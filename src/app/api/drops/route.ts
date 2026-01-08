import { NextResponse } from 'next/server';
import { dropsRepo, itemsRepo, bossesRepo, salesRepo } from '@/lib/repo';
import { createDropSchema } from '@/lib/validators';
import { notifyNewDrop } from '@/lib/discord';
import { authorizeAdmin } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const dropStatus = searchParams.get('drop_status') || undefined;
    const financeStatus = searchParams.get('finance_status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const withDetails = searchParams.get('with_details') === 'true';
    
    const filter: Record<string, unknown> = {};
    if (dropStatus) filter.drop_status = dropStatus;
    if (financeStatus) filter.finance_status = financeStatus;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    
    if (withDetails) {
      const drops = await dropsRepo.listWithDetails({
        search,
        filter: Object.keys(filter).length > 0 ? filter : undefined
      });
      return NextResponse.json(drops);
    }
    
    const drops = await dropsRepo.list({ 
      search, 
      filter: Object.keys(filter).length > 0 ? filter : undefined 
    });
    
    return NextResponse.json(drops);
  } catch (error) {
    console.error('Error fetching drops:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await authorizeAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const result = createDropSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    // Validate item exists
    const item = await itemsRepo.get(result.data.item_id);
    if (!item) {
      return NextResponse.json(
        { error: 'ไม่พบไอเทมที่เลือก' },
        { status: 400 }
      );
    }
    
    // Validate boss exists if provided
    if (result.data.boss_id) {
      const boss = await bossesRepo.get(result.data.boss_id);
      if (!boss) {
        return NextResponse.json(
          { error: 'ไม่พบบอสที่เลือก' },
          { status: 400 }
        );
      }
    }
    
    const drop = await dropsRepo.create({
      ...result.data,
      drop_date: result.data.drop_date ?? null,
      boss_id: result.data.boss_id ?? null,
      note: result.data.note ?? null,
    });
    
    // Notify Discord
    try {
      // Fetch boss name for notification if boss_id exists
      let bossName = undefined;
      if (drop.boss_id) {
        const boss = await bossesRepo.get(drop.boss_id);
        bossName = boss?.name;
      }
      
      const item = await itemsRepo.get(drop.item_id);
      if (item) {
        await notifyNewDrop(item.name, bossName);
      }
    } catch (err) {
      console.error('Failed to send discord notification:', err);
    } // Don't block response on notification failure
    
    return NextResponse.json(drop, { status: 201 });
  } catch (error) {
    console.error('Error creating drop:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Dashboard stats endpoint
export async function OPTIONS() {
  return NextResponse.json({ message: 'OK' });
}
