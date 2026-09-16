import React from 'react';
import { Folder, MoreHorizontal } from 'lucide-react';
import type { FolderItem } from '../types';

interface FolderCardProps {
  folder: FolderItem;
  onOpenMenu?: (e: React.MouseEvent) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, onOpenMenu }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-xs transition-all cursor-pointer group">
      <div className="flex items-start justify-between">
        {/* Outline Folder Icon */}
        <div className="text-[#5D5FEF] p-1.5 rounded-lg group-hover:bg-[#EEF2FF] transition-colors">
          <Folder className="w-6 h-6 stroke-[1.75]" />
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu?.(e);
          }}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h3 className="font-semibold text-slate-900 text-sm mt-3.5 mb-2 truncate">
        {folder.name}
      </h3>

      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>{folder.filesCount} files</span>
        <span>{folder.updatedDate}</span>
      </div>
    </div>
  );
};
