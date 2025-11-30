
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User, ThemeColor } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Sparkles, Ghost, AlertTriangle } from 'lucide-react';

interface AuthViewProps {
    onSuccess: (user: User) => void;
    theme?: ThemeColor;
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess, theme = 'cyan' }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            let user;
            if (mode === 'login') {
                user = await authService.signIn(email, password);
            } else {
                user = await authService.signUp(name, email, handle, password);
            }
            onSuccess(user);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const user = await authService.signInWithGoogle();
            onSuccess(user);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Google Sign-In failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuest = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const user = await authService.continueAsGuest();
            onSuccess(user);
        } catch (err: any) {
            setError(err.message || "Could not enter as guest");
        } finally {
            setIsLoading(false);
        }
    };

    const getBtnBg = () => {
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
        <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
             {/* Background Ambience */}
             <div className={`absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full ${getBtnBg()} opacity-10 blur-[120px] pointer-events-none`} />
             <div className={`absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full ${getBtnBg()} opacity-10 blur-[120px] pointer-events-none`} />

             <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <div className={`w-16 h-16 rounded-2xl ${getBtnBg()} flex items-center justify-center shadow-lg shadow-white/10`}>
                             <Sparkles className="text-black" size={32} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Flux</h1>
                    <p className="text-zinc-500 font-medium">Capture your world, unadulterated.</p>
                </div>

                <div className="space-y-4">
                    {/* Google Button */}
                    <button 
                        onClick={handleGoogle}
                        disabled={isLoading}
                        className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition active:scale-[0.98] disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="animate-spin text-black" /> : (
                            <>
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    {/* Guest Button */}
                    <button 
                        onClick={handleGuest}
                        disabled={isLoading}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition active:scale-[0.98] disabled:opacity-70"
                    >
                        <Ghost size={18} />
                        <span>Continue as Guest</span>
                    </button>

                    <div className="flex items-center gap-4 text-zinc-700 my-4">
                        <div className="h-[1px] bg-zinc-800 flex-1" />
                        <span className="text-xs font-bold uppercase tracking-widest">Or</span>
                        <div className="h-[1px] bg-zinc-800 flex-1" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {mode === 'signup' && (
                             <div className="flex gap-3">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 flex-1 focus-within:border-zinc-600 transition">
                                    <UserIcon size={18} className="text-zinc-500" />
                                    <input 
                                        placeholder="Name" 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="bg-transparent text-white placeholder:text-zinc-600 outline-none text-sm w-full font-bold" 
                                        required 
                                    />
                                </div>
                             </div>
                        )}
                        
                        {mode === 'signup' && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-zinc-600 transition">
                                <span className="text-zinc-500 text-sm font-bold">@</span>
                                <input 
                                    placeholder="handle" 
                                    value={handle}
                                    onChange={e => setHandle(e.target.value)}
                                    className="bg-transparent text-white placeholder:text-zinc-600 outline-none text-sm w-full font-bold" 
                                    required 
                                />
                            </div>
                        )}

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-zinc-600 transition">
                            <Mail size={18} className="text-zinc-500" />
                            <input 
                                type="email"
                                placeholder="Email address" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="bg-transparent text-white placeholder:text-zinc-600 outline-none text-sm w-full font-medium" 
                                required 
                            />
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-zinc-600 transition">
                            <Lock size={18} className="text-zinc-500" />
                            <input 
                                type="password"
                                placeholder="Password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="bg-transparent text-white placeholder:text-zinc-600 outline-none text-sm w-full font-medium" 
                                required 
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-bold flex gap-3 items-start">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button 
                             type="submit"
                             disabled={isLoading}
                             className={`w-full ${getBtnBg()} text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98] shadow-lg disabled:opacity-50 mt-4`}
                        >
                            {isLoading ? <Loader2 className="animate-spin text-black" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                            {!isLoading && <ArrowRight size={18} strokeWidth={3} />}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <button 
                            onClick={() => {
                                setMode(mode === 'login' ? 'signup' : 'login'); 
                                setError(null);
                            }} 
                            className="text-zinc-500 text-xs font-bold hover:text-white transition"
                        >
                            {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default AuthView;
