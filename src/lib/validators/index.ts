import { z } from 'zod';

// Player Schemas
export const PlayerRoleEnum = z.enum(['ADMIN', 'MEMBER']);

export const createPlayerSchema = z.object({
  name: z.string().min(1, 'ชื่อต้องไม่ว่าง').max(50, 'ชื่อยาวเกินไป'),
  discord_id: z.string().nullable().optional(),
  username: z.string().min(3, 'Username ต้องอย่างน้อย 3 ตัวอักษร').optional().or(z.literal('')),
  password: z.string().min(6, 'Password ต้องอย่างน้อย 6 ตัวอักษร').optional().or(z.literal('')),
  role: PlayerRoleEnum.default('MEMBER'),
  active: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).default(true),
});

export const updatePlayerSchema = createPlayerSchema.partial();

// Item Schemas
export const ItemCategoryEnum = z.enum(['Skill', 'Weapon', 'Armor', 'Accessory', 'Material', 'Mount', 'Special']);

export const createItemSchema = z.object({
  name: z.string().min(1, 'ชื่อไอเทมต้องไม่ว่าง').max(100, 'ชื่อยาวเกินไป'),
  category: ItemCategoryEnum,
  sub_type: z.string().nullable().optional(),
  tradeable: z.boolean().default(true),
  note: z.string().nullable().optional(),
});

export const updateItemSchema = createItemSchema.partial();

// Boss Schemas
export const createBossSchema = z.object({
  name: z.string().min(1, 'ชื่อบอสต้องไม่ว่าง').max(100, 'ชื่อยาวเกินไป'),
  location: z.string().nullable().optional(),
});

export const updateBossSchema = createBossSchema.partial();

// Drop Schemas
export const DropStatusEnum = z.enum(['DROPPED', 'NOT_DROPPED']);
export const FinanceStatusEnum = z.enum(['WAIT', 'PAID', 'PERSONAL']);

export const createDropSchema = z.object({
  drop_date: z.string().nullable().optional(),
  item_id: z.string().uuid('ต้องเลือกไอเทม'),
  boss_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1, 'จำนวนต้องมากกว่า 0').default(1),
  participant_count: z.number().int().min(1, 'จำนวนผู้เข้าร่วมต้องมากกว่า 0'),
  drop_status: DropStatusEnum.default('DROPPED'),
  finance_status: FinanceStatusEnum.default('WAIT'),
  note: z.string().nullable().optional(),
});

export const updateDropSchema = createDropSchema.partial();

// Sale Schemas
export const createSaleSchema = z.object({
  drop_id: z.string().uuid('ต้องระบุ drop'),
  sale_price: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  fee_percent: z.number().min(0).max(100).default(5),
  sale_date: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
}).transform((data) => {
  // Server recalculates fee and net
  const fee_amount = Math.round((data.sale_price * data.fee_percent / 100) * 100) / 100;
  const net_amount = Math.round((data.sale_price - fee_amount) * 100) / 100;
  return { ...data, fee_amount, net_amount };
});

export const updateSaleSchema = z.object({
  sale_price: z.number().min(0, 'ราคาต้องไม่ติดลบ').optional(),
  fee_percent: z.number().min(0).max(100).optional(),
  sale_date: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
}).transform((data) => {
  if (data.sale_price !== undefined && data.fee_percent !== undefined) {
    const fee_amount = Math.round((data.sale_price * data.fee_percent / 100) * 100) / 100;
    const net_amount = Math.round((data.sale_price - fee_amount) * 100) / 100;
    return { ...data, fee_amount, net_amount };
  }
  return data;
});

// Share Schemas
export const ShareTypeEnum = z.enum(['AUTO', 'BUY', 'PERSONAL']);
export const PaidStatusEnum = z.enum(['WAIT', 'PAID']);

export const createShareSchema = z.object({
  drop_id: z.string().uuid('ต้องระบุ drop'),
  player_id: z.string().uuid('ต้องเลือกผู้เล่น'),
  share_type: ShareTypeEnum.default('AUTO'),
  percent: z.number().min(0).max(100).nullable().optional(),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  paid_status: PaidStatusEnum.default('WAIT'),
  remark: z.string().nullable().optional(),
});

export const updateShareSchema = createShareSchema.partial().omit({ drop_id: true });

// Auth Schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอก Username'),
  password: z.string().min(1, 'กรุณากรอก Password'),
});

// Type exports from schemas
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateBossInput = z.infer<typeof createBossSchema>;
export type UpdateBossInput = z.infer<typeof updateBossSchema>;
export type CreateDropInput = z.infer<typeof createDropSchema>;
export type UpdateDropInput = z.infer<typeof updateDropSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type CreateShareInput = z.infer<typeof createShareSchema>;
export type UpdateShareInput = z.infer<typeof updateShareSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
