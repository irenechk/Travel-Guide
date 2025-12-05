export enum AppState {
  WELCOME = 'WELCOME',
  COUNTRY_SELECT = 'COUNTRY_SELECT',
  CITY_SELECT = 'CITY_SELECT',
  DASHBOARD = 'DASHBOARD'
}

export enum TabView {
  OVERVIEW = 'OVERVIEW',
  ITINERARY = 'ITINERARY',
  WEATHER = 'WEATHER',
  LOGISTICS = 'LOGISTICS',
  HOTELS = 'HOTELS',
  TRANSLATOR = 'TRANSLATOR',
  IMMERSIVE = 'IMMERSIVE'
}

export type TravelVibe = 'Relaxation' | 'Adventure' | 'Cultural' | 'Foodie' | 'Nightlife' | 'Family';

export interface CityOption {
  name: string;
  isCapital: boolean;
  direction: string; // e.g., "North-East region"
  description: string;
}

export interface WeatherData {
  currentTemp: number;
  condition: string;
  high: number;
  low: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  description: string;
  hourly: { time: string; temp: number; icon: string }[];
  daily: { day: string; icon: string; min: number; max: number }[];
}

export interface Activity {
  name: string;
  description: string;
  type: string;
  location: string;
}

export interface ItineraryItem {
  time: string;
  activity: string;
  description: string;
  place?: string;
}

export interface ItineraryDay {
  day: number;
  theme: string;
  activities: ItineraryItem[];
}

export interface TravelDetails {
  citySummary: string;
  clothingSuggestion: string;
  cuisines: string[];
  restaurants: string[];
  sunrise: string;
  sunset: string;
  bestViewSpot: string;
  avatarMessage: string;
  localLanguage: string;
  activities: Activity[]; 
}

export interface Hospital {
  name: string;
  address?: string;
  rating?: string;
  uri?: string;
}

export interface Hotel {
  name: string;
  priceRange: string; // "$", "$$", "$$$"
  rating: number;
  description: string;
  isPetFriendly: boolean;
  isChildFriendly: boolean;
  location: string;
  imageUrl?: string;
}

export interface HotelFilters {
  price: 'any' | 'budget' | 'moderate' | 'luxury';
  childFriendly: boolean;
  petFriendly: boolean;
}

export interface FlightOption {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  type: string; // e.g., "Non-stop", "1 Stop"
}