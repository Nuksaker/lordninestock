'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout, useToast } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth(); // Assuming refreshUser exists or we just rely on session
  const { showToast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    discord_id: '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Fetch true user details from API instead of just session values
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.player) {
           setProfileData({
             name: data.player.name || '',
             discord_id: data.player.discord_id || '',
           });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Need user ID to update. 
      // Option 1: Using /api/auth/me response to get ID
      // Option 2: Auth context usually has user info.
      
      // Let's assume we fetch /api/auth/me again to get ID or we pass it via specialized endpoint
      // To simplify, let's assume we can PUT to /api/auth/me or verify ID first.
      
      // Better: Just use known API structure. We need ID.
      // Let's fetch ID first if not in context.
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      
      if (!meData.player?.id) throw new Error('User not found');

      const res = await fetch(`/api/players/${meData.player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           name: profileData.name,
           discord_id: profileData.discord_id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update');
      }

      showToast('เบนทึกข้อมูลสำเร็จ', 'success');
      // refreshUser?.(); // If available
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast('รหัสผ่านใหม่ไม่ตรงกัน', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to change password');
      }

      showToast('เปลี่ยนรหัสผ่านสำเร็จ', 'success');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การตั้งค่าบัญชี</h1>
          <p className="text-sm text-gray-500">จัดการข้อมูลส่วนตัวและความปลอดภัย</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">ข้อมูลส่วนตัว</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  value={user?.username || ''} 
                  disabled 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อในเกม (Name)</label>
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discord ID (Optional)</label>
                <input 
                  type="text" 
                  value={profileData.discord_id} 
                  onChange={e => setProfileData({...profileData, discord_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-amber-500">🔒</span> เปลี่ยนรหัสผ่าน
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านเดิม</label>
                <input 
                  type="password" 
                  value={passwordData.old_password} 
                  onChange={e => setPasswordData({...passwordData, old_password: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                <input 
                  type="password" 
                  value={passwordData.new_password} 
                  onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <input 
                  type="password" 
                  value={passwordData.confirm_password} 
                  onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
