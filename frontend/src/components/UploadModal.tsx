import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, File, CheckCircle2, AlertCircle, Loader2, Cloud } from 'lucide-react';
import { api } from '../api/client';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
  currentFolderName?: string;
  onUploadComplete?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'completing' | 'done' | 'error';

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

const MIME_TYPES: Record<string, string> = {
  'application/pdf': 'application/pdf',
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/gif': 'image/gif',
  'image/webp': 'image/webp',
  'application/msword': 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel': 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'video/mp4': 'video/mp4',
  'video/quicktime': 'video/quicktime',
  'text/plain': 'text/plain',
  'application/zip': 'application/zip',
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return { label: 'PDF', color: 'bg-rose-100 text-rose-600' };
  if (mimeType.includes('image')) return { label: 'IMG', color: 'bg-violet-100 text-violet-600' };
  if (mimeType.includes('word') || mimeType.includes('document')) return { label: 'DOC', color: 'bg-blue-100 text-blue-600' };
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return { label: 'XLS', color: 'bg-green-100 text-green-600' };
  if (mimeType.includes('video')) return { label: 'VID', color: 'bg-amber-100 text-amber-600' };
  return { label: 'FILE', color: 'bg-slate-100 text-slate-600' };
};

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  currentFolderId,
  currentFolderName = 'My Drive',
  onUploadComplete,
}) => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(f => MIME_TYPES[f.type]);
    const newItems: UploadItem[] = validFiles.map(f => ({
      id: `${f.name}-${f.lastModified}-${Math.random()}`,
      file: f,
      status: 'idle',
      progress: 0,
    }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const uploadFile = async (item: UploadItem) => {
    updateItem(item.id, { status: 'uploading', progress: 10 });

    try {
      // Step 1: Get presigned PUT URL
      const uploadInfo = await api.initiateUpload({
        file_name: item.file.name,
        content_type: item.file.type,
        size_bytes: item.file.size,
        folder_id: currentFolderId || undefined,
      });

      updateItem(item.id, { progress: 30 });

      // Step 2: PUT directly to MinIO (with CORS)
      const uploadResp = await fetch(uploadInfo.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': item.file.type,
        },
        body: item.file,
      });

      if (!uploadResp.ok) {
        throw new Error(`MinIO upload failed: ${uploadResp.status} ${uploadResp.statusText}`);
      }

      updateItem(item.id, { progress: 75, status: 'completing' });

      // Extract ETag from response header
      const etag = uploadResp.headers.get('ETag')?.replace(/"/g, '') || '';

      // Step 3: Complete upload
      await api.completeUpload({ file_id: uploadInfo.file_id, etag });

      updateItem(item.id, { status: 'done', progress: 100 });
    } catch (err: any) {
      console.error('Upload error:', err);
      updateItem(item.id, { status: 'error', error: err.message || 'Upload failed' });
    }
  };

  const handleUploadAll = async () => {
    const pending = items.filter(i => i.status === 'idle');
    await Promise.all(pending.map(uploadFile));
    onUploadComplete?.();
  };

  const handleClose = () => {
    setItems([]);
    onClose();
  };

  if (!isOpen) return null;

  const allDone = items.length > 0 && items.every(i => i.status === 'done');
  const hasErrors = items.some(i => i.status === 'error');
  const hasPending = items.some(i => i.status === 'idle');
  const isUploading = items.some(i => i.status === 'uploading' || i.status === 'completing');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#5D5FEF] flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Files</h2>
              <p className="text-xs text-slate-400">To {currentFolderName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#5D5FEF] bg-[#EEF2FF]'
                : 'border-slate-200 hover:border-[#5D5FEF]/40 hover:bg-slate-50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#5D5FEF]">
              <Cloud className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">
                {isDragOver ? 'Drop files here' : 'Drag files here or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">PDF, Images, Word, Excel, Video — up to 2 GB each</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={Object.keys(MIME_TYPES).join(',')}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* File List */}
        {items.length > 0 && (
          <div className="px-6 pb-4 space-y-2.5 max-h-56 overflow-y-auto">
            {items.map((item) => {
              const iconInfo = getFileIcon(item.file.type);
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`text-[10px] font-black px-1.5 py-1 rounded-md ${iconInfo.color} shrink-0`}>
                    {iconInfo.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[11px] text-slate-400">{formatSize(item.file.size)}</p>
                      {item.status === 'uploading' && (
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-[#5D5FEF] rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'completing' && (
                        <span className="text-[11px] text-amber-500 font-medium">Verifying…</span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-[11px] text-rose-500 font-medium truncate">{item.error}</span>
                      )}
                    </div>
                  </div>
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {item.status === 'idle' && <File className="w-4 h-4 text-slate-300" />}
                    {(item.status === 'uploading' || item.status === 'completing') && (
                      <Loader2 className="w-4 h-4 text-[#5D5FEF] animate-spin" />
                    )}
                    {item.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {item.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {items.length > 0 ? `${items.length} file${items.length === 1 ? '' : 's'} selected` : 'No files selected'}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {allDone ? 'Close' : 'Cancel'}
            </button>
            {!allDone && (
              <button
                onClick={handleUploadAll}
                disabled={!hasPending || isUploading}
                className="px-5 py-2 bg-[#5D5FEF] hover:bg-[#4D4FD9] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isUploading ? 'Uploading…' : `Upload ${hasPending ? items.filter(i => i.status === 'idle').length : ''} file${items.filter(i => i.status === 'idle').length === 1 ? '' : 's'}`}</span>
              </button>
            )}
            {allDone && !hasErrors && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>All uploaded!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
