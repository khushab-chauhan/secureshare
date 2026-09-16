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
  HardDrive,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen && file) {
      setIsLoadingUrl(true);
      setZoomLevel(1);
      setRotation(0);
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

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const isImage = file.type === 'png';
  const isPdf = file.type === 'pdf';

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-500 text-white';
      case 'png': return 'bg-emerald-500 text-white';
      case 'docx': return 'bg-blue-500 text-white';
      case 'xlsx': return 'bg-teal-500 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 animate-in fade-in duration-200">
      
      {/* ── Modal Container ── */}
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl w-full max-w-5xl h-[88vh] max-h-[900px] flex flex-col overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* ── Top Bar ── */}
        <div className="px-6 py-3.5 border-b border-slate-800/90 flex items-center justify-between shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-3 min-w-0 mr-4">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${getBadgeStyle(file.type)}`}>
              {file.type}
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-100 text-sm truncate" title={file.name}>
                {file.name}
              </h2>
              <p className="text-[11px] text-slate-400">
                {file.size} • {file.updatedTime}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            
            {/* Image Viewer Controls */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 mr-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setZoomLevel(1); setRotation(0); }}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                  title="Reset view"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Star button */}
            <button
              onClick={() => onToggleStar(file.id)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                file.isStarred
                  ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
              }`}
              title={file.isStarred ? 'Unstar' : 'Star file'}
            >
              <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Rename button */}
            <button
              onClick={() => onRename(file)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Rename file"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Share button */}
            <button
              onClick={() => onOpenShare(file.name)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Share file"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download button */}
            <button
              onClick={() => onDownload(file.id, file.name)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#5D5FEF] hover:bg-[#4F46E5] rounded-xl transition-all cursor-pointer shadow-sm ml-1"
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
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Preview Content Body ── */}
        <div className="flex-1 bg-slate-950/60 p-4 sm:p-6 overflow-hidden flex items-center justify-center relative select-none">
          {isLoadingUrl ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#5D5FEF]" />
              <p className="text-xs font-medium">Fetching secure encrypted stream...</p>
            </div>
          ) : isImage && downloadUrl ? (
            <div className="w-full h-full flex items-center justify-center p-2 overflow-auto">
              <img
                src={downloadUrl}
                alt={file.name}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl bg-black/20"
              />
            </div>
          ) : isPdf && downloadUrl ? (
            <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/40">
              <iframe
                src={`${downloadUrl}#toolbar=0`}
                title={file.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            /* Non-image / Document Preview Card */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#5D5FEF]/10 border border-[#5D5FEF]/20 flex items-center justify-center mx-auto mb-5 text-[#5D5FEF]">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1 truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Type: <span className="font-semibold uppercase text-slate-300">{file.type}</span> • Size: {file.size}
              </p>

              <div className="grid grid-cols-2 gap-3 text-left mb-6 p-3 bg-slate-800/60 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AES-256 Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <HardDrive className="w-4 h-4 text-[#5D5FEF] shrink-0" />
                  <span>MinIO Bucket</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 col-span-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Modified: {file.updatedTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onDownload(file.id, file.name)}
                  className="flex-1 py-3 px-4 bg-[#5D5FEF] hover:bg-[#4F46E5] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
                {downloadUrl && (
                  <button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-700"
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
