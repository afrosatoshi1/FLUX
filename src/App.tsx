
import React, { useState, useEffect } from 'react';
import { Photo, ViewState, User, Album, SocialPost, ThemeColor, ChatSession, AiAvatarConfig, UserSettings, Message } from './types';
import CameraView from './components/CameraView';
import GalleryView from './components/GalleryView';
import SocialView from './components/SocialView';
import CreateAlbumView from './components/CreateAlbumView';
import AlbumDetailView from './components/AlbumDetailView';
import ReviewView from './components/ReviewView';
import BottomNav from './components/BottomNav';
import SettingsView from './components/SettingsView';
import LiveView from './components/LiveView';
import ChatView from './components/ChatView';
import AiBuddy from './components/AiBuddy';
import AuthView from './components/AuthView';
import { analyzePhoto } from './services/geminiService';
import { authService } from './services/authService';
import { db } from './services/db';
import { X, Share, WifiOff, Globe } from 'lucide-react';

const AI_CHAT_ID = 'flux-ai-buddy';
const DEFAULT_AI_SESSION: ChatSession = {
    id: AI_CHAT_ID,
    participantId: 'Flux AI',
    messages: [{ id: 'welcome', senderId: 'ai', text: "Hey! I'm Flux. Need advice, a caption, or just wanna chat?", timestamp: Date.now() }],
    config: { relationship: 'Assistant', tone: 'Helpful', motive: 'Support' },
    lastRead: Date.now()
};

const DEFAULT_SETTINGS: UserSettings = {
    allowAiAnalysis: true,
    publicProfile: true,
    notifications: true,
    highQualityVideo: false,
    saveToCameraRoll: true
};

const DEFAULT_AVATAR_CONFIG: AiAvatarConfig = {
    name: 'Flux',
    personality: 'sassy',
    enabled: true
};

