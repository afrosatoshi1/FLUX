
import React, { useState } from 'react';
import { Photo, User, AiMetadata, ThemeColor } from '../types';
import { generateAlbumInfo } from '../services/geminiService';
import { ArrowLeft, Wand2, Check, Loader2 } from 'lucide-react';

interface CreateAlbumViewProps {
  photos: Photo[];
  users: User[];
  onBack: () => void;
  onCreate: (title: string, description: string, selectedPhotoIds: string[], sharedWith: string[]) => void;
  theme?: ThemeColor;
}

const CreateAlbumView: React.FC<CreateAlbumViewProps> = ({ photos, users, onBack, onCreate, theme = 'cyan' }) => {
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'select-photos' | 'details'>('select-photos');
  const [isGenerating, setIsGenerating] = useState(false);

  const togglePhoto = (id: string) => {
    const newSet = new Set(selectedPhotoIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPhotoIds(newSet);
  };

  const toggleUser = (id: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUserIds(newSet);
  };

  const handleAiMagic = async () => {
    setIsGenerating(true);
    const selectedPhotos = photos.filter(p => selectedPhotoIds.has(p.id));
    const metadataList: AiMetadata[] = selectedPhotos
        .map(p => p.aiMetadata)
        .filter((m): m is AiMetadata => !!m);

    try {
        const info = await generateAlbumInfo(metadataList);
        setTitle(info.title);
        setDescription(info.description);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleCreate = () => {
    if (!title) return;
    onCreate(title, description, Array.from(selectedPhotoIds), Array.from(selectedUserIds));
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
    <div className="w-full h-full bg-black flex flex-col pt-safe-top">
      {/* Header */}
      <div className="px-6 py-6 pt-10 flex items-center justify-between bg-black z-10 sticky top-0">
        <button onClick={onBack} className="p-3 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition">
            <ArrowLeft size={24} />
        </button>
        <h2 className="text-white font-black text-lg tracking-wide uppercase">
            {step === 'select-photos' ? 'Select Snaps' : 'New Flux'}
        </h2>
        <div className="w-10" /> 
      </div>

      {step === 'select-photos' ? (
        <div className="flex-1 overflow-y-auto px-1">
            <div className="grid grid-cols-3 gap-0.5">
                {photos.map(photo => {
                    const isSelected = selectedPhotoIds.has(photo.id);
                    return (
                        <div key={photo.id} onClick={() => togglePhoto(photo.id)} className="relative aspect-square cursor-pointer">
                            <img src={photo.thumbnailUrl || photo.dataUrl} className={`w-full h-full object-cover transition duration-300 ${isSelected ? 'opacity-40 grayscale' : ''}`} alt="" />
                            {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`${getThemeBg()} rounded-full p-2 shadow-lg`}>
                                        <Check size={20} className="text-black" strokeWidth={4} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-8">
            {/* Cover Preview */}
            <div className="flex justify-center">
                <div className={`w-48 h-48 rounded-3xl overflow-hidden relative shadow-2xl shadow-${theme}-500/10 border border-white/10`}>
                     {Array.from(selectedPhotoIds).slice(0, 1).map(id => {
                         const photo = photos.find(p => p.id === id);
                         return photo ? <img key={id} src={photo.thumbnailUrl || photo.dataUrl} className="w-full h-full object-cover" alt="Cover" /> : null;
                     })}
                </div>
            </div>

            {/* Inputs */}
            <div className="space-y-6">
                <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest ml-1">Title</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summer Vibes..."
                            className="w-full bg-zinc-900 border border-transparent focus:border-white/20 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors"
                        />
                    </div>
                    <button 
                        onClick={handleAiMagic}
                        disabled={isGenerating}
                        className={`bg-white/10 p-4 rounded-2xl text-white mb-[1px] shadow-lg disabled:opacity-50 border border-white/5 hover:bg-white/20 transition`}
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Wand2 size={24} />}
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What made this special?"
                        className="w-full bg-zinc-900 border border-transparent focus:border-white/20 rounded-2xl px-5 py-4 text-white font-medium h-28 outline-none resize-none transition-colors"
                    />
                </div>
            </div>

            {/* Friend Selector */}
            <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest ml-1">Share with Friends</label>
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                    {users.map(user => {
                        const isSelected = selectedUserIds.has(user.id);
                        return (
                            <div key={user.id} onClick={() => toggleUser(user.id)} className="flex flex-col items-center gap-2 cursor-pointer min-w-[60px] group">
                                <div className={`w-14 h-14 rounded-full p-[3px] transition-all ${isSelected ? getThemeBg() : 'bg-zinc-800'}`}>
                                    <img src={user.avatar} className="w-full h-full rounded-full border-2 border-black" alt={user.name} />
                                </div>
                                <span className={`text-[10px] font-bold ${isSelected ? getThemeText() : 'text-zinc-600'} group-hover:text-white transition`}>{user.name.split(' ')[0]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* Footer Action */}
      <div className="p-6 pb-8 bg-black">
          {step === 'select-photos' ? (
              <button 
                onClick={() => setStep('details')}
                disabled={selectedPhotoIds.size === 0}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-wider rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-white/10"
              >
                  Next ({selectedPhotoIds.size})
              </button>
          ) : (
              <button 
                onClick={handleCreate}
                disabled={!title}
                className={`w-full py-4 ${getThemeBg()} text-black font-black uppercase tracking-wider rounded-2xl disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition shadow-lg`}
              >
                  Create Flux
              </button>
          )}
      </div>
    </div>
  );
};

export default CreateAlbumView;
