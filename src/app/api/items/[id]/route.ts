import { NextResponse } from 'next/server';
import { itemsRepo } from '@/lib/repo';
import { updateItemSchema } from '@/lib/validators';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const item = await itemsRepo.get(id);
    
    if (!item) {
      return NextResponse.json(
        { error: 'ไม่พบไอเทม' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

import { authorizeAdmin } from '@/lib/rbac';

export async function PUT(request: Request, context: RouteContext) {
  try {
    const isAdmin = await authorizeAdmin();
    if (!isAdmin) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    
    // ... rest of the code
    
    const result = updateItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const item = await itemsRepo.update(id, result.data);
    
    if (!item) {
      return NextResponse.json(
        { error: 'ไม่พบไอเทม' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
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
    
    const deleted = await itemsRepo.remove(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'ไม่พบไอเทม' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'ลบไอเทมสำเร็จ' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
