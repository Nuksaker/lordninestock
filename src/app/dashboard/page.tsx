'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout, StatusBadge, useToast } from '@/components';
import { DropWithDetails } from '@/lib/repo/types';
import { formatMoney, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  isAdmin: boolean;
  myStats: {
    totalAmount: number;
    unpaidAmount: number;
    paidAmount: number;
  };
  adminStats: {
    totalSales: number;
    totalDrops: number;
    totalUnpaidShares: number;
    totalPaidShares: number;
  } | null;
  recentDrops: DropWithDetails[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถโหลดข้อมูล Dashboard ได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
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

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          สวัสดี, {user?.username || 'Member'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">ยินดีต้อนรับสู่ระบบจัดการคลัง LordNine Stock</p>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Unpaid (Highlight) */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-600 text-6xl">💰</div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-yellow-800 mb-1">ยอดเงินรอรับ (Pending)</div>
            <div className="text-3xl font-bold text-yellow-700">{formatMoney(stats.myStats.unpaidAmount)}</div>
            <div className="mt-2 text-xs text-yellow-600">จากส่วนแบ่งที่ยังไม่ได้รับ</div>
          </div>
        </div>

        {/* Card 2: Paid */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">ได้รับแล้ว (Paid)</div>
          <div className="text-3xl font-bold text-green-600">{formatMoney(stats.myStats.paidAmount)}</div>
        </div>

        {/* Card 3: Total */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">ยอดสะสมทั้งหมด</div>
          <div className="text-3xl font-bold text-gray-900">{formatMoney(stats.myStats.totalAmount)}</div>
        </div>
      </div>

      {/* Admin Stats Area */}
      {stats.isAdmin && stats.adminStats && (
        <div className="mb-8 p-6 bg-slate-900 rounded-xl shadow-lg text-white">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="bg-indigo-500 w-2 h-6 rounded-full inline-block"></span>
            ภาพรวมระบบ (Admin)
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-slate-400 text-sm mb-1">ยอดขายรวมสุทธิ</div>
              <div className="text-2xl font-bold text-indigo-300">{formatMoney(stats.adminStats.totalSales)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">จำนวน Drop ทั้งหมด</div>
              <div className="text-2xl font-bold">{stats.adminStats.totalDrops} ครั้ง</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">ยอดค้างจ่ายสมาชิก</div>
              <div className="text-2xl font-bold text-yellow-400">{formatMoney(stats.adminStats.totalUnpaidShares)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">จ่ายให้สมาชิกแล้ว</div>
              <div className="text-2xl font-bold text-green-400">{formatMoney(stats.adminStats.totalPaidShares)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Drops */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">รายการ Drop ล่าสุด</h2>
      {stats.recentDrops.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">วันที่</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ไอเทม</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">บอส</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ยอดสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentDrops.map((drop) => (
                  <tr key={drop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{formatDate(drop.drop_date)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{drop.item?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{drop.boss?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                         <StatusBadge status={drop.drop_status} type="drop" />
                         <StatusBadge status={drop.finance_status} type="finance" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {drop.sale ? formatMoney(drop.sale.net_amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 text-center">
            <Link href="/drops" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              ดูทั้งหมด →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200 text-gray-500">
          ยังไม่มีรายการ Drop
        </div>
      )}
    </DashboardLayout>
  );
}
