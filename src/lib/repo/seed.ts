import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Player, Item, Boss, Drop, Sale, Share } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

function generateId(): string {
  return uuidv4();
}

function getTimestamp(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function getDate(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Seed Data
const players: Player[] = [
  { id: generateId(), name: 'mrzero', discord_id: 'mrzero#1234', role: 'ADMIN', active: true, created_at: getTimestamp(30) },
  { id: generateId(), name: 'benzboss', discord_id: 'benzboss#5678', role: 'MEMBER', active: true, created_at: getTimestamp(28) },
  { id: generateId(), name: 'whiro', discord_id: 'whiro#9012', role: 'MEMBER', active: true, created_at: getTimestamp(25) },
  { id: generateId(), name: 'Blue16Alpha', discord_id: 'Blue16Alpha#3456', role: 'MEMBER', active: true, created_at: getTimestamp(20) },
  { id: generateId(), name: 'DragonSlayer', discord_id: null, role: 'MEMBER', active: true, created_at: getTimestamp(15) },
  { id: generateId(), name: 'NightWolf', discord_id: 'NightWolf#7890', role: 'MEMBER', active: false, created_at: getTimestamp(40) },
];

const items: Item[] = [
  { id: generateId(), name: 'ทักษะ เอาชนะ', category: 'Skill', sub_type: 'Combat', tradeable: true, note: 'สกิลหายาก', created_at: getTimestamp(30) },
  { id: generateId(), name: 'หินประดับม่วง x100', category: 'Material', sub_type: 'Gem', tradeable: true, note: null, created_at: getTimestamp(28) },
  { id: generateId(), name: 'ดาบโล่ รุ่งอรุณ', category: 'Weapon', sub_type: 'Sword', tradeable: true, note: 'อาวุธระดับ S', created_at: getTimestamp(25) },
  { id: generateId(), name: 'อาน เดลโฟน', category: 'Mount', sub_type: 'Horse', tradeable: true, note: 'พาหนะหายาก', created_at: getTimestamp(22) },
  { id: generateId(), name: 'ชุดเกราะมังกร', category: 'Armor', sub_type: 'Heavy', tradeable: true, note: null, created_at: getTimestamp(20) },
  { id: generateId(), name: 'แหวนพลังเวทย์', category: 'Accessory', sub_type: 'Ring', tradeable: true, note: null, created_at: getTimestamp(18) },
  { id: generateId(), name: 'คริสตัลสีทอง', category: 'Special', sub_type: null, tradeable: false, note: 'ไอเทมกิจกรรม ห้ามขาย', created_at: getTimestamp(15) },
];

const bosses: Boss[] = [
  { id: generateId(), name: 'พญามังกรดำ', location: 'ถ้ำมรณะ ชั้น 5', created_at: getTimestamp(30) },
  { id: generateId(), name: 'ราชาปีศาจ', location: 'วิหารร้าง', created_at: getTimestamp(28) },
  { id: generateId(), name: 'เทพแห่งสายฟ้า', location: 'ยอดเขาสูงสุด', created_at: getTimestamp(25) },
  { id: generateId(), name: 'ราชินีน้ำแข็ง', location: 'พระราชวังหิมะ', created_at: getTimestamp(22) },
  { id: generateId(), name: 'อสูรโลกันตร์', location: 'นรกภูมิ', created_at: getTimestamp(20) },
];

// Create drops with references to items and bosses
function createDrops(): Drop[] {
  const result: Drop[] = [];
  
  // Drop 1: Sold and Paid
  result.push({
    id: generateId(),
    drop_date: getDate(2),
    item_id: items[0].id, // ทักษะ เอาชนะ
    boss_id: bosses[0].id,
    quantity: 1,
    participant_count: 31,
    drop_status: 'DROPPED',
    finance_status: 'PAID',
    note: 'ดรอปจากบอสวันนี้',
    created_at: getTimestamp(2),
  });
  
  // Drop 2: Sold but waiting for payment
  result.push({
    id: generateId(),
    drop_date: getDate(3),
    item_id: items[2].id, // ดาบโล่ รุ่งอรุณ
    boss_id: bosses[1].id,
    quantity: 1,
    participant_count: 39,
    drop_status: 'DROPPED',
    finance_status: 'WAIT',
    note: null,
    created_at: getTimestamp(3),
  });
  
  // Drop 3: Personal use
  result.push({
    id: generateId(),
    drop_date: getDate(5),
    item_id: items[3].id, // อาน เดลโฟน
    boss_id: bosses[2].id,
    quantity: 1,
    participant_count: 25,
    drop_status: 'DROPPED',
    finance_status: 'PERSONAL',
    note: 'mrzero เก็บไว้ใช้เอง',
    created_at: getTimestamp(5),
  });
  
  // Drop 4: Material drop (100 pcs)
  result.push({
    id: generateId(),
    drop_date: getDate(7),
    item_id: items[1].id, // หินประดับม่วง x100
    boss_id: bosses[3].id,
    quantity: 100,
    participant_count: 42,
    drop_status: 'DROPPED',
    finance_status: 'WAIT',
    note: null,
    created_at: getTimestamp(7),
  });
  
  // Drop 5: Not dropped
  result.push({
    id: generateId(),
    drop_date: getDate(10),
    item_id: items[4].id, // ชุดเกราะมังกร
    boss_id: bosses[4].id,
    quantity: 1,
    participant_count: 35,
    drop_status: 'NOT_DROPPED',
    finance_status: 'WAIT',
    note: 'ไม่ดรอป รอรอบหน้า',
    created_at: getTimestamp(10),
  });
  
  return result;
}

const drops = createDrops();

// Create sales for paid/wait drops
function createSales(): Sale[] {
  const result: Sale[] = [];
  
  // Sale for drop 1 (PAID)
  const salePrice1 = 150000;
  const feePercent1 = 5;
  const feeAmount1 = salePrice1 * feePercent1 / 100;
  result.push({
    id: generateId(),
    drop_id: drops[0].id,
    sale_price: salePrice1,
    fee_percent: feePercent1,
    fee_amount: feeAmount1,
    net_amount: salePrice1 - feeAmount1,
    sale_date: getDate(1),
    platform: 'Facebook',
    created_at: getTimestamp(1),
  });
  
  // Sale for drop 2 (WAIT)
  const salePrice2 = 280000;
  const feePercent2 = 5;
  const feeAmount2 = salePrice2 * feePercent2 / 100;
  result.push({
    id: generateId(),
    drop_id: drops[1].id,
    sale_price: salePrice2,
    fee_percent: feePercent2,
    fee_amount: feeAmount2,
    net_amount: salePrice2 - feeAmount2,
    sale_date: getDate(2),
    platform: 'Discord',
    created_at: getTimestamp(2),
  });
  
  // Sale for drop 4 (material - WAIT)
  const salePrice4 = 50000;
  const feePercent4 = 5;
  const feeAmount4 = salePrice4 * feePercent4 / 100;
  result.push({
    id: generateId(),
    drop_id: drops[3].id,
    sale_price: salePrice4,
    fee_percent: feePercent4,
    fee_amount: feeAmount4,
    net_amount: salePrice4 - feeAmount4,
    sale_date: getDate(6),
    platform: 'In-game',
    created_at: getTimestamp(6),
  });
  
  return result;
}

const sales = createSales();

// Create shares
function createShares(): Share[] {
  const result: Share[] = [];
  const sale1 = sales[0]; // 150000 - 7500 = 142500 net
  const sale2 = sales[1]; // 280000 - 14000 = 266000 net
  
  // Shares for drop 1 (all AUTO split among 4 players - simplified)
  const netPerPlayer1 = sale1.net_amount / 4;
  for (let i = 0; i < 4; i++) {
    result.push({
      id: generateId(),
      drop_id: drops[0].id,
      player_id: players[i].id,
      share_type: 'AUTO',
      percent: 25,
      amount: netPerPlayer1,
      paid_status: 'PAID',
      remark: null,
      created_at: getTimestamp(1),
    });
  }
  
  // Shares for drop 2 - one player BUY 50%
  const buyAmount = sale2.net_amount * 0.5;
  result.push({
    id: generateId(),
    drop_id: drops[1].id,
    player_id: players[1].id, // benzboss
    share_type: 'BUY',
    percent: 50,
    amount: buyAmount,
    paid_status: 'WAIT',
    remark: 'benzboss ซื้อ 50%',
    created_at: getTimestamp(2),
  });
  
  // Remaining 50% split among 3 players
  const remainingNet = sale2.net_amount - buyAmount;
  const netPerPlayer2 = remainingNet / 3;
  for (let i = 0; i < 3; i++) {
    if (i === 1) continue; // Skip benzboss (already has BUY share)
    result.push({
      id: generateId(),
      drop_id: drops[1].id,
      player_id: players[i === 0 ? 0 : i + 1].id,
      share_type: 'AUTO',
      percent: 50 / 3,
      amount: netPerPlayer2,
      paid_status: 'WAIT',
      remark: null,
      created_at: getTimestamp(2),
    });
  }
  
  return result;
}

const shares = createShares();

// Write seed data to files
export async function seedData(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    await fs.writeFile(path.join(DATA_DIR, 'players.json'), JSON.stringify(players, null, 2));
    await fs.writeFile(path.join(DATA_DIR, 'items.json'), JSON.stringify(items, null, 2));
    await fs.writeFile(path.join(DATA_DIR, 'bosses.json'), JSON.stringify(bosses, null, 2));
    await fs.writeFile(path.join(DATA_DIR, 'drops.json'), JSON.stringify(drops, null, 2));
    await fs.writeFile(path.join(DATA_DIR, 'sales.json'), JSON.stringify(sales, null, 2));
    await fs.writeFile(path.join(DATA_DIR, 'shares.json'), JSON.stringify(shares, null, 2));
    
    console.log('✅ Seed data created successfully!');
    console.log(`   - ${players.length} players`);
    console.log(`   - ${items.length} items`);
    console.log(`   - ${bosses.length} bosses`);
    console.log(`   - ${drops.length} drops`);
    console.log(`   - ${sales.length} sales`);
    console.log(`   - ${shares.length} shares`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Check if data exists
export async function checkDataExists(): Promise<boolean> {
  try {
    const files = ['players.json', 'items.json', 'bosses.json', 'drops.json', 'sales.json', 'shares.json'];
    for (const file of files) {
      const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      if (!Array.isArray(data) || data.length === 0) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Initialize data if empty
export async function initializeData(): Promise<void> {
  const exists = await checkDataExists();
  if (!exists) {
    console.log('📦 No data found, creating seed data...');
    await seedData();
  } else {
    console.log('✅ Data already exists, skipping seed.');
  }
}
