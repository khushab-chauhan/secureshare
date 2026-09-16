import React, { useState, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Star, 
  Download, 
  Share2, 
  Trash2, 
  RotateCcw,
  FileText,
  Eye,
  Edit2,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import type { FileItem } from '../types';

// In-memory cache for presigned thumbnail URLs to avoid re-fetching
const thumbnailCache = new Map<string, string>();

interface FileCardProps {
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

export const FileCard: React.FC<FileCardProps> = ({ 
  file, 
  onOpenShare, 
  onSelect,
  onToggleStar,
  onDownload,
  onDelete,
  onRestore,
  onPreview,
  onRename,
  isTrashView = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(file.imageUrl || thumbnailCache.get(file.id) || null);
  const [isLoadingThumb, setIsLoadingThumb] = useState(false);

  // Automatically fetch thumbnail URL for images
  useEffect(() => {
    if (file.previewType === 'image') {
      if (thumbnailCache.has(file.id)) {
        setThumbUrl(thumbnailCache.get(file.id)!);
        return;
      }
      setIsLoadingThumb(true);
      api.getDownloadUrl(file.id)
        .then(res => {
          thumbnailCache.set(file.id, res.download_url);
          setThumbUrl(res.download_url);
        })
        .catch(err => console.error('Failed to load thumbnail:', err))
        .finally(() => setIsLoadingThumb(false));
    }
  }, [file.id, file.previewType]);

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-50 text-red-600 border border-red-100';
      case 'png': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'docx': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'xlsx': return 'bg-teal-50 text-teal-800 border border-teal-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking on specific interactive elements, don't trigger preview
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onPreview) {
      onPreview();
    } else if (onSelect) {
      onSelect();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl p-3 bg-white transition-all duration-200 cursor-pointer ${
        file.isSelected
          ? 'border-2 border-[#5D5FEF] ring-2 ring-indigo-500/15 shadow-md -translate-y-0.5'
          : 'border border-slate-200/90 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* ── Thumbnail Preview Area ── */}
      <div className="mb-3 overflow-hidden rounded-xl relative h-32 bg-slate-50 flex items-center justify-center select-none">
        
        {/* Image File Preview */}
        {file.previewType === 'image' && (
          <div className="w-full h-full relative overflow-hidden bg-slate-100">
            {isLoadingThumb ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#5D5FEF]" />
              </div>
            ) : thumbUrl ? (
              <img
                src={thumbUrl}
                alt={file.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setThumbUrl(null)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-indigo-50/50 to-slate-100">
                <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Image</span>
              </div>
            )}
          </div>
        )}

        {/* PDF File Preview */}
        {file.previewType === 'pdf' && (
          <div className="w-full h-full bg-gradient-to-br from-red-50 to-rose-100/60 p-4 flex flex-col justify-between border border-red-100/60">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-red-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                PDF
              </span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-200" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-200" />
              </div>
            </div>
            <div className="space-y-1.5 opacity-60">
              <div className="h-1.5 bg-red-300/60 rounded-full w-3/4" />
              <div className="h-1.5 bg-red-300/40 rounded-full w-full" />
              <div className="h-1.5 bg-red-300/30 rounded-full w-1/2" />
            </div>
            <div className="text-[10px] font-bold text-red-500 tracking-wider uppercase">
              Encrypted Document
            </div>
          </div>
        )}

        {/* Word Document Preview */}
        {file.previewType === 'docx' && (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100/60 p-4 flex flex-col justify-between border border-blue-100/60">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                W
              </span>
              <FileText className="w-4 h-4 text-blue-300" />
            </div>
            <div className="space-y-1.5 opacity-60">
              <div className="h-1.5 bg-blue-300/60 rounded-full w-4/5" />
              <div className="h-1.5 bg-blue-300/40 rounded-full w-full" />
              <div className="h-1.5 bg-blue-300/30 rounded-full w-2/3" />
            </div>
            <div className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
              Word Document
            </div>
          </div>
        )}

        {/* Excel Spreadsheet Preview */}
        {file.previewType === 'sheet' && (
          <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100/60 p-4 flex flex-col justify-between border border-emerald-100/60">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                X
              </span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="grid grid-cols-3 gap-1 opacity-50 my-1">
              <div className="h-2 bg-emerald-300 rounded-xs" />
              <div className="h-2 bg-emerald-200 rounded-xs" />
              <div className="h-2 bg-emerald-200 rounded-xs" />
              <div className="h-2 bg-emerald-200 rounded-xs" />
              <div className="h-2 bg-emerald-300 rounded-xs" />
              <div className="h-2 bg-emerald-200 rounded-xs" />
            </div>
            <div className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
              Spreadsheet
            </div>
          </div>
        )}

        {/* Generic File */}
        {!['pdf', 'image', 'docx', 'sheet'].includes(file.previewType) && (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-8 h-8 text-slate-300 mb-1" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">{file.type}</span>
          </div>
        )}

        {/* Hover Click to Preview pill */}
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/95 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-[#5D5FEF]" />
            <span>Click to Preview</span>
          </div>
        </div>

        {/* Top-Right Star Toggle */}
        {!isTrashView && onToggleStar && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer z-10 ${
              file.isStarred
                ? 'bg-amber-50 text-amber-500 shadow-xs ring-1 ring-amber-200 opacity-100'
                : 'bg-white/85 text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 shadow-xs'
            }`}
            title={file.isStarred ? 'Remove from Starred' : 'Add to Starred'}
          >
            <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        )}

        {/* Top-Left Quick Download */}
        {!isTrashView && onDownload && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/85 text-slate-500 hover:text-[#5D5FEF] opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer z-10"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Metadata Area ── */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${getBadgeStyle(file.type)}`}>
              {file.type}
            </span>
            <span className="font-semibold text-slate-900 text-xs truncate" title={file.name}>
              {file.name}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
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
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {!isTrashView ? (
                    <>
                      {onPreview && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onPreview();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#5D5FEF]" />
                          <span className="font-medium">Open Preview</span>
                        </button>
                      )}
                      {onRename && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onRename();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rename</span>
                        </button>
                      )}
                      {onDownload && (
                        <button
                          type="button"
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
                        type="button"
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
                          type="button"
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
                          type="button"
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
                          type="button"
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
                          type="button"
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
