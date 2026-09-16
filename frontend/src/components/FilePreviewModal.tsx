import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Star, 
  Edit2, 
  Trash2, 
  FileText, 
  Loader2, 
  ShieldCheck, 
  ExternalLink,
  Calendar,
  HardDrive
} from 'lucide-react';
import { api } from '../api/client';
import type { FileItem } from '../types';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: FileItem | null;
  onClose: () => void;
  onOpenShare: (fileName: string) => void;
  onToggleStar: (fileId: string) => void;
  onDownload: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onRename: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  file,
  onClose,
  onOpenShare,
  onToggleStar,
  onDownload,
  onDelete,
  onRename,
}) => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      setIsLoadingUrl(true);
      api.getDownloadUrl(file.id)
        .then(res => setDownloadUrl(res.download_url))
        .catch(err => {
          console.error('Failed to get preview URL:', err);
          setDownloadUrl(null);
        })
        .finally(() => setIsLoadingUrl(false));
    } else {
      setDownloadUrl(null);
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const isImage = file.type === 'png';
  const isPdf = file.type === 'pdf';

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-600';
      case 'png': return 'bg-emerald-100 text-emerald-700';
      case 'docx': return 'bg-blue-100 text-blue-700';
      case 'xlsx': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] max-h-[850px] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* ── Top Bar ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/95">
          <div className="flex items-center gap-3 min-w-0 mr-4">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${getBadgeStyle(file.type)}`}>
              {file.type}
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base truncate" title={file.name}>
                {file.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {file.size} • {file.updatedTime}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Star button */}
            <button
              onClick={() => onToggleStar(file.id)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                file.isStarred
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
              }`}
              title={file.isStarred ? 'Unstar' : 'Star file'}
            >
              <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Rename button */}
            <button
              onClick={() => onRename(file)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Rename file"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Share button */}
            <button
              onClick={() => onOpenShare(file.name)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Share file"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download button */}
            <button
              onClick={() => onDownload(file.id, file.name)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4F46E5] rounded-xl transition-all cursor-pointer shadow-xs ml-1"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Delete button */}
            <button
              onClick={() => {
                onDelete(file.id);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Preview Content Body ── */}
        <div className="flex-1 bg-slate-50/70 p-4 sm:p-6 overflow-hidden flex items-center justify-center">
          {isLoadingUrl ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#5D5FEF]" />
              <p className="text-xs font-medium">Loading secure preview...</p>
            </div>
          ) : isImage && downloadUrl ? (
            <div className="w-full h-full flex items-center justify-center p-2">
              <img
                src={downloadUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-md border border-slate-200/80 bg-white"
              />
            </div>
          ) : isPdf && downloadUrl ? (
            <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <iframe
                src={`${downloadUrl}#toolbar=0`}
                title={file.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            /* Non-image / Non-PDF or Document Preview Card */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5 text-[#5D5FEF]">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1 truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Format: <span className="font-semibold uppercase">{file.type}</span> • Size: {file.size}
              </p>

              <div className="grid grid-cols-2 gap-3 text-left mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>AES-256 Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <HardDrive className="w-4 h-4 text-[#5D5FEF] shrink-0" />
                  <span>MinIO S3 Storage</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 col-span-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Last Modified: {file.updatedTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onDownload(file.id, file.name)}
                  className="flex-1 py-3 px-4 bg-[#5D5FEF] hover:bg-[#4F46E5] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download to View</span>
                </button>
                {downloadUrl && (
                  <button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
