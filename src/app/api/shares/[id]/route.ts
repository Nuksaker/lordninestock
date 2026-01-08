import { NextResponse } from 'next/server';
import { sharesRepo, playersRepo } from '@/lib/repo';
import { updateShareSchema } from '@/lib/validators';
import { authorizeAdmin } from '@/lib/rbac';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    const share = await sharesRepo.get(id);
    if (!share) {
      return NextResponse.json(
        { error: 'ไม่พบส่วนแบ่ง' },
        { status: 404 }
      );
    }
    
    const player = await playersRepo.get(share.player_id);
    
    return NextResponse.json({ ...share, player });
  } catch (error) {
    console.error('Error fetching share:', error);
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
    
    const existingShare = await sharesRepo.get(id);
    if (!existingShare) {
      return NextResponse.json(
        { error: 'ไม่พบส่วนแบ่ง' },
        { status: 404 }
      );
    }
    
    const result = updateShareSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    // Validate player if changing
    if (result.data.player_id) {
      const player = await playersRepo.get(result.data.player_id);
      if (!player) {
        return NextResponse.json(
          { error: 'ไม่พบผู้เล่นที่เลือก' },
          { status: 400 }
        );
      }
    }
    
    const share = await sharesRepo.update(id, result.data);
    const player = await playersRepo.get(share!.player_id);
    
    return NextResponse.json({ ...share, player });
  } catch (error) {
    console.error('Error updating share:', error);
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
    
    const deleted = await sharesRepo.remove(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'ไม่พบส่วนแบ่ง' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'ลบส่วนแบ่งสำเร็จ' });
  } catch (error) {
    console.error('Error deleting share:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
