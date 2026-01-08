import { supabase } from '@/lib/supabase';
import { 
  Player, Item, Boss, Drop, Sale, Share,
  PlayersRepo, ItemsRepo, BossesRepo, DropsRepo, SalesRepo, SharesRepo,
  DropWithDetails, ShareWithPlayer, ListParams
} from '../types';

// --- Helper for List Params ---
const applyFilters = (query: any, params?: ListParams, searchColumns: string[] = ['name']) => {
  if (params?.search) {
    const search = params.search;
    // Simple OR search across columns
    const orQuery = searchColumns.map(col => `${col}.ilike.%${search}%`).join(',');
    query = query.or(orQuery);
  }

  if (params?.filter) {
    const { startDate, endDate, ...otherFilters } = params.filter as any;

    if (startDate) {
      // Handle date if table has drop_date or created_at logic, but this helper is general
      // Better handle specific date logic in specific repos
    }

    Object.entries(otherFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        query = query.eq(key, value);
      }
    });
  }

  if (params?.limit) {
    const from = params.offset || 0;
    query = query.range(from, from + params.limit - 1);
  }

  return query;
};

// --- Players Repo ---
export const playersRepo: PlayersRepo = {
  async list(params?: ListParams): Promise<Player[]> {
    let query = supabase.from('players').select('*').order('created_at', { ascending: false });
    query = applyFilters(query, params, ['name', 'discord_id']);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Player | null> {
    const { data, error } = await supabase.from('players').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async create(data: Omit<Player, 'id' | 'created_at'>): Promise<Player> {
    const { data: created, error } = await supabase.from('players').insert(data).select().single();
    if (error) throw error;
    return created;
  },

  async update(id: string, data: Partial<Omit<Player, 'id' | 'created_at'>>): Promise<Player | null> {
    const { data: updated, error } = await supabase.from('players').update(data).eq('id', id).select().single();
    if (error) return null;
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('players').delete().eq('id', id);
    return !error;
  },

  async findByName(name: string): Promise<Player | null> {
    const { data } = await supabase.from('players').select('*').ilike('name', name).single();
    return data;
  },

  async findByUsername(username: string): Promise<Player | null> {
    const { data } = await supabase.from('players').select('*').eq('username', username).single();
    return data;
  }
};

// --- Items Repo ---
export const itemsRepo: ItemsRepo = {
  async list(params?: ListParams): Promise<Item[]> {
    let query = supabase.from('items').select('*').order('created_at', { ascending: false });
    query = applyFilters(query, params, ['name']);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Item | null> {
    const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async create(data: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
    const { data: created, error } = await supabase.from('items').insert(data).select().single();
    if (error) throw error;
    return created;
  },

  async update(id: string, data: Partial<Omit<Item, 'id' | 'created_at'>>): Promise<Item | null> {
    const { data: updated, error } = await supabase.from('items').update(data).eq('id', id).select().single();
    if (error) return null;
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('items').delete().eq('id', id);
    return !error;
  },

  async findByName(name: string): Promise<Item | null> {
    const { data } = await supabase.from('items').select('*').ilike('name', name).single();
    return data;
  }
};

// --- Bosses Repo ---
export const bossesRepo: BossesRepo = {
  async list(params?: ListParams): Promise<Boss[]> {
    let query = supabase.from('bosses').select('*').order('created_at', { ascending: false });
    query = applyFilters(query, params, ['name', 'location']);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Boss | null> {
    const { data, error } = await supabase.from('bosses').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async create(data: Omit<Boss, 'id' | 'created_at'>): Promise<Boss> {
    const { data: created, error } = await supabase.from('bosses').insert(data).select().single();
    if (error) throw error;
    return created;
  },

  async update(id: string, data: Partial<Omit<Boss, 'id' | 'created_at'>>): Promise<Boss | null> {
    const { data: updated, error } = await supabase.from('bosses').update(data).eq('id', id).select().single();
    if (error) return null;
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('bosses').delete().eq('id', id);
    return !error;
  },

  async findByName(name: string): Promise<Boss | null> {
    const { data } = await supabase.from('bosses').select('*').ilike('name', name).single();
    return data;
  }
};

// --- Drops Repo ---
export const dropsRepo: DropsRepo = {
  async list(params?: ListParams): Promise<Drop[]> {
    let query = supabase.from('drops').select('*').order('drop_date', { ascending: false });
    
    // Custom Date Range Filter for Drops
    if (params?.filter) {
      const { startDate, endDate, ...otherFilters } = params.filter as any;
      
      if (startDate) query = query.gte('drop_date', startDate);
      if (endDate) query = query.lte('drop_date', endDate);
      
      // Apply other filters
      Object.entries(otherFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
          query = query.eq(key, value);
        }
      });
    }

    // Search
    if (params?.search) {
      query = query.ilike('note', `%${params.search}%`);
    }

    if (params?.limit) {
      const from = params.offset || 0;
      query = query.range(from, from + params.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listWithDetails(params?: ListParams): Promise<DropWithDetails[]> {
    let query = supabase.from('drops')
      .select(`
        *,
        item:items(*),
        boss:bosses(*),
        sale:sales(*),
        shares:shares(*)
      `)
      .order('drop_date', { ascending: false });

    // Custom Date Range Filter
    if (params?.filter) {
      const { startDate, endDate, ...otherFilters } = params.filter as any;
      
      if (startDate) query = query.gte('drop_date', startDate);
      if (endDate) query = query.lte('drop_date', endDate);
      
      Object.entries(otherFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
          query = query.eq(key, value);
        }
      });
    }

    if (params?.search) {
      query = query.ilike('note', `%${params.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Drop | null> {
    const { data, error } = await supabase.from('drops').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async create(data: Omit<Drop, 'id' | 'created_at'>): Promise<Drop> {
    const { data: created, error } = await supabase.from('drops').insert(data).select().single();
    if (error) throw error;
    return created;
  },

  async update(id: string, data: Partial<Omit<Drop, 'id' | 'created_at'>>): Promise<Drop | null> {
    const { data: updated, error } = await supabase.from('drops').update(data).eq('id', id).select().single();
    if (error) return null;
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('drops').delete().eq('id', id);
    return !error;
  }
};

// --- Sales Repo ---
export const salesRepo: SalesRepo = {
  async getByDropId(dropId: string): Promise<Sale | null> {
    const { data, error } = await supabase.from('sales').select('*').eq('drop_id', dropId).single();
    if (error) return null;
    return data;
  },

  async create(data: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> {
    const { data: created, error } = await supabase.from('sales').insert(data).select().single();
    if (error) throw error;
    return created;
  },

  async update(id: string, data: Partial<Omit<Sale, 'id' | 'created_at'>>): Promise<Sale | null> {
    const { data: updated, error } = await supabase.from('sales').update(data).eq('id', id).select().single();
    if (error) return null;
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    return !error;
  },

  async getStats(): Promise<{ totalSales: number; totalDrops: number }> {
    const { data, error } = await supabase.from('sales').select('net_amount');
    
    if (error || !data) return { totalSales: 0, totalDrops: 0 };
    
    const totalSales = data.reduce((sum, sale) => sum + (sale.net_amount || 0), 0);
    return {
      totalSales,
      totalDrops: data.length
    };
  }
};

// --- Shares Repo ---
export const sharesRepo: SharesRepo = {
  async list(params?: ListParams): Promise<Share[]> {
    const query = supabase.from('shares').select('*');
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listByDropId(dropId: string): Promise<ShareWithPlayer[]> {
    const { data, error } = await supabase.from('shares')
      .select(`*, player:players(*)`)
      .eq('drop_id', dropId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Share | null> {
    const { data, error } = await supabase.from('shares').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async create(data: Omit<Share, 'id' | 'created_at'>): Promise<Share> {
    const { data: created, error } = await supabase.from('shares').insert(data).select().single();
    if (error) throw error;
    return created;
  },

  async update(id: string, data: Partial<Omit<Share, 'id' | 'created_at'>>): Promise<Share | null> {
    const { data: updated, error } = await supabase.from('shares').update(data).eq('id', id).select().single();
    if (error) return null;
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('shares').delete().eq('id', id);
    return !error;
  },

  async removeByDropId(dropId: string): Promise<boolean> {
    const { error } = await supabase.from('shares').delete().eq('drop_id', dropId);
    return !error;
  },

  async getStats(playerId?: string): Promise<{ totalAmount: number; unpaidAmount: number; paidAmount: number }> {
    let query = supabase.from('shares').select('amount, paid_status');
    
    if (playerId) {
      query = query.eq('player_id', playerId);
    }
    
    const { data, error } = await query;
    if (error || !data) return { totalAmount: 0, unpaidAmount: 0, paidAmount: 0 };
    
    const stats = data.reduce((acc, share) => {
      const amount = share.amount || 0;
      acc.totalAmount += amount;
      if (share.paid_status === 'WAIT') acc.unpaidAmount += amount;
      if (share.paid_status === 'PAID') acc.paidAmount += amount;
      return acc;
    }, { totalAmount: 0, unpaidAmount: 0, paidAmount: 0 });
    
    return stats;
  }
};
