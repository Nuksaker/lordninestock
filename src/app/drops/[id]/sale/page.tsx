'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout, useToast } from '@/components';
import type { DropWithDetails, Sale } from '@/lib/repo/types';
import { formatMoney, calculateFee, calculateNet } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SalePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  
  const [drop, setDrop] = useState<DropWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    sale_price: 0,
    fee_percent: 5,
    sale_date: '',
    platform: '',
  });
  
  const [computed, setComputed] = useState({
    fee_amount: 0,
    net_amount: 0,
  });

  useEffect(() => {
    fetchDrop();
  }, [id]);

  useEffect(() => {
    // Recalculate on form change
    const feeAmount = calculateFee(formData.sale_price, formData.fee_percent);
    const netAmount = calculateNet(formData.sale_price, feeAmount);
    setComputed({ fee_amount: feeAmount, net_amount: netAmount });
  }, [formData.sale_price, formData.fee_percent]);

  const fetchDrop = async () => {
    try {
      const res = await fetch(`/api/drops/${id}?with_details=true`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setDrop(data);
      
      // If sale exists, populate form
      if (data.sale) {
        setFormData({
          sale_price: data.sale.sale_price,
          fee_percent: data.sale.fee_percent,
          sale_date: data.sale.sale_date || '',
          platform: data.sale.platform || '',
        });
      } else {
        // Default sale date to today
        setFormData(prev => ({
          ...prev,
          sale_date: new Date().toISOString().split('T')[0],
        }));
      }
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.sale_price <= 0) {
      showToast('กรุณาระบุราคาขาย', 'error');
      return;
    }
    
    setIsSaving(true);

    try {
      const isEdit = !!drop?.sale;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(`/api/drops/${id}/sale`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_price: formData.sale_price,
          fee_percent: formData.fee_percent,
          sale_date: formData.sale_date || null,
          platform: formData.platform || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast(isEdit ? 'แก้ไขข้อมูลการขายสำเร็จ' : 'บันทึกข้อมูลการขายสำเร็จ', 'success');
      router.push('/drops');
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </DashboardLayout>
    );
  }

  if (!drop) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">ไม่พบ Drop</p>
          <Link href="/drops" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all">
            กลับไปหน้า Drops
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/drops" className="text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2 inline-block">
          ← กลับไปหน้า Drops
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {drop.sale ? 'แก้ไขข้อมูลการขาย' : 'เพิ่มข้อมูลการขาย'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          ไอเทม: <span className="font-medium text-gray-900">{drop.item?.name}</span> | บอส: <span className="font-medium text-gray-900">{drop.boss?.name || '-'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-5xl">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท) *</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={formData.sale_price || ''}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                min={0}
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ค่าธรรมเนียม (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={formData.fee_percent}
                onChange={(e) => setFormData({ ...formData, fee_percent: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step="0.1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ขาย</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แพลตฟอร์ม</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="เช่น Facebook, Discord"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <Link href="/drops" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all">
                ยกเลิก
              </Link>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
                disabled={isSaving}
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                บันทึก
              </button>
            </div>
          </form>
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการขาย</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">ราคาขาย</div>
                <div className="text-2xl font-bold text-gray-900">{formatMoney(formData.sale_price)}</div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">ค่าธรรมเนียม ({formData.fee_percent}%)</span>
                  <span className="text-sm font-medium text-yellow-600">-{formatMoney(computed.fee_amount)}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">รายได้สุทธิ</div>
                <div className="text-3xl font-bold text-green-600">{formatMoney(computed.net_amount)}</div>
              </div>

              {drop.participant_count > 0 && computed.net_amount > 0 && (
                <div className="pt-4 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 p-6 mt-2">
                  <div className="text-xs text-gray-500 mb-1">เฉลี่ยต่อคน ({drop.participant_count} คน)</div>
                  <div className="text-lg font-semibold text-gray-900">~{formatMoney(computed.net_amount / drop.participant_count)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
