
import React, { useState, useEffect } from 'react';
import { User, SocialPost, ThemeColor } from '../types';
import { Heart, MessageCircle, Share2, Plus, LogOut, Flame, Sparkles, Play, Video, Settings, Music2, BadgeCheck, Ghost } from 'lucide-react';

interface SocialViewProps {
  currentUser: User | null;
  posts: SocialPost[];
  users: User[];
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  theme?: ThemeColor;
  onOpenSettings: () => void;
}

const SocialView: React.FC<SocialViewProps> = ({ currentUser, posts, users, onUpdateUser, onLogout, theme = 'cyan', onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'fyp' | 'profile'>('fyp');
  
  // Feed is just the real posts sorted by date
  const [feedPosts, setFeedPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
      setFeedPosts([...posts].sort((a, b) => b.timestamp - a.timestamp));
  }, [posts]);

  const getThemeText = () => {
       const map: Record<string, string> = {
          cyan: 'text-cyan-400',
          violet: 'text-violet-400',
          emerald: 'text-emerald-400',
          rose: 'text-rose-400',
          amber: 'text-amber-400',
      };
      return map[theme];
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

  if (!currentUser) return null;

  const renderPost = (post: SocialPost) => {
      // Find author
      const fallbackUser: User = { id: 'unknown', name: 'Flux User', avatar: 'https://picsum.photos/50/50', status: 'offline', isVerified: false };
      const author = post.authorId === currentUser.id ? currentUser : (users.find(u => u.id === post.authorId) || fallbackUser);

      return (
          <div key={post.id} className="relative w-full h-[calc(100dvh-6rem)] snap-start shrink-0 bg-black overflow-hidden mb-1 rounded-3xl border border-white/5">
              {/* Media */}
              <div className="absolute inset-0">
                  {post.photo.type === 'video' ? (
                      <video src={post.photo.dataUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  ) : (
                      <img src={post.photo.dataUrl} className="w-full h-full object-cover" alt="Post" />
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
              </div>

              {/* Right Sidebar */}
              <div className="absolute bottom-20 right-4 flex flex-col gap-6 items-center z-20">
                  <div className="relative group">
                      <div className={`w-12 h-12 rounded-full p-[2px] ${getThemeBg()}`}>
                          <img src={author.avatar} className="w-full h-full rounded-full border border-black" alt={author.name} />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5 border-2 border-black">
                          <Plus size={10} className="text-white" strokeWidth={4} />
                      </div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                      <Heart size={32} className="text-white drop-shadow-lg" strokeWidth={1.5} />
                      <span className="text-white text-xs font-bold shadow-black drop-shadow-md">{post.likes > 1000 ? (post.likes/1000).toFixed(1) + 'k' : post.likes}</span>
                  </div>

                   <div className="flex flex-col items-center gap-1">
                      <MessageCircle size={32} className="text-white drop-shadow-lg" strokeWidth={1.5} />
                      <span className="text-white text-xs font-bold shadow-black drop-shadow-md">0</span>
                  </div>

                   <div className="flex flex-col items-center gap-1">
                      <Share2 size={32} className="text-white drop-shadow-lg" strokeWidth={1.5} />
                      <span className="text-white text-xs font-bold shadow-black drop-shadow-md">Share</span>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center animate-spin-slow mt-4">
                      <Music2 size={20} className="text-white" />
                  </div>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-6 left-4 right-16 z-20 text-left">
                  <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2 shadow-black drop-shadow-md">
                      {author.name} 
                      {author.isVerified && <BadgeCheck size={16} className={`fill-blue-500 text-black`} />}
                  </h3>
                  
                  {post.photo.aiMetadata?.caption && (
                       <p className="text-white/90 text-sm font-medium mb-3 line-clamp-2 leading-relaxed shadow-black drop-shadow-md">
                           {post.photo.aiMetadata.caption}
                       </p>
                  )}

                  {/* AI Rizz Badge */}
                  {post.photo.aiMetadata?.socialComment && (
                    <div className="flex items-start gap-2 bg-white/10 backdrop-blur-md rounded-xl p-2.5 max-w-[85%] border border-white/5">
                        <div className={`p-1.5 rounded-full ${getThemeBg()} text-black`}>
                             <Sparkles size={12} fill="black" />
                        </div>
                        <div>
                             <p className={`text-xs font-bold ${getThemeText()} uppercase tracking-wider mb-0.5`}>Flux AI {post.photo.aiMetadata.socialCommentType || 'Says'}</p>
                             <p className="text-white text-xs italic">"{post.photo.aiMetadata.socialComment}"</p>
                        </div>
                    </div>
                  )}
                  
                  {/* Music Track */}
                  <div className="flex items-center gap-2 mt-4 text-white/80">
                      <Music2 size={12} />
                      <span className="text-xs font-medium scrolling-text-container w-40 overflow-hidden whitespace-nowrap">
                          Original Audio - {author.name} • Flux Sounds
                      </span>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="w-full h-full bg-black flex flex-col pt-safe-top">
        {/* Top Navigation */}
        <div className="absolute top-10 left-0 right-0 z-30 flex justify-center items-center gap-6 text-base font-bold drop-shadow-lg">
            <button 
                onClick={() => setActiveTab('profile')}
                className={`transition-colors duration-300 ${activeTab === 'profile' ? 'text-white scale-110' : 'text-white/50'}`}
            >
                Profile
            </button>
            <div className="w-[1px] h-4 bg-white/20" />
            <button 
                onClick={() => setActiveTab('fyp')}
                className={`transition-colors duration-300 ${activeTab === 'fyp' ? 'text-white scale-110' : 'text-white/50'}`}
            >
                For You
            </button>
        </div>

        {activeTab === 'profile' && (
             <div className="absolute top-10 right-6 z-40">
                <button onClick={onOpenSettings} className="text-white/80 hover:text-white transition">
                    <Settings size={24} />
                </button>
             </div>
        )}

        {/* Content Area */}
        {activeTab === 'fyp' ? (
             <div className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar pb-20 pt-safe-top bg-black">
                 {feedPosts.length > 0 ? (
                    feedPosts.map(post => renderPost(post))
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
                        <Ghost size={48} className="opacity-50" />
                        <p className="text-xs uppercase tracking-widest font-bold">No posts yet</p>
                    </div>
                 )}
                 
                 {feedPosts.length > 0 && (
                     <div className="snap-start w-full h-32 flex items-center justify-center text-zinc-600 text-xs uppercase tracking-widest font-bold pb-20">
                         You're all caught up
                     </div>
                 )}
             </div>
        ) : (
            <div className="flex-1 overflow-y-auto pb-32 pt-20 px-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <div className={`w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-zinc-800 to-zinc-700`}>
                            <img src={currentUser.avatar} className="w-full h-full rounded-full border-4 border-black object-cover" alt="Profile" />
                        </div>
                        {currentUser.isGuest && (
                            <div className="absolute -bottom-2 inset-x-0 mx-auto w-max bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Ghost size={10} /> GUEST
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 bg-black rounded-full p-1 border border-zinc-800">
                             <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                 <Plus size={14} className="text-white" />
                             </div>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-1">
                        {currentUser.name}
                        {currentUser.isVerified && <BadgeCheck size={20} className="text-blue-500 fill-blue-500/10" />}
                    </h2>
                    <p className="text-zinc-500 font-medium text-sm mb-4">{currentUser.handle}</p>
                    
                    <div className="flex gap-8 mb-6">
                        <div className="text-center">
                            <span className="block text-white font-bold text-lg">{posts.filter(p => p.authorId === currentUser.id).length}</span>
                            <span className="text-zinc-500 text-xs uppercase font-bold">Posts</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-white font-bold text-lg">{currentUser.isGuest ? '0' : '0'}</span>
                            <span className="text-zinc-500 text-xs uppercase font-bold">Followers</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-white font-bold text-lg">{currentUser.isGuest ? '0' : '0'}</span>
                            <span className="text-zinc-500 text-xs uppercase font-bold">Following</span>
                        </div>
                    </div>

                    <p className="text-center text-zinc-300 text-sm max-w-xs mb-6 leading-relaxed">
                        {currentUser.bio || "No bio yet."}
                    </p>

                    <div className="flex gap-3 w-full max-w-xs">
                         {currentUser.isGuest ? (
                             <button onClick={onLogout} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold text-sm">Create Account</button>
                         ) : (
                             <button className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold text-sm">Edit Profile</button>
                         )}
                         <button className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold text-sm">Share Profile</button>
                    </div>
                </div>

                {/* Profile Grid */}
                <div className="border-t border-white/10 pt-6">
                     <div className="flex items-center gap-4 mb-6">
                         <span className={`text-white font-bold border-b-2 ${currentUser.isVerified ? 'border-blue-500' : `border-${theme}-500`} pb-1`}>Posts</span>
                         <span className="text-zinc-500 font-bold pb-1">Liked</span>
                         <span className="text-zinc-500 font-bold pb-1">Private</span>
                     </div>

                     <div className="grid grid-cols-3 gap-1">
                         {posts.filter(p => p.authorId === currentUser.id).length > 0 ? (
                             posts.filter(p => p.authorId === currentUser.id).map(post => (
                                 <div key={post.id} className="aspect-[3/4] bg-zinc-900 relative">
                                     {post.photo.type === 'video' ? (
                                        <div className="w-full h-full relative">
                                            <video src={post.photo.dataUrl} className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute top-2 right-2">
                                                <Play size={12} className="text-white fill-white" />
                                            </div>
                                        </div>
                                     ) : (
                                        <img src={post.photo.dataUrl} className="w-full h-full object-cover opacity-80" alt="post" />
                                     )}
                                     <div className="absolute bottom-1 left-2 flex items-center gap-1">
                                         <Play size={10} className="text-white fill-white" />
                                         <span className="text-[10px] text-white font-bold">{post.likes}</span>
                                     </div>
                                 </div>
                             ))
                         ) : (
                             <div className="col-span-3 py-10 text-center text-zinc-600 text-xs uppercase font-bold">
                                 No posts yet
                             </div>
                         )}
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SocialView;
