import { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  FolderPlus, 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  MoreVertical,
  HardDrive,
  Users,
  Star,
  User as UserIcon,
  CloudUpload,
  X,
  CheckCircle2,
  Moon,
  Shield,
  HelpCircle,
  LogOut,
  Clock
} from 'lucide-react';
import type { FolderItem, FileItem } from '../types';

interface MobileViewProps {
  folders: FolderItem[];
  files: FileItem[];
  onOpenShare: (fileName: string) => void;
}

export const MobileView: React.FC<MobileViewProps> = ({ folders, files, onOpenShare }) => {
  const [currentTab, setCurrentTab] = useState<'home' | 'shared' | 'search' | 'starred' | 'profile'>('home');
  const [mobileScreen, setMobileScreen] = useState<'home' | 'browser' | 'upload'>('home');
  const [searchQuery, setSearchQuery] = useState('pitch');
  const [selectedFilter, setSelectedFilter] = useState('All');

  return (
    <div className="w-[375px] h-[812px] bg-white rounded-[44px] shadow-2xl border-[10px] border-slate-900 overflow-hidden flex flex-col relative mx-auto select-none">
      
      {/* iOS Notch / Status Bar */}
      <div className="h-11 px-6 flex items-center justify-between text-xs font-semibold text-slate-900 shrink-0 bg-white z-20">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 bg-slate-900 rounded-xs" />
        </div>
      </div>

      {/* Screen Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        
        {/* ================= TAB: HOME ================= */}
        {currentTab === 'home' && mobileScreen === 'home' && (
          <div className="px-5 pt-2">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#5D5FEF] flex items-center justify-center text-white">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg text-slate-900">SecureShare</span>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentTab('search')}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <Search className="w-4 h-4" />
                </button>
                <div className="relative">
                  <Bell className="w-4 h-4 text-slate-600" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                </div>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover"
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setMobileScreen('upload')}
                className="flex-1 bg-[#5D5FEF] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload</span>
              </button>

              <button className="flex-1 bg-white border border-slate-200 text-slate-800 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                <FolderPlus className="w-4 h-4 text-slate-600" />
                <span>New Folder</span>
              </button>
            </div>

            {/* Quick Access Horizontal Scroll */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Quick Access</h4>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {/* PDF Card */}
                <div 
                  onClick={() => onOpenShare('PitchDeck_2026.pdf')}
                  className="w-36 bg-white border border-slate-200/80 rounded-2xl p-2.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  <div className="bg-red-50/70 h-20 rounded-xl flex items-center justify-center font-bold text-red-500 text-sm mb-2">
                    PDF
                  </div>
                  <p className="text-xs font-semibold text-slate-900 truncate">PitchDeck_2026.pdf</p>
                  <p className="text-[10px] text-slate-400">4.2 MB</p>
                </div>

                {/* Image Card */}
                <div 
                  onClick={() => onOpenShare('homepage_wireframe.png')}
                  className="w-36 bg-white border border-slate-200/80 rounded-2xl p-2.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=240"
                    alt="wireframe"
                    className="w-full h-20 object-cover rounded-xl mb-2"
                  />
                  <p className="text-xs font-semibold text-slate-900 truncate">homepage_wirefra...</p>
                  <p className="text-[10px] text-slate-400">2.8 MB</p>
                </div>

                {/* DOCX Card */}
                <div 
                  onClick={() => onOpenShare('Strategy_Plan.docx')}
                  className="w-36 bg-white border border-slate-200/80 rounded-2xl p-2.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  <div className="bg-blue-50/70 h-20 rounded-xl flex items-center justify-center font-bold text-blue-600 text-sm mb-2">
                    DOCX
                  </div>
                  <p className="text-xs font-semibold text-slate-900 truncate">Strategy_Plan.docx</p>
                  <p className="text-[10px] text-slate-400">1.4 MB</p>
                </div>
              </div>
            </div>

            {/* Folders List */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Folders</h4>
              <div className="space-y-2.5">
                {folders.slice(0, 3).map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setMobileScreen('browser')}
                    className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[#5D5FEF]">
                        <Folder className="w-5 h-5 stroke-[1.75]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{folder.name}</p>
                        <p className="text-[10px] text-slate-400">{folder.filesCount} files</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Files List */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-3">Recent Files</h4>
              <div className="space-y-2">
                <div 
                  onClick={() => onOpenShare('Q1_Budget_Final.xlsx')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-1 rounded-md">
                      XLSX
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Q1_Budget_Final.xlsx</p>
                      <p className="text-[10px] text-slate-400">1.8 MB • Jan 15</p>
                    </div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SCREEN: MOBILE FILE BROWSER ================= */}
        {mobileScreen === 'browser' && (
          <div className="px-5 pt-2">
            <button 
              onClick={() => setMobileScreen('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-4 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Projects</span>
            </button>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {['All', 'Documents', 'Images', 'PDFs'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 cursor-pointer ${
                    selectedFilter === filter
                      ? 'bg-slate-950 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* File List Cards */}
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onOpenShare(file.name)}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {file.previewType === 'image' && file.imageUrl ? (
                      <img src={file.imageUrl} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                        file.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {file.type}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{file.size} • {file.updatedTime}</p>
                    </div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>

            {/* FAB Button */}
            <button 
              onClick={() => setMobileScreen('upload')}
              className="fixed bottom-24 right-8 w-12 h-12 rounded-full bg-[#5D5FEF] text-white flex items-center justify-center shadow-lg hover:bg-[#4F46E5] cursor-pointer"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ================= SCREEN: MOBILE UPLOAD PROGRESS ================= */}
        {mobileScreen === 'upload' && (
          <div className="px-5 pt-2">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setMobileScreen('home')}
                className="flex items-center gap-1 text-xs font-bold text-slate-900 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Uploads</span>
              </button>
              <button className="text-xs font-bold text-[#5D5FEF] cursor-pointer">
                Pause All
              </button>
            </div>

            {/* Dropzone Area */}
            <div className="border-2 border-dashed border-indigo-200/90 rounded-2xl bg-indigo-50/20 p-6 text-center mb-5">
              <CloudUpload className="w-7 h-7 text-[#5D5FEF] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#5D5FEF]">Drag & Drop or Select files</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Max file size: 5GB</p>
            </div>

            {/* Upload Tasks */}
            <div className="space-y-3">
              {/* Task 1 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Pitch_Video_Raw.mp4</p>
                      <p className="text-[10px] text-slate-400">145.2 MB • 64% left</p>
                    </div>
                  </div>
                  <X className="w-4 h-4 text-slate-400 cursor-pointer" />
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#5D5FEF] h-full rounded-full w-[36%]" />
                </div>
              </div>

              {/* Task 2 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Financial_Forecast_v2.xlsx</p>
                      <p className="text-[10px] text-slate-400">18.4 MB • 12% left</p>
                    </div>
                  </div>
                  <X className="w-4 h-4 text-slate-400 cursor-pointer" />
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#5D5FEF] h-full rounded-full w-[88%]" />
                </div>
              </div>

              {/* Task 3 (Completed) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Brand_Mockup_Clean.png</p>
                    <p className="text-[10px] text-slate-400">8.2 MB • Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: SEARCH ================= */}
        {currentTab === 'search' && (
          <div className="px-5 pt-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
                <X 
                  onClick={() => setSearchQuery('')}
                  className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" 
                />
              </div>
              <button 
                onClick={() => setCurrentTab('home')}
                className="text-xs font-semibold text-[#5D5FEF]"
              >
                Cancel
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
              {['Documents', 'Images', 'PDFs', 'Audio', 'Videos'].map((t) => (
                <span key={t} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium shrink-0">
                  {t}
                </span>
              ))}
            </div>

            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              Search Results
            </p>
            <div className="space-y-2 mb-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3">
                <div className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-1 rounded">PDF</div>
                <div>
                  <p className="text-xs font-bold text-[#5D5FEF]">Fintrex_PitchDeck_2026.pdf</p>
                  <p className="text-[10px] text-slate-400">My Drive &gt; Projects • 4.2 MB</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              Recent Searches
            </p>
            <div className="space-y-3">
              {['pitch deck', 'logo template', 'financial outline'].map((s) => (
                <div key={s} className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s}</span>
                  </div>
                  <X className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: PROFILE ================= */}
        {currentTab === 'profile' && (
          <div className="px-5 pt-2">
            {/* Profile Avatar Header */}
            <div className="text-center mb-5">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160"
                alt="Jimmy Dane"
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-200 shadow-sm mb-2"
              />
              <h3 className="font-bold text-slate-900 text-sm">Jimmy Dane</h3>
              <p className="text-[11px] text-slate-400">jimmy@centralabs.com</p>
            </div>

            {/* Cloud Storage Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">Cloud Storage</span>
                <span className="text-[10px] font-bold text-[#5D5FEF] bg-[#EEF2FF] px-2 py-0.5 rounded-full uppercase">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">1.2 GB of 5.0 GB used (24%)</p>

              {/* Multi-color Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex mb-4">
                <div className="bg-[#5D5FEF] h-full" style={{ width: '45%' }} />
                <div className="bg-[#10B981] h-full" style={{ width: '35%' }} />
                <div className="bg-[#F59E0B] h-full" style={{ width: '20%' }} />
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#5D5FEF]" />
                    <span className="text-slate-600 text-[11px]">Documents</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">620 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span className="text-slate-600 text-[11px]">Images</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">380 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-slate-600 text-[11px]">Videos</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px]">200 MB</span>
                </div>
              </div>

              <button className="w-full bg-[#5D5FEF] hover:bg-[#4F46E5] text-white text-xs font-semibold py-2.5 rounded-xl cursor-pointer">
                Upgrade Plan
              </button>
            </div>

            {/* Settings Links */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">SETTINGS</p>
              <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 text-xs text-slate-700">
                <div className="p-3 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <span>Notifications</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-3 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>Security & Encryption</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Moon className="w-4 h-4 text-slate-500" />
                    <span>Dark Mode</span>
                  </div>
                  <div className="w-9 h-5 bg-indigo-600 rounded-full p-0.5 cursor-pointer flex items-center justify-end">
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    <span>Help & Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-3 flex items-center gap-2.5 text-red-500 cursor-pointer">
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="font-semibold">Sign Out</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* iOS Bottom Navigation Bar (5 tabs) */}
      <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 h-16 flex items-center justify-around px-2 z-30">
        {[
          { id: 'home', label: 'Home', icon: HardDrive },
          { id: 'shared', label: 'Shared', icon: Users },
          { id: 'search', label: 'Search', icon: Search },
          { id: 'starred', label: 'Starred', icon: Star },
          { id: 'profile', label: 'Profile', icon: UserIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id as any);
                setMobileScreen('home');
              }}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#5D5FEF]' : 'text-slate-400'}`} />
              <span className={`text-[9px] ${isActive ? 'text-[#5D5FEF] font-bold' : 'text-slate-400 font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="absolute bottom-1.5 inset-x-0 flex justify-center pointer-events-none z-40">
        <div className="w-32 h-1 bg-slate-900 rounded-full" />
      </div>

    </div>
  );
};
