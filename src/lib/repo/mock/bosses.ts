import { Boss, BossesRepo, ListParams } from '../types';
import { createBaseRepo, readJsonFile, writeJsonFile, withLock, generateId, getCurrentTimestamp } from './storage';

const FILENAME = 'bosses';
const baseRepo = createBaseRepo<Boss>(FILENAME);

export const bossesRepo: BossesRepo = {
  async list(params?: ListParams): Promise<Boss[]> {
    let items = await readJsonFile<Boss>(FILENAME);
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      items = items.filter(b => 
        b.name.toLowerCase().includes(search) ||
        b.location?.toLowerCase().includes(search)
      );
    }
    
    // Sort by name
    items.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    
    if (params?.limit) {
      const offset = params.offset || 0;
      items = items.slice(offset, offset + params.limit);
    }
    
    return items;
  },

  get: baseRepo.get,

  async create(data: Omit<Boss, 'id' | 'created_at'>): Promise<Boss> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Boss>(FILENAME);
      
      // Check unique name
      if (items.some(b => b.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('ชื่อบอสซ้ำ');
      }
      
      const newItem: Boss = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
      };
      items.push(newItem);
      await writeJsonFile(FILENAME, items);
      return newItem;
    });
  },

  async update(id: string, data: Partial<Omit<Boss, 'id' | 'created_at'>>): Promise<Boss | null> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Boss>(FILENAME);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      
      // Check unique name if changing
      if (data.name && data.name.toLowerCase() !== items[index].name.toLowerCase()) {
        if (items.some(b => b.name.toLowerCase() === data.name!.toLowerCase())) {
          throw new Error('ชื่อบอสซ้ำ');
        }
      }
      
      items[index] = { ...items[index], ...data };
      await writeJsonFile(FILENAME, items);
      return items[index];
    });
  },

  remove: baseRepo.remove,

  async findByName(name: string): Promise<Boss | null> {
    const items = await readJsonFile<Boss>(FILENAME);
    return items.find(b => b.name.toLowerCase() === name.toLowerCase()) || null;
  },
};
