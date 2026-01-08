import { Share, SharesRepo, ListParams } from '../types';
import { readJsonFile, writeJsonFile, withLock, generateId, getCurrentTimestamp } from './storage';

const FILENAME = 'shares';

export const sharesRepo: SharesRepo = {
  async list(params?: ListParams): Promise<Share[]> {
    let items = await readJsonFile<Share>(FILENAME);
    
    if (params?.filter) {
      if (params.filter.drop_id) {
        items = items.filter(s => s.drop_id === params.filter!.drop_id);
      }
      if (params.filter.player_id) {
        items = items.filter(s => s.player_id === params.filter!.player_id);
      }
      if (params.filter.paid_status) {
        items = items.filter(s => s.paid_status === params.filter!.paid_status);
      }
    }
    
    // Sort by created_at
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    return items;
  },

  async get(id: string): Promise<Share | null> {
    const items = await readJsonFile<Share>(FILENAME);
    return items.find(s => s.id === id) || null;
  },

  async create(data: Omit<Share, 'id' | 'created_at'>): Promise<Share> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Share>(FILENAME);
      
      const newItem: Share = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
      };
      items.push(newItem);
      await writeJsonFile(FILENAME, items);
      return newItem;
    });
  },

  async update(id: string, data: Partial<Omit<Share, 'id' | 'created_at'>>): Promise<Share | null> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Share>(FILENAME);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      
      items[index] = { ...items[index], ...data };
      await writeJsonFile(FILENAME, items);
      return items[index];
    });
  },

  async remove(id: string): Promise<boolean> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Share>(FILENAME);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return false;
      
      items.splice(index, 1);
      await writeJsonFile(FILENAME, items);
      return true;
    });
  },

  async listByDropId(dropId: string): Promise<Share[]> {
    return this.list({ filter: { drop_id: dropId } });
  },
};
