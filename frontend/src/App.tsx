import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  LayoutGrid, 
  List, 
  ChevronDown,
  Monitor,
  Smartphone,
  FolderPlus
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
import type { Breadcrumb } from './api/client';
import type { FolderItem, FileItem } from './types';

// Fallback initial folders matching Figma Screenshot 1
const DEFAULT_FOLDERS: FolderItem[] = [
  { id: '1', name: 'Brand Guidelines', filesCount: 18, updatedDate: 'Jan 12, 2026' },
  { id: '2', name: 'Financial Audits', filesCount: 7, updatedDate: 'Jan 10, 2026' },
  { id: '3', name: 'Marketing Collateral', filesCount: 24, updatedDate: 'Jan 08, 2026' },
  { id: '4', name: 'Investor Reports', filesCount: 5, updatedDate: 'Jan 05, 2026' },
];

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
  const [folders, setFolders] = useState<FolderItem[]>(DEFAULT_FOLDERS);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(initialModal);
  const [selectedFileName, setSelectedFileName] = useState('Fintrex_PitchDeck_2026.pdf');

  // Initial Files matching Figma Screenshot 1
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'Fintrex_PitchDeck_2026.pdf',
      type: 'pdf',
      size: '4.2 MB',
      updatedTime: 'Updated 2h ago',
      previewType: 'pdf',
    },
    {
      id: '2',
      name: 'homepage_wireframe_v4.png',
      type: 'png',
      size: '2.8 MB',
      updatedTime: 'Updated 5h ago',
      previewType: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: '3',
      name: 'Q1_Strategy_Outline.docx',
      type: 'docx',
      size: '1.4 MB',
      updatedTime: 'Updated 1d ago',
      previewType: 'docx',
      isSelected: true, // Selected in Figma Screenshot 1 (Blue border)
    },
    {
      id: '4',
      name: 'architectural_blueprint_A.pdf',
      type: 'pdf',
      size: '12.5 MB',
      updatedTime: 'Updated 2d ago',
      previewType: 'pdf',
    },
  ]);

  // Load folders from backend with auto-auth
  const loadFolders = useCallback(async (parentId: string | null = null) => {
    try {
      // Check auth / auto-login
      if (!localStorage.getItem('secureshare_access_token')) {
        try {
          await api.login('khushab@secureshare.io', 'Password123!');
        } catch {
          // If login fails, try to register
          await api.register('khushab@secureshare.io', 'Password123!', 'Khushab Chauhan');
          await api.login('khushab@secureshare.io', 'Password123!');
        }
      }

      const backendFolders = await api.getFolders(parentId);
      if (backendFolders && backendFolders.length > 0) {
        const formatted: FolderItem[] = backendFolders.map(f => {
          const date = new Date(f.updated_at);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
          return {
            id: f.id,
            name: f.name,
            filesCount: (f as any).files_count || 0,
            updatedDate: dateStr,
          };
        });
        setFolders(formatted);
      } else if (parentId === null) {
        setFolders(DEFAULT_FOLDERS);
      } else {
        setFolders([]);
      }

      // Update breadcrumbs
      if (parentId) {
        const detail = await api.getFolder(parentId);
        setBreadcrumbs(detail.breadcrumbs || [{ id: detail.id, name: detail.name }]);
      } else {
        setBreadcrumbs([]);
      }
    } catch (err) {
      console.warn('Could not load folders from backend, using fallback data:', err);
    }
  }, []);

  useEffect(() => {
    loadFolders(currentFolderId);
  }, [currentFolderId, loadFolders]);

  const handleFolderClick = (folderId: string) => {
    // Only drill down if it's a valid UUID from backend
    if (folderId.includes('-')) {
      setCurrentFolderId(folderId);
    }
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
    setFiles(files.map(f => ({
      ...f,
      isSelected: f.id === fileId ? !f.isSelected : false
    })));
  };

  // Filter files
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Documents') return f.type === 'docx';
    if (selectedFilter === 'Images') return f.type === 'png';
    if (selectedFilter === 'PDFs') return f.type === 'pdf';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      
      {/* Top Banner: Device View Switcher for Developer / QA Inspection */}
      <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-xs shrink-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-200">Figma Source of Truth Implementation (node-id: 0-1)</span>
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

      {/* Main Viewport Content */}
      {devicePreview === 'desktop' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onNewUpload={() => setIsUploadModalOpen(true)} 
          />

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
            <Header 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
            />

            <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
              
              {/* Breadcrumbs & View Bar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* Dynamic Breadcrumb Path */}
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

                  {/* Right View & Sort Controls */}
                  <div className="flex items-center gap-3">
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

                    {/* Sort Dropdown */}
                    <button className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer">
                      <span>Sort: Last Modified</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2">
                  {['All', 'Documents', 'Images', 'PDFs'].map((filter) => (
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

              {/* Folders Section */}
              <section>
                <div className="flex items-center justify-between mb-3.5">
                  <h2 className="text-sm font-semibold text-slate-900">Folders</h2>
                  <button 
                    onClick={() => setIsNewFolderModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#5D5FEF] hover:text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>New Folder</span>
                  </button>
                </div>
                {folders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {folders.map((folder) => (
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
                    <p className="text-xs text-slate-400 font-medium">This folder is empty</p>
                  </div>
                )}
              </section>

              {/* Recent Files Section */}
              <section>
                <h2 className="text-sm font-semibold text-slate-900 mb-3.5">Recent Files</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onOpenShare={() => handleOpenShare(file.name)}
                      onSelect={() => handleSelectFile(file.id)}
                    />
                  ))}
                </div>
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

      {/* Share Modal Overlay (Exact Match of Screenshot 2) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileName={selectedFileName}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentFolderId={currentFolderId}
        currentFolderName={breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'My Drive'}
        onUploadComplete={() => loadFolders(currentFolderId)}
      />

      {/* New Folder Modal */}
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
