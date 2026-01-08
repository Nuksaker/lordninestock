// Entity Types for LordNine Stock

export type PlayerRole = 'ADMIN' | 'MEMBER';
export type ItemCategory = 'Skill' | 'Weapon' | 'Armor' | 'Accessory' | 'Material' | 'Mount' | 'Special';
export type DropStatus = 'DROPPED' | 'NOT_DROPPED';
export type FinanceStatus = 'WAIT' | 'PAID' | 'PERSONAL';
export type ShareType = 'AUTO' | 'BUY' | 'PERSONAL';
export type PaidStatus = 'WAIT' | 'PAID';

export interface Player {
  id: string;
  name: string;
  discord_id: string | null;
  username?: string; // For login
  password?: string; // For login (stored as plain text for mock)
  role: PlayerRole;
  active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  sub_type: string | null;
  tradeable: boolean;
  note: string | null;
  created_at: string;
}

export interface Boss {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
}

export interface Drop {
  id: string;
  drop_date: string | null;
  item_id: string;
  boss_id: string | null;
  quantity: number;
  participant_count: number;
  drop_status: DropStatus;
  finance_status: FinanceStatus;
  note: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  drop_id: string;
  sale_price: number;
  fee_percent: number;
  fee_amount: number;
  net_amount: number;
  sale_date: string | null;
  platform: string | null;
  created_at: string;
}

export interface Share {
  id: string;
  drop_id: string;
  player_id: string;
  share_type: ShareType;
  percent: number | null;
  amount: number;
  paid_status: PaidStatus;
  remark: string | null;
  created_at: string;
}

// Repository Interfaces
export interface ListParams {
  search?: string;
  filter?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export interface Repository<T> {
  list(params?: ListParams): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'created_at'>): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T | null>;
  remove(id: string): Promise<boolean>;
}

export interface PlayersRepo extends Repository<Player> {
  findByName(name: string): Promise<Player | null>;
  findByUsername(username: string): Promise<Player | null>;
}

export interface ItemsRepo extends Repository<Item> {
  findByName(name: string): Promise<Item | null>;
}

export interface BossesRepo extends Repository<Boss> {
  findByName(name: string): Promise<Boss | null>;
}

export interface DropsRepo extends Repository<Drop> {
  listWithDetails(params?: ListParams): Promise<DropWithDetails[]>;
}

export interface SalesRepo {
  getByDropId(dropId: string): Promise<Sale | null>;
  create(data: Omit<Sale, 'id' | 'created_at'>): Promise<Sale>;
  update(id: string, data: Partial<Omit<Sale, 'id' | 'created_at'>>): Promise<Sale | null>;
  remove(id: string): Promise<boolean>;
  getStats(): Promise<{ totalSales: number; totalDrops: number }>;
}

export interface SharesRepo {
  list(params?: ListParams): Promise<Share[]>;
  listByDropId(dropId: string): Promise<ShareWithPlayer[]>;
  get(id: string): Promise<Share | null>;
  create(data: Omit<Share, 'id' | 'created_at'>): Promise<Share>;
  update(id: string, data: Partial<Omit<Share, 'id' | 'created_at'>>): Promise<Share | null>;
  remove(id: string): Promise<boolean>;
  removeByDropId(dropId: string): Promise<boolean>;
  getStats(playerId?: string): Promise<{ totalAmount: number; unpaidAmount: number; paidAmount: number }>;
}

// Extended Types with Relations
export interface DropWithDetails extends Drop {
  item?: Item;
  boss?: Boss;
  sale?: Sale;
  shares?: Share[];
}

export interface ShareWithPlayer extends Share {
  player?: Player;
}
