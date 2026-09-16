import React, { useEffect, useState } from 'react';
import { 
  HardDrive, 
  Users, 
  Clock, 
  Star, 
  Trash2, 
  Plus, 
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import type { User } from '../api/client';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onNewUpload }) => {
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

  const formatGB = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.01) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(1)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-full shrink-0 p-5">
      <div>
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
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive 
                    ? 'bg-[#EEF2FF] text-[#5D5FEF] font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#5D5FEF]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dynamic Storage Status Card */}
      <div className="p-4 bg-[#F8FAFC] border border-slate-200/70 rounded-2xl">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-800">Storage Used</span>
          <button className="text-[11px] font-bold text-[#5D5FEF] tracking-wider hover:underline uppercase cursor-pointer">
            Upgrade
          </button>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              usedPercent > 85 ? 'bg-rose-500' : usedPercent > 60 ? 'bg-amber-500' : 'bg-[#5D5FEF]'
            }`}
            style={{ width: `${Math.max(usedPercent, 1)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 font-medium">
          {formatGB(storageUsed)} of {formatGB(storageQuota)} used
        </p>
        {user && (
          <p className="text-[10px] text-slate-300 mt-0.5 truncate" title={user.email}>
            {user.full_name || user.email}
          </p>
        )}
      </div>
    </aside>
  );
};
