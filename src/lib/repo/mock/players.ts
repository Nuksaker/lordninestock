import { Player, PlayersRepo, ListParams } from '../types';
import { createBaseRepo, readJsonFile, writeJsonFile, withLock, generateId, getCurrentTimestamp } from './storage';

const FILENAME = 'players';
const baseRepo = createBaseRepo<Player>(FILENAME);

export const playersRepo: PlayersRepo = {
  async list(params?: ListParams): Promise<Player[]> {
    let items = await readJsonFile<Player>(FILENAME);
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.discord_id?.toLowerCase().includes(search)
      );
    }
    
    if (params?.filter) {
      if (params.filter.active !== undefined) {
        items = items.filter(p => p.active === params.filter!.active);
      }
      if (params.filter.role) {
        items = items.filter(p => p.role === params.filter!.role);
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

  async create(data: Omit<Player, 'id' | 'created_at'>): Promise<Player> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Player>(FILENAME);
      
      // Check unique name
      if (items.some(p => p.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('ชื่อผู้เล่นซ้ำ');
      }
      
      // Check unique username
      if (data.username && items.some(p => p.username?.toLowerCase() === data.username?.toLowerCase())) {
        throw new Error('Username ซ้ำ');
      }
      
      const newItem: Player = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
      };
      items.push(newItem);
      await writeJsonFile(FILENAME, items);
      return newItem;
    });
  },

  async update(id: string, data: Partial<Omit<Player, 'id' | 'created_at'>>): Promise<Player | null> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Player>(FILENAME);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      
      // Check unique name if changing
      if (data.name && data.name.toLowerCase() !== items[index].name.toLowerCase()) {
        if (items.some(p => p.name.toLowerCase() === data.name!.toLowerCase())) {
          throw new Error('ชื่อผู้เล่นซ้ำ');
        }
      }
      
      // Check unique username if changing
      if (data.username) {
        const usernameChanged = !items[index].username || data.username.toLowerCase() !== items[index].username.toLowerCase();
        if (usernameChanged && items.some((p, i) => i !== index && p.username?.toLowerCase() === data.username?.toLowerCase())) {
          throw new Error('Username ซ้ำ');
        }
      }
      
      items[index] = { ...items[index], ...data };
      await writeJsonFile(FILENAME, items);
      return items[index];
    });
  },

  remove: baseRepo.remove,

  async findByName(name: string): Promise<Player | null> {
    const items = await readJsonFile<Player>(FILENAME);
    return items.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
  },

  async findByUsername(username: string): Promise<Player | null> {
    const items = await readJsonFile<Player>(FILENAME);
    return items.find(p => p.username?.toLowerCase() === username.toLowerCase()) || null;
  },
};
