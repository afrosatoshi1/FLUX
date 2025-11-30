
import React from 'react';
import { Album, Photo, User, ThemeColor } from '../types';
import { ArrowLeft, Plus, Play, Video } from 'lucide-react';

interface AlbumDetailViewProps {
  album: Album;
  photos: Photo[];
  users: User[];
  onBack: () => void;
  onPhotoClick: (photo: Photo) => void;
  theme?: ThemeColor;
}

const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({ album, photos, users, onBack, onPhotoClick, theme = 'cyan' }) => {
  const albumPhotos = photos.filter(p => album.photoIds.includes(p.id));
  const collaborators = users.filter(u => album.sharedWith.includes(u.id));

  // Use thumbnail if video
  const coverUrl = albumPhotos[0]?.thumbnailUrl || albumPhotos[0]?.dataUrl;

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
    <div className="w-full h-full bg-black overflow-y-auto no-scrollbar">
        {/* Hero Header */}
        <div className="relative h-96 w-full">
            <div className="absolute inset-0">
                <img 
                    src={coverUrl} 
                    className="w-full h-full object-cover opacity-50 blur-lg scale-110" 
                    alt="bg" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black"></div>
            </div>

            <div className="absolute top-0 left-0 p-6 pt-12 z-20">
                <button onClick={onBack} className="p-3 bg-black/20 backdrop-blur-xl rounded-full text-white hover:bg-black/40 transition">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                <h1 className="text-5xl font-black text-white mb-3 leading-none tracking-tight shadow-xl">{album.title}</h1>
                <p className="text-white/80 text-sm font-medium mb-6 max-w-[90%] leading-relaxed">{album.description}</p>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                         <div className="flex -space-x-3">
                             {/* Owner */}
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                                You
                            </div>
                            {collaborators.map(user => (
                                <img key={user.id} src={user.avatar} className="w-10 h-10 rounded-full border-2 border-black" alt={user.name} />
                            ))}
                            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border-2 border-black border-dashed flex items-center justify-center text-white">
                                <Plus size={16} />
                            </button>
                         </div>
                    </div>
                    
                    <button className={`${getThemeBg()} text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-white/5 active:scale-95 transition`}>
                        <Play size={16} fill="currentColor" /> Play Reel
                    </button>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="px-2 py-4 pb-32">
             <div className="columns-2 gap-2 space-y-2">
                {albumPhotos.map((photo) => (
                    <div 
                        key={photo.id} 
                        onClick={() => onPhotoClick(photo)}
                        className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer relative group"
                    >
                        <img src={photo.thumbnailUrl || photo.dataUrl} className="w-full h-auto" alt="" />
                        {photo.type === 'video' && (
                             <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                                 <Video size={12} className="text-white" />
                             </div>
                        )}
                    </div>
                ))}
             </div>
             
             {/* Empty State */}
             {albumPhotos.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                     <p className="font-bold">This memory is empty.</p>
                 </div>
             )}
        </div>
    </div>
  );
};

export default AlbumDetailView;
