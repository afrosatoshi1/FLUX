
import React, { useRef, useState, useEffect } from 'react';
import { Zap, RefreshCcw, AlertCircle, Upload, ChevronLeft, ChevronRight, Wand2, Loader2, Bot } from 'lucide-react';
import { ThemeColor } from '../types';
import { generateFilterConfig } from '../services/geminiService';

interface CameraViewProps {
  onCapture: (imageData: string, type: 'image' | 'video', thumbnail?: string) => void;
  isActive: boolean;
  theme?: ThemeColor;
  aiEnabled?: boolean;
  onToggleAi?: () => void;
}

interface Filter {
  id: string;
  name: string;
  css: string;
  type: 'color' | 'bw' | 'retro' | 'glitch' | 'overlay';
  isTrending?: boolean;
  overlayText?: string;
  isAiGenerated?: boolean;
}

const formatDate = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString()}`;
};

const DAILY_SEEDS = ["Cyber", "Peachy", "Noir", "Emerald", "Golden"];
const getDailyFilterName = () => DAILY_SEEDS[new Date().getDay() % DAILY_SEEDS.length];

const INITIAL_FILTERS: Filter[] = [
    { id: 'normal', name: 'Flux', css: 'none', type: 'color' },
    { id: 'daily', name: `Daily: ${getDailyFilterName()}`, css: 'contrast(1.1) saturate(1.2) hue-rotate(-5deg)', type: 'color', isTrending: true, overlayText: "DAILY DROP" },
    { id: 'vintage', name: '1998 Cam', css: 'sepia(0.5) contrast(0.9) brightness(0.9) saturate(0.8)', type: 'retro', overlayText: formatDate() },
    { id: 'bw', name: 'Noir', css: 'grayscale(1) contrast(1.2) brightness(1.1)', type: 'bw' },
    { id: 'dream', name: 'Daydream', css: 'blur(0.5px) saturate(1.5) brightness(1.2) contrast(0.9)', type: 'color' }
];

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isActive, theme = 'cyan', aiEnabled, onToggleAi }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashActive, setFlashActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filter[]>(INITIAL_FILTERS);
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const activeFilter = filters[activeFilterIndex];
  const [showFilterName, setShowFilterName] = useState(false);
  const [isGeneratingFilter, setIsGeneratingFilter] = useState(false);

  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const touchStartRef = useRef<number>(0);

  useEffect(() => {
    if (isActive) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [isActive, facingMode, mode]);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 15) { stopRecording(); return prev; }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
      setShowFilterName(true);
      const t = setTimeout(() => setShowFilterName(false), 1500);
      if (carouselRef.current) {
          const item = carouselRef.current.children[activeFilterIndex + 1] as HTMLElement;
          if (item) item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      return () => clearTimeout(t);
  }, [activeFilterIndex]);

  const startCamera = async () => {
    setError(null);
    if (stream) stream.getTracks().forEach(track => track.stop());

    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video'
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
    } catch (err) {
       setError("Camera unavailable");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const drawToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!videoRef.current) return;
      ctx.filter = activeFilter.css;
      if (facingMode === 'user') {
          ctx.save();
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, width, height);
          ctx.restore();
      } else {
          ctx.drawImage(videoRef.current, 0, 0, width, height);
      }
      ctx.filter = 'none';
      if (activeFilter.overlayText) {
          ctx.font = 'bold 40px sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 4;
          ctx.textAlign = 'center';
          ctx.fillText(activeFilter.overlayText, width / 2, height - 100);
      }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        drawToCanvas(ctx, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        if (flashActive) triggerFlashEffect();
        onCapture(dataUrl, 'image');
    }
  };

  const startRecording = () => {
    if (!stream || !canvasRef.current || !videoRef.current) return;
    chunksRef.current = [];
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
        if (videoRef.current && ctx) drawToCanvas(ctx, canvas.width, canvas.height);
        if (isRecording || mediaRecorderRef.current?.state === 'recording') {
            animationFrameRef.current = requestAnimationFrame(renderLoop);
        }
    };

    try {
        const canvasStream = canvas.captureStream(30);
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) canvasStream.addTrack(audioTracks[0]);

        let options: MediaRecorderOptions = { mimeType: 'video/webm' };
        if (MediaRecorder.isTypeSupported('video/mp4')) options = { mimeType: 'video/mp4' };
        
        const recorder = new MediaRecorder(canvasStream, options);
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: options.mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
                const thumbnail = canvas.toDataURL('image/jpeg', 0.5);
                onCapture(reader.result as string, 'video', thumbnail);
            };
            reader.readAsDataURL(blob);
            setIsRecording(false);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };

        setIsRecording(true);
        renderLoop();
        recorder.start();
        mediaRecorderRef.current = recorder;
    } catch (e) {
        setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  const handleGenerateFilter = async () => {
      setIsGeneratingFilter(true);
      const newConfig = await generateFilterConfig();
      setFilters(prev => [...prev, {
          id: `ai-${Date.now()}`,
          name: newConfig.name,
          css: newConfig.css,
          type: 'color',
          overlayText: newConfig.overlayText,
          isAiGenerated: true,
          isTrending: true
      }]);
      setActiveFilterIndex(filters.length);
      setIsGeneratingFilter(false);
  };

  const handleAction = () => {
      if (mode === 'image') takePhoto();
      else isRecording ? stopRecording() : startRecording();
  };

  const triggerFlashEffect = () => {
    const flash = document.createElement('div');
    Object.assign(flash.style, { position: 'fixed', inset: '0', background: 'white', zIndex: '100', opacity: '0.8' });
    document.body.appendChild(flash);
    setTimeout(() => document.body.removeChild(flash), 100);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      const diff = touchStartRef.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
          const newIndex = diff > 0 ? (activeFilterIndex + 1) % filters.length : (activeFilterIndex - 1 + filters.length) % filters.length;
          setActiveFilterIndex(newIndex);
      }
  };

  const getThemeColor = () => {
      const map: Record<string, string> = { cyan: 'text-cyan-400', violet: 'text-violet-400', emerald: 'text-emerald-400', rose: 'text-rose-400', amber: 'text-amber-400' };
      return map[theme];
  };

  return (
    <div 
        className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-center items-center touch-pan-y"
        onTouchStart={e => touchStartRef.current = e.touches[0].clientX}
        onTouchEnd={handleTouchEnd}
    >
      {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
              <AlertCircle size={40} className="text-red-500 mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">Camera Unavailable</h3>
              <button onClick={startCamera} className="px-6 py-4 bg-zinc-900 rounded-2xl text-white font-bold">Try Again</button>
          </div>
      ) : (
          <>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ filter: activeFilter.css }}
                className={`absolute min-w-full min-h-full object-cover transition-all duration-300 ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
            {activeFilter.overlayText && (
                <div className="absolute bottom-40 w-full text-center pointer-events-none">
                     <span className="text-white font-black text-4xl drop-shadow-lg opacity-90 tracking-tighter" style={{ textShadow: '2px 2px 4px black' }}>{activeFilter.overlayText}</span>
                </div>
            )}
          </>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
      <input type="file" ref={fileInputRef} accept="image/*,video/*" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                  const res = ev.target?.result as string;
                  const type = file.type.startsWith('video') ? 'video' : 'image';
                  onCapture(res, type, type === 'image' ? res : undefined);
              };
              reader.readAsDataURL(file);
          }
      }} />

      {isRecording && (
          <div className="absolute top-16 flex items-center gap-3 bg-red-600/90 px-6 py-2 rounded-full backdrop-blur-xl border border-red-400/30 shadow-xl z-30">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span className="text-white font-mono font-bold">{recordingTime < 10 ? `00:0${recordingTime}` : `00:${recordingTime}`}</span>
          </div>
      )}

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500 ${showFilterName ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
           <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
               <span className="text-white font-bold text-xl tracking-wide whitespace-nowrap">{activeFilter.name}</span>
           </div>
      </div>

      {!error && (
        <div className="absolute top-12 right-6 flex flex-col gap-4 z-20 pointer-events-auto">
            <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="p-3 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full text-white"><RefreshCcw size={20} /></button>
            {mode === 'image' && (
                <button onClick={() => setFlashActive(!flashActive)} className={`p-3 backdrop-blur-xl border border-white/10 rounded-full ${flashActive ? 'bg-yellow-400 text-black' : 'bg-black/20 text-white'}`}><Zap size={20} /></button>
            )}
            {onToggleAi && (
                <button onClick={onToggleAi} className={`p-3 backdrop-blur-xl border border-white/10 rounded-full ${aiEnabled ? 'bg-emerald-500 text-white' : 'bg-black/20 text-zinc-400'}`}><Bot size={20} /></button>
            )}
        </div>
      )}

      {!error && !isRecording && (
        <div className="absolute top-12 left-6 z-20 pointer-events-auto">
             <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full text-white"><Upload size={20} /></button>
        </div>
      )}

      {!error && (
          <div className="absolute bottom-0 w-full flex flex-col items-center pb-28 z-20 pointer-events-none">
            {!isRecording && (
                <div ref={carouselRef} className="pointer-events-auto w-full overflow-x-auto no-scrollbar flex items-center snap-x snap-mandatory mb-6 px-[50vw]">
                    <div className="w-1 shrink-0" />
                    {filters.map((filter, index) => (
                        <div key={filter.id} onClick={(e) => { e.stopPropagation(); setActiveFilterIndex(index); }} className={`snap-center shrink-0 mx-3 flex flex-col items-center justify-center transition-all duration-300 ${index === activeFilterIndex ? 'scale-110' : 'scale-75 opacity-70'}`}>
                            <div className={`w-16 h-16 rounded-full border-2 overflow-hidden relative cursor-pointer shadow-lg ${index === activeFilterIndex ? `${getThemeColor()} border-current ring-4 ring-white/10` : 'border-white'}`}>
                                <div className="w-full h-full bg-zinc-800" style={{ filter: filter.css }}><img src="https://picsum.photos/100/100" className="w-full h-full object-cover opacity-80" alt="filter" /></div>
                            </div>
                        </div>
                    ))}
                    <div onClick={(e) => { e.stopPropagation(); handleGenerateFilter(); }} className="snap-center shrink-0 mx-3 flex flex-col items-center justify-center scale-90 hover:scale-100 transition cursor-pointer">
                         <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/50 bg-white/10 flex items-center justify-center">
                            {isGeneratingFilter ? <Loader2 className="animate-spin text-white" /> : <Wand2 className="text-white" />}
                         </div>
                    </div>
                    <div className="w-[50vw] shrink-0" />
                </div>
            )}

            <div className="flex items-center gap-10 pointer-events-auto z-30 mb-4">
                 {!isRecording && <ChevronLeft className="text-white/30 animate-pulse hidden md:block" />}
                <button onClick={handleAction} className={`relative flex items-center justify-center transition-all duration-500 cursor-pointer ${mode === 'video' ? 'h-24 w-24' : 'h-20 w-20'}`}>
                    <div className={`rounded-full border-[5px] flex items-center justify-center transition-all duration-500 shadow-2xl ${mode === 'video' ? 'h-24 w-24 border-white/80' : 'h-20 w-20 border-white'}`}>
                        <div className={`rounded-full transition-all duration-300 shadow-inner ${mode === 'video' ? (isRecording ? 'h-10 w-10 rounded-md bg-red-500' : 'h-20 w-20 bg-red-500 scale-[0.85]') : 'h-16 w-16 bg-white scale-[0.85] active:scale-[0.75]'}`} />
                    </div>
                </button>
                 {!isRecording && <ChevronRight className="text-white/30 animate-pulse hidden md:block" />}
            </div>

            {!isRecording && (
                <div className="flex gap-6 mt-2 pointer-events-auto bg-black/40 backdrop-blur-lg px-6 py-2 rounded-full border border-white/5 z-30">
                    <button onClick={() => setMode('image')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'image' ? 'text-white scale-110' : 'text-zinc-500'}`}>Photo</button>
                    <button onClick={() => setMode('video')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'video' ? 'text-white scale-110' : 'text-zinc-500'}`}>Video</button>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default CameraView;
