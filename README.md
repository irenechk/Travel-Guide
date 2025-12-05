# Odyssey AI 🌍✈️

**Odyssey AI** is an intelligent, immersive travel companion application designed to transform how you plan and experience your trips. Powered by Google's Gemini Models, it offers personalized itineraries, real-time weather, 3D exploration, and cultural guidance in a stunning, "Glassmorphism" style interface.

## ✨ Key Features

- **🌐 Interactive 3D Globe**: A stunning entry experience allowing users to explore the world visually.
- **🎨 Personalized Trip Vibes**: Choose your travel style (Adventure, Relaxation, Foodie, Nightlife, etc.) to get curated recommendations.
- **📅 Smart Itinerary Generator**: AI-generated day-by-day plans tailored specifically to your selected vibes and trip duration.
- **🏙️ Immersive 3D City Tours**: Virtual 360° panoramic tours of your destination generated on the fly.
- **🌦️ Advanced Weather Widget**: iPhone-inspired weather interface with hourly forecasts, UV index, and atmospheric details.
- **🏨 Intelligent Hotel Search**: Find accommodation with specific filters (Pet Friendly, Family Friendly) complete with AI-generated visual previews.
- **🗣️ AI Translator & Logistics**: 
  - Real-time text translation.
  - **Speech-to-Text** input for hands-free usage.
  - **Text-to-Speech** audio playback to hear the correct pronunciation.
  - Flight search and hospital finder.
- **🧚 Anime-Style Avatar Guide**: A unique, culturally adapted AI character for every city that guides you through the app.
- **🌸 Atmospheric Effects**: Dynamic background particles (Cherry Blossoms for Japan, Snow for Nordic countries, etc.) to set the mood.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Models**: Google GenAI SDK (`@google/genai`)
  - `gemini-2.5-flash` (Logic, Itineraries, Translations)
  - `gemini-2.5-flash-image` (Avatar & Scenery Generation)
  - `gemini-2.5-flash-preview-tts` (Text-to-Speech Audio)
- **3D & Graphics**: 
  - `Three.js` (Panoramic Views)
  - `Cobe` (Interactive Globe)
  - `Recharts` (Data Visualization)
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

1.  **Node.js** (v18+ recommended)
2.  **Google Gemini API Key**: Get one at [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/odyssey-ai.git
    cd odyssey-ai
    ```

2.  **Install Dependencies**
    *(If using a standard Vite/React setup)*
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run the App**
    ```bash
    npm run dev
    ```

## 🎮 How to Use

1.  **Explore**: Spin the globe or type a country name to begin.
2.  **Select Destination**: Choose a specific city or search for a custom one.
3.  **Define Vibe**: Select tags like "Adventure" or "Foodie" and set your trip duration.
4.  **Dashboard**: 
    - Use the tabs to switch between Overview, Itinerary, Weather, and more.
    - Click "3D Tour" to generate a VR-style view of the city.
    - Use the "Translator" tab to speak and translate phrases.

## 📦 Project Structure

- `src/App.tsx`: Main application flow and routing.
- `src/components/Dashboard.tsx`: The core interface containing all widgets.
- `src/components/City3DView.tsx`: Three.js logic for 360° panoramas.
- `src/components/WeatherWidget.tsx`: Visual weather display.
- `src/components/AvatarGuide.tsx`: The floating AI companion.
- `src/services/geminiService.ts`: All interactions with the Google Gemini API.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
