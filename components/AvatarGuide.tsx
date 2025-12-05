import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { getDestinationAvatar } from '../services/geminiService';

interface AvatarGuideProps {
  country: string;
  city: string;
  message: string;
}

const AvatarGuide: React.FC<AvatarGuideProps> = ({ country, city, message }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [visibleMessage, setVisibleMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Typewriter effect - Fixed to only run once per new message
  useEffect(() => {
    if (!message) return;
    
    // Reset and type only when message changes content
    setVisibleMessage("");
    let i = 0;
    const timer = setInterval(() => {
      setVisibleMessage(message.substring(0, i));
      i++;
      if (i > message.length) clearInterval(timer);
    }, 30);

    return () => clearInterval(timer);
  }, [message]);

  // Fetch Avatar with Caching (Keyed by City + Country)
  useEffect(() => {
    let isMounted = true;
    const cacheKey = `odyssey_avatar_${country}_${city}`;

    const fetchAvatar = async () => {
        // Check cache first
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            setAvatarUrl(cached);
            return;
        }

        setLoading(true);
        // Use city-specific avatar generation
        const url = await getDestinationAvatar(country, city);
        
        if (isMounted) {
            if (url) {
                setAvatarUrl(url);
                try {
                    sessionStorage.setItem(cacheKey, url);
                } catch (e) {
                    console.warn("Session storage full");
                }
            }
            setLoading(false);
        }
    };
    
    if (city && country) {
        fetchAvatar();
    }
    
    return () => { isMounted = false; };
  }, [country, city]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-end gap-3 max-w-sm">
      <div className="relative group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 p-[3px] shadow-2xl hover:scale-105 transition-transform duration-300 relative overflow-hidden">
           <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white">
             {loading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
             ) : (
                <img 
                  src={avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(city)}`} 
                  alt={`${city} Guide`} 
                  className="w-full h-full object-cover"
                />
             )}
           </div>
        </div>
        <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white z-10"></div>
      </div>

      {isOpen && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl rounded-bl-none shadow-2xl p-5 border border-white/20 animate-in slide-in-from-bottom-5 duration-300 relative text-slate-800 max-w-[280px]">
          <button 
            onClick={() => setIsOpen(false)} 
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase text-pink-500 tracking-widest bg-pink-100 px-2 py-0.5 rounded-full">Guide</span>
            <span className="text-xs font-bold text-slate-600 truncate">{city}</span>
          </div>
          <p className="text-sm leading-relaxed font-medium">
            "{visibleMessage}"
          </p>
          <div className="absolute -left-2 bottom-6 w-4 h-4 bg-white/95 rotate-45 border-l border-b border-white/20"></div>
        </div>
      )}
      
      {!isOpen && (
        <button 
            onClick={() => setIsOpen(true)}
            className="bg-white p-3 rounded-full shadow-lg text-slate-600 hover:text-pink-500 transition-colors"
        >
            <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default AvatarGuide;