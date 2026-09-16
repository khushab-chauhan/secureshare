import { useState } from 'react';
import { 
  X, 
  Mail, 
  ChevronDown, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Edit2, 
  Link2,
  Check
} from 'lucide-react';
import type { SharedUser } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose,
  fileName = "Fintrex_PitchDeck_2026.pdf" 
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Editor' | 'Viewer'>('Editor');
  const [isPublicLinkEnabled, setIsPublicLinkEnabled] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const usersWithAccess: SharedUser[] = [
    {
      id: '1',
      name: 'Jimmy Dane (You)',
      email: 'jimmy@centralabs.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      role: 'Owner',
      isCurrentUser: true,
    },
    {
      id: '2',
      name: 'Alice Vance',
      email: 'alice@centralabs.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      role: 'Editor',
    },
    {
      id: '3',
      name: 'Marcus Stone',
      email: 'm.stone@investor.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      role: 'Viewer',
    },
  ];

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText('https://secureshare.app/s/fintrex_deck_xyz123');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-[460px] w-full border border-slate-100 relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 text-red-600 text-[11px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
              PDF
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">
                {fileName}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Created 2 hours ago • 4.2 MB
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite People Form */}
        <div className="mt-2">
          <label className="block text-xs font-semibold text-slate-900 mb-2">
            Invite people
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Add email addresses..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF]"
              />
            </div>

            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="appearance-none bg-slate-50/70 border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button className="bg-[#5D5FEF] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Send
            </button>
          </div>
        </div>

        {/* People with access List */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-900 mb-3">
            People with access
          </label>
          <div className="space-y-3">
            {usersWithAccess.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 leading-none">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-normal mt-1">
                      {user.email}
                    </p>
                  </div>
                </div>

                <span className={`text-xs font-medium ${user.role === 'Owner' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Anyone with public link section */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-900">Anyone with public link</p>
              <p className="text-[11px] text-slate-400">Allow public file downloads</p>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={() => setIsPublicLinkEnabled(!isPublicLinkEnabled)}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                isPublicLinkEnabled ? 'bg-[#5D5FEF]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isPublicLinkEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Security & Expiry Badges */}
          {isPublicLinkEnabled && (
            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-700 mb-4">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-medium">Password Required</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-medium">Expires: 7 Days</span>
                <button className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5">
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Copy Public Link Button */}
          <button
            onClick={handleCopy}
            className="w-full border border-indigo-200 bg-[#EEF2FF]/60 hover:bg-[#EEF2FF] text-[#5D5FEF] font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-all cursor-pointer shadow-2xs"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>Copy Public Link</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
