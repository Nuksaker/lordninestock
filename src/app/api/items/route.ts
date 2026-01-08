import { NextResponse } from 'next/server';
import { itemsRepo } from '@/lib/repo';
import { createItemSchema } from '@/lib/validators';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    
    const items = await itemsRepo.list({ 
      search, 
      filter: Object.keys(filter).length > 0 ? filter : undefined 
    });
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

import { authorizeAdmin } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const isAdmin = await authorizeAdmin();
    if (!isAdmin) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const result = createItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const item = await itemsRepo.create({
      ...result.data,
      sub_type: result.data.sub_type ?? null,
      note: result.data.note ?? null,
    });
    
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
