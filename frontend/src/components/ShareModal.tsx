import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Clock, 
  Link2,
  Check,
  UserPlus,
  Trash2
} from 'lucide-react';
import type { FileItem, SharedUser } from '../types';
import type { User } from '../api/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: FileItem | null;
  fileName?: string;
  currentUser?: User | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose,
  file,
  fileName,
  currentUser
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Editor' | 'Viewer'>('Editor');
  const [isPublicLinkEnabled, setIsPublicLinkEnabled] = useState(true);
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [isCopied, setIsCopied] = useState(false);

  const displayFileName = file?.name || fileName || 'Document.pdf';
  const displayFileType = file?.type || 'pdf';
  const displayFileSize = file?.size || '2.4 MB';
  const displayUpdated = file?.updatedTime || 'Recently';

  const [collaborators, setCollaborators] = useState<SharedUser[]>([
    {
      id: 'owner',
      name: `${currentUser?.full_name || 'Harsh Chauhan'} (You)`,
      email: currentUser?.email || 'harshchauhan08866@gmail.com',
      avatar: '',
      role: 'Owner',
      isCurrentUser: true,
    },
    {
      id: '2',
      name: 'Khushab Chauhan',
      email: 'khushab@secureshare.io',
      avatar: '',
      role: 'Editor',
    }
  ]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const shareUrl = `${window.location.origin}/s/${file?.id || 'demo-share'}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const newUser: SharedUser = {
      id: Date.now().toString(),
      name: emailInput.split('@')[0],
      email: emailInput.trim(),
      avatar: '',
      role: selectedRole,
    };

    setCollaborators(prev => [...prev, newUser]);
    setEmailInput('');
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-[480px] w-full border border-slate-100 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* ── Header ── */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0 mr-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${getBadgeStyle(displayFileType)}`}>
              {displayFileType}
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-sm leading-tight truncate" title={displayFileName}>
                {displayFileName}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {displayFileSize} • {displayUpdated}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Invite Input ── */}
        <form onSubmit={handleAddCollaborator} className="pt-4 pb-4">
          <label className="block text-xs font-semibold text-slate-800 mb-2">
            Share with people
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] transition-all"
              />
            </div>
            
            {/* Role Picker */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>

            <button
              type="submit"
              disabled={!emailInput.trim()}
              className="bg-[#5D5FEF] hover:bg-[#4F46E5] disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          </div>
        </form>

        {/* ── People with Access ── */}
        <div className="py-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            People with access ({collaborators.length})
          </span>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {collaborators.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#5D5FEF]/10 text-[#5D5FEF] font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-slate-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    user.role === 'Owner' 
                      ? 'bg-amber-50 text-amber-700' 
                      : user.role === 'Editor'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                  {!user.isCurrentUser && (
                    <button
                      onClick={() => handleRemoveCollaborator(user.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                      title="Remove access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── General Link Sharing ── */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#5D5FEF]" />
              <span className="text-xs font-bold text-slate-800">Public Link Sharing</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPublicLinkEnabled} 
                onChange={(e) => setIsPublicLinkEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5D5FEF]"></div>
            </label>
          </div>

          {isPublicLinkEnabled && (
            <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              {/* Expiry & Password settings */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Expires in
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
                  >
                    <option value="1">24 Hours</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="0">Never</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPasswordEnabled(!isPasswordEnabled)}
                    className={`w-full text-xs font-semibold py-1 px-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      isPasswordEnabled 
                        ? 'bg-indigo-50 border-[#5D5FEF] text-[#5D5FEF]' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {isPasswordEnabled ? 'Protected' : 'No password'}
                  </button>
                </div>
              </div>

              {isPasswordEnabled && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set download password..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#5D5FEF]"
                />
              )}

              {/* Copy link bar */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/s/${file?.id || 'demo-share'}`}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 select-all font-mono truncate"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
