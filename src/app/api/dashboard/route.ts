import { NextResponse } from 'next/server';
import { dropsRepo, salesRepo } from '@/lib/repo';
import type { DropWithDetails } from '@/lib/repo/types';

export async function GET() {
  try {
    const drops = await dropsRepo.listWithDetails();
    
    // Calculate stats
    const totalDrops = drops.length;
    const droppedDrops = drops.filter(d => d.drop_status === 'DROPPED');
    
    let totalSalePrice = 0;
    let totalFee = 0;
    let totalNet = 0;
    
    for (const drop of drops) {
      if (drop.sale) {
        totalSalePrice += drop.sale.sale_price;
        totalFee += drop.sale.fee_amount;
        totalNet += drop.sale.net_amount;
      }
    }
    
    // Count by finance status
    const statusCounts = {
      WAIT: drops.filter(d => d.finance_status === 'WAIT').length,
      PAID: drops.filter(d => d.finance_status === 'PAID').length,
      PERSONAL: drops.filter(d => d.finance_status === 'PERSONAL').length,
      NOT_DROPPED: drops.filter(d => d.drop_status === 'NOT_DROPPED').length,
    };
    
    // Recent drops (last 20)
    const recentDrops = drops.slice(0, 20);
    
    return NextResponse.json({
      stats: {
        totalDrops,
        droppedDrops: droppedDrops.length,
        totalSalePrice,
        totalFee,
        totalNet,
        statusCounts,
      },
      recentDrops,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}
