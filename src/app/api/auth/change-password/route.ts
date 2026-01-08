import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { playersRepo } from '@/lib/repo';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'กรุณาระบุรหัสผ่านเดิม'),
  new_password: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { old_password, new_password } = result.data;
    
    // Get current user
    const player = await playersRepo.findByUsername(session.sub);
    if (!player) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }
    
    // Verify old password
    // Must handle both bcrypt and plain text (legacy) logic if needed,
    // but based on recent changes, we assume hash or plain text compare via bcrypt/direct
    
    let isMatch = false;
    if (player.password) {
        // Try bcrypt first
        isMatch = await bcrypt.compare(old_password, player.password);
        
        // Fallback: If not match, try direct comparison (only if not a valid hash format, but simple compare covers legacy plain text)
        // Actually, bcrypt.compare return false for plain text mismatches against hash.
        // If legacy password in DB is plain text '1234', bcrypt.compare('1234', '1234') returns false.
        // So we might need a fallback check for legacy plain text passwords during this transition.
        if (!isMatch && player.password === old_password) {
            isMatch = true;
        }
    }
    
    if (!isMatch) {
      return NextResponse.json(
        { error: 'รหัสผ่านเดิมไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password
    await playersRepo.update(player.id, { password: hashedPassword });
    
    return NextResponse.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' },
      { status: 500 }
    );
  }
}
