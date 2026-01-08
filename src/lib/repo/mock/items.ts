import { Item, ItemsRepo, ListParams } from '../types';
import { createBaseRepo, readJsonFile, writeJsonFile, withLock, generateId, getCurrentTimestamp } from './storage';

const FILENAME = 'items';
const baseRepo = createBaseRepo<Item>(FILENAME);

export const itemsRepo: ItemsRepo = {
  async list(params?: ListParams): Promise<Item[]> {
    let items = await readJsonFile<Item>(FILENAME);
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(search) ||
        i.sub_type?.toLowerCase().includes(search)
      );
    }
    
    if (params?.filter) {
      if (params.filter.category) {
        items = items.filter(i => i.category === params.filter!.category);
      }
      if (params.filter.tradeable !== undefined) {
        items = items.filter(i => i.tradeable === params.filter!.tradeable);
      }
    }
    
    // Sort by created_at desc
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    if (params?.limit) {
      const offset = params.offset || 0;
      items = items.slice(offset, offset + params.limit);
    }
    
    return items;
  },

  get: baseRepo.get,

  async create(data: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Item>(FILENAME);
      
      // Check unique name
      if (items.some(i => i.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('ชื่อไอเทมซ้ำ');
      }
      
      const newItem: Item = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
      };
      items.push(newItem);
      await writeJsonFile(FILENAME, items);
      return newItem;
    });
  },

  async update(id: string, data: Partial<Omit<Item, 'id' | 'created_at'>>): Promise<Item | null> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Item>(FILENAME);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      
      // Check unique name if changing
      if (data.name && data.name.toLowerCase() !== items[index].name.toLowerCase()) {
        if (items.some(i => i.name.toLowerCase() === data.name!.toLowerCase())) {
          throw new Error('ชื่อไอเทมซ้ำ');
        }
      }
      
      items[index] = { ...items[index], ...data };
      await writeJsonFile(FILENAME, items);
      return items[index];
    });
  },

  remove: baseRepo.remove,

  async findByName(name: string): Promise<Item | null> {
    const items = await readJsonFile<Item>(FILENAME);
    return items.find(i => i.name.toLowerCase() === name.toLowerCase()) || null;
  },
};
