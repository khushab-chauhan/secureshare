import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { FileItem } from '../types';

interface FileCardProps {
  file: FileItem;
  onOpenShare: () => void;
  onSelect?: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onOpenShare, onSelect }) => {
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-600';
      case 'png':
        return 'bg-emerald-100 text-emerald-700';
      case 'docx':
        return 'bg-blue-100 text-blue-700';
      case 'xlsx':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-3 bg-white transition-all cursor-pointer ${
        file.isSelected
          ? 'border-2 border-blue-600 ring-2 ring-blue-500/10 shadow-xs'
          : 'border border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Thumbnail Preview Area */}
      <div className="mb-3 overflow-hidden rounded-xl">
        {file.previewType === 'pdf' && (
          <div className="bg-red-50/70 h-28 rounded-xl flex items-center justify-center font-bold text-red-500 text-lg tracking-wider">
            PDF
          </div>
        )}

        {file.previewType === 'image' && (
          <div className="bg-slate-100 h-28 rounded-xl overflow-hidden relative flex items-center justify-center">
            {file.imageUrl && (
              <img
                src={file.imageUrl}
                alt={file.name}
                className="w-full h-full object-cover relative z-10"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500">
              <div className="grid grid-cols-2 gap-1 p-4 w-full h-full opacity-60">
                <div className="bg-white/80 rounded" />
                <div className="bg-white/80 rounded" />
                <div className="bg-white/80 rounded" />
                <div className="bg-white/80 rounded" />
              </div>
            </div>
          </div>
        )}

        {file.previewType === 'docx' && (
          <div className="border-2 border-dashed border-blue-300/90 bg-blue-50/30 h-28 rounded-xl flex items-center justify-center font-bold text-blue-600 text-lg tracking-wider">
            DOCX
          </div>
        )}
      </div>

      {/* Metadata Bottom Area */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getBadgeStyle(file.type)}`}>
              {file.type}
            </span>
            <span className="font-semibold text-slate-900 text-xs truncate max-w-[140px]" title={file.name}>
              {file.name}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare();
            }}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="Options / Share"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{file.size}</span>
          <span>{file.updatedTime}</span>
        </div>
      </div>
    </div>
  );
};
