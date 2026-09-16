import React, { useEffect, useState } from 'react';
import { 
  HardDrive, 
  Users, 
  Clock, 
  Star, 
  Trash2, 
  Plus, 
  Layers,
  LogOut
} from 'lucide-react';
import { api } from '../api/client';
import type { User } from '../api/client';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewUpload: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onNewUpload, onLogout }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.getMe().then(setUser).catch(() => setUser(null));
  }, []);

  const navItems = [
    { id: 'my-drive', label: 'My Drive', icon: HardDrive },
    { id: 'shared', label: 'Shared with Me', icon: Users },
    { id: 'recent', label: 'Recent Files', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const storageUsed = user?.storage_used_bytes ?? 0;
  const storageQuota = user?.storage_quota_bytes ?? 5 * 1024 * 1024 * 1024;
  const usedPercent = Math.min((storageUsed / storageQuota) * 100, 100);

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.001) {
      const mb = bytes / (1024 * 1024);
      return mb < 0.01 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  // Initials for avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-full shrink-0">
      
      {/* Top section */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#5D5FEF] flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">SecureShare</span>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onNewUpload}
          className="w-full bg-[#5D5FEF] hover:bg-[#4F46E5] text-white font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors mb-6 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Upload</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#5D5FEF] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#5D5FEF]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-5 space-y-3 border-t border-slate-100">

        {/* Storage Status Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Storage</span>
            <button className="text-[10px] font-bold text-[#5D5FEF] tracking-wider hover:underline uppercase cursor-pointer">
              Upgrade
            </button>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-1.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedPercent > 85 ? 'bg-rose-500' : usedPercent > 60 ? 'bg-amber-500' : 'bg-[#5D5FEF]'
              }`}
              style={{ width: `${Math.max(usedPercent, 1)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {formatStorage(storageUsed)} of {formatStorage(storageQuota)} used
          </p>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 hover:bg-slate-100/70 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#5D5FEF] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate" title={user?.full_name || 'User'}>
              {user?.full_name || 'User'}
            </p>
            <p className="text-[10px] text-slate-400 truncate" title={user?.email || ''}>
              {user?.email || ''}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onLogout}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
};
