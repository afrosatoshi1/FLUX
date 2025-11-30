
import React, { useEffect, useRef, useState } from 'react';
import { User, ThemeColor } from '../types';
import { Eye, Heart, MessageCircle, Send, X, AlertTriangle, Settings, Radio, Bot } from 'lucide-react';

interface LiveViewProps {
  currentUser: User | null;
  onClose: () => void;
  theme?: ThemeColor;
  aiEnabled?: boolean;
  onToggleAi?: () => void;
}

type LiveState = 'setup' | 'live' | 'ended';

const LiveView: React.FC<LiveViewProps> = ({ currentUser, onClose, theme = 'cyan', aiEnabled, onToggleAi }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liveState, setLiveState] = useState<LiveState>('setup');
  
  // Live Data
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<{user: string, text: string}[]>([]);
  const [title, setTitle] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Start Camera immediately for preview
    const startLiveCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' }, 
                audio: true 
            });
            if (mounted && videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.error("Live Camera Error", e);
            if (mounted) setError("Could not access camera/mic.");
        }
    };

    startLiveCamera();

    return () => {
        mounted = false;
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
    };
  }, []);

  // Simulation Effect when Live
  useEffect(() => {
    if (liveState !== 'live') return;

    const interval = setInterval(() => {
        setViewers(prev => prev + Math.floor(Math.random() * 3));
        if (Math.random() > 0.6) setLikes(prev => prev + 1);
        
        if (Math.random() > 0.7) {
            const randomComments = ["So cool!", "Where is this?", "Love the outfit", "Flux is amazing", "Notice me!", "Hi from NYC", "Wow!", "Can you say hi?", "AI Coach is watching 👀"];
            const randomUser = ["alex_z", "sarah.j", "mike_c", "jenny_w", "user_123", "flux_fan"];
            setComments(prev => [...prev.slice(-6), {
                user: randomUser[Math.floor(Math.random() * randomUser.length)],
                text: randomComments[Math.floor(Math.random() * randomComments.length)]
            }]);
        }
    }, 1500);

    return () => clearInterval(interval);
  }, [liveState]);

  const handleGoLive = () => {
      setLiveState('live');
      setComments([{ user: 'System', text: 'You are now LIVE!' }]);
  };

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
    <div className="w-full h-full bg-black relative">
        {error ? (
            <div className="w-full h-full flex items-center justify-center flex-col p-8 text-center bg-zinc-900">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h3 className="text-white font-bold text-xl">Camera Error</h3>
                <p className="text-zinc-500 mt-2">{error}</p>
                <button onClick={onClose} className="mt-8 bg-zinc-800 text-white px-6 py-3 rounded-full font-bold">Close</button>
            </div>
        ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        
        {/* --- SETUP SCREEN --- */}
        {liveState === 'setup' && !error && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex flex-col pt-safe-top">
                <div className="flex justify-between items-center p-4">
                     <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md">
                        <X size={24} />
                    </button>
                    <div className="px-4 py-1 bg-black/30 rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/10">
                        Preview
                    </div>
                    {onToggleAi && (
                        <button
                            onClick={onToggleAi}
                            className={`p-2 backdrop-blur-md rounded-full transition ${aiEnabled ? 'bg-emerald-500 text-white' : 'bg-black/20 text-white'}`}
                        >
                            <Bot size={24} />
                        </button>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-8">
                     <input 
                        type="text" 
                        placeholder="Add a title to your LIVE..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent text-center text-2xl font-black text-white placeholder:text-white/50 outline-none w-full mb-8"
                     />
                     
                     <div className="bg-black/40 p-6 rounded-3xl border border-white/10 w-full max-w-xs mb-8 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-white font-bold text-sm">AI Coach</span>
                            <div className={`w-10 h-6 rounded-full ${getThemeBg()} flex items-center justify-end px-1`}>
                                <div className="w-4 h-4 bg-black rounded-full" />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-300">Flux AI is ready to monitor your stream. The floating orb will give you real-time tips!</p>
                     </div>
                </div>

                <div className="p-8 pb-12 w-full flex justify-center bg-gradient-to-t from-black via-transparent to-transparent">
                    <button 
                        onClick={handleGoLive}
                        className={`px-12 py-4 ${getThemeBg()} text-black font-black rounded-full text-lg uppercase tracking-widest shadow-xl shadow-white/10 active:scale-95 transition-transform`}
                    >
                        Go Live
                    </button>
                </div>
            </div>
        )}

        {/* --- LIVE BROADCAST SCREEN --- */}
        {liveState === 'live' && (
            <>
                <div className="absolute top-safe px-4 pt-10 w-full flex justify-between items-start z-10">
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <div className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                                <Radio size={12} /> LIVE
                            </div>
                            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2">
                                <Eye size={14} /> {viewers}
                            </div>
                        </div>
                        {title && <h3 className="text-white font-bold text-sm shadow-black drop-shadow-md ml-1">{title}</h3>}
                    </div>
                    {onToggleAi && (
                        <button
                            onClick={onToggleAi}
                            className={`p-2 backdrop-blur-md rounded-full transition ${aiEnabled ? 'bg-emerald-500 text-white' : 'bg-black/20 text-white'}`}
                        >
                            <Bot size={24} />
                        </button>
                    )}
                </div>

                {/* Bottom Overlay */}
                <div className="absolute bottom-0 w-full p-4 pb-10 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col gap-4">
                    {/* Comments Stream */}
                    <div className="h-56 overflow-y-auto no-scrollbar mask-image-linear-gradient flex flex-col justify-end gap-2 mb-2">
                        {comments.map((c, i) => (
                            <div key={i} className="animate-in slide-in-from-bottom-2 fade-in bg-black/20 w-fit px-3 py-1.5 rounded-2xl backdrop-blur-sm border border-white/5">
                                <span className="font-bold text-zinc-300 text-xs mr-2">{c.user}</span> 
                                <span className="text-white text-sm">{c.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Input & Actions */}
                    <div className="flex gap-4 items-center mb-2">
                        <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-full h-12 flex items-center px-4 border border-white/10">
                            <input type="text" placeholder="Say something..." className="bg-transparent w-full text-white outline-none placeholder:text-zinc-500 text-sm" />
                            <button className="text-white opacity-50 hover:opacity-100"><Send size={20} /></button>
                        </div>
                        <button onClick={() => setLikes(prev => prev + 1)} className={`w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center active:scale-90 transition`}>
                            <Heart size={24} className={`${likes > 0 ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                        </button>
                    </div>

                    {/* End Button - Bottom Center */}
                    <div className="flex justify-center w-full">
                        <button 
                            onClick={onClose} 
                            className="bg-red-600/90 text-white font-black uppercase tracking-widest text-sm px-10 py-3 rounded-full backdrop-blur-md shadow-lg shadow-red-900/20 active:scale-95 transition"
                        >
                            End Live
                        </button>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default LiveView;
