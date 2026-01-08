import { NextResponse } from 'next/server';
import { playersRepo } from '@/lib/repo';
import { updatePlayerSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';
import { authorizeAdmin } from '@/lib/rbac';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const player = await playersRepo.get(id);
    
    if (!player) {
      return NextResponse.json(
        { error: 'ไม่พบผู้เล่น' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
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
    
    const result = updatePlayerSchema.safeParse(body);
    if (!result.success) {
    // @ts-ignore
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    // Clean up empty strings to undefined
    const { username, password, ...rest } = result.data;
    
    const updateData: any = {
      ...rest,
    };
    
    if (username !== '' && username !== undefined) updateData.username = username;
    if (password !== '' && password !== undefined) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // @ts-ignore
    const player = await playersRepo.update(id, updateData);
    
    if (!player) {
      return NextResponse.json(
        { error: 'ไม่พบผู้เล่น' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(player);
  } catch (error: any) {
    console.error('Error updating player:', error);
    const message = error?.message || 'เกิดข้อผิดพลาด';
    const details = error?.details || '';
    return NextResponse.json({ error: `${message} ${details}`.trim() }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const isAdmin = await authorizeAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';
    
    if (hard) {
      const deleted = await playersRepo.remove(id);
      if (!deleted) {
        return NextResponse.json(
          { error: 'ไม่พบผู้เล่น' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: 'ลบผู้เล่นสำเร็จ' });
    }
    
    // Soft delete
    const player = await playersRepo.update(id, { active: false });
    if (!player) {
      return NextResponse.json(
        { error: 'ไม่พบผู้เล่น' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'ปิดใช้งานผู้เล่นสำเร็จ' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
