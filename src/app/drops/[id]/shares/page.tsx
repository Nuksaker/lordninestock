'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { DashboardLayout, StatusBadge, EmptyState, ConfirmDialog, useToast } from '@/components';
import type { DropWithDetails, ShareWithPlayer, Player, ShareType, PaidStatus } from '@/lib/repo/types';
import { formatMoney } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SharesPage({ params }: PageProps) {
  const { id } = use(params);
  const { showToast } = useToast();
  
  const [drop, setDrop] = useState<DropWithDetails | null>(null);
  const [shares, setShares] = useState<ShareWithPlayer[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShare, setEditingShare] = useState<ShareWithPlayer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ShareWithPlayer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Split equally modal
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  // Form
  const [formData, setFormData] = useState({
    player_id: '',
    share_type: 'AUTO' as ShareType,
    percent: 0,
    amount: 0,
    paid_status: 'WAIT' as PaidStatus,
    remark: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [dropRes, sharesRes, playersRes] = await Promise.all([
        fetch(`/api/drops/${id}?with_details=true`),
        fetch(`/api/drops/${id}/shares`),
        fetch('/api/players?active=true'),
      ]);
      
      if (!dropRes.ok || !sharesRes.ok || !playersRes.ok) throw new Error('Failed');
      
      const [dropData, sharesData, playersData] = await Promise.all([
        dropRes.json(),
        sharesRes.json(),
        playersRes.json(),
      ]);
      
      setDrop(dropData);
      setShares(sharesData);
      setPlayers(playersData);
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingShare(null);
    setFormData({
      player_id: players[0]?.id || '',
      share_type: 'AUTO',
      percent: 0,
      amount: 0,
      paid_status: 'WAIT',
      remark: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (share: ShareWithPlayer) => {
    setEditingShare(share);
    setFormData({
      player_id: share.player_id,
      share_type: share.share_type,
      percent: share.percent || 0,
      amount: share.amount,
      paid_status: share.paid_status,
      remark: share.remark || '',
    });
    setIsModalOpen(true);
  };

  const handleQuickBuy50 = () => {
    if (!drop?.sale) return;
    setEditingShare(null);
    const buyAmount = drop.sale.net_amount * 0.5;
    setFormData({
      player_id: players[0]?.id || '',
      share_type: 'BUY',
      percent: 50,
      amount: buyAmount,
      paid_status: 'WAIT',
      remark: 'ซื้อ 50%',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingShare 
        ? `/api/shares/${editingShare.id}` 
        : `/api/drops/${id}/shares`;
      const method = editingShare ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: formData.player_id,
          share_type: formData.share_type,
          percent: formData.percent || null,
          amount: formData.amount,
          paid_status: formData.paid_status,
          remark: formData.remark || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast(editingShare ? 'แก้ไขส่วนแบ่งสำเร็จ' : 'เพิ่มส่วนแบ่งสำเร็จ', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSplitEqually = async () => {
    if (selectedPlayers.length === 0) {
      showToast('กรุณาเลือกผู้เล่นอย่างน้อย 1 คน', 'error');
      return;
    }
    
    setIsSaving(true);

    try {
      const res = await fetch(`/api/drops/${id}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          split_equally: true,
          player_ids: selectedPlayers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast('แบ่งเท่าๆ กันสำเร็จ', 'success');
      setIsSplitModalOpen(false);
      setSelectedPlayers([]);
      fetchData();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/shares/${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast('ลบส่วนแบ่งสำเร็จ', 'success');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePaidStatus = async (share: ShareWithPlayer) => {
    try {
      const newStatus = share.paid_status === 'WAIT' ? 'PAID' : 'WAIT';
      const res = await fetch(`/api/shares/${share.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed');
      
      showToast('อัพเดทสถานะสำเร็จ', 'success');
      fetchData();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const totalShared = shares.reduce((sum, s) => sum + s.amount, 0);
  const remaining = (drop?.sale?.net_amount || 0) - totalShared;

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

  if (!drop || !drop.sale) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">ไม่พบ Drop หรือยังไม่มีข้อมูลการขาย</p>
          <Link href="/drops" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all">
            กลับไปหน้า Drops
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/drops" className="text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2 inline-block">
            ← กลับไปหน้า Drops
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">จัดการส่วนแบ่ง</h1>
          <p className="text-sm text-gray-500 mt-1">
            ไอเทม: <span className="font-medium text-gray-900">{drop.item?.name}</span> | รายได้สุทธิ: <span className="font-medium text-green-600">{formatMoney(drop.sale.net_amount)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all" onClick={handleQuickBuy50}>
            💰 เพิ่ม BUY 50%
          </button>
          <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all" onClick={() => setIsSplitModalOpen(true)}>
            👥 แบ่งเท่าๆ กัน
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all" onClick={openCreateModal}>
            + เพิ่มส่วนแบ่ง
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">รายได้สุทธิ</div>
          <div className="text-2xl font-bold text-green-500">
            {formatMoney(drop.sale.net_amount)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">แบ่งแล้ว</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMoney(totalShared)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">คงเหลือ</div>
          <div className={`text-2xl font-bold ${remaining > 0 ? 'text-yellow-500' : remaining < 0 ? 'text-red-500' : 'text-gray-300'}`}>
            {formatMoney(remaining)}
          </div>
        </div>
      </div>

      {/* Shares Table */}
      {shares.length === 0 ? (
        <EmptyState
          icon="👥"
          title="ยังไม่มีส่วนแบ่ง"
          description="เพิ่มส่วนแบ่งให้ผู้เล่น"
          action={
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all" onClick={openCreateModal}>
              + เพิ่มส่วนแบ่ง
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ผู้เล่น</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ประเภท</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">เปอร์เซ็นต์</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">จำนวนเงิน</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">หมายเหตุ</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shares.map((share) => (
                  <tr key={share.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{share.player?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        share.share_type === 'BUY' ? 'bg-purple-100 text-purple-800' : 
                        share.share_type === 'PERSONAL' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {share.share_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{share.percent ? `${share.percent.toFixed(2)}%` : '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">{formatMoney(share.amount)}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => togglePaidStatus(share)}
                        className="focus:outline-none transition-transform active:scale-95"
                      >
                        <StatusBadge status={share.paid_status} type="paid" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{share.remark || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" onClick={() => openEditModal(share)} title="แก้ไข">
                          ✏️
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => setDeleteConfirm(share)} title="ลบ">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">{editingShare ? 'แก้ไขส่วนแบ่ง' : 'เพิ่มส่วนแบ่ง'}</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้เล่น *</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                  value={formData.player_id}
                  onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                  required
                >
                  <option value="">เลือกผู้เล่น</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                    value={formData.share_type}
                    onChange={(e) => setFormData({ ...formData, share_type: e.target.value as ShareType })}
                  >
                    <option value="AUTO">AUTO</option>
                    <option value="BUY">BUY</option>
                    <option value="PERSONAL">PERSONAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เปอร์เซ็นต์</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={formData.percent || ''}
                    onChange={(e) => {
                      const percent = parseFloat(e.target.value) || 0;
                      const amount = drop.sale ? (drop.sale.net_amount * percent / 100) : 0;
                      setFormData({ ...formData, percent, amount: Math.round(amount * 100) / 100 });
                    }}
                    min={0}
                    max={100}
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน *</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะการจ่าย</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                  value={formData.paid_status}
                  onChange={(e) => setFormData({ ...formData, paid_status: e.target.value as PaidStatus })}
                >
                  <option value="WAIT">รอรับเงิน</option>
                  <option value="PAID">ได้รับแล้ว</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="เช่น ซื้อ 50%"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" onClick={() => setIsModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 flex items-center gap-2" disabled={isSaving}>
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editingShare ? 'บันทึก' : 'เพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Split Equally Modal */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsSplitModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">แบ่งเท่าๆ กัน</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100" onClick={() => setIsSplitModalOpen(false)}>✕</button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                เลือกผู้เล่นที่จะได้รับส่วนแบ่ง (แบ่งเท่าๆ กันจากรายได้สุทธิ <strong className="text-gray-900">{formatMoney(drop.sale.net_amount)}</strong>)
              </p>
              
              <div className="max-h-60 overflow-y-auto mb-4 space-y-1">
                {players.map(p => (
                  <label 
                    key={p.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                      selectedPlayers.includes(p.id) 
                        ? 'bg-indigo-50 border-indigo-200' 
                        : 'bg-white hover:bg-gray-50 border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={selectedPlayers.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayers([...selectedPlayers, p.id]);
                        } else {
                          setSelectedPlayers(selectedPlayers.filter(id => id !== p.id));
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  </label>
                ))}
              </div>

              {selectedPlayers.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                  <div className="text-xs text-gray-500 text-center">
                    แต่ละคนจะได้รับ: <strong className="text-green-600 text-sm">
                      {formatMoney(drop.sale.net_amount / selectedPlayers.length)}
                    </strong>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" onClick={() => setIsSplitModalOpen(false)}>
                  ยกเลิก
                </button>
                <button 
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={handleSplitEqually}
                  disabled={isSaving || selectedPlayers.length === 0}
                >
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  แบ่งให้ {selectedPlayers.length} คน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="ลบส่วนแบ่ง"
        message={`คุณต้องการลบส่วนแบ่งของ "${deleteConfirm?.player?.name}" หรือไม่?`}
        confirmText="ลบ"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        isLoading={isSaving}
      />
    </DashboardLayout>
  );
}
