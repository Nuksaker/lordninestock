import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validators';
import { signToken, setSessionCookie } from '@/lib/auth';
import { playersRepo } from '@/lib/repo';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        // @ts-ignore
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { username, password } = result.data;
    
    let role: 'ADMIN' | 'MEMBER' = 'MEMBER';
    let userFound = false;

    // 1. Check Env Admin first (Priority)
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (adminUser && adminPass && username === adminUser && password === adminPass) {
      userFound = true;
      role = 'ADMIN';
    } else {
      // 2. Check Database Players
      const player = await playersRepo.findByUsername(username);
      
      if (player && player.password && player.active) {
         // Check valid hash first
         const isMatch = await bcrypt.compare(password, player.password);
         
         if (isMatch) {
            userFound = true;
            role = player.role;
         }
      }
    }
    
    if (!userFound) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    // Create token and set cookie
    const token = await signToken(username, role);
    await setSessionCookie(token);
    
    return NextResponse.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
