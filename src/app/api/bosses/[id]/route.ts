import { NextResponse } from 'next/server';
import { bossesRepo } from '@/lib/repo';
import { updateBossSchema } from '@/lib/validators';
import { authorizeAdmin } from '@/lib/rbac';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const boss = await bossesRepo.get(id);
    
    if (!boss) {
      return NextResponse.json(
        { error: 'ไม่พบบอส' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(boss);
  } catch (error) {
    console.error('Error fetching boss:', error);
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
    
    const result = updateBossSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const boss = await bossesRepo.update(id, result.data);
    
    if (!boss) {
      return NextResponse.json(
        { error: 'ไม่พบบอส' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(boss);
  } catch (error) {
    console.error('Error updating boss:', error);
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
    
    const deleted = await bossesRepo.remove(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'ไม่พบบอส' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'ลบบอสสำเร็จ' });
  } catch (error) {
    console.error('Error deleting boss:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
