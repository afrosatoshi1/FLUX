
import React, { useState, useEffect } from 'react';
import { ThemeColor, User, UserSettings } from '../types';
import { ArrowLeft, Check, Palette, User as UserIcon, Shield, Trash2, Bell, RefreshCw, BadgeCheck, Download } from 'lucide-react';

interface SettingsViewProps {
  currentTheme: ThemeColor;
  onSelectTheme: (theme: ThemeColor) => void;
  onBack: () => void;
  currentUser: User | null;
  onUpdateUser: (user: User) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    currentTheme, onSelectTheme, onBack, currentUser, onUpdateUser, settings, onUpdateSettings 
}) => {
  const [editingName, setEditingName] = useState(currentUser?.name || '');
  const [editingBio, setEditingBio] = useState(currentUser?.bio || '');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const themes: { id: ThemeColor; name: string; color: string }[] = [
      { id: 'cyan', name: 'Flux Cyan', color: 'bg-cyan-400' },
      { id: 'violet', name: 'Cyber Violet', color: 'bg-violet-400' },
      { id: 'emerald', name: 'Neon Mint', color: 'bg-emerald-400' },
      { id: 'rose', name: 'Hot Pink', color: 'bg-rose-400' },
      { id: 'amber', name: 'Solar Gold', color: 'bg-amber-400' },
  ];

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleClearData = () => {
      if (confirm("WARNING: This will delete ALL your photos, albums, and chats. This action cannot be undone. Are you sure?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleUpdateProfile = () => {
      if (!currentUser) return;
      onUpdateUser({ ...currentUser, name: editingName, bio: editingBio });
      alert("Profile updated!");
  };

  const getThemeText = () => {
      const map: Record<string, string> = {
         cyan: 'text-cyan-400',
         violet: 'text-violet-400',
         emerald: 'text-emerald-400',
         rose: 'text-rose-400',
         amber: 'text-amber-400',
     };
     return map[currentTheme];
  };

  return (
    <div className="w-full h-full bg-black flex flex-col pt-safe-top">
      {/* Header */}
      <div className="px-6 py-6 pt-10 flex items-center gap-4 bg-black/50 backdrop-blur-md z-10 sticky top-0">
        <button onClick={onBack} className="p-3 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition">
            <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-white tracking-tight">Settings</h2>
      </div>

      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-8 pb-20">

        {/* Install App Banner */}
        {installPrompt && (
            <button 
                onClick={handleInstall}
                className={`w-full p-5 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-between group active:scale-95 transition`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${themes.find(t=>t.id===currentTheme)?.color} flex items-center justify-center text-black`}>
                        <Download size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-white font-bold">Install Flux</h3>
                        <p className="text-zinc-500 text-xs">Get the native app experience</p>
                    </div>
                </div>
                <div className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide">
                    Get
                </div>
            </button>
        )}
        
        {/* Account Section */}
        {currentUser && (
            <div className="bg-zinc-900/50 rounded-3xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <UserIcon className="text-zinc-500" size={20} />
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Account</h3>
                </div>
                
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                         <label className="text-xs text-zinc-500 font-bold ml-1">Display Name</label>
                         <input 
                            value={editingName} 
                            onChange={e => setEditingName(e.target.value)}
                            className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold"
                         />
                    </div>
                     <div className="flex flex-col gap-2">
                         <label className="text-xs text-zinc-500 font-bold ml-1">Bio</label>
                         <textarea 
                            value={editingBio} 
                            onChange={e => setEditingBio(e.target.value)}
                            className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm h-20 resize-none"
                         />
                    </div>
                    {currentUser.isVerified && (
                        <div className="flex items-center gap-2 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                            <BadgeCheck className="text-blue-500" size={18} />
                            <span className="text-blue-400 text-xs font-bold">Owner / Verified Account</span>
                        </div>
                    )}
                    <button onClick={handleUpdateProfile} className="w-full bg-white text-black font-bold py-3 rounded-xl">Save Changes</button>
                </div>
            </div>
        )}

        {/* Appearance */}
        <div>
            <div className="flex items-center gap-3 mb-4">
                <Palette className="text-zinc-500" size={20} />
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Theme</h3>
            </div>
            
            <div className="space-y-3">
                {themes.map((t) => (
                    <button 
                        key={t.id}
                        onClick={() => onSelectTheme(t.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                            currentTheme === t.id 
                                ? 'bg-white/10 border-white/20 scale-[1.02]' 
                                : 'bg-zinc-900/50 border-transparent hover:bg-zinc-900'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full ${t.color} shadow-lg shadow-white/5`} />
                            <span className="text-white font-bold text-lg">{t.name}</span>
                        </div>
                        {currentTheme === t.id && (
                            <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center`}>
                                <Check size={16} className="text-black" strokeWidth={3} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Privacy & Settings */}
        <div className="bg-zinc-900/50 rounded-3xl p-5 border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
                <Shield className="text-zinc-500" size={20} />
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Privacy & Data</h3>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Public Profile</span>
                    <div 
                        onClick={() => onUpdateSettings({...settings, publicProfile: !settings.publicProfile})}
                        className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${settings.publicProfile ? `bg-${currentTheme}-400` : 'bg-zinc-700'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settings.publicProfile ? 'left-6' : 'left-1'}`} />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Allow AI Analysis</span>
                    <div 
                         onClick={() => onUpdateSettings({...settings, allowAiAnalysis: !settings.allowAiAnalysis})}
                        className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${settings.allowAiAnalysis ? `bg-${currentTheme}-400` : 'bg-zinc-700'}`}
                    >
                         <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settings.allowAiAnalysis ? 'left-6' : 'left-1'}`} />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Notifications</span>
                    <div 
                         onClick={() => onUpdateSettings({...settings, notifications: !settings.notifications})}
                        className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${settings.notifications ? `bg-${currentTheme}-400` : 'bg-zinc-700'}`}
                    >
                         <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settings.notifications ? 'left-6' : 'left-1'}`} />
                    </div>
                </div>
            </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 rounded-3xl p-5 border border-red-500/20">
             <div className="flex items-center gap-3 mb-4">
                <Trash2 className="text-red-500" size={20} />
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest">Danger Zone</h3>
            </div>
            <button onClick={handleClearData} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition">
                Clear All Data & Reset App
            </button>
            <p className="text-xs text-red-400 mt-2 text-center opacity-70">This action removes all local storage and cannot be undone.</p>
        </div>

        {/* Info */}
        <div className="text-center text-zinc-600 text-xs font-medium space-y-2 pt-4">
             <p className="flex items-center justify-center gap-2">Flux v1.0.2 (Production Build)</p>
             <button className="text-zinc-500 hover:text-white flex items-center justify-center gap-2 mx-auto">
                 <RefreshCw size={12} /> Check for updates
             </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
