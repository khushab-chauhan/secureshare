import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Star, 
  Download, 
  Share2, 
  Trash2, 
  RotateCcw,
  FileText
} from 'lucide-react';
import type { FileItem } from '../types';

interface FileCardProps {
  file: FileItem;
  onOpenShare: () => void;
  onSelect?: () => void;
  onToggleStar?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  isTrashView?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({ 
  file, 
  onOpenShare, 
  onSelect,
  onToggleStar,
  onDownload,
  onDelete,
  onRestore,
  isTrashView = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      className={`group relative rounded-2xl p-3 bg-white transition-all cursor-pointer ${
        file.isSelected
          ? 'border-2 border-[#5D5FEF] ring-2 ring-indigo-500/10 shadow-sm'
          : 'border border-slate-200/90 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Thumbnail Preview Area */}
      <div className="mb-3 overflow-hidden rounded-xl relative">
        {file.previewType === 'pdf' && (
          <div className="bg-red-50/80 h-28 rounded-xl flex items-center justify-center font-bold text-red-500 text-lg tracking-wider">
            PDF
          </div>
        )}

        {file.previewType === 'image' && (
          <div className="bg-slate-100 h-28 rounded-xl overflow-hidden relative flex items-center justify-center">
            {file.imageUrl ? (
              <img
                src={file.imageUrl}
                alt={file.name}
                className="w-full h-full object-cover relative z-10"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center text-slate-400 font-semibold text-xs">
                IMAGE
              </div>
            )}
          </div>
        )}

        {file.previewType === 'docx' && (
          <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 h-28 rounded-xl flex items-center justify-center font-bold text-blue-600 text-lg tracking-wider">
            DOCX
          </div>
        )}

        {file.previewType === 'sheet' && (
          <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 h-28 rounded-xl flex items-center justify-center font-bold text-emerald-600 text-lg tracking-wider">
            XLSX
          </div>
        )}

        {!['pdf', 'image', 'docx', 'sheet'].includes(file.previewType) && (
          <div className="bg-slate-100 h-28 rounded-xl flex items-center justify-center text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
        )}

        {/* Top-Right Star Toggle Button */}
        {!isTrashView && onToggleStar && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-xs transition-all cursor-pointer ${
              file.isStarred
                ? 'bg-amber-50 text-amber-500 shadow-xs ring-1 ring-amber-200 opacity-100'
                : 'bg-white/80 text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 shadow-xs'
            }`}
            title={file.isStarred ? 'Remove from Starred' : 'Add to Starred'}
          >
            <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        )}

        {/* Top-Left Quick Download Button */}
        {!isTrashView && onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/90 text-slate-500 hover:text-[#5D5FEF] opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Metadata Bottom Area */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1.5 relative">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${getBadgeStyle(file.type)}`}>
              {file.type}
            </span>
            <span className="font-semibold text-slate-900 text-xs truncate" title={file.name}>
              {file.name}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(prev => !prev);
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Context Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {!isTrashView ? (
                    <>
                      {onDownload && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onDownload();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>Download</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onOpenShare();
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Share</span>
                      </button>
                      {onToggleStar && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onToggleStar();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                          <span>{file.isStarred ? 'Unstar' : 'Add to Starred'}</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onDelete();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Move to Trash</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {onRestore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onRestore();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onDelete();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Forever</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{file.size}</span>
          <span>{file.updatedTime}</span>
        </div>
      </div>
    </div>
  );
};
