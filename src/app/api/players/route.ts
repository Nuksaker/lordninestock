import { NextResponse } from 'next/server';
import { playersRepo } from '@/lib/repo';
import { createPlayerSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const active = searchParams.get('active');
    const role = searchParams.get('role');
    
    const filter: Record<string, unknown> = {};
    if (active !== null) filter.active = active === 'true';
    if (role) filter.role = role;
    
    const players = await playersRepo.list({ 
      search, 
      filter: Object.keys(filter).length > 0 ? filter : undefined 
    });
    
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const result = createPlayerSchema.safeParse(body);
    if (!result.success) {
      console.error('Validation Error:', result.error);
      const formatted = result.error.format();
      const errorMessage = result.error.errors?.[0]?.message || 'ข้อมูลไม่ถูกต้อง';
      
      // Construct a more detailed error message
      const details = Object.entries(formatted)
        .filter(([key]) => key !== '_errors')
        .map(([key, value]: any) => `${key}: ${value._errors?.join(', ')}`)
        .join('; ');

      return NextResponse.json(
        { error: errorMessage, details: details || JSON.stringify(formatted) },
        { status: 400 }
      );
    }
    
    const { username, password, ...rest } = result.data;
    
    const playerData = {
      ...rest,
      username: username || undefined,
      password: password ? await bcrypt.hash(password, 10) : undefined,
      discord_id: result.data.discord_id ?? null,
    };
    
    // Check for duplicate username
    if (playerData.username) {
      const existing = await playersRepo.findByUsername(playerData.username);
      if (existing) {
        return NextResponse.json(
          { error: 'Username นี้ถูกใช้งานแล้ว' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate name
    const existingName = await playersRepo.findByName(playerData.name);
    if (existingName) {
      return NextResponse.json(
        { error: 'ชื่อผู้เล่นนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }
    
    // @ts-ignore
    const player = await playersRepo.create(playerData);
    
    return NextResponse.json(player, { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    const message = error?.message || 'เกิดข้อผิดพลาด';
    const details = error?.details || '';
    return NextResponse.json({ error: `${message} ${details}`.trim() }, { status: 400 });
  }
}
