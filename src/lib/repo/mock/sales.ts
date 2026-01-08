import { Sale, SalesRepo } from '../types';
import { readJsonFile, writeJsonFile, withLock, generateId, getCurrentTimestamp } from './storage';

const FILENAME = 'sales';

export const salesRepo: SalesRepo = {
  async getByDropId(dropId: string): Promise<Sale | null> {
    const items = await readJsonFile<Sale>(FILENAME);
    return items.find(s => s.drop_id === dropId) || null;
  },

  async create(data: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Sale>(FILENAME);
      
      // Check if sale already exists for this drop
      if (items.some(s => s.drop_id === data.drop_id)) {
        throw new Error('Drop นี้มีข้อมูลการขายแล้ว');
      }
      
      const newItem: Sale = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
      };
      items.push(newItem);
      await writeJsonFile(FILENAME, items);
      return newItem;
    });
  },

  async update(id: string, data: Partial<Omit<Sale, 'id' | 'created_at'>>): Promise<Sale | null> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Sale>(FILENAME);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      
      items[index] = { ...items[index], ...data };
      await writeJsonFile(FILENAME, items);
      return items[index];
    });
  },

  async remove(id: string): Promise<boolean> {
    return withLock(FILENAME, async () => {
      const items = await readJsonFile<Sale>(FILENAME);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return false;
      
      items.splice(index, 1);
      await writeJsonFile(FILENAME, items);
      return true;
    });
  },

  async getStats(): Promise<{ totalSales: number; totalDrops: number }> {
    const items = await readJsonFile<Sale>(FILENAME);
    const totalSales = items.reduce((sum, sale) => sum + (sale.net_amount || 0), 0);
    return {
      totalSales,
      totalDrops: items.length
    };
  }
};
