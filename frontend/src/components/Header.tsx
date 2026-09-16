import React from 'react';
import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <header className="h-16 px-8 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
      {/* Search Input */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files, folders..."
          className="w-full pl-10 pr-12 py-2 bg-slate-50/60 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right User Area */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer ring-2 ring-transparent hover:ring-[#5D5FEF]/30 transition-all bg-gradient-to-tr from-amber-200 to-indigo-200 flex items-center justify-center text-slate-700 font-bold text-xs">
          JD
        </div>
      </div>
    </header>
  );
};
