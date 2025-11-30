import React from 'react';
import { Camera, Image as ImageIcon, MessageSquare, Radio, Users } from 'lucide-react';
import { ViewState, ThemeColor } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  theme?: ThemeColor;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, theme = 'cyan' }) => {
  if (currentView === ViewState.PHOTO_DETAIL || currentView === ViewState.REVIEW || currentView === ViewState.CREATE_ALBUM || currentView === ViewState.SETTINGS || currentView === ViewState.LIVE || currentView === ViewState.CHAT_LIST) return null;

  const getColorClass = (isActive: boolean) => {
      const map: Record<string, string> = {
          cyan: isActive ? 'text-cyan-400' : 'text-zinc-500',
          violet: isActive ? 'text-violet-400' : 'text-zinc-500',
          emerald: isActive ? 'text-emerald-400' : 'text-zinc-500',
          rose: isActive ? 'text-rose-400' : 'text-zinc-500',
          amber: isActive ? 'text-amber-400' : 'text-zinc-500',
      };
      return map[theme];
  };

  const getBgClass = () => {
       const map: Record<string, string> = {
          cyan: 'bg-cyan-400 shadow-cyan-400/30',
          violet: 'bg-violet-400 shadow-violet-400/30',
          emerald: 'bg-emerald-400 shadow-emerald-400/30',
          rose: 'bg-rose-400 shadow-rose-400/30',
          amber: 'bg-amber-400 shadow-amber-400/30',
      };
      return map[theme];
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-2 rounded-[2.5rem] bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50">
        
        <button 
            onClick={() => setView(ViewState.SOCIAL)} 
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${currentView === ViewState.SOCIAL ? 'bg-white/10' : 'hover:bg-white/5'}`}
        >
          <Users size={20} className={getColorClass(currentView === ViewState.SOCIAL)} />
        </button>

         <button 
            onClick={() => setView(ViewState.CHAT_LIST)} 
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-white/5`}
        >
          <MessageSquare size={20} className="text-zinc-500" />
        </button>

        <button 
          onClick={() => setView(ViewState.CAMERA)} 
          className={`w-16 h-16 rounded-full flex items-center justify-center text-black shadow-lg transition-all duration-300 active:scale-95 mx-2 ${getBgClass()} ${currentView === ViewState.CAMERA ? 'scale-110' : ''}`}
        >
          <Camera size={28} strokeWidth={2.5} />
        </button>

         <button 
            onClick={() => setView(ViewState.LIVE)} 
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-white/5`}
        >
          <Radio size={20} className="text-zinc-500" />
        </button>

        <button 
            onClick={() => setView(ViewState.GALLERY)} 
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${currentView === ViewState.GALLERY || currentView === ViewState.ALBUM_DETAIL ? 'bg-white/10' : 'hover:bg-white/5'}`}
        >
          <ImageIcon size={20} className={getColorClass(currentView === ViewState.GALLERY || currentView === ViewState.ALBUM_DETAIL)} />
        </button>

      </div>
    </div>
  );
};

export default BottomNav;