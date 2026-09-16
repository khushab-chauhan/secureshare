import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  UploadCloud, 
  ShieldCheck, 
  HardDrive, 
  LogOut, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import type { User } from '../api/client';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'upload' | 'storage' | 'security' | 'system';
}

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: User | null;
  onLogout: () => void;
  notifications?: NotificationItem[];
  onClearNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  setSearchQuery,
  user,
  onLogout
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Cloud Storage Ready',
      message: 'Your 5.0 GB encrypted MinIO bucket is active and ready.',
      time: 'Just now',
      read: false,
      type: 'storage'
    },
    {
      id: '2',
      title: 'Security Verified',
      message: 'Argon2id password hashing and JWT sessions are active.',
      time: '10m ago',
      read: false,
      type: 'security'
    },
    {
      id: '3',
      title: 'Welcome to SecureShare',
      message: 'Upload, share, and organize your files with end-to-end security.',
      time: '1h ago',
      read: true,
      type: 'system'
    }
  ]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'upload':
        return <UploadCloud className="w-4 h-4 text-[#5D5FEF]" />;
      case 'storage':
        return <HardDrive className="w-4 h-4 text-emerald-600" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  // Initials for avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <header className="h-16 px-8 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0 relative z-30">
      
      {/* ── Search Input ── */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files, folders..."
          className="w-full pl-10 pr-12 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] focus:bg-white transition-all shadow-2xs"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Right Actions: Notifications & User Profile ── */}
      <div className="flex items-center gap-3">
        
        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen(prev => !prev);
              setIsProfileOpen(false);
            }}
            className={`relative p-2 rounded-xl transition-all cursor-pointer ${
              isNotificationsOpen 
                ? 'bg-[#EEF2FF] text-[#5D5FEF]' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-in zoom-in-50">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold bg-[#EEF2FF] text-[#5D5FEF] px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[#5D5FEF] hover:text-[#4F46E5] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setNotifications(prev =>
                          prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                        );
                      }}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#5D5FEF] shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs text-slate-400">No notifications right now</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic User Avatar with Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(prev => !prev);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-gradient-to-tr from-[#5D5FEF] to-indigo-400 flex items-center justify-center text-white font-bold text-xs shadow-xs ring-2 ring-transparent hover:ring-[#5D5FEF]/30 transition-all">
              {initials}
            </div>
          </button>

          {/* User Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5D5FEF] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.full_name || 'SecureShare User'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || 'user@secureshare.io'}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-md border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Role: {user?.role || 'User'}</span>
                </div>
              </div>

              <div className="py-1">
                <div className="px-4 py-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Account
                </div>
                <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Storage Tier
                  </span>
                  <span className="font-semibold text-slate-800">5.0 GB Free</span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
