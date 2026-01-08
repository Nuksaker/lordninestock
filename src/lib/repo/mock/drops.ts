import { Drop, DropsRepo, DropWithDetails, ListParams } from '../types';
import { createBaseRepo, readJsonFile, writeJsonFile, withLock, generateId, getCurrentTimestamp } from './storage';
import { itemsRepo } from './items';
import { bossesRepo } from './bosses';
import { salesRepo } from './sales';
import { sharesRepo } from './shares';

const FILENAME = 'drops';
const baseRepo = createBaseRepo<Drop>(FILENAME);

export const dropsRepo: DropsRepo = {
  async list(params?: ListParams): Promise<Drop[]> {
    let items = await readJsonFile<Drop>(FILENAME);
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      // Search will be done after joining with items
      const allItems = await readJsonFile<{ id: string; name: string }>(FILENAME);
      const itemIds = allItems.filter(i => i.name.toLowerCase().includes(search)).map(i => i.id);
      items = items.filter(d => itemIds.includes(d.item_id));
    }
    
    if (params?.filter) {
      if (params.filter.drop_status) {
        items = items.filter(d => d.drop_status === params.filter!.drop_status);
      }
      if (params.filter.finance_status) {
        items = items.filter(d => d.finance_status === params.filter!.finance_status);
      }
      if (params.filter.item_id) {
        items = items.filter(d => d.item_id === params.filter!.item_id);
      }
      if (params.filter.boss_id) {
        items = items.filter(d => d.boss_id === params.filter!.boss_id);
      }
    }
    
    // Sort by drop_date desc, then created_at desc
    items.sort((a, b) => {
      const dateA = a.drop_date || a.created_at;
      const dateB = b.drop_date || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    if (params?.limit) {
      const offset = params.offset || 0;
      items = items.slice(offset, offset + params.limit);
    }
    
    return items;
  },

  get: baseRepo.get,

  async create(data: Omit<Drop, 'id' | 'created_at'>): Promise<Drop> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Drop>(FILENAME);
      
      const newItem: Drop = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
      };
      items.push(newItem);
      await writeJsonFile(FILENAME, items);
      return newItem;
    });
  },

  update: baseRepo.update,
  remove: baseRepo.remove,

  async listWithDetails(params?: ListParams): Promise<DropWithDetails[]> {
    const drops = await this.list(params);
    const items = await readJsonFile<any>('items.json');
    const bosses = await readJsonFile<any>('bosses.json');
    const result: DropWithDetails[] = [];
    
    for (const drop of drops) {
      const item = await itemsRepo.get(drop.item_id);
      const boss = drop.boss_id ? await bossesRepo.get(drop.boss_id) : undefined;
      const sale = await salesRepo.getByDropId(drop.id);
      const shares = await sharesRepo.listByDropId(drop.id);
      
      result.push({
        ...drop,
        item: item || undefined,
        boss: boss || undefined,
        sale: sale || undefined,
        shares,
      });
    }
    
    return result;
  },
};
