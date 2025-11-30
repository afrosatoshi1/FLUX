
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AiAvatarConfig, ThemeColor, ViewState } from '../types';
import { Mic, MicOff, Sparkles, Volume2, X, AlertCircle, VideoOff, Ear } from 'lucide-react';

interface AiBuddyProps {
  config: AiAvatarConfig;
  currentView: ViewState;
  isActive: boolean;
  onClose: () => void;
  theme?: ThemeColor;
}

const AiBuddy: React.FC<AiBuddyProps> = ({ config, currentView, isActive, onClose, theme = 'cyan' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);
  const lastUiUpdateRef = useRef<number>(0);
  
  const isActiveRef = useRef(isActive);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // FORCE AUDIO RESUME ON USER INTERACTION
  useEffect(() => {
      const unlockAudio = () => {
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume();
          }
      };
      document.addEventListener('click', unlockAudio);
      document.addEventListener('touchstart', unlockAudio);
      return () => {
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
      };
  }, []);

  const getGlowColor = () => {
    if (isUserSpeaking) return 'shadow-emerald-400/50';
    const map: Record<string, string> = {
        cyan: 'shadow-cyan-400/50',
        violet: 'shadow-violet-400/50',
        emerald: 'shadow-emerald-400/50',
        rose: 'shadow-rose-400/50',
        amber: 'shadow-amber-400/50',
    };
    return map[theme];
  };

  const getBorderColor = () => {
     if (isUserSpeaking) return 'border-emerald-400';
     const map: Record<string, string> = {
        cyan: 'border-cyan-400',
        violet: 'border-violet-400',
        emerald: 'border-emerald-400',
        rose: 'border-rose-400',
        amber: 'border-amber-400',
    };
    return map[theme];
  };

  const getOrbColor = () => {
    if (isUserSpeaking) return 'bg-emerald-500';
    const map: Record<string, string> = {
       cyan: 'bg-cyan-400',
       violet: 'bg-violet-400',
       emerald: 'bg-emerald-400',
       rose: 'bg-rose-400',
       amber: 'bg-amber-400',
   };
   return map[theme];
 };

  // --- AUDIO UTILS ---

  const downsampleBuffer = (buffer: Float32Array, sampleRate: number, outSampleRate: number) => {
      if (outSampleRate === sampleRate) return buffer;
      if (outSampleRate > sampleRate) return buffer;
      const sampleRateRatio = sampleRate / outSampleRate;
      const newLength = Math.round(buffer.length / sampleRateRatio);
      const result = new Float32Array(newLength);
      let offsetResult = 0;
      let offsetBuffer = 0;
      while (offsetResult < result.length) {
          const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
          let accum = 0, count = 0;
          for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
              accum += buffer[i];
              count++;
          }
          result[offsetResult] = count > 0 ? accum / count : 0;
          offsetResult++;
          offsetBuffer = nextOffsetBuffer;
      }
      return result;
  };

  const createBlob = (data: Float32Array) => {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        let s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      let binary = '';
      const bytes = new Uint8Array(int16.buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      return {
        data: base64,
        mimeType: 'audio/pcm;rate=16000',
      };
  };

  const decodeAudio = (base64: string) => {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  };

  useEffect(() => {
    let isMounted = true;

    const initConnection = async () => {
        if (!isActive || !config.enabled) return;
        await new Promise(r => setTimeout(r, 100));
        if (!isMounted) return;
        connect(isMounted);
    };

    if (isActive && config.enabled) {
        initConnection();
    } else {
        disconnect();
        setRetryCount(0);
    }

    return () => {
        isMounted = false;
        disconnect();
    };
  }, [isActive, config.enabled]);

  const connect = async (isMounted: boolean) => {
    const getApiKey = () => {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        return (import.meta as any).env.VITE_API_KEY;
      }
      return '';
    };

    const apiKey = getApiKey();
    if (!apiKey) {
        if (isMounted) setError("API Key Missing");
        return;
    }

    if (isMounted) setError(null);

    const handleConnectionError = (e: any, source: string) => {
        if (!isMounted) return;
        console.error(`Flux Live Error (${source}):`, e);
        
        const msg = (e.message || e.toString()).toLowerCase();
        
        const isRetryable = 
            msg.includes("unavailable") || 
            msg.includes("503") || 
            msg.includes("disconnect") || 
            msg.includes("network") || 
            msg.includes("fetch") || 
            msg.includes("aborted");

        if (isRetryable && retryCount < 3) {
             const delay = (retryCount + 1) * 2000;
             setRetryCount(c => c + 1);
             setError(null); 
             setIsConnected(false);
             disconnect(); 
             retryTimeoutRef.current = window.setTimeout(() => {
                 if (isMounted && isActiveRef.current && config.enabled) {
                     connect(isMounted);
                 }
             }, delay);
             return;
        }

        if (msg.includes("permission") || msg.includes("403")) {
            setError("Access Denied");
        } else if (isRetryable) {
            setError("Network Error");
        } else {
            setError("Connection Failed");
        }
        setIsConnected(false);
    };

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        let stream: MediaStream | null = null;
        let hasVideo = false;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                }, 
                video: { width: 320, height: 240 } 
            });
            hasVideo = true;
        } catch (mediaErr) {
            console.warn("Video access failed, trying audio only", mediaErr);
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1
                    } 
                });
                hasVideo = false;
            } catch (audioErr) {
                if (isMounted) setError("Mic access denied");
                return;
            }
        }
        
        if (!isMounted || !isActiveRef.current || !stream) {
            stream?.getTracks().forEach(t => t.stop());
            return;
        }

        streamRef.current = stream;
        setCameraEnabled(hasVideo);

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: `You are ${config.name}, a witty social AI. Keep responses extremely short (under 2 sentences) and conversational. Be fast.`,
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            },
            callbacks: {
                onopen: () => {
                    console.log("Flux AI Connected");
                    if (isMounted) {
                        setIsConnected(true);
                        setRetryCount(0);
                    }

                    if (audioContextRef.current?.state === 'suspended') {
                        audioContextRef.current.resume().catch(console.error);
                    }

                    if (!streamRef.current || !audioContextRef.current) return;

                    const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                    const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
                    
                    const muteGain = audioContextRef.current.createGain();
                    muteGain.gain.value = 0; 
                    gainRef.current = muteGain;

                    source.connect(processor);
                    processor.connect(muteGain);
                    muteGain.connect(audioContextRef.current.destination);
                    
                    sourceRef.current = source;
                    processorRef.current = processor;
                    
                    const sampleRate = audioContextRef.current.sampleRate;

                    processor.onaudioprocess = (e) => {
                        if (!micOn) return;
                        const inputData = e.inputBuffer.getChannelData(0);
                        const now = Date.now();
                        if (now - lastUiUpdateRef.current > 100) {
                             let sum = 0;
                             for(let i = 0; i < inputData.length; i+=16) sum += inputData[i] * inputData[i];
                             const rms = Math.sqrt(sum / (inputData.length / 16));
                             if (isMounted) setIsUserSpeaking(rms > 0.02);
                             lastUiUpdateRef.current = now;
                        }

                        const downsampled = downsampleBuffer(inputData, sampleRate, 16000);
                        const blob = createBlob(downsampled);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: blob });
                        }).catch(() => {});
                    };

                    if (hasVideo) {
                        sessionPromise.then(session => startVideoAnalysis(session));
                    }
                },
                onmessage: async (msg: LiveServerMessage) => {
                    if (!isMounted) return;
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        setIsSpeaking(true);
                        if (speakingTimeoutRef.current) window.clearTimeout(speakingTimeoutRef.current);
                        speakingTimeoutRef.current = window.setTimeout(() => {
                             if (isMounted) setIsSpeaking(false);
                        }, 1000); 
                        playAudio(audioData);
                    }
                },
                onclose: () => {
                    if (isMounted) setIsConnected(false);
                },
                onerror: (e: any) => {
                    handleConnectionError(e, 'Runtime');
                }
            }
        });

        sessionPromise.catch((e: any) => {
            handleConnectionError(e, 'Handshake');
        });

        const session = await sessionPromise;
        if (isMounted) sessionRef.current = session;

    } catch (e: any) {
        handleConnectionError(e, 'Init');
    }
  };

  const startVideoAnalysis = (session: any) => {
      if (!streamRef.current || !videoRef.current) return;
      
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length === 0) return;

      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.play().catch(e => console.warn("Video play failed", e));

      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);

      videoIntervalRef.current = window.setInterval(() => {
         if (!session) return;
         
         const canvas = canvasRef.current;
         if (video.readyState === video.HAVE_ENOUGH_DATA) {
             canvas.width = 320; 
             canvas.height = 240;
             const ctx = canvas.getContext('2d');
             if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                try {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: 'image/jpeg',
                            data: base64
                        }
                    });
                } catch (e) {}
             }
         }
      }, 1000); 
  };

  const playAudio = async (base64: string) => {
     if (!audioContextRef.current) return;
     const ctx = audioContextRef.current;
     
     if (ctx.state === 'suspended') {
         try { await ctx.resume(); } catch (e) {}
     }

     try {
        const raw = decodeAudio(base64);
        const float32 = new Float32Array(raw.length / 2);
        const view = new DataView(raw.buffer);
        
        for(let i=0; i < raw.length / 2; i++) {
            float32[i] = view.getInt16(i * 2, true) / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        const now = ctx.currentTime;
        const startTime = Math.max(now, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + audioBuffer.duration;

     } catch (e) {
         console.error("Audio playback error", e);
     }
  };

  const disconnect = () => {
    setIsConnected(false);
    
    if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
    }
    if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = null;
    }
    if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
    }
    try {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
    } catch (e) {}
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-24 right-4 z-50 flex flex-col items-end pointer-events-none">
        <div className={`pointer-events-auto relative group`}>
            <div className={`
                w-16 h-16 rounded-full ${getOrbColor()}
                shadow-[0_0_30px_rgba(0,0,0,0.5)] ${getGlowColor()}
                flex items-center justify-center
                transition-all duration-300
                ${isSpeaking ? 'scale-110 animate-pulse' : 'scale-100'}
                ${isUserSpeaking ? 'scale-110 border-white ring-4 ring-emerald-500/30' : ''}
                border-2 ${getBorderColor()}
            `}>
                {error ? (
                    <div className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center">
                        <AlertCircle size={24} className="text-white" />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Sparkles size={24} className={`text-white ${isSpeaking ? 'animate-spin' : ''}`} />
                    </div>
                )}
            </div>

            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${isConnected && !error ? 'bg-green-500' : 'bg-red-500'}`}>
                {error ? <X size={10} className="text-black"/> : (micOn ? <Mic size={10} className="text-black" /> : <MicOff size={10} className="text-black" />)}
            </div>
            
            {!error && isConnected && !cameraEnabled && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 border-2 border-black flex items-center justify-center">
                    <VideoOff size={10} className="text-black" />
                </div>
            )}

            <div className="absolute top-0 right-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                 {!error && isConnected && (
                     <button onClick={() => setMicOn(!micOn)} className="p-3 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/10">
                        {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                     </button>
                 )}
                 <button onClick={onClose} className="p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-red-600">
                    <X size={18} />
                 </button>
            </div>
        </div>

        {(isSpeaking || error || isUserSpeaking) && (
            <div className="mt-4 mr-2 max-w-[200px] bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl rounded-tr-sm animate-in slide-in-from-right-5 fade-in">
                {error ? (
                    <p className="text-xs text-red-400 font-bold">{error}</p>
                ) : isUserSpeaking ? (
                    <p className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                        <Ear size={12} className="animate-pulse" /> Listening...
                    </p>
                ) : (
                    <>
                        <div className="flex gap-2 items-center mb-1">
                            <Volume2 size={12} className={theme === 'cyan' ? 'text-cyan-400' : 'text-white'} />
                            <span className="text--[10px] font-bold uppercase tracking-wider text-white opacity-70">{config.name}</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full w-2/3 ${getOrbColor()} animate-pulse`} />
                        </div>
                    </>
                )}
            </div>
        )}
    </div>
  );
};

export default AiBuddy;
