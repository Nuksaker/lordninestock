import { NextResponse } from 'next/server';
import { dropsRepo, sharesRepo, playersRepo, salesRepo } from '@/lib/repo';
import { createShareSchema } from '@/lib/validators';
import { notifyDividend } from '@/lib/discord';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    // Check drop exists
    const drop = await dropsRepo.get(id);
    if (!drop) {
      return NextResponse.json(
        { error: 'ไม่พบดรอป' },
        { status: 404 }
      );
    }
    
    const shares = await sharesRepo.listByDropId(id);
    
    // Enrich with player info
    const sharesWithPlayers = await Promise.all(
      shares.map(async (share) => {
        const player = await playersRepo.get(share.player_id);
        return { ...share, player };
      })
    );
    
    return NextResponse.json(sharesWithPlayers);
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Check drop exists
    const drop = await dropsRepo.get(id);
    if (!drop) {
      return NextResponse.json(
        { error: 'ไม่พบดรอป' },
        { status: 404 }
      );
    }
    
    // Handle bulk create (split equally)
    if (body.split_equally && Array.isArray(body.player_ids)) {
      const sale = await salesRepo.getByDropId(id);
      if (!sale) {
        return NextResponse.json(
          { error: 'ต้องมีข้อมูลการขายก่อนจึงจะแบ่งส่วนได้' },
          { status: 400 }
        );
      }
      
      const playerIds: string[] = body.player_ids;
      const equalPercent = 100 / playerIds.length;
      const equalAmount = sale.net_amount / playerIds.length;
      
      // Delete existing shares for this drop to recalculate
      await sharesRepo.removeByDropId(id);
      
      const shares = [];
      for (const playerId of playerIds) {
        // ... (existing loop code, assumed unchanged in replacement) ...
        const player = await playersRepo.get(playerId);
        if (!player) {
           // ...
        }
        
        const share = await sharesRepo.create({
          drop_id: id,
          player_id: playerId,
          share_type: 'AUTO',
          percent: Math.round(equalPercent * 100) / 100,
          amount: Math.round(equalAmount * 100) / 100,
          paid_status: 'WAIT',
          remark: null,
        });
        shares.push(share);
      }
      
      // Notify Discord
      try {
        if (drop.item_id) {
          const item = await (await import('@/lib/repo')).itemsRepo.get(drop.item_id);
          if (item) {
             await notifyDividend(item.name, equalAmount, playerIds.length);
          }
        }
      } catch (err) {
        console.error('Failed to send discord notification:', err);
      }

      return NextResponse.json(shares, { status: 201 });
    }
    
    // Single share create
    const result = createShareSchema.safeParse({ ...body, drop_id: id });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    // Validate player exists
    const player = await playersRepo.get(result.data.player_id);
    if (!player) {
      return NextResponse.json(
        { error: 'ไม่พบผู้เล่นที่เลือก' },
        { status: 400 }
      );
    }
    
    const share = await sharesRepo.create({
      ...result.data,
      percent: result.data.percent ?? null,
      remark: result.data.remark ?? null,
    });
    
    return NextResponse.json({ ...share, player }, { status: 201 });
  } catch (error) {
    console.error('Error creating share:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
