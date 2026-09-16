import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  LayoutGrid, 
  List, 
  ChevronDown,
  Monitor,
  Smartphone,
  FolderPlus,
  RefreshCw,
  Download,
  Loader2
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FolderCard } from './components/FolderCard';
import { FileCard } from './components/FileCard';
import { ShareModal } from './components/ShareModal';
import { MobileView } from './components/MobileView';
import { NewFolderModal } from './components/NewFolderModal';
import { UploadModal } from './components/UploadModal';
import { api } from './api/client';
import type { Breadcrumb, FileData } from './api/client';
import type { FolderItem, FileItem } from './types';

// ── Helpers ────────────────────────────────────────────────────────────────
const mimeToType = (mime: string | null): FileItem['type'] => {
  if (!mime) return 'pdf';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('image')) return 'png';
  if (mime.includes('word') || mime.includes('document')) return 'docx';
  if (mime.includes('excel') || mime.includes('sheet')) return 'xlsx';
  if (mime.includes('video')) return 'mp4';
  return 'pdf';
};

const mimeToPreview = (mime: string | null): FileItem['previewType'] => {
  if (!mime) return 'pdf';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('image')) return 'image';
  if (mime.includes('word') || mime.includes('document')) return 'docx';
  if (mime.includes('excel') || mime.includes('sheet')) return 'sheet';
  return 'pdf';
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Updated ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Updated ${days}d ago`;
};

const toFileItem = (f: FileData, selected = false): FileItem => ({
  id: f.id,
  name: f.name,
  type: mimeToType(f.mime_type),
  size: formatBytes(f.size_bytes),
  updatedTime: relativeTime(f.updated_at),
  previewType: mimeToPreview(f.mime_type),
  isSelected: selected,
});

// ── Auth helper ─────────────────────────────────────────────────────────────
const ensureAuth = async () => {
  if (!localStorage.getItem('secureshare_access_token')) {
    try {
      await api.login('khushab@secureshare.io', 'Password123!');
    } catch {
      try {
        await api.register('khushab@secureshare.io', 'Password123!', 'Khushab Chauhan');
        await api.login('khushab@secureshare.io', 'Password123!');
      } catch (err) {
        console.error('Auth failed', err);
      }
    }
  }
};

export function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialView = urlParams?.get('view') === 'mobile' ? 'mobile' : 'desktop';
  const initialModal = urlParams?.get('modal') === 'share';

  const [activeTab, setActiveTab] = useState('my-drive');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>(initialView);

  // Folder Hierarchy & Breadcrumb State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);

  // Files State — fully dynamic from backend
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(initialModal);
  const [selectedFileName, setSelectedFileName] = useState('');

  // ── Load folders from backend ─────────────────────────────────────────────
  const loadFolders = useCallback(async (parentId: string | null = null) => {
    setFoldersLoading(true);
    try {
      await ensureAuth();
      const backendFolders = await api.getFolders(parentId);
      const formatted: FolderItem[] = (backendFolders || []).map(f => ({
        id: f.id,
        name: f.name,
        filesCount: (f as any).files_count ?? 0,
        updatedDate: new Date(f.updated_at).toLocaleDateString('en-US', {
          month: 'short', day: '2-digit', year: 'numeric'
        }),
      }));
      setFolders(formatted);

      // Update breadcrumbs
      if (parentId) {
        const detail = await api.getFolder(parentId);
        setBreadcrumbs(detail.breadcrumbs || []);
      } else {
        setBreadcrumbs([]);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
      setFolders([]);
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  // ── Load files from backend ───────────────────────────────────────────────
  const loadFiles = useCallback(async (folderId: string | null = null) => {
    setFilesLoading(true);
    try {
      await ensureAuth();
      const backendFiles = await api.listFiles(folderId);
      const formatted: FileItem[] = (backendFiles || []).map(f => toFileItem(f));
      setFiles(formatted);
    } catch (err) {
      console.error('Failed to load files:', err);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  // ── Refresh both when folder changes ──────────────────────────────────────
  const refreshAll = useCallback((folderId: string | null = null) => {
    loadFolders(folderId);
    loadFiles(folderId);
  }, [loadFolders, loadFiles]);

  useEffect(() => {
    refreshAll(currentFolderId);
  }, [currentFolderId, refreshAll]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFolderClick = (folderId: string) => {
    if (folderId.includes('-')) setCurrentFolderId(folderId);
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleCreateFolder = async (name: string) => {
    await api.createFolder(name, currentFolderId);
    await loadFolders(currentFolderId);
  };

  const handleOpenShare = (fileName?: string) => {
    if (fileName) setSelectedFileName(fileName);
    setIsShareModalOpen(true);
  };

  const handleSelectFile = (fileId: string) => {
    setFiles(prev => prev.map(f => ({ ...f, isSelected: f.id === fileId ? !f.isSelected : false })));
  };

  const handleDownloadFile = async (fileId: string, _fileName: string) => {
    setDownloadingId(fileId);
    try {
      const result = await api.getDownloadUrl(fileId);
      // Open in new tab — triggers browser download prompt
      window.open(result.download_url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Filter files ──────────────────────────────────────────────────────────
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Documents') return f.type === 'docx' || f.type === 'xlsx';
    if (selectedFilter === 'Images') return f.type === 'png';
    if (selectedFilter === 'PDFs') return f.type === 'pdf';
    return true;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">

      {/* Top Banner: Device View Switcher */}
      <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-xs shrink-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-200">SecureShare — Live Dynamic Data (node-id: 0-1)</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => setDevicePreview('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              devicePreview === 'desktop' ? 'bg-[#5D5FEF] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Dashboard</span>
          </button>
          <button
            onClick={() => setDevicePreview('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              devicePreview === 'mobile' ? 'bg-[#5D5FEF] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App Preview</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      {devicePreview === 'desktop' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNewUpload={() => setIsUploadModalOpen(true)}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
            <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <main className="p-8 max-w-7xl w-full mx-auto space-y-8">

              {/* Breadcrumbs & Controls */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* Dynamic Breadcrumbs */}
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      onClick={() => handleBreadcrumbClick(null)}
                      className={`font-medium transition-colors cursor-pointer ${
                        breadcrumbs.length === 0 ? 'font-bold text-slate-900' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      My Drive
                    </span>
                    {breadcrumbs.map((bc, idx) => {
                      const isLast = idx === breadcrumbs.length - 1;
                      return (
                        <div key={bc.id} className="flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          <span
                            onClick={() => !isLast && handleBreadcrumbClick(bc.id)}
                            className={`font-medium transition-colors ${
                              isLast ? 'font-bold text-slate-900' : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                            }`}
                          >
                            {bc.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-3">
                    {/* Refresh */}
                    <button
                      onClick={() => refreshAll(currentFolderId)}
                      title="Refresh"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {/* View Toggle */}
                    <div className="flex items-center border border-slate-200/90 rounded-xl p-0.5 bg-white shadow-2xs">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Grid View"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="List View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Sort */}
                    <button className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer">
                      <span>Sort: Last Modified</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2">
                  {['All', 'Documents', 'Images', 'PDFs'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-4 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        selectedFilter === filter
                          ? 'bg-slate-950 text-white font-semibold shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Folders Section ── */}
              <section>
                <div className="flex items-center justify-between mb-3.5">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Folders
                    {!foldersLoading && <span className="ml-2 text-xs font-normal text-slate-400">({folders.length})</span>}
                  </h2>
                  <button
                    onClick={() => setIsNewFolderModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#5D5FEF] hover:text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>New Folder</span>
                  </button>
                </div>

                {foldersLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : folders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {folders.map(folder => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onClick={() => handleFolderClick(folder.id)}
                        onOpenMenu={() => handleOpenShare(folder.name)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs text-slate-400 font-medium">No folders here yet</p>
                    <button
                      onClick={() => setIsNewFolderModalOpen(true)}
                      className="mt-2 text-xs text-[#5D5FEF] font-semibold hover:underline cursor-pointer"
                    >
                      Create your first folder →
                    </button>
                  </div>
                )}
              </section>

              {/* ── Files Section ── */}
              <section>
                <div className="flex items-center justify-between mb-3.5">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {currentFolderId ? 'Files in This Folder' : 'Recent Files'}
                    {!filesLoading && <span className="ml-2 text-xs font-normal text-slate-400">({filteredFiles.length})</span>}
                  </h2>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-emerald-100"
                  >
                    <Download className="w-3.5 h-3.5 rotate-180" />
                    <span>Upload File</span>
                  </button>
                </div>

                {filesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : filteredFiles.length > 0 ? (
                  <div className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'
                    : 'flex flex-col gap-2'
                  }>
                    {filteredFiles.map(file => (
                      <div key={file.id} className="relative group">
                        <FileCard
                          file={file}
                          onOpenShare={() => handleOpenShare(file.name)}
                          onSelect={() => handleSelectFile(file.id)}
                        />
                        {/* Download button on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file.id, file.name);
                          }}
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-slate-200 rounded-lg p-1.5 text-slate-500 hover:text-[#5D5FEF] cursor-pointer"
                          title="Download file"
                        >
                          {downloadingId === file.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs text-slate-400 font-medium mb-1">No files uploaded yet</p>
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="text-xs text-[#5D5FEF] font-semibold hover:underline cursor-pointer"
                    >
                      Upload your first file →
                    </button>
                  </div>
                )}
              </section>

            </main>
          </div>
        </div>
      ) : (
        /* Mobile Interactive View */
        <div className="flex-1 bg-slate-100/70 flex items-center justify-center p-8 overflow-y-auto">
          <MobileView
            folders={folders}
            files={files}
            onOpenShare={handleOpenShare}
          />
        </div>
      )}

      {/* Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileName={selectedFileName}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentFolderId={currentFolderId}
        currentFolderName={breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'My Drive'}
        onUploadComplete={() => refreshAll(currentFolderId)}
      />

      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
        currentParentName={breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'My Drive'}
      />
    </div>
  );
}

export default App;
