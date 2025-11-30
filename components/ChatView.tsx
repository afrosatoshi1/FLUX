import React, { useState } from 'react';
import { ChatSession, Message, ThemeColor, ChatConfig, User } from '../types';
import { ArrowLeft, Send, Wand2, Settings, MoreVertical, Loader2, Sparkles, Bot } from 'lucide-react';
import { generateChatReply, chatWithAi } from '../services/geminiService';

interface ChatViewProps {
  sessions: ChatSession[];
  currentUser: User | null;
  onBack: () => void;
  onUpdateSession: (session: ChatSession) => void;
  theme?: ThemeColor;
}

const AI_CHAT_ID = 'flux-ai-buddy';

const ChatView: React.FC<ChatViewProps> = ({ sessions, currentUser, onBack, onUpdateSession, theme = 'cyan' }) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Ensure Flux AI session exists in the view
  const aiSession: ChatSession = sessions.find(s => s.id === AI_CHAT_ID) || {
      id: AI_CHAT_ID,
      participantId: 'Flux AI',
      messages: [{ id: 'welcome', senderId: 'ai', text: "Hey! I'm Flux. Need advice, a caption, or just wanna chat?", timestamp: Date.now() }],
      config: { relationship: 'Assistant', tone: 'Helpful', motive: 'Support' },
      lastRead: Date.now()
  };

  const allSessions = [aiSession, ...sessions.filter(s => s.id !== AI_CHAT_ID)];
  const activeSession = allSessions.find(s => s.id === activeSessionId);

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

  // --- LIST VIEW ---
  if (!activeSession) {
    return (
        <div className="w-full h-full bg-black pt-safe-top overflow-y-auto">
            <div className="px-6 py-6 pt-10 flex items-center gap-4 sticky top-0 bg-black z-10">
                <button onClick={onBack} className="p-3 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-black text-white tracking-tight">Messages</h2>
            </div>
            
            <div className="px-4 space-y-2">
                {/* AI Chat Pinned */}
                <div 
                    onClick={() => setActiveSessionId(AI_CHAT_ID)}
                    className={`p-4 rounded-3xl bg-zinc-900 border border-white/5 active:scale-[0.98] transition cursor-pointer flex gap-4 items-center group relative overflow-hidden`}
                >
                     <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none`} />
                    <div className={`w-14 h-14 rounded-full ${getThemeBg()} flex items-center justify-center text-black shadow-lg shadow-${theme}-500/20`}>
                        <Sparkles size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold flex items-center gap-2">Flux AI <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase">Buddy</span></h3>
                        <p className="text-zinc-400 text-sm line-clamp-1">{aiSession.messages[aiSession.messages.length - 1]?.text}</p>
                    </div>
                </div>

                <div className="h-[1px] bg-white/5 my-4 mx-4" />

                {sessions.filter(s => s.id !== AI_CHAT_ID).map(session => (
                    <div 
                        key={session.id} 
                        onClick={() => setActiveSessionId(session.id)}
                        className="p-4 rounded-3xl bg-zinc-900/30 hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer flex gap-4 items-center"
                    >
                        <div className={`w-14 h-14 rounded-full bg-zinc-800 border-2 ${getThemeBg()} border-opacity-50 flex items-center justify-center text-xl font-bold text-white`}>
                            {session.participantId[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold">{session.participantId}</h3>
                            <p className="text-zinc-500 text-sm line-clamp-1">{session.messages[session.messages.length - 1]?.text || 'No messages'}</p>
                        </div>
                        <div className="text-xs text-zinc-600 font-bold uppercase tracking-wide">Now</div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  return <ChatDetailView session={activeSession} onBack={() => setActiveSessionId(null)} onUpdateSession={onUpdateSession} theme={theme} isAi={activeSession.id === AI_CHAT_ID} />;
};

const ChatDetailView: React.FC<{ session: ChatSession; onBack: () => void; onUpdateSession: (s: ChatSession) => void; theme: string; isAi: boolean }> = ({ session, onBack, onUpdateSession, theme, isAi }) => {
    const [inputText, setInputText] = useState('');
    const [showConfig, setShowConfig] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [isAiTyping, setIsAiTyping] = useState(false);
    
    // Config State
    const [config, setConfig] = useState<ChatConfig>(session.config || { relationship: 'Friend', tone: 'Casual', motive: 'Chat' });

    const handleSend = async (text: string = inputText) => {
        if (!text.trim()) return;
        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: 'me',
            text: text,
            timestamp: Date.now()
        };
        const updatedSession = { ...session, messages: [...session.messages, newMessage] };
        onUpdateSession(updatedSession);
        setInputText('');
        setAiSuggestions([]);

        if (isAi) {
            setIsAiTyping(true);
            const responseText = await chatWithAi(updatedSession.messages);
            setIsAiTyping(false);
            
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                senderId: 'ai',
                text: responseText,
                timestamp: Date.now()
            };
             onUpdateSession({ ...updatedSession, messages: [...updatedSession.messages, aiMessage] });
        }
    };

    const handleAiSuggestion = async () => {
        setIsLoadingAi(true);
        const suggestions = await generateChatReply(session.messages, config, session.participantId);
        setAiSuggestions(suggestions);
        setIsLoadingAi(false);
    };

    const saveConfig = () => {
        onUpdateSession({ ...session, config });
        setShowConfig(false);
    };

    return (
        <div className="w-full h-full bg-black flex flex-col">
            {/* Header */}
            <div className="px-4 py-4 pt-12 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md border-b border-white/5 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-white"><ArrowLeft size={24} /></button>
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            {session.participantId} 
                            {isAi && <Sparkles size={12} className={`text-${theme}-400`} />}
                        </h3>
                        {!isAi && <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{config.relationship} • {config.tone}</p>}
                        {isAi && <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Always Online</p>}
                    </div>
                </div>
                {!isAi && (
                    <button onClick={() => setShowConfig(!showConfig)} className={`p-2 rounded-full ${showConfig ? 'bg-white text-black' : 'text-zinc-400'}`}>
                        <Settings size={20} />
                    </button>
                )}
            </div>

            {/* Config Panel (Only for human chats) */}
            {showConfig && !isAi && (
                <div className="bg-zinc-900 border-b border-white/10 p-6 space-y-4 animate-in slide-in-from-top-2">
                    <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Wand2 size={16} /> AI Context</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-zinc-500 font-bold block mb-1">Relationship</label>
                            <input value={config.relationship} onChange={e => setConfig({...config, relationship: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 font-bold block mb-1">Tone</label>
                            <div className="flex gap-2">
                                {['Flirty', 'Professional', 'Savage', 'Casual'].map(t => (
                                    <button key={t} onClick={() => setConfig({...config, tone: t})} className={`px-3 py-1 rounded-full text-xs font-bold border ${config.tone === t ? `bg-white text-black border-white` : 'text-zinc-500 border-zinc-800'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={saveConfig} className="w-full bg-white text-black font-bold py-3 rounded-xl mt-2">Save Context</button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {session.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                            msg.senderId === 'me' 
                                ? `bg-${theme}-400 text-black rounded-tr-sm font-medium` 
                                : 'bg-zinc-800 text-white rounded-tl-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isAiTyping && (
                     <div className="flex justify-start">
                        <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                     </div>
                )}
            </div>

            {/* AI Suggestions (Human Chat Only) */}
            {aiSuggestions.length > 0 && !isAi && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
                    {aiSuggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSend(s)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full border border-${theme}-400/30 bg-${theme}-400/10 text-${theme}-400 text-xs font-bold hover:bg-${theme}-400 hover:text-black transition`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-zinc-900 border-t border-white/5 pb-8 flex gap-3 items-center">
                {!isAi && (
                    <button 
                        onClick={handleAiSuggestion} 
                        disabled={isLoadingAi}
                        className={`p-3 rounded-full bg-gradient-to-tr from-${theme}-400 to-fuchsia-500 text-white shadow-lg active:scale-95 transition`}
                    >
                        {isLoadingAi ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                    </button>
                )}
                <input 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={isAi ? "Ask Flux..." : "Message..."}
                    className="flex-1 bg-black border border-zinc-800 rounded-full px-6 py-3 text-white focus:border-white/20 outline-none"
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={() => handleSend()} className="p-3 bg-white text-black rounded-full hover:bg-zinc-200">
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatView;