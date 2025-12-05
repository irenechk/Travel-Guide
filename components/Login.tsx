import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { Loader2, Globe as GlobeIcon, ArrowRight } from 'lucide-react';
import Globe3D from './Globe3D';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Auth state change will be caught in App.tsx
    } catch (err: any) {
        // Handle common firebase errors nicely
        if (err.code === 'auth/configuration-not-found' || err.code === 'auth/api-key-not-valid') {
            setError("Firebase configuration missing. Please update services/firebase.ts");
        } else {
            setError("Failed to sign in. Please try again.");
        }
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#0f172a] flex flex-col items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 z-0 opacity-50">
            <Globe3D />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-[#0f172a]"></div>
        </div>

        <div className="relative z-10 w-full max-w-md p-6">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">ODYSSEY AI</h1>
                    <p className="text-slate-400 font-light">Your intelligent travel companion</p>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-white text-[#0f172a] hover:bg-slate-200 py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                        )}
                        <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
                    </button>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-xs text-slate-500">
                        By continuing, you verify that you are ready to explore the world with AI assistance.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;