'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout, StatusBadge, EmptyState, ConfirmDialog, useToast } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import type { Player } from '@/lib/repo/types';
import { formatDateTime } from '@/lib/utils';

export default function MembersPage() {
  const { showToast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Player | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    discord_id: '',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER',
    active: true,
    username: '',
    password: '',
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlayer(null);
    setFormData({ 
      name: '', 
      discord_id: '', 
      role: 'MEMBER', 
      active: true,
      username: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      discord_id: player.discord_id || '',
      role: player.role,
      active: player.active,
      username: player.username || '',
      password: '', // Don't show password
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingPlayer ? `/api/players/${editingPlayer.id}` : '/api/players';
      const method = editingPlayer ? 'PUT' : 'POST';
      
      const payload: any = {
        name: formData.name,
        discord_id: formData.discord_id || null,
        active: formData.active,
      };

      // Only send role/auth if admin
      if (isAdmin) {
        payload.role = formData.role;
        payload.username = formData.username || null;
        if (formData.password) {
          payload.password = formData.password;
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast(editingPlayer ? 'แก้ไขสมาชิกสำเร็จ' : 'เพิ่มสมาชิกสำเร็จ', 'success');
      setIsModalOpen(false);
      fetchPlayers();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (hard: boolean = false) => {
    if (!deleteConfirm) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/players/${deleteConfirm.id}${hard ? '?hard=true' : ''}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        return;
      }

      showToast(hard ? 'ลบสมาชิกสำเร็จ' : 'ปิดใช้งานสมาชิกสำเร็จ', 'success');
      setDeleteConfirm(null);
      fetchPlayers();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter players
  const filteredPlayers = players.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterActive !== 'all' && p.active !== (filterActive === 'true')) return false;
    if (filterRole !== 'all' && p.role !== filterRole) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สมาชิก</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการสมาชิกในทีม</p>
        </div>
        
        {/* Only Admin can add members */}
        {isAdmin && !authLoading && (
          <button 
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all" 
            onClick={openCreateModal}
          >
            + เพิ่มสมาชิก
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          className="w-full sm:w-64 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          placeholder="ค้นหาชื่อ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="w-full sm:w-40 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="true">ใช้งาน</option>
          <option value="false">ไม่ใช้งาน</option>
        </select>
        <select
          className="w-full sm:w-40 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">Role ทั้งหมด</option>
          <option value="ADMIN">Admin</option>
          <option value="MEMBER">Member</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="ไม่พบสมาชิก"
          description={search ? 'ลองค้นหาด้วยคำอื่น' : 'เพิ่มสมาชิกคนแรกของทีม'}
          action={
            !search && isAdmin && (
              <button 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all" 
                onClick={openCreateModal}
              >
                + เพิ่มสมาชิก
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
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ชื่อ</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Discord ID</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">สร้างเมื่อ</th>
                  {isAdmin && <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider w-24">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div>{player.name}</div>
                      {player.username && isAdmin && (
                        <div className="text-xs text-gray-400 mt-0.5">User: {player.username}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{player.discord_id || '-'}</td>
                    <td className="px-6 py-4 text-sm"><StatusBadge status={player.role} type="role" /></td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        player.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {player.active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {formatDateTime(player.created_at)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                            onClick={() => openEditModal(player)} 
                            title="แก้ไข"
                          >
                            ✏️
                          </button>
                          <button 
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            onClick={() => setDeleteConfirm(player)} 
                            title="ลบ"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
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
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">{editingPlayer ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิก'}</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* General Profile (Open to view for everyone? No, admin edit only for now) */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อในเกม *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ชื่อตัวละคร"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discord ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={formData.discord_id}
                  onChange={(e) => setFormData({ ...formData, discord_id: e.target.value })}
                  placeholder="username#1234"
                />
              </div>
              
              {/* Admin Only Zone */}
              {isAdmin && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">ตั้งค่าระบบ (Admin Only)</div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="สำหรับ Login"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingPlayer ? 'ว่างไว้ถ้าไม่เปลี่ยน' : 'รหัสผ่าน'}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center] pr-10"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MEMBER' })}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <span>ใช้งาน (Active)</span>
                    </label>
                  </div>
                </div>
              )}

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
                  {editingPlayer ? 'บันทึก' : 'เพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="ลบสมาชิก"
        message={
          <div>
            <p className="mb-2">คุณต้องการลบสมาชิก <strong className="text-gray-900">{deleteConfirm?.name}</strong> หรือไม่?</p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1 ml-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <li>Soft delete: ปิดใช้งาน (สามารถเปิดใช้งานใหม่ได้)</li>
              <li>Hard delete: ลบถาวร (ไม่สามารถกู้คืนได้)</li>
            </ul>
          </div>
        }
        confirmText="Soft Delete"
        cancelText="ยกเลิก"
        onConfirm={() => handleDelete(false)}
        onCancel={() => setDeleteConfirm(null)}
        isLoading={isSaving}
      />
    </DashboardLayout>
  );
}
