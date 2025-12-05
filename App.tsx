import React, { useState, useEffect } from 'react';
import { AppState, CityOption, WeatherData, TravelDetails, TravelVibe } from './types';
import { fetchCitiesForCountry, fetchTravelDetails } from './services/geminiService';
import Dashboard from './components/Dashboard';
import Globe3D from './components/Globe3D';
import { Map, Loader2, ArrowRight, Search, Globe, ChevronRight, ArrowLeft, Compass, PartyPopper, Palmtree, Tent, Sparkles, Utensils, Check, Calendar, Minus, Plus } from 'lucide-react';

const SUGGESTED_DESTINATIONS = ["Japan", "Italy", "Iceland", "Egypt", "Switzerland", "Peru"];

const App: React.FC = () => {
  const [view, setView] = useState<AppState>(AppState.WELCOME);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // New States
  const [selectedVibes, setSelectedVibes] = useState<TravelVibe[]>([]);
  const [numDays, setNumDays] = useState<number>(3);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dashboard Data
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [travelDetails, setTravelDetails] = useState<TravelDetails | null>(null);

  const handleCountrySelect = async (country: string) => {
    setSelectedCountry(country);
    setLoading(true);
    // Fetch cities using Gemini
    const fetchedCities = await fetchCitiesForCountry(country);
    setCities(fetchedCities);
    setLoading(false);
    setView(AppState.CITY_SELECT);
    setCitySearchQuery(""); // Reset city search
  };

  const toggleVibe = (vibe: TravelVibe) => {
    if (selectedVibes.includes(vibe)) {
        setSelectedVibes(prev => prev.filter(v => v !== vibe));
    } else {
        setSelectedVibes(prev => [...prev, vibe]);
    }
  };

  const handleDaysChange = (change: number) => {
    setNumDays(prev => Math.max(1, Math.min(14, prev + change)));
  }

  const handleStartAdventure = async () => {
    if (selectedVibes.length === 0) return;
    setLoading(true);
    // Fetch dashboard data
    try {
      const data = await fetchTravelDetails(selectedCountry, selectedCity, selectedDate, selectedVibes);
      setWeatherData(data.weather);
      setTravelDetails(data.details);
      setView(AppState.DASHBOARD);
    } catch (e) {
      alert("Failed to load travel data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  // --- Views ---

  if (view === AppState.WELCOME || view === AppState.COUNTRY_SELECT) {
    return (
      <div className="h-screen w-full relative overflow-hidden bg-[#0f172a] flex flex-col items-center">
        
        {/* The 3D Globe Background */}
        <div className="absolute inset-0 z-0">
           <Globe3D />
           <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-transparent to-[#0f172a] pointer-events-none"></div>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f172a_70%)] pointer-events-none"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
          
          <div className="mb-12 animate-in fade-in slide-in-from-top-10 duration-1000">
            <h1 className="text-7xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter mb-4">
              ODYSSEY
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 font-light tracking-wide">
              AI-Powered Global Exploration
            </p>
          </div>

          {/* Search Interface */}
          <div className="w-full max-w-lg relative group animate-in zoom-in-95 duration-700 delay-300">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500"></div>
            <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-2 shadow-2xl hover:border-white/20 transition-colors">
              <div className="pl-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Where do you want to go?" 
                className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 text-lg placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) handleCountrySelect(searchQuery);
                }}
              />
              <button 
                onClick={() => searchQuery && handleCountrySelect(searchQuery)}
                className="bg-white text-[#0f172a] p-3 rounded-full hover:scale-105 active:scale-95 transition-transform"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="mt-12 flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            {SUGGESTED_DESTINATIONS.map((country) => (
               <button
                 key={country}
                 onClick={() => handleCountrySelect(country)}
                 className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-400 text-sm hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
               >
                 {country}
               </button>
            ))}
          </div>

          {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a]/80 backdrop-blur-md z-50">
               <div className="relative w-20 h-20 mb-4">
                 <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
               <p className="text-blue-400 font-medium tracking-widest uppercase text-sm">Initiating Launch Sequence...</p>
             </div>
          )}
        </div>
      </div>
    );
  }

  if (view === AppState.CITY_SELECT) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6 md:p-12 relative overflow-hidden">
         {/* Background Elements */}
         <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
         
         <div className="max-w-6xl mx-auto relative z-10">
            <button 
              onClick={() => setView(AppState.COUNTRY_SELECT)} 
              className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Globe
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
               <div>
                 <span className="text-blue-500 font-bold tracking-wider uppercase text-sm mb-2 block">Destination</span>
                 <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                   {selectedCountry}
                 </h2>
               </div>
               
               <div className="flex flex-col md:flex-row gap-4 items-end">
                 <div className="w-full md:w-64">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Search City</label>
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Find a city..."
                            value={citySearchQuery}
                            onChange={(e) => setCitySearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                 </div>
                 
                 <div className="w-full md:w-auto">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Travel Date</label>
                    <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                    />
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCities.map((city, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                      setSelectedCity(city.name);
                      setSelectedVibes([]);
                  }}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                   {/* Decorative gradient blob */}
                   <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all"></div>

                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${city.isCapital ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-400'}`}>
                          {city.isCapital ? <Globe className="w-5 h-5" /> : <Map className="w-5 h-5" />}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2">{city.name}</h3>
                      <p className="text-sm text-blue-300 font-medium mb-3">{city.direction}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{city.description}</p>
                   </div>
                </div>
              ))}
              
              {/* Option to select the searched city if not in list */}
              {citySearchQuery && !filteredCities.find(c => c.name.toLowerCase() === citySearchQuery.toLowerCase()) && (
                  <div 
                    onClick={() => {
                        setSelectedCity(citySearchQuery);
                        setSelectedVibes([]);
                    }}
                    className="group relative bg-blue-600/10 backdrop-blur-sm border-2 border-dashed border-blue-500/30 rounded-3xl p-6 hover:bg-blue-600/20 hover:border-blue-500/50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center"
                  >
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                          <Map className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">Explore {citySearchQuery}</h3>
                      <p className="text-sm text-slate-400">Select this custom destination</p>
                  </div>
              )}
            </div>
         </div>

         {/* Vibe Selection Modal (Appears when city is selected) */}
         {selectedCity && (
            <div className="fixed inset-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="max-w-3xl w-full">
                  <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">Define Your Journey</h2>
                  <p className="text-center text-slate-400 mb-8">Select one or more vibes to tailor your experience in <span className="text-white font-bold">{selectedCity}</span>.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                     {[
                       { id: 'Relaxation', icon: Palmtree, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500' },
                       { id: 'Adventure', icon: Tent, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500' },
                       { id: 'Cultural', icon: Compass, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500' },
                       { id: 'Nightlife', icon: PartyPopper, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500' },
                       { id: 'Foodie', icon: Utensils, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500' },
                       { id: 'Family', icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
                     ].map((v) => {
                       const isSelected = selectedVibes.includes(v.id as TravelVibe);
                       return (
                        <button
                            key={v.id}
                            onClick={() => toggleVibe(v.id as TravelVibe)}
                            className={`group relative p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                                isSelected 
                                ? `${v.bg} ${v.border} scale-105 shadow-xl` 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {isSelected && (
                                <div className="absolute top-3 right-3 bg-white text-black rounded-full p-0.5">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                            <div className={`w-12 h-12 rounded-full ${isSelected ? 'bg-black/20' : v.bg} flex items-center justify-center`}>
                                <v.icon className={`w-6 h-6 ${v.color}`} />
                            </div>
                            <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{v.id}</span>
                        </button>
                       );
                     })}
                  </div>

                  {/* Trip Duration Section */}
                  <div className="bg-white/5 rounded-2xl p-6 mb-8 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="font-bold text-white">Trip Duration</p>
                            <p className="text-xs text-slate-400">How many days?</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 bg-black/20 rounded-full px-2 py-1">
                        <button 
                            onClick={() => handleDaysChange(-1)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-xl w-6 text-center">{numDays}</span>
                        <button 
                            onClick={() => handleDaysChange(1)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 items-center">
                    <button 
                        onClick={handleStartAdventure}
                        disabled={selectedVibes.length === 0}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-12 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        Start Adventure
                    </button>
                    <button 
                        onClick={() => setSelectedCity("")}
                        className="text-slate-500 hover:text-white transition text-sm"
                    >
                        Change Destination
                    </button>
                  </div>
               </div>
            </div>
         )}

         {loading && (
             <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-xl flex flex-col items-center justify-center z-[60]">
               <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
               <p className="text-xl text-white font-light text-center">
                 Crafting your <span className="text-blue-400 font-bold">{selectedVibes.join(" & ")}</span> experience in <span className="text-white font-bold">{selectedCity}</span>...
               </p>
             </div>
          )}
      </div>
    );
  }

  if (view === AppState.DASHBOARD && weatherData && travelDetails && selectedVibes.length > 0) {
    return (
      <Dashboard 
        country={selectedCountry}
        city={selectedCity}
        date={selectedDate}
        vibe={selectedVibes}
        days={numDays}
        weather={weatherData}
        details={travelDetails}
        onBack={() => {
           setView(AppState.CITY_SELECT);
           setSelectedCity(""); // Reset city to allow re-selection
        }}
      />
    );
  }

  return null;
};

export default App;