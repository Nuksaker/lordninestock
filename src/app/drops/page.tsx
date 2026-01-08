'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout, StatusBadge, EmptyState, ConfirmDialog, useToast } from '@/components';
import type { DropWithDetails, Item, Boss, DropStatus, FinanceStatus } from '@/lib/repo/types';
import { formatDate, formatMoney, getCurrentDate } from '@/lib/utils';

type TabFilter = 'all' | 'WAIT' | 'PAID' | 'PERSONAL' | 'NOT_DROPPED';

export default function DropsPage() {
  const { showToast } = useToast();
  const [drops, setDrops] = useState<DropWithDetails[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<DropWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DropWithDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Boss modal
  const [isBossModalOpen, setIsBossModalOpen] = useState(false);
  const [newBoss, setNewBoss] = useState({ name: '', location: '' });
  
  // Form
  const [formData, setFormData] = useState({
    drop_date: getCurrentDate(),
    item_id: '',
    boss_id: '',
    quantity: 1,
    participant_count: 30,
    drop_status: 'DROPPED' as DropStatus,
    finance_status: 'WAIT' as FinanceStatus,
    note: '',
  });

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]); // Refetch when dates change

  const fetchData = async () => {
    try {
      // Build query string
      const params = new URLSearchParams();
      params.append('with_details', 'true');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const [dropsRes, itemsRes, bossesRes] = await Promise.all([
        fetch(`/api/drops?${params.toString()}`),
        fetch('/api/items'),
        fetch('/api/bosses'),
      ]);
      
      if (!dropsRes.ok || !itemsRes.ok || !bossesRes.ok) throw new Error('Failed to fetch');
      
      const [dropsData, itemsData, bossesData] = await Promise.all([
        dropsRes.json(),
        itemsRes.json(),
        bossesRes.json(),
      ]);
      
      setDrops(dropsData);
      setItems(itemsData);
      setBosses(bossesData);
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDrop(null);
    setFormData({
      drop_date: getCurrentDate(),
      item_id: items[0]?.id || '',
      boss_id: '',
      quantity: 1,
      participant_count: 30,
      drop_status: 'DROPPED',
      finance_status: 'WAIT',
      note: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (drop: DropWithDetails) => {
    setEditingDrop(drop);
    setFormData({
      drop_date: drop.drop_date || '',
      item_id: drop.item_id,
      boss_id: drop.boss_id || '',
      quantity: drop.quantity,
      participant_count: drop.participant_count,
      drop_status: drop.drop_status,
      finance_status: drop.finance_status,
      note: drop.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingDrop ? `/api/drops/${editingDrop.id}` : '/api/drops';
      const method = editingDrop ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          drop_date: formData.drop_date || null,
          boss_id: formData.boss_id || null,
          note: formData.note || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast(editingDrop ? 'แก้ไข Drop สำเร็จ' : 'สร้าง Drop สำเร็จ', 'success');
      setIsModalOpen(false);
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
      const res = await fetch(`/api/drops/${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast('ลบ Drop สำเร็จ', 'success');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkPaid = async (drop: DropWithDetails) => {
    try {
      const res = await fetch(`/api/drops/${drop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finance_status: 'PAID' }),
      });

      if (!res.ok) throw new Error('Failed');
      
      showToast('อัพเดทสถานะสำเร็จ', 'success');
      fetchData();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleAddBoss = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/bosses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBoss.name,
          location: newBoss.location || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast('เพิ่มบอสสำเร็จ', 'success');
      setBosses([...bosses, data]);
      setFormData({ ...formData, boss_id: data.id });
      setIsBossModalOpen(false);
      setNewBoss({ name: '', location: '' });
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter drops
  const filteredDrops = drops.filter(d => {
    if (search && !d.item?.name.toLowerCase().includes(search.toLowerCase())) return false;
    
    switch (activeTab) {
      case 'WAIT': return d.finance_status === 'WAIT' && d.drop_status === 'DROPPED';
      case 'PAID': return d.finance_status === 'PAID';
      case 'PERSONAL': return d.finance_status === 'PERSONAL';
      case 'NOT_DROPPED': return d.drop_status === 'NOT_DROPPED';
      default: return true;
    }
  });

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'ทั้งหมด', count: drops.length },
    { key: 'WAIT', label: 'รอจ่าย', count: drops.filter(d => d.finance_status === 'WAIT' && d.drop_status === 'DROPPED').length },
    { key: 'PAID', label: 'จ่ายแล้ว', count: drops.filter(d => d.finance_status === 'PAID').length },
    { key: 'PERSONAL', label: 'เก็บเอง', count: drops.filter(d => d.finance_status === 'PERSONAL').length },
    { key: 'NOT_DROPPED', label: 'ไม่ดรอป', count: drops.filter(d => d.drop_status === 'NOT_DROPPED').length },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drops</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการรายการ Drop ทั้งหมด</p>
        </div>
        <button 
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          onClick={openCreateModal}
        >
          + สร้าง Drop
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 rounded-lg mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeTab === tab.key 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder="ค้นหาชื่อไอเทม..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <input 
            type="date"
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="ตั้งแต่วันที่"
            title="ตั้งแต่วันที่"
          />
          <span className="self-center text-gray-400">-</span>
          <input 
            type="date"
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="ถึงวันที่"
            title="ถึงวันที่"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredDrops.length === 0 ? (
        <EmptyState
          icon="🎁"
          title="ไม่พบ Drop"
          description={search ? 'ลองค้นหาด้วยคำอื่น' : 'สร้าง Drop แรกของคุณ'}
          action={
            !search && (
              <button 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                onClick={openCreateModal}
              >
                + สร้าง Drop
              </button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">วันที่</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ไอเทม</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">บอส</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">จำนวน</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ผู้เข้าร่วม</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ราคาขาย</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">รายได้สุทธิ</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider w-40">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrops.map((drop) => (
                  <tr key={drop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{formatDate(drop.drop_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{drop.item?.name || '-'}</div>
                      <div className="text-xs text-gray-500">{drop.item?.category}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{drop.boss?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{drop.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{drop.participant_count}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={drop.drop_status} type="drop" />
                        <StatusBadge status={drop.finance_status} type="finance" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {drop.sale ? formatMoney(drop.sale.sale_price) : '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${drop.sale ? 'text-green-600' : 'text-gray-400'}`}>
                      {drop.sale ? formatMoney(drop.sale.net_amount) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                          onClick={() => openEditModal(drop)} 
                          title="แก้ไข"
                        >
                          ✏️
                        </button>
                        {drop.drop_status === 'DROPPED' && drop.finance_status !== 'PERSONAL' && (
                          <Link 
                            href={`/drops/${drop.id}/sale`} 
                            className="p-1 px-2 text-xs font-medium text-white bg-indigo-500 rounded hover:bg-indigo-600 transition-colors"
                          >
                            💰 ขาย
                          </Link>
                        )}
                        {drop.sale && (
                          <Link 
                            href={`/drops/${drop.id}/shares`} 
                            className="p-1 px-2 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 transition-colors"
                          >
                            👥 แบ่ง
                          </Link>
                        )}
                        {drop.sale && drop.finance_status === 'WAIT' && (
                          <button 
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-bold" 
                            onClick={() => handleMarkPaid(drop)}
                            title="ทำเครื่องหมายว่าจ่ายแล้ว"
                          >
                            ✓
                          </button>
                        )}
                        <button 
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          onClick={() => setDeleteConfirm(drop)} 
                          title="ลบ"
                        >
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
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">{editingDrop ? 'แก้ไข Drop' : 'สร้าง Drop'}</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ Drop</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={formData.drop_date}
                    onChange={(e) => setFormData({ ...formData, drop_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ไอเทม *</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                    value={formData.item_id}
                    onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                    required
                  >
                    <option value="">เลือกไอเทม</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">บอส</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                      value={formData.boss_id}
                      onChange={(e) => setFormData({ ...formData, boss_id: e.target.value })}
                    >
                      <option value="">ไม่ระบุ</option>
                      {bosses.map(boss => (
                        <option key={boss.id} value={boss.id}>{boss.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100"
                      onClick={() => setIsBossModalOpen(true)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ผู้เข้าร่วม</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={formData.participant_count}
                    onChange={(e) => setFormData({ ...formData, participant_count: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ Drop</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                    value={formData.drop_status}
                    onChange={(e) => setFormData({ ...formData, drop_status: e.target.value as DropStatus })}
                  >
                    <option value="DROPPED">ดรอปแล้ว</option>
                    <option value="NOT_DROPPED">ไม่ดรอป</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะการเงิน</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                    value={formData.finance_status}
                    onChange={(e) => setFormData({ ...formData, finance_status: e.target.value as FinanceStatus })}
                  >
                    <option value="WAIT">รอจ่าย</option>
                    <option value="PAID">จ่ายแล้ว</option>
                    <option value="PERSONAL">เก็บเอง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <textarea
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
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
                  {editingDrop ? 'บันทึก' : 'สร้าง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Boss Modal */}
      {isBossModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsBossModalOpen(false)}>
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">เพิ่มบอส</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100" onClick={() => setIsBossModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddBoss} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบอส *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={newBoss.name}
                  onChange={(e) => setNewBoss({ ...newBoss, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={newBoss.location}
                  onChange={(e) => setNewBoss({ ...newBoss, location: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all" onClick={() => setIsBossModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 flex items-center gap-2" disabled={isSaving}>
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  เพิ่ม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="ลบ Drop"
        message={`คุณต้องการลบ Drop "${deleteConfirm?.item?.name}" หรือไม่? ข้อมูลการขายและส่วนแบ่งจะถูกลบไปด้วย`}
        confirmText="ลบ"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        isLoading={isSaving}
      />
    </DashboardLayout>
  );
}
