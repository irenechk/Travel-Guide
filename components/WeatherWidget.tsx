import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Calendar } from 'lucide-react';
import { WeatherData } from '../types';

interface WeatherWidgetProps {
  weather: WeatherData;
  date: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, date }) => {
  
  const getGradient = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700';
    if (lower.includes('cloud')) return 'bg-gradient-to-br from-slate-500 to-slate-700 border-slate-600';
    if (lower.includes('sun') || lower.includes('clear')) return 'bg-gradient-to-br from-orange-400 to-amber-600 border-orange-400';
    return 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400';
  };

  const getWeatherIcon = (condition: string, className?: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return <CloudRain className={className} />;
    if (lower.includes('cloud')) return <Cloud className={className} />;
    return <Sun className={className} />;
  };

  return (
    <div className={`relative overflow-hidden rounded-[2rem] text-white shadow-2xl transition-all duration-500 hover:scale-[1.01] border ${getGradient(weather.condition)}`}>
      <div className="absolute top-0 right-0 p-32 bg-white opacity-5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative p-6 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                <Calendar className="w-3 h-3" />
                {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-1">{weather.condition}</h2>
            <p className="opacity-80 text-lg font-light">{weather.description}</p>
          </div>
          <div className="text-right">
            <span className="text-7xl md:text-8xl font-thin tracking-tighter">{Math.round(weather.currentTemp)}°</span>
          </div>
        </div>

        {/* Hourly Chart */}
        <div className="h-28 mb-8 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weather.hourly}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                  cursor={{stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1}}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: 'none', color: 'white', padding: '8px 12px' }}
                  itemStyle={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: number) => [`${value}°`, '']}
              />
              <Area 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#ffffff" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorTemp)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 flex flex-col items-center justify-center text-center">
             <Thermometer className="w-5 h-5 mb-1 opacity-70" />
             <span className="text-lg font-bold">{Math.round(weather.feelsLike)}°</span>
             <span className="text-[10px] uppercase tracking-wide opacity-60">Feels Like</span>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 flex flex-col items-center justify-center text-center">
             <Droplets className="w-5 h-5 mb-1 opacity-70" />
             <span className="text-lg font-bold">{weather.humidity}%</span>
             <span className="text-[10px] uppercase tracking-wide opacity-60">Humidity</span>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 flex flex-col items-center justify-center text-center">
             <Wind className="w-5 h-5 mb-1 opacity-70" />
             <span className="text-lg font-bold">{weather.windSpeed}</span>
             <span className="text-[10px] uppercase tracking-wide opacity-60">km/h</span>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 flex flex-col items-center justify-center text-center">
             <Sun className="w-5 h-5 mb-1 opacity-70" />
             <span className="text-lg font-bold">{weather.uvIndex}</span>
             <span className="text-[10px] uppercase tracking-wide opacity-60">UV Index</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;