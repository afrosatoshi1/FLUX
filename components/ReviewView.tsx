import React from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { ThemeColor } from '../types';

interface ReviewViewProps {
  mediaData: string;
  type?: 'image' | 'video';
  onRetake: () => void;
  onSave: () => void;
  theme?: ThemeColor;
}

const ReviewView: React.FC<ReviewViewProps> = ({ mediaData, type = 'image', onRetake, onSave, theme = 'cyan' }) => {
  
    const getThemeBg = () => {
       const map: Record<string, string> = {
          cyan: 'bg-cyan-400',
          violet: 'bg-violet-400',
          emerald: 'bg-emerald-400',
          rose: 'bg-rose-400',
          amber: 'bg-amber-400',
      };
      return map[theme];
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in zoom-in duration-300">
      {/* Media Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden rounded-b-3xl">
        {type === 'video' ? (
             <video 
                src={mediaData} 
                className="max-w-full max-h-full object-contain" 
                autoPlay 
                loop 
                playsInline 
                controls
             />
        ) : (
             <img src={mediaData} className="max-w-full max-h-full object-contain shadow-2xl" alt="Review" />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="h-32 bg-black flex items-center justify-around px-8 pb-8 pt-4">
        <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onRetake}>
            <button 
            className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 text-white group-active:scale-90 transition border border-zinc-800"
            >
            <RotateCcw size={24} />
            </button>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-white transition-colors">Retake</span>
        </div>

        <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onSave}>
            <button 
            className={`flex items-center justify-center w-20 h-20 rounded-full ${getThemeBg()} text-black shadow-lg shadow-white/10 group-active:scale-90 transition`}
            >
            <Check size={36} strokeWidth={4} />
            </button>
            <span className={`text-[10px] font-black text-white uppercase tracking-widest`}>Save</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewView;