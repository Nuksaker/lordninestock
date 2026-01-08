import { NextResponse } from 'next/server';
import { dropsRepo, itemsRepo, bossesRepo, salesRepo, sharesRepo } from '@/lib/repo';
import { updateDropSchema } from '@/lib/validators';
import { authorizeAdmin } from '@/lib/rbac';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const withDetails = searchParams.get('with_details') === 'true';
    
    const drop = await dropsRepo.get(id);
    
    if (!drop) {
      return NextResponse.json(
        { error: 'ไม่พบดรอป' },
        { status: 404 }
      );
    }
    
    if (withDetails) {
      const item = await itemsRepo.get(drop.item_id);
      const boss = drop.boss_id ? await bossesRepo.get(drop.boss_id) : null;
      const sale = await salesRepo.getByDropId(drop.id);
      const shares = await sharesRepo.listByDropId(drop.id);
      
      return NextResponse.json({
        ...drop,
        item,
        boss,
        sale,
        shares,
      });
    }
    
    return NextResponse.json(drop);
  } catch (error) {
    console.error('Error fetching drop:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const isAdmin = await authorizeAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    
    const result = updateDropSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    // Check if drop exists
    const existingDrop = await dropsRepo.get(id);
    if (!existingDrop) {
      return NextResponse.json(
        { error: 'ไม่พบดรอป' },
        { status: 404 }
      );
    }
    
    // Validate item if changing
    if (result.data.item_id) {
      const item = await itemsRepo.get(result.data.item_id);
      if (!item) {
        return NextResponse.json(
          { error: 'ไม่พบไอเทมที่เลือก' },
          { status: 400 }
        );
      }
    }
    
    // Validate boss if changing
    if (result.data.boss_id) {
      const boss = await bossesRepo.get(result.data.boss_id);
      if (!boss) {
        return NextResponse.json(
          { error: 'ไม่พบบอสที่เลือก' },
          { status: 400 }
        );
      }
    }
    
    const drop = await dropsRepo.update(id, result.data);
    
    return NextResponse.json(drop);
  } catch (error) {
    console.error('Error updating drop:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const isAdmin = await authorizeAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    
    // Also delete related sale and shares
    const sale = await salesRepo.getByDropId(id);
    if (sale) {
      await salesRepo.remove(sale.id);
    }
    
    const shares = await sharesRepo.listByDropId(id);
    for (const share of shares) {
      await sharesRepo.remove(share.id);
    }
    
    const deleted = await dropsRepo.remove(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'ไม่พบดรอป' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'ลบดรอปสำเร็จ' });
  } catch (error) {
    console.error('Error deleting drop:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
