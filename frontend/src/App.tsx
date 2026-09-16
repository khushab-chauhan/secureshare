import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronRight, 
  LayoutGrid, 
  List, 
  ChevronDown,
  FolderPlus,
  RefreshCw,
  Download,
  Loader2,
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FolderCard } from './components/FolderCard';
import { FileCard } from './components/FileCard';
import { FileListRow } from './components/FileListRow';
import { ShareModal } from './components/ShareModal';
import { NewFolderModal } from './components/NewFolderModal';
import { UploadModal } from './components/UploadModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { RenameModal } from './components/RenameModal';
import { AuthPage } from './components/AuthPage';
import { api } from './api/client';
import type { Breadcrumb, FileData, User } from './api/client';
import type { FolderItem, FileItem } from './types';

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Updated ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Updated ${days}d ago`;
};

// Local storage for Starred items
const getStarredIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('secureshare_starred_ids');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveStarredIds = (ids: Set<string>) => {
  try {
    localStorage.setItem('secureshare_starred_ids', JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error('Failed to save starred IDs:', e);
  }
};

const isLoggedIn = () => !!localStorage.getItem('secureshare_access_token');

export function App() {
  // ── Auth Gate ──────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.getMe().then(setUser).catch(() => {
        // Token invalid or expired
        api.clearTokens();
        setIsAuthenticated(false);
      });
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    api.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
  };

  // ── Navigation & Views ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('my-drive');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'>('date');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Folder Hierarchy State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);

  // Files State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [trashFiles, setTrashFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [starredSet, setStarredSet] = useState<Set<string>>(getStarredIds);

  // Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFileItem, setShareFileItem] = useState<FileItem | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameFileItem, setRenameFileItem] = useState<FileItem | null>(null);

  // ── Convert backend FileData to UI FileItem ────────────────────────────────
  const toFileItem = useCallback((f: FileData, selected = false): FileItem => ({
    id: f.id,
    name: f.name,
    type: mimeToType(f.mime_type),
    size: formatBytes(f.size_bytes),
    updatedTime: relativeTime(f.updated_at),
    previewType: mimeToPreview(f.mime_type),
    isSelected: selected,
    isStarred: starredSet.has(f.id),
    status: f.status,
    rawSizeBytes: f.size_bytes,
    rawUpdatedAt: f.updated_at,
  }), [starredSet]);

  // ── Load Folders ───────────────────────────────────────────────────────────
  const loadFolders = useCallback(async (parentId: string | null = null) => {
    setFoldersLoading(true);
    try {
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

  // ── Load Files ─────────────────────────────────────────────────────────────
  const loadFiles = useCallback(async (folderId: string | null = null) => {
    setFilesLoading(true);
    try {
      const [backendFiles, trashData] = await Promise.all([
        api.listFiles(folderId),
        api.listFiles(null, false, true).catch(() => [])
      ]);

      setFiles((backendFiles || []).map(f => toFileItem(f)));
      setTrashFiles((trashData || []).map(f => toFileItem(f)));
    } catch (err) {
      console.error('Failed to load files:', err);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, [toFileItem]);

  const refreshAll = useCallback((folderId: string | null = null) => {
    loadFolders(folderId);
    loadFiles(folderId);
    if (isAuthenticated) {
      api.getMe().then(setUser).catch(() => null);
    }
  }, [loadFolders, loadFiles, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll(currentFolderId);
    }
  }, [currentFolderId, refreshAll, isAuthenticated]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleToggleStar = (fileId: string) => {
    setStarredSet(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      saveStarredIds(next);
      return next;
    });

    setFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, isStarred: !f.isStarred } : f)
    );
  };

  const handleDeleteFile = async (fileId: string, permanent = false) => {
    try {
      await api.deleteFile(fileId, permanent);
      await refreshAll(currentFolderId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleRestoreFile = async (fileId: string) => {
    try {
      await api.restoreFile(fileId);
      await refreshAll(currentFolderId);
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  const handleFolderClick = (folderId: string) => {
    if (folderId.includes('-')) {
      setCurrentFolderId(folderId);
      setActiveTab('my-drive');
    }
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleCreateFolder = async (name: string) => {
    await api.createFolder(name, currentFolderId);
    await loadFolders(currentFolderId);
  };

  const handleOpenShare = (fileOrName?: FileItem | string) => {
    if (typeof fileOrName === 'string') {
      setSelectedFileName(fileOrName);
      setShareFileItem(null);
    } else if (fileOrName) {
      setSelectedFileName(fileOrName.name);
      setShareFileItem(fileOrName);
    }
    setIsShareModalOpen(true);
  };

  const handleOpenPreview = (file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewModalOpen(true);
  };

  const handleOpenRename = (file: FileItem) => {
    setRenameFileItem(file);
    setIsRenameModalOpen(true);
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    await api.renameFile(fileId, newName);
    await refreshAll(currentFolderId);
    if (previewFile && previewFile.id === fileId) {
      setPreviewFile(prev => prev ? { ...prev, name: newName } : null);
    }
  };

  const handleSelectFile = (fileId: string) => {
    setFiles(prev => prev.map(f => ({ ...f, isSelected: f.id === fileId ? !f.isSelected : false })));
  };

  const handleDownloadFile = async (fileId: string, _fileName: string) => {
    setDownloadingId(fileId);
    try {
      const result = await api.getDownloadUrl(fileId);
      window.open(result.download_url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Determine which files to display based on activeTab ────────────────────
  const activeFilesList = useMemo(() => {
    if (activeTab === 'trash') {
      return trashFiles;
    }
    if (activeTab === 'starred') {
      return files.filter(f => starredSet.has(f.id));
    }
    if (activeTab === 'recent') {
      // Sort all files descending by updated time
      return [...files].sort((a, b) => 
        new Date(b.rawUpdatedAt || 0).getTime() - new Date(a.rawUpdatedAt || 0).getTime()
      );
    }
    if (activeTab === 'shared') {
      // In shared tab, show files that have sharedWith flag or sample shared files
      return files.filter(f => f.sharedWith || f.name.toLowerCase().includes('report') || f.name.toLowerCase().includes('guide'));
    }
    // Default: My Drive
    return files;
  }, [activeTab, files, trashFiles, starredSet]);

  // ── Filter and Sort ────────────────────────────────────────────────────────
  const filteredFiles = useMemo(() => {
    let result = activeFilesList.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Documents') return f.type === 'docx' || f.type === 'xlsx';
      if (selectedFilter === 'Images') return f.type === 'png';
      if (selectedFilter === 'PDFs') return f.type === 'pdf';
      return true;
    });

    // Apply Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'size-desc') return (b.rawSizeBytes || 0) - (a.rawSizeBytes || 0);
      if (sortBy === 'size-asc') return (a.rawSizeBytes || 0) - (b.rawSizeBytes || 0);
      // default: date desc
      return new Date(b.rawUpdatedAt || 0).getTime() - new Date(a.rawUpdatedAt || 0).getTime();
    });

    return result;
  }, [activeFilesList, searchQuery, selectedFilter, sortBy]);

  const filteredFolders = useMemo(() => {
    if (activeTab !== 'my-drive') return [];
    return folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [folders, searchQuery, activeTab]);

  // Sort label display
  const getSortLabel = () => {
    switch (sortBy) {
      case 'name-asc': return 'Name (A to Z)';
      case 'name-desc': return 'Name (Z to A)';
      case 'size-desc': return 'Size (Largest)';
      case 'size-asc': return 'Size (Smallest)';
      default: return 'Last Modified';
    }
  };

  // ── Tab Title & Subtitle ───────────────────────────────────────────────────
  const getTabHeader = () => {
    switch (activeTab) {
      case 'shared':
        return {
          title: 'Shared with Me',
          icon: <Users className="w-5 h-5 text-[#5D5FEF]" />,
          desc: 'Files and folders shared with you by colleagues and collaborators'
        };
      case 'recent':
        return {
          title: 'Recent Files',
          icon: <Clock className="w-5 h-5 text-indigo-600" />,
          desc: 'Files you opened, modified, or uploaded recently'
        };
      case 'starred':
        return {
          title: 'Starred Items',
          icon: <Star className="w-5 h-5 fill-amber-400 text-amber-500" />,
          desc: 'Quick access to your most important and bookmarked files'
        };
      case 'trash':
        return {
          title: 'Trash',
          icon: <Trash2 className="w-5 h-5 text-rose-500" />,
          desc: 'Deleted files. Items in trash can be restored or permanently removed'
        };
      default:
        return {
          title: 'My Drive',
          icon: <HardDrive className="w-5 h-5 text-[#5D5FEF]" />,
          desc: 'Your personal encrypted cloud drive'
        };
    }
  };

  const tabHeader = getTabHeader();

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col h-screen overflow-hidden">

      {/* ── Main Application Container ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'my-drive') {
              setCurrentFolderId(null);
            }
          }}
          onNewUpload={() => setIsUploadModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
          
          {/* Header */}
          <Header 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            user={user}
            onLogout={handleLogout}
          />

          <main className="p-8 max-w-7xl w-full mx-auto space-y-8">

            {/* ── Section Title Bar & Breadcrumbs ── */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                
                {/* Dynamic Breadcrumbs or Tab Title */}
                <div>
                  {activeTab === 'my-drive' ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        onClick={() => handleBreadcrumbClick(null)}
                        className={`font-medium transition-colors cursor-pointer ${
                          breadcrumbs.length === 0 ? 'font-bold text-slate-900 text-lg' : 'text-slate-500 hover:text-slate-800'
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
                                isLast ? 'font-bold text-slate-900 text-lg' : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                              }`}
                            >
                              {bc.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        {tabHeader.icon}
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-slate-900">{tabHeader.title}</h1>
                        <p className="text-xs text-slate-500">{tabHeader.desc}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Controls: Refresh, View Switcher, Sort Dropdown */}
                <div className="flex items-center gap-3">
                  
                  {/* Refresh Button */}
                  <button
                    onClick={() => refreshAll(currentFolderId)}
                    title="Refresh data"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {/* Grid / List View Mode Toggle */}
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

                  {/* Working Sort Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsSortMenuOpen(prev => !prev)}
                      className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span>Sort: {getSortLabel()}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {isSortMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsSortMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                          {[
                            { id: 'date', label: 'Last Modified' },
                            { id: 'name-asc', label: 'Name (A to Z)' },
                            { id: 'name-desc', label: 'Name (Z to A)' },
                            { id: 'size-desc', label: 'Size (Largest)' },
                            { id: 'size-asc', label: 'Size (Smallest)' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setSortBy(opt.id as any);
                                setIsSortMenuOpen(false);
                              }}
                              className={`w-full px-3.5 py-1.5 text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                                sortBy === opt.id
                                  ? 'bg-[#EEF2FF] text-[#5D5FEF] font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {sortBy === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-[#5D5FEF]" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-2">
                {['All', 'Documents', 'Images', 'PDFs'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
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

            {/* ── Folders Section (Only in My Drive) ── */}
            {activeTab === 'my-drive' && (
              <section>
                <div className="flex items-center justify-between mb-3.5">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Folders
                    {!foldersLoading && <span className="ml-2 text-xs font-normal text-slate-400">({filteredFolders.length})</span>}
                  </h2>
                  <button
                    onClick={() => setIsNewFolderModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#5D5FEF] hover:text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
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
                ) : filteredFolders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredFolders.map(folder => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onClick={() => handleFolderClick(folder.id)}
                        onOpenMenu={() => handleOpenShare(folder.name)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5D5FEF] flex items-center justify-center mx-auto mb-3">
                      <FolderPlus className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">Organize your workspace with folders</p>
                    <p className="text-xs text-slate-400 mb-4">Create a custom folder or pick a template below to get started.</p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto mb-3">
                      {['Design Assets', 'Financial Reports', 'Marketing', 'Legal & Contracts'].map(name => (
                        <button
                          key={name}
                          onClick={() => handleCreateFolder(name)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-medium text-slate-600 hover:text-[#5D5FEF] transition-all cursor-pointer"
                        >
                          + {name}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setIsNewFolderModalOpen(true)}
                      className="text-xs text-[#5D5FEF] font-semibold hover:underline cursor-pointer"
                    >
                      + Custom folder name
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ── Files Section ── */}
            <section>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-sm font-semibold text-slate-900">
                  {activeTab === 'trash' ? 'Trash Files' : activeTab === 'starred' ? 'Starred Files' : activeTab === 'recent' ? 'Recent Files' : activeTab === 'shared' ? 'Shared Files' : currentFolderId ? 'Files in This Folder' : 'Recent Files'}
                  {!filesLoading && <span className="ml-2 text-xs font-normal text-slate-400">({filteredFiles.length})</span>}
                </h2>
                
                {activeTab !== 'trash' && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-emerald-200/80 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 rotate-180" />
                    <span>Upload File</span>
                  </button>
                )}
              </div>

              {filesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filteredFiles.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredFiles.map(file => (
                      <div key={file.id} className="relative group">
                        <FileCard
                          file={file}
                          onOpenShare={() => handleOpenShare(file)}
                          onSelect={() => handleSelectFile(file.id)}
                          onToggleStar={() => handleToggleStar(file.id)}
                          onDownload={() => handleDownloadFile(file.id, file.name)}
                          onDelete={() => handleDeleteFile(file.id, activeTab === 'trash')}
                          onRestore={() => handleRestoreFile(file.id)}
                          onPreview={() => handleOpenPreview(file)}
                          onRename={() => handleOpenRename(file)}
                          isTrashView={activeTab === 'trash'}
                        />
                        {downloadingId === file.id && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-[#5D5FEF] animate-spin" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ── High-Density List Table View ── */
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <span className="flex-1">Name</span>
                      <span className="hidden md:block w-24">Type</span>
                      <span className="hidden sm:block w-28">Size</span>
                      <span className="hidden lg:block w-36">Last Modified</span>
                      <span className="w-24 text-right">Actions</span>
                    </div>
                    <div className="p-2 space-y-1">
                      {filteredFiles.map(file => (
                        <FileListRow
                          key={file.id}
                          file={file}
                          onOpenShare={() => handleOpenShare(file)}
                          onSelect={() => handleSelectFile(file.id)}
                          onToggleStar={() => handleToggleStar(file.id)}
                          onDownload={() => handleDownloadFile(file.id, file.name)}
                          onDelete={() => handleDeleteFile(file.id, activeTab === 'trash')}
                          onRestore={() => handleRestoreFile(file.id)}
                          onPreview={() => handleOpenPreview(file)}
                          onRename={() => handleOpenRename(file)}
                          isTrashView={activeTab === 'trash'}
                        />
                      ))}
                    </div>
                  </div>
                )
              ) : (
                /* Empty States tailored to the current tab */
                <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                  {activeTab === 'starred' ? (
                    <div>
                      <Star className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-800 mb-1">No starred files yet</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Click the star icon on any file card or row in My Drive to quickly bookmark it here.
                      </p>
                    </div>
                  ) : activeTab === 'trash' ? (
                    <div>
                      <Trash2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-800 mb-1">Trash is empty</p>
                      <p className="text-xs text-slate-400">Deleted files will appear here until permanently removed.</p>
                    </div>
                  ) : activeTab === 'shared' ? (
                    <div>
                      <Users className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-800 mb-1">No shared files yet</p>
                      <p className="text-xs text-slate-400">Files shared with you will appear in this workspace.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">No files uploaded yet</p>
                      <p className="text-xs text-slate-400 mb-3">Upload your first document, image, or PDF to get started.</p>
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="inline-flex items-center gap-2 text-xs text-white bg-[#5D5FEF] hover:bg-[#4F46E5] font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 rotate-180" />
                        <span>Upload File</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

          </main>
        </div>
      </div>

      {/* ── Modals ── */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        file={shareFileItem}
        fileName={selectedFileName}
        currentUser={user}
      />

      <FilePreviewModal
        isOpen={isPreviewModalOpen}
        file={previewFile}
        onClose={() => setIsPreviewModalOpen(false)}
        onOpenShare={(name) => handleOpenShare(name)}
        onToggleStar={handleToggleStar}
        onDownload={handleDownloadFile}
        onDelete={(id) => handleDeleteFile(id, activeTab === 'trash')}
        onRename={handleOpenRename}
      />

      <RenameModal
        isOpen={isRenameModalOpen}
        file={renameFileItem}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRenameFile}
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
