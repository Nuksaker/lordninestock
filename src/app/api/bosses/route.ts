import { NextResponse } from 'next/server';
import { bossesRepo } from '@/lib/repo';
import { createBossSchema } from '@/lib/validators';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    
    const bosses = await bossesRepo.list({ search });
    
    return NextResponse.json(bosses);
  } catch (error) {
    console.error('Error fetching bosses:', error);
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
    
    const result = createBossSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const boss = await bossesRepo.create({
      ...result.data,
      location: result.data.location ?? null,
    });
    
    return NextResponse.json(boss, { status: 201 });
  } catch (error) {
    console.error('Error creating boss:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