const App: React.FC = () => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.AUTH); 
  const [theme, setTheme] = useState<ThemeColor>('cyan');
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [chats, setChats] = useState<ChatSession[]>([]); // Initialized empty
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [aiAvatarConfig, setAiAvatarConfig] = useState<AiAvatarConfig>(DEFAULT_AVATAR_CONFIG);

  // Transient State
  const [tempPhoto, setTempPhoto] = useState<{data: string, type: 'image' | 'video', thumb?: string} | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  // --- INIT ---
  useEffect(() => {
      // 1. Auth Listener
      const unsubscribeAuth = authService.onAuthStateChanged((user) => {
          if (user) {
              // Ensure we don't have stale photos from previous session
              setPhotos([]);
              setCurrentUser(user);
              if (view === ViewState.AUTH) setView(ViewState.CAMERA);
          } else {
              setCurrentUser(null);
              setPhotos([]);
              setView(ViewState.AUTH);
          }
      });

      // 2. Load Local Settings
      const savedSettings = localStorage.getItem('flux_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedTheme = localStorage.getItem('flux_theme') as ThemeColor;
      if (savedTheme) setTheme(savedTheme);

      // 3. Ensure AI Chat Exists
      setChats(prev => {
          if (!prev.find(c => c.id === AI_CHAT_ID)) {
              return [DEFAULT_AI_SESSION, ...prev];
          }
          return prev;
      });

      // 4. Offline Listener
      const handleOnline = () => { setIsOffline(false); setShowOfflineToast(true); setTimeout(() => setShowOfflineToast(false), 3000); };
      const handleOffline = () => { setIsOffline(true); setShowOfflineToast(true); setTimeout(() => setShowOfflineToast(false), 3000); };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
          unsubscribeAuth();
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // --- REAL-TIME DATABASE LISTENERS ---
  useEffect(() => {
      if (!currentUser || currentUser.isGuest) return;

      // Listen to Photos
      const unsubPhotos = db.listenToPhotos(currentUser.id, (newPhotos) => {
          // Firestore onSnapshot returns the FULL list, so we just set it.
          setPhotos(newPhotos);
      });

      // Listen to Albums
      const unsubAlbums = db.listenToAlbums(currentUser.id, (newAlbums) => {
          setAlbums(newAlbums);
      });
      
      // Listen to Feed
      const unsubFeed = db.listenToFeed((newPosts) => {
          setPosts(newPosts);
      });

      return () => {
          unsubPhotos();
          unsubAlbums();
          unsubFeed();
      };
  }, [currentUser]);

  // Persist Local Settings
  useEffect(() => { localStorage.setItem('flux_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('flux_theme', theme); }, [theme]);

  // --- ACTIONS ---

  const handleAuthSuccess = (user: User) => {
      setCurrentUser(user);
      setView(ViewState.CAMERA);
  };

  const handleLogout = async () => {
      await authService.logout();
      setCurrentUser(null);
      setPhotos([]);
      setView(ViewState.AUTH);
  };

  const handleCapture = (data: string, type: 'image' | 'video', thumb?: string) => {
    setTempPhoto({ data, type, thumb });
    setView(ViewState.REVIEW);
  };

  const handleRetake = () => {
    setTempPhoto(null);
    setView(ViewState.CAMERA);
  };

  const handleSavePhoto = async () => {
    if (!tempPhoto || !currentUser) return;

    const newPhoto: Photo = {
      id: Date.now().toString(),
      dataUrl: tempPhoto.data,
      type: tempPhoto.type,
      thumbnailUrl: tempPhoto.thumb,
      timestamp: Date.now(),
      aiMetadata: { caption: 'Processing...', tags: [], vibe: '...', socialComment: '', ratings: { authenticity: 0, beauty: 0, virality: 0 } }
    };

    // Save to DB
    if (!currentUser.isGuest) {
        // DB save will trigger the listener, which updates state.
        db.savePhoto(newPhoto, currentUser.id);
    } else {
        // Guest: just local state - prevent duplicates by checking ID
        setPhotos(prev => {
            if (prev.find(p => p.id === newPhoto.id)) return prev;
            return [newPhoto, ...prev];
        });
    }

    setTempPhoto(null);
    setView(ViewState.GALLERY);

    // Trigger AI Analysis in background (only if online & allowed)
    if (settings.allowAiAnalysis && !isOffline && tempPhoto.type === 'image') {
        try {
            const analysis = await analyzePhoto(tempPhoto.data);
            const updatedPhoto = { ...newPhoto, aiMetadata: analysis };
            if (!currentUser.isGuest) {
                 db.savePhoto(updatedPhoto, currentUser.id); // Update DB with AI results
            } else {
                 setPhotos(prev => prev.map(p => p.id === newPhoto.id ? updatedPhoto : p));
            }
        } catch (e) {
            console.error("AI Analysis Failed", e);
        }
    }
  };

  const handleCreateAlbum = async (title: string, description: string, photoIds: string[], sharedWith: string[]) => {
      const newAlbum: Album = {
          id: Date.now().toString(),
          title,
          description,
          photoIds,
          coverId: photoIds[0],
          sharedWith,
          createdAt: Date.now(),
          ownerId: currentUser?.id || 'me'
      };
      
      if (currentUser && !currentUser.isGuest) {
          await db.createAlbum(newAlbum);
      } else {
          setAlbums(prev => [newAlbum, ...prev]);
      }
      setView(ViewState.GALLERY);
  };

  const handleUpdateChatSession = (updatedSession: ChatSession) => {
      setChats(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const handlePostToSocial = async (photo: Photo) => {
      if (!currentUser) return;
      
      const newPost: SocialPost = {
          id: Date.now().toString(),
          authorId: currentUser.id,
          photo: photo,
          likes: 0,
          timestamp: Date.now()
      };

      if (!currentUser.isGuest) {
          await db.savePost(newPost);
      } else {
          setPosts(prev => [newPost, ...prev]);
      }
      alert("Posted to Flux Social!");
  };
  
  const toggleAiBuddy = () => {
      setAiAvatarConfig(prev => ({...prev, enabled: !prev.enabled}));
  };

  // --- UI HELPERS ---

  if (view === ViewState.AUTH) {
      return <AuthView onSuccess={handleAuthSuccess} theme={theme} />;
  }

  // Common Props for Views
  const commonProps = { theme, currentUser };

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden relative font-sans">
      
      {/* Offline Toast */}
      {showOfflineToast && (
          <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-5 fade-in duration-300 ${isOffline ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
               {isOffline ? <WifiOff size={18} /> : <Globe size={18} />}
               <span className="text-sm font-bold">{isOffline ? 'You are offline' : 'Back online'}</span>
          </div>
      )}

      {/* --- VIEWS --- */}

      {/* 1. CAMERA */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${view === ViewState.CAMERA ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
        <CameraView 
            onCapture={handleCapture} 
            isActive={view === ViewState.CAMERA} 
            aiEnabled={aiAvatarConfig.enabled}
            onToggleAi={toggleAiBuddy}
            {...commonProps} 
        />
        {/* AI Buddy Overlay (Only visible in Camera/Live) */}
        <AiBuddy 
            config={aiAvatarConfig} 
            isActive={view === ViewState.CAMERA && !isOffline} // Disable AI when offline
            currentView={view}
            onClose={() => setAiAvatarConfig(prev => ({...prev, enabled: false}))}
            {...commonProps}
        />
      </div>

      {/* 2. LIVE */}
      {view === ViewState.LIVE && (
          <div className="absolute inset-0 z-20">
              <LiveView 
                  onClose={() => setView(ViewState.CAMERA)} 
                  aiEnabled={aiAvatarConfig.enabled}
                  onToggleAi={toggleAiBuddy}
                  {...commonProps} 
              />
              <AiBuddy config={aiAvatarConfig} isActive={true} currentView={ViewState.LIVE} onClose={() => {}} {...commonProps} />
          </div>
      )}

      {/* 3. GALLERY */}
      {view === ViewState.GALLERY && (
        <div className="absolute inset-0 z-20 bg-black animate-in slide-in-from-bottom-10 fade-in duration-300">
           <GalleryView 
             photos={photos} 
             albums={albums} 
             onPhotoClick={(p) => { setTempPhoto({data: p.dataUrl, type: p.type || 'image', thumb: p.thumbnailUrl}); setView(ViewState.PHOTO_DETAIL); }}
             onCreateAlbum={() => setView(ViewState.CREATE_ALBUM)}
             onAlbumClick={(a) => { setSelectedAlbum(a); setView(ViewState.ALBUM_DETAIL); }}
             {...commonProps}
           />
        </div>
      )}

      {/* 4. SOCIAL */}
      {view === ViewState.SOCIAL && (
          <div className="absolute inset-0 z-20 bg-black animate-in slide-in-from-right-10 fade-in duration-300">
              <SocialView 
                posts={posts} 
                users={users} 
                onUpdateUser={(u) => { setCurrentUser(u); db.saveUser(u); }}
                onLogout={handleLogout}
                onOpenSettings={() => setView(ViewState.SETTINGS)}
                {...commonProps}
              />
          </div>
      )}

      {/* 5. CHAT LIST */}
      {view === ViewState.CHAT_LIST && (
          <div className="absolute inset-0 z-20 bg-black animate-in slide-in-from-left-10 fade-in duration-300">
              <ChatView 
                sessions={chats} 
                onBack={() => setView(ViewState.CAMERA)} 
                onUpdateSession={handleUpdateChatSession}
                {...commonProps}
              />
          </div>
      )}

      {/* --- SUB VIEWS (Overlays) --- */}

      {/* REVIEW */}
      {view === ViewState.REVIEW && tempPhoto && (
        <ReviewView 
            mediaData={tempPhoto.data} 
            type={tempPhoto.type}
            onRetake={handleRetake} 
            onSave={handleSavePhoto} 
            {...commonProps}
        />
      )}

      {/* CREATE ALBUM */}
      {view === ViewState.CREATE_ALBUM && (
          <div className="absolute inset-0 z-30 bg-black">
              <CreateAlbumView 
                photos={photos} 
                users={users} 
                onBack={() => setView(ViewState.GALLERY)} 
                onCreate={handleCreateAlbum}
                {...commonProps}
              />
          </div>
      )}

      {/* ALBUM DETAIL */}
      {view === ViewState.ALBUM_DETAIL && selectedAlbum && (
          <div className="absolute inset-0 z-30 bg-black">
              <AlbumDetailView 
                album={selectedAlbum} 
                photos={photos} 
                users={users}
                onBack={() => setView(ViewState.GALLERY)}
                onPhotoClick={(p) => {}}
                {...commonProps}
              />
          </div>
      )}

      {/* PHOTO DETAIL (Simple Viewer) */}
      {view === ViewState.PHOTO_DETAIL && tempPhoto && (
          <div className="absolute inset-0 z-40 bg-black flex flex-col">
               <div className="absolute top-0 w-full p-4 flex justify-between z-10">
                   <button onClick={() => setView(ViewState.GALLERY)} className="p-2 bg-black/50 rounded-full text-white"><X /></button>
                   <button onClick={() => handlePostToSocial(photos.find(p => p.dataUrl === tempPhoto.data) as Photo)} className="p-2 bg-blue-500 rounded-full text-white"><Share /></button>
               </div>
               <div className="flex-1 flex items-center justify-center">
                   {tempPhoto.type === 'video' ? (
                       <video src={tempPhoto.data} controls className="max-w-full max-h-full" />
                   ) : (
                       <img src={tempPhoto.data} className="max-w-full max-h-full object-contain" alt="" />
                   )}
               </div>
               {/* AI Metadata Overlay */}
               {(() => {
                   const p = photos.find(ph => ph.dataUrl === tempPhoto.data);
                   if (p?.aiMetadata) {
                       return (
                           <div className="absolute bottom-20 left-4 right-4 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                               <p className="text-white font-bold text-sm mb-1">{p.aiMetadata.caption}</p>
                               <div className="flex flex-wrap gap-2 mb-2">
                                   {p.aiMetadata.tags.map(t => <span key={t} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-300">#{t}</span>)}
                               </div>
                               <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                                    <div className="text-center">
                                        <div className="text-xs text-zinc-500 uppercase font-bold">Authenticity</div>
                                        <div className="text-white font-black">{p.aiMetadata.ratings?.authenticity}/10</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-zinc-500 uppercase font-bold">Beauty</div>
                                        <div className="text-white font-black">{p.aiMetadata.ratings?.beauty}/10</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-zinc-500 uppercase font-bold">Virality</div>
                                        <div className="text-white font-black">{p.aiMetadata.ratings?.virality}/10</div>
                                    </div>
                               </div>
                           </div>
                       );
                   }
                   return null;
               })()}
          </div>
      )}

      {/* SETTINGS */}
      {view === ViewState.SETTINGS && (
          <div className="absolute inset-0 z-40 bg-black animate-in slide-in-from-right-10">
              <SettingsView 
                currentTheme={theme} 
                onSelectTheme={setTheme} 
                onBack={() => setView(ViewState.SOCIAL)}
                currentUser={currentUser}
                onUpdateUser={(u) => { setCurrentUser(u); db.saveUser(u); }}
                settings={settings}
                onUpdateSettings={setSettings}
              />
          </div>
      )}

      {/* NAVIGATION */}
      <BottomNav currentView={view} setView={setView} theme={theme} />

    </div>
  );
};

export default App;
