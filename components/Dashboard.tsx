import React, { useState, useEffect, useRef } from 'react';
import WeatherWidget from './WeatherWidget';
import AvatarGuide from './AvatarGuide';
import ParticleOverlay from './ParticleOverlay';
import City3DView from './City3DView';
import { WeatherData, TravelDetails, Hospital, TabView, Hotel, HotelFilters, TravelVibe, ItineraryDay, FlightOption } from '../types';
import { fetchHospitals, fetchHotels, translateText, generateImage, generateSpeech, fetchItinerary, fetchFlights } from '../services/geminiService';
import { 
  ArrowLeft, Shirt, Utensils, Coffee, MapPin, 
  Sunrise, Sunset, Car, Bike, Stethoscope, Navigation,
  LayoutDashboard, CloudSun, Briefcase, Hotel as HotelIcon, Languages,
  Check, X, Search, Star, Copy, Baby, Cat, Mic, MicOff, Compass, Loader2, Volume2, Box, CalendarRange, Clock,
  Plane
} from 'lucide-react';

interface DashboardProps {
  country: string;
  city: string;
  date: string;
  days: number;
  vibe: TravelVibe[];
  weather: WeatherData;
  details: TravelDetails;
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ country, city, date, days, vibe, weather, details, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.OVERVIEW);
  const [cityImageUrl, setCityImageUrl] = useState<string | null>(null);
  
  // Logistics State
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [transportMode, setTransportMode] = useState<'cab' | 'bike' | null>(null);

  // Flight State
  const [originCity, setOriginCity] = useState("");
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(false);

  // Hotel State
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [hotelFilters, setHotelFilters] = useState<HotelFilters>({
    price: 'any',
    childFriendly: false,
    petFriendly: false
  });

  // Itinerary State
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [loadingItinerary, setLoadingItinerary] = useState(false);

  // Translator State
  const [translationInput, setTranslationInput] = useState("");
  const [translationOutput, setTranslationOutput] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [targetLang, setTargetLang] = useState(details.localLanguage || "English");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // Generate accurate city image on load
    const loadCityImage = async () => {
        const prompt = `A breathtaking, high-quality, 8k photorealistic wide landscape photography of ${city}, ${country}. Capture the essence of the city with iconic landmarks visible, daytime, cinematic lighting.`;
        const url = await generateImage(prompt);
        if (isMounted.current && url) setCityImageUrl(url);
    };
    loadCityImage();
  }, [city, country]);

  // Lazy Load Itinerary
  useEffect(() => {
    const loadItinerary = async () => {
        if (activeTab === TabView.ITINERARY && itinerary.length === 0 && !loadingItinerary) {
            setLoadingItinerary(true);
            const plan = await fetchItinerary(country, city, vibe, days);
            if (isMounted.current) {
                setItinerary(plan);
                setLoadingItinerary(false);
            }
        }
    };
    loadItinerary();
  }, [activeTab, country, city, vibe, days, itinerary.length, loadingItinerary]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Speech Recognition Toggle
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; 

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranslationInput(transcript);
      // Auto translate after speaking
      handleTranslate(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
    }
  };

  const handleSeekMedicalHelp = async () => {
    if (hospitals.length === 0) {
      setLoadingHospitals(true);
      const fetched = await fetchHospitals(city);
      if (isMounted.current) {
          setHospitals(fetched);
          setLoadingHospitals(false);
      }
    }
  };

  const handleSearchFlights = async () => {
    if (!originCity.trim()) return;
    setLoadingFlights(true);
    setFlights([]);
    const fetched = await fetchFlights(originCity, city, date);
    if (isMounted.current) {
        setFlights(fetched);
        setLoadingFlights(false);
    }
  };

  const handleSearchHotels = async () => {
    setLoadingHotels(true);
    setHotels([]); // Clear previous
    const fetched = await fetchHotels(city, hotelFilters);
    if (isMounted.current) {
        setHotels(fetched);
        setLoadingHotels(false);
    }

    // Lazy load images for hotels
    fetched.forEach(async (hotel, index) => {
        const prompt = `A high-quality, photorealistic exterior photography of the hotel "${hotel.name}" in ${city}. Architectural style, welcoming entrance, sunny day.`;
        const imgUrl = await generateImage(prompt);
        if (imgUrl && isMounted.current) {
            setHotels(prev => {
                const updated = [...prev];
                // Check if the hotel is still at the same index or find by name
                const target = updated.find(h => h.name === hotel.name);
                if (target) target.imageUrl = imgUrl;
                return updated;
            });
        }
    });
  };

  const handleTranslate = async (textToTranslate = translationInput) => {
    if (!textToTranslate.trim()) return;
    setIsTranslating(true);
    const result = await translateText(textToTranslate, targetLang);
    if (isMounted.current) {
        setTranslationOutput(result);
        setIsTranslating(false);
    }
  };

  const handlePlayTranslation = async () => {
    if (!translationOutput || isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    const base64Audio = await generateSpeech(translationOutput);
    
    if (!isMounted.current) return;

    if (!base64Audio) {
      setIsPlayingAudio(false);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error("AudioContext not supported");
        setIsPlayingAudio(false);
        return;
      }
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      
      // Decode Base64 manually to raw bytes
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert to Int16Array then Float32Array for AudioBuffer
      // Note: This assumes Little Endian, which is standard for most generated PCM
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        // Normalize 16-bit integer to -1.0 to 1.0 float
        channelData[i] = dataInt16[i] / 32768.0;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        if (isMounted.current) setIsPlayingAudio(false);
        audioCtx.close();
      };
      source.start();
    } catch (e) {
      console.error("Audio playback error", e);
      if (isMounted.current) setIsPlayingAudio(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-24 overflow-x-hidden">
      <ParticleOverlay country={country} />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Header with City Image */}
      <div className="relative h-[40vh] w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          {cityImageUrl ? (
             <img 
               src={cityImageUrl} 
               alt={city} 
               className="w-full h-full object-cover animate-in fade-in duration-1000"
             />
          ) : (
             <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0f172a]"></div>
        </div>
        
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
          <button 
            onClick={onBack} 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/80 text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
                {country}
              </span>
              {vibe.map(v => (
                <span key={v} className="inline-block px-3 py-1 rounded-full bg-pink-500/80 text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
                    {v} Trip
                </span>
              ))}
              <span className="inline-block px-3 py-1 rounded-full bg-slate-500/80 text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
                {days} Days
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">{city}</h1>
            <p className="text-white/80 text-lg max-w-xl line-clamp-2">{details.citySummary}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex gap-8 overflow-x-auto no-scrollbar">
          {[
            { id: TabView.OVERVIEW, icon: LayoutDashboard, label: 'Overview' },
            { id: TabView.ITINERARY, icon: CalendarRange, label: 'Itinerary' },
            { id: TabView.IMMERSIVE, icon: Box, label: '3D Tour' },
            { id: TabView.WEATHER, icon: CloudSun, label: 'Forecast' },
            { id: TabView.LOGISTICS, icon: Briefcase, label: 'Logistics' },
            { id: TabView.HOTELS, icon: HotelIcon, label: 'Hotels' },
            { id: TabView.TRANSLATOR, icon: Languages, label: 'Translator' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === TabView.OVERVIEW && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Main Weather Teaser */}
             <div 
               className="glass-panel rounded-3xl p-6 cursor-pointer hover:bg-white/10 transition flex items-center justify-between"
               onClick={() => setActiveTab(TabView.WEATHER)}
             >
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-1">Current Conditions</h3>
                  <p className="text-3xl font-bold">{Math.round(weather.currentTemp)}°C &bull; {weather.condition}</p>
                </div>
                <CloudSun className="w-10 h-10 text-yellow-400" />
             </div>

             {/* Vibe Based Activities */}
             <div className="glass-panel rounded-3xl p-8 border-l-4 border-pink-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Curated {vibe.join(' & ')} Experiences</h3>
                    <p className="text-xs text-slate-400">Handpicked for your style</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {details.activities?.map((act, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-blue-200">{act.name}</h4>
                        <span className="text-[10px] uppercase bg-slate-800 px-2 py-1 rounded text-slate-400">{act.type}</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{act.description}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                         <MapPin className="w-3 h-3" /> {act.location}
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cuisine Card */}
                <div className="glass-panel rounded-3xl p-8 border-l-4 border-orange-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Culinary Scene</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-2">Must Try Dishes</p>
                        <div className="flex flex-wrap gap-2">
                          {details.cuisines.map((c, i) => (
                            <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-sm text-slate-200 border border-white/10">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-2">Top Spots</p>
                        <ul className="space-y-2">
                          {details.restaurants.map((r, i) => (
                            <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                              <Coffee className="w-3 h-3 text-orange-400" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                </div>

                {/* Clothing Card */}
                <div className="glass-panel rounded-3xl p-8 border-l-4 border-indigo-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Shirt className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Style Guide</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {details.clothingSuggestion}
                    </p>
                </div>
             </div>
             
             {/* Sunrise/Sunset */}
             <div className="glass-panel rounded-3xl p-8 bg-gradient-to-r from-orange-900/40 to-indigo-900/40">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="flex items-center gap-4">
                      <Sunrise className="w-10 h-10 text-orange-300" />
                      <div>
                        <span className="block text-sm text-slate-400 uppercase">Sunrise</span>
                        <span className="text-2xl font-bold">{details.sunrise}</span>
                      </div>
                   </div>
                   <div className="h-px w-full md:w-px md:h-12 bg-white/10"></div>
                   <div className="flex items-center gap-4">
                      <Sunset className="w-10 h-10 text-purple-300" />
                      <div>
                        <span className="block text-sm text-slate-400 uppercase">Sunset</span>
                        <span className="text-2xl font-bold">{details.sunset}</span>
                      </div>
                   </div>
                   <div className="h-px w-full md:w-px md:h-12 bg-white/10"></div>
                   <div className="flex-1 text-center md:text-right">
                      <span className="block text-xs text-slate-400 uppercase mb-1">Best Viewpoint</span>
                      <span className="text-lg font-medium text-white flex items-center justify-center md:justify-end gap-2">
                        <MapPin className="w-4 h-4 text-red-400" />
                        {details.bestViewSpot}
                      </span>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ITINERARY TAB */}
        {activeTab === TabView.ITINERARY && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                {loadingItinerary ? (
                     <div className="text-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Planning your {days} days...</h3>
                        <p className="text-slate-400">Curating the perfect schedule for {vibe.join(', ')} vibes.</p>
                     </div>
                ) : (
                    <div className="space-y-8 relative">
                         {/* Timeline vertical line */}
                         <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-transparent opacity-30 md:left-1/2 md:-ml-px"></div>

                         {itinerary.map((day, idx) => (
                             <div key={idx} className={`relative z-10 flex flex-col md:flex-row gap-6 md:gap-0 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                 
                                 {/* Day Number Badge (Center) */}
                                 <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#0f172a] border-4 border-blue-500 flex items-center justify-center font-bold text-blue-400 z-20 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                     {day.day}
                                 </div>

                                 {/* Empty Space for alignment */}
                                 <div className="flex-1 hidden md:block"></div>

                                 {/* Card */}
                                 <div className="flex-1 pl-16 md:pl-0">
                                     <div className={`glass-panel p-6 rounded-2xl border-l-4 ${idx % 2 === 0 ? 'border-l-purple-500 md:mr-10' : 'border-l-blue-500 md:ml-10'}`}>
                                         <h3 className="text-xl font-bold text-white mb-1">Day {day.day}: {day.theme}</h3>
                                         
                                         <div className="space-y-4 mt-6">
                                            {day.activities.map((act, i) => (
                                                <div key={i} className="flex gap-4 group">
                                                    <div className="mt-1">
                                                        <Clock className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{act.time}</span>
                                                        <h4 className="font-bold text-slate-200">{act.activity}</h4>
                                                        <p className="text-sm text-slate-400 leading-snug">{act.description}</p>
                                                        {act.place && (
                                                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                                <MapPin className="w-3 h-3" /> {act.place}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                         
                         {/* Final Note */}
                         <div className="text-center pt-8 pb-4">
                             <p className="text-slate-500 italic">Itinerary customized for {vibe.join(', ')}</p>
                         </div>
                    </div>
                )}
            </div>
        )}

        {/* 3D IMMERSIVE TAB */}
        {activeTab === TabView.IMMERSIVE && (
           <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Immersive Tour</h2>
                <p className="text-slate-400">Step into a virtual 360° view of {city}. Drag to explore the environment.</p>
              </div>
              <City3DView city={city} />
           </div>
        )}

        {/* WEATHER TAB */}
        {activeTab === TabView.WEATHER && (
           <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500">
             <WeatherWidget weather={weather} date={date} />
             
             <div className="mt-8 grid grid-cols-2 gap-4">
               {weather.daily.slice(0, 4).map((day, i) => (
                 <div key={i} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <span className="font-medium text-slate-200">{day.day}</span>
                    <div className="flex items-center gap-3">
                       <CloudSun className="w-5 h-5 text-slate-400" />
                       <span className="text-sm font-bold">{Math.round(day.max)}° <span className="text-slate-500 font-normal">/ {Math.round(day.min)}°</span></span>
                    </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* LOGISTICS TAB */}
        {activeTab === TabView.LOGISTICS && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             
             {/* Flight Search Section */}
             <div className="glass-panel rounded-3xl p-8 border border-blue-400/20 bg-blue-900/10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                     <Plane className="w-5 h-5 text-blue-400" />
                   </div>
                   <h3 className="text-xl font-bold text-white">Flight Connections</h3>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                   <div className="flex-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Departing From</label>
                      <input 
                        type="text" 
                        placeholder="e.g. New York, London"
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      />
                   </div>
                   <div className="flex-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Destination</label>
                      <div className="w-full bg-white/5 border border-white/10 text-slate-400 p-3 rounded-xl cursor-not-allowed">
                        {city}, {country}
                      </div>
                   </div>
                   <div className="flex items-end">
                      <button 
                        onClick={handleSearchFlights}
                        disabled={!originCity.trim() || loadingFlights}
                        className="h-[50px] px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2"
                      >
                        {loadingFlights ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Find Flights
                      </button>
                   </div>
                </div>

                {flights.length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {flights.map((flight, i) => (
                         <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                            <div className="flex justify-between items-start mb-2">
                               <span className="font-bold text-lg text-white">{flight.airline}</span>
                               <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{flight.type}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-400 mb-3">
                               <span>{flight.departureTime}</span>
                               <div className="h-px bg-slate-600 flex-1 mx-2 relative">
                                  <Plane className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 text-slate-500" />
                               </div>
                               <span>{flight.arrivalTime}</span>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                               <span className="text-xl font-bold text-green-400">{flight.price}</span>
                               <a 
                                 href={`https://www.google.com/search?q=flights+from+${originCity}+to+${city}`}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="text-sm font-semibold text-blue-400 hover:text-white transition"
                               >
                                 Book Now &rarr;
                               </a>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>

             {/* Transport */}
             <div className="glass-panel rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Local Transport</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTransportMode(transportMode === 'cab' ? null : 'cab')}
                    className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                      transportMode === 'cab' 
                      ? 'bg-blue-600 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Car className="w-8 h-8 mb-2" />
                    <span className="font-bold text-lg">Request Ride</span>
                    <span className="text-xs text-slate-400">Local Cabs & Rideshare</span>
                  </button>

                  <button 
                    onClick={() => setTransportMode(transportMode === 'bike' ? null : 'bike')}
                    className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                      transportMode === 'bike' 
                      ? 'bg-green-600 border-green-500 shadow-[0_0_20px_rgba(22,163,74,0.3)]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Bike className="w-8 h-8 mb-2" />
                    <span className="font-bold text-lg">Rent Bike</span>
                    <span className="text-xs text-slate-400">Eco-friendly Travel</span>
                  </button>
                </div>
                
                {transportMode && (
                  <div className="mt-6 p-4 rounded-xl bg-blue-900/20 border border-blue-500/30 flex items-center gap-3 animate-pulse">
                    <Navigation className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-200">Searching for available {transportMode === 'cab' ? 'drivers' : 'stations'} nearby...</span>
                  </div>
                )}
             </div>

             {/* Medical */}
             <div className="glass-panel rounded-3xl p-8 border border-red-900/30 bg-red-900/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-red-200 flex items-center gap-2">
                    <Stethoscope className="w-6 h-6" /> Medical Assistance
                  </h3>
                  <button 
                    onClick={handleSeekMedicalHelp}
                    className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition shadow-lg shadow-red-900/50"
                  >
                    Find Hospitals
                  </button>
                </div>

                {loadingHospitals && <p className="text-center text-slate-400 py-4">Locating medical facilities...</p>}

                {hospitals.length > 0 && (
                  <div className="space-y-3">
                    {hospitals.map((h, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center hover:bg-white/10 transition">
                         <div>
                           <p className="font-bold text-white">{h.name}</p>
                           {h.address && <p className="text-sm text-slate-400">{h.address}</p>}
                         </div>
                         <a 
                           href={h.uri || '#'} 
                           target="_blank" 
                           rel="noreferrer"
                           className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition"
                         >
                           <Navigation className="w-4 h-4" />
                         </a>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* HOTELS TAB */}
        {activeTab === TabView.HOTELS && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Filter Section */}
            <div className="glass-panel p-6 rounded-2xl mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <HotelIcon className="w-5 h-5 text-purple-400" /> 
                Find Your Stay
              </h3>
              
              <div className="flex flex-wrap gap-4 items-center">
                 <select 
                   value={hotelFilters.price}
                   onChange={(e) => setHotelFilters({...hotelFilters, price: e.target.value as any})}
                   className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                 >
                   <option value="any">Any Price</option>
                   <option value="budget">Budget ($)</option>
                   <option value="moderate">Moderate ($$)</option>
                   <option value="luxury">Luxury ($$$)</option>
                 </select>

                 <button 
                    onClick={() => setHotelFilters({...hotelFilters, childFriendly: !hotelFilters.childFriendly})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${
                      hotelFilters.childFriendly 
                      ? 'bg-purple-600 border-purple-500 text-white' 
                      : 'bg-transparent border-slate-600 text-slate-300 hover:bg-white/5'
                    }`}
                 >
                    <Baby className="w-4 h-4" /> Family Friendly
                 </button>

                 <button 
                    onClick={() => setHotelFilters({...hotelFilters, petFriendly: !hotelFilters.petFriendly})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${
                      hotelFilters.petFriendly 
                      ? 'bg-green-600 border-green-500 text-white' 
                      : 'bg-transparent border-slate-600 text-slate-300 hover:bg-white/5'
                    }`}
                 >
                    <Cat className="w-4 h-4" /> Pet Friendly
                 </button>

                 <button 
                   onClick={handleSearchHotels}
                   className="ml-auto bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-slate-200 transition flex items-center gap-2"
                 >
                   <Search className="w-4 h-4" /> Search
                 </button>
              </div>
            </div>

            {loadingHotels ? (
               <div className="text-center py-20">
                 <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-slate-400">Finding the best spots...</p>
               </div>
            ) : hotels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hotels.map((hotel, idx) => (
                  <div key={idx} className="glass-panel rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 flex flex-col">
                     <div className="h-48 bg-slate-800 relative">
                        {hotel.imageUrl ? (
                            <img 
                              src={hotel.imageUrl} 
                              alt={hotel.name}
                              className="w-full h-full object-cover animate-in fade-in duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        )}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                          {hotel.priceRange}
                        </div>
                     </div>
                     <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">{hotel.name}</h3>
                          <div className="flex items-center gap-1 text-yellow-400">
                             <Star className="w-4 h-4 fill-current" />
                             <span className="text-sm font-bold">{hotel.rating}</span>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{hotel.description}</p>
                        
                        <div className="flex gap-2 mb-6">
                           {hotel.isChildFriendly && (
                             <span className="text-[10px] uppercase font-bold text-blue-300 bg-blue-900/30 px-2 py-1 rounded border border-blue-500/20">Family</span>
                           )}
                           {hotel.isPetFriendly && (
                             <span className="text-[10px] uppercase font-bold text-green-300 bg-green-900/30 px-2 py-1 rounded border border-green-500/20">Pets</span>
                           )}
                        </div>

                        <a 
                          href={`https://www.google.com/search?q=book+${hotel.name}+${city}+hotel`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-auto w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-semibold text-center transition-colors"
                        >
                          Book Now
                        </a>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 opacity-50">
                 <HotelIcon className="w-16 h-16 mx-auto mb-4" />
                 <p>Select filters and click Search to find hotels.</p>
              </div>
            )}
          </div>
        )}

        {/* TRANSLATOR TAB */}
        {activeTab === TabView.TRANSLATOR && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="text-center mb-8">
               <h2 className="text-3xl font-bold mb-2">AI Translator</h2>
               <p className="text-slate-400">Break language barriers instantly.</p>
             </div>

             <div className="glass-panel rounded-[2rem] p-1 border border-white/10 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-black/20">
                   {/* Input */}
                   <div className="p-6 relative">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detected Language</span>
                      </div>
                      <textarea 
                        className="w-full h-40 bg-transparent border-none focus:ring-0 text-xl md:text-2xl text-white placeholder:text-slate-600 resize-none"
                        placeholder="Type or speak..."
                        value={translationInput}
                        onChange={(e) => setTranslationInput(e.target.value)}
                      />
                      <button
                        onClick={toggleListening}
                        className={`absolute bottom-6 right-6 p-3 rounded-full transition-all z-10 ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'}`}
                        title={isListening ? "Stop listening" : "Start voice input"}
                      >
                        {isListening ? <Mic className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>
                   </div>

                   {/* Output */}
                   <div className="p-6 bg-white/5 relative">
                      <div className="flex justify-between items-center mb-4">
                         <input 
                           value={targetLang}
                           onChange={(e) => setTargetLang(e.target.value)}
                           className="bg-transparent border-none text-blue-400 font-bold uppercase tracking-widest text-xs focus:ring-0 w-full"
                         />
                         <div className="flex gap-2">
                             <button 
                               onClick={handlePlayTranslation}
                               disabled={!translationOutput || isPlayingAudio}
                               className={`text-slate-500 hover:text-white transition ${isPlayingAudio ? 'animate-pulse text-blue-400' : ''}`}
                               title="Listen"
                             >
                               <Volume2 className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => navigator.clipboard.writeText(translationOutput)}
                               className="text-slate-500 hover:text-white transition"
                               title="Copy"
                             >
                               <Copy className="w-4 h-4" />
                             </button>
                         </div>
                      </div>
                      
                      {isTranslating ? (
                        <div className="h-40 flex items-center justify-center">
                          <div className="flex gap-1">
                             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 overflow-y-auto text-xl md:text-2xl font-light text-blue-100">
                          {translationOutput || <span className="text-slate-700 italic">Translation will appear here</span>}
                        </div>
                      )}
                   </div>
                </div>
                
                <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
                   <button 
                     onClick={() => handleTranslate()}
                     disabled={!translationInput.trim() || isTranslating}
                     className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                   >
                     <Languages className="w-5 h-5" /> Translate
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>

      <AvatarGuide country={country} city={city} message={details.avatarMessage} />
    </div>
  );
};

export default Dashboard;