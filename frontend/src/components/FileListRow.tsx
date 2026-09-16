import React from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  Trash2, 
  RotateCcw, 
  Star,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Eye,
  Edit2
} from 'lucide-react';
import type { FileItem } from '../types';

interface FileListRowProps {
  file: FileItem;
  onOpenShare: () => void;
  onSelect?: () => void;
  onToggleStar?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onPreview?: () => void;
  onRename?: () => void;
  isTrashView?: boolean;
}

export const FileListRow: React.FC<FileListRowProps> = ({
  file,
  onOpenShare,
  onSelect,
  onToggleStar,
  onDownload,
  onDelete,
  onRestore,
  onPreview,
  onRename,
  isTrashView = false,
}) => {
  const getFileIcon = () => {
    switch (file.type) {
      case 'pdf':
        return <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">PDF</div>;
      case 'png':
        return <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><ImageIcon className="w-4 h-4" /></div>;
      case 'docx':
        return <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><FileText className="w-4 h-4" /></div>;
      case 'xlsx':
        return <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center"><FileSpreadsheet className="w-4 h-4" /></div>;
      default:
        return <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center"><FileCode className="w-4 h-4" /></div>;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between px-4 py-3 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50/80 transition-all cursor-pointer ${
        file.isSelected ? 'border-[#5D5FEF] ring-1 ring-[#5D5FEF]/20 bg-indigo-50/20' : ''
      }`}
    >
      {/* Name & Icon */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
        {getFileIcon()}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate" title={file.name}>
            {file.name}
          </p>
          <span className="text-xs text-slate-400 sm:hidden">
            {file.size} • {file.updatedTime}
          </span>
        </div>
      </div>

      {/* Type badge (desktop) */}
      <div className="hidden md:block w-24 text-xs font-medium text-slate-500 uppercase">
        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-semibold text-slate-600">
          {file.type}
        </span>
      </div>

      {/* Size (desktop) */}
      <div className="hidden sm:block w-28 text-xs font-medium text-slate-500">
        {file.size}
      </div>

      {/* Last Modified (desktop) */}
      <div className="hidden lg:block w-36 text-xs text-slate-400">
        {file.updatedTime}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!isTrashView ? (
          <>
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#5D5FEF] hover:bg-slate-100 transition-colors cursor-pointer"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {onRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Rename"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {onToggleStar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar();
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  file.isStarred
                    ? 'text-amber-500 hover:bg-amber-50'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                }`}
                title={file.isStarred ? 'Unstar' : 'Star'}
              >
                <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            {onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#5D5FEF] hover:bg-slate-100 transition-colors cursor-pointer"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenShare();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Move to Trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <>
            {onRestore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore();
                }}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
