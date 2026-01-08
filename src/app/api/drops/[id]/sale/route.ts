import { NextResponse } from 'next/server';
import { dropsRepo, salesRepo, itemsRepo } from '@/lib/repo';
import { createSaleSchema, updateSaleSchema } from '@/lib/validators';
import { notifySale } from '@/lib/discord';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    // Check drop exists
    const drop = await dropsRepo.get(id);
    if (!drop) {
      return NextResponse.json(
        { error: 'ไม่พบดรอป' },
        { status: 404 }
      );
    }
    
    const sale = await salesRepo.getByDropId(id);
    
    if (!sale) {
      return NextResponse.json(
        { error: 'ยังไม่มีข้อมูลการขาย' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Check drop exists
    const drop = await dropsRepo.get(id);
    if (!drop) {
      return NextResponse.json(
        { error: 'ไม่พบดรอป' },
        { status: 404 }
      );
    }
    
    // Check drop status - cannot add sale to NOT_DROPPED
    if (drop.drop_status === 'NOT_DROPPED') {
      return NextResponse.json(
        { error: 'ไม่สามารถเพิ่มการขายสำหรับไอเทมที่ไม่ดรอป' },
        { status: 400 }
      );
    }
    
    // Check if sale already exists
    const existingSale = await salesRepo.getByDropId(id);
    if (existingSale) {
      return NextResponse.json(
        { error: 'ดรอปนี้มีข้อมูลการขายแล้ว' },
        { status: 400 }
      );
    }
    
    const result = createSaleSchema.safeParse({ ...body, drop_id: id });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const sale = await salesRepo.create({
      ...result.data,
      sale_date: result.data.sale_date ?? null,
      platform: result.data.platform ?? null,
    });
    
    // Update drop finance_status to WAIT (ready for split)
    await dropsRepo.update(id, { finance_status: 'WAIT' });
    
    // Notify Discord
    try {
      if (drop.item_id) {
        const item = await (await import('@/lib/repo')).itemsRepo.get(drop.item_id); // Dynamic import to avoid circular dep if needed, or straight import
        if (item) {
          await notifySale(item.name, sale.sale_price, sale.net_amount);
        }
      }
    } catch (err) {
      console.error('Failed to send discord notification:', err);
    }
    
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Check drop exists
    const drop = await dropsRepo.get(id);
    if (!drop) {
      return NextResponse.json(
        { error: 'ไม่พบดรอป' },
        { status: 404 }
      );
    }
    
    // Check sale exists
    const existingSale = await salesRepo.getByDropId(id);
    if (!existingSale) {
      return NextResponse.json(
        { error: 'ยังไม่มีข้อมูลการขาย' },
        { status: 404 }
      );
    }
    
    // Merge with existing sale for recalculation
    const mergedData = {
      sale_price: body.sale_price ?? existingSale.sale_price,
      fee_percent: body.fee_percent ?? existingSale.fee_percent,
      sale_date: body.sale_date !== undefined ? body.sale_date : existingSale.sale_date,
      platform: body.platform !== undefined ? body.platform : existingSale.platform,
    };
    
    const result = updateSaleSchema.safeParse(mergedData);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const sale = await salesRepo.update(existingSale.id, result.data);
    
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error updating sale:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    const sale = await salesRepo.getByDropId(id);
    if (!sale) {
      return NextResponse.json(
        { error: 'ยังไม่มีข้อมูลการขาย' },
        { status: 404 }
      );
    }
    
    await salesRepo.remove(sale.id);
    
    return NextResponse.json({ success: true, message: 'ลบข้อมูลการขายสำเร็จ' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
