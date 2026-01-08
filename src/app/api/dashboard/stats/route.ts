import { NextResponse } from 'next/server';
import { verifyToken, getSessionToken } from '@/lib/auth';
import { salesRepo, sharesRepo, dropsRepo, playersRepo } from '@/lib/repo';

export async function GET(request: Request) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Try to find player by username
    const player = await playersRepo.findByUsername(user.sub);
    const isAdmin = user.role === 'ADMIN';

    // 1. Common Stats: My Stats (Only if player exists)
    let myStats = { totalAmount: 0, unpaidAmount: 0, paidAmount: 0 };
    if (player) {
      myStats = await sharesRepo.getStats(player.id);
    } else if (isAdmin) {
      // If admin from env (not in DB), myStats is irrelevant or 0
      // We accept this case
    } else {
      // If MEMBER but not found in DB -> Data inconsistency
       return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 2. Recent Drops (Everyone sees this)
    const recentDrops = await dropsRepo.listWithDetails({ limit: 5 });

    // 3. Admin Stats (Only if admin)
    let adminStats: any = {};
    if (isAdmin) {
      const salesStats = await salesRepo.getStats();
      const allSharesStats = await sharesRepo.getStats(); // Global stats
      
      adminStats = {
        totalSales: salesStats.totalSales,
        totalDrops: salesStats.totalDrops,
        totalUnpaidShares: allSharesStats.unpaidAmount,
        totalPaidShares: allSharesStats.paidAmount,
      };
    }

    return NextResponse.json({
      isAdmin,
      myStats,
      adminStats: isAdmin ? adminStats : null,
      recentDrops,
    });


  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard' },
      { status: 500 }
    );
  }
}
