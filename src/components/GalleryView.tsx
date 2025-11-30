
import React, { useMemo } from 'react';
import { Photo, Album, ThemeColor } from '../types';
import { Sparkles, MapPin, Plus, Video } from 'lucide-react';

interface GalleryViewProps {
  photos: Photo[];
  albums: Album[];
  onPhotoClick: (photo: Photo) => void;
  onCreateAlbum: () => void;
  onAlbumClick: (album: Album) => void;
  theme?: ThemeColor;
}

const GalleryView: React.FC<GalleryViewProps> = ({ photos, albums, onPhotoClick, onCreateAlbum, onAlbumClick, theme = 'cyan' }) => {
  
  const groupedPhotos = useMemo(() => {
    const groups: Record<string, Photo[]> = { 'Recent': [] };
    const sorted = [...photos].sort((a, b) => b.timestamp - a.timestamp);
    sorted.forEach(p => {
      groups['Recent'].push(p);
      const albumName = p.aiMetadata?.suggestedAlbum;
      if (albumName) {
        if (!groups[albumName]) groups[albumName] = [];
        groups[albumName].push(p);
      }
    });
    return groups;
  }, [photos]);

  const sections = Object.keys(groupedPhotos).filter(k => k !== 'Recent' && groupedPhotos[k].length > 0);

  const getAlbumCover = (album: Album) => {
    const photo = photos.find(p => p.id === album.coverId) || photos.find(p => album.photoIds.includes(p.id));
    return photo?.thumbnailUrl || photo?.dataUrl || '';
  };

  const getGradient = () => {
       const map: Record<string, string> = {
          cyan: 'from-cyan-400 to-blue-600',
          violet: 'from-violet-400 to-fuchsia-600',
          emerald: 'from-emerald-400 to-teal-600',
          rose: 'from-rose-400 to-red-600',
          amber: 'from-amber-400 to-orange-600',
      };
      return map[theme];
  };

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

  return (
    <div className="w-full h-full bg-black pt-12 pb-32 overflow-y-auto no-scrollbar">
      <div className="px-6 mb-8 mt-4">
        <h1 className="text-4xl font-black text-white mb-1 tracking-tight">Flux</h1>
        <p className="text-zinc-500 text-sm font-medium">Your Digital Life</p>
      </div>

      {/* Stories / Albums Strip */}
      <div className="flex overflow-x-auto gap-5 px-6 mb-10 no-scrollbar pb-4 min-h-[120px]">
        {/* Create Button */}
        <div className="flex flex-col items-center gap-3 group" onClick={onCreateAlbum}>
           <div className="w-[4.5rem] h-[4.5rem] rounded-full border border-dashed border-zinc-600 flex items-center justify-center bg-zinc-900/50 text-zinc-500 shrink-0 cursor-pointer group-active:scale-95 transition-all">
             <Plus size={28} />
           </div>
           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">New</span>
        </div>
        
        {/* User Created Albums */}
        {albums.map(album => (
            <div key={album.id} onClick={() => onAlbumClick(album)} className="flex flex-col items-center gap-3 cursor-pointer group">
              <div className={`w-[4.5rem] h-[4.5rem] rounded-full p-[3px] bg-gradient-to-tr ${getGradient()} shrink-0 shadow-lg`}>
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-black relative">
                  <img src={getAlbumCover(album)} className="w-full h-full object-cover group-active:scale-95 transition-transform duration-300" alt={album.title} />
                </div>
              </div>
              <span className="text-[10px] font-bold text-white max-w-[80px] truncate text-center uppercase tracking-wide">{album.title}</span>
            </div>
        ))}

        {/* Separator if we have both */}
        {albums.length > 0 && sections.length > 0 && (
             <div className="w-[1px] h-12 bg-zinc-800 shrink-0 my-auto mx-1" />
        )}

        {/* AI Smart Albums */}
        {sections.map(section => {
           const p = groupedPhotos[section][0];
           const cover = p?.thumbnailUrl || p?.dataUrl;
           return (
            <div key={section} className="flex flex-col items-center gap-3 cursor-pointer group">
              <div className="w-[4.5rem] h-[4.5rem] rounded-full p-[3px] bg-zinc-800 shrink-0 group-active:scale-95 transition-transform">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-black">
                  <img src={cover} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" alt={section} />
                </div>
              </div>
              <span className="text-[10px] font-bold text-zinc-400 max-w-[80px] truncate text-center uppercase tracking-wide">{section}</span>
            </div>
           );
        })}
      </div>

      {/* Masonry Grid */}
      <div className="px-4">
        <h2 className={`text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest sticky top-0 bg-black/80 backdrop-blur-xl py-4 z-10 border-b border-white/5`}>
          <Sparkles className={getThemeText()} size={16} /> Recent Snaps
        </h2>
        
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {groupedPhotos['Recent'].map((photo) => (
            <div 
              key={photo.id} 
              onClick={() => onPhotoClick(photo)}
              className="relative rounded-3xl overflow-hidden bg-zinc-900 break-inside-avoid shadow-lg cursor-pointer group active:scale-[0.98] transition-transform duration-300"
            >
              <img src={photo.thumbnailUrl || photo.dataUrl} alt="memory" className="w-full h-auto object-cover" />
              
              {/* Video Indicator */}
              {photo.type === 'video' && (
                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md rounded-full p-2 border border-white/10">
                      <Video size={14} className="text-white" />
                  </div>
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                 <p className="text-white text-sm font-bold line-clamp-1">{photo.aiMetadata?.caption || "New Memory"}</p>
                 <div className="flex items-center gap-1 mt-1">
                   {photo.aiMetadata?.locationGuess && (
                     <span className="text-[10px] text-zinc-300 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-md">
                       <MapPin size={8} /> {photo.aiMetadata.locationGuess}
                     </span>
                   )}
                 </div>
              </div>
            </div>
          ))}
        </div>
        
        {photos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                <p className="font-medium">No moments captured yet.</p>
                <p className="text-xs mt-2 uppercase tracking-widest opacity-50">Start your Flux</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default GalleryView;
