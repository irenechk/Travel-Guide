import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CityOption, WeatherData, TravelDetails, Hospital, Hotel, HotelFilters, TravelVibe, ItineraryDay, FlightOption } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Generic Image Generation Helper
export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export const fetchCitiesForCountry = async (country: string): Promise<CityOption[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `List 5 major cities in ${country}. Include the capital. Briefly describe location/direction relative to the center of the country.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              isCapital: { type: Type.BOOLEAN },
              direction: { type: Type.STRING, description: "Location direction, e.g., 'Northern coast'" },
              description: { type: Type.STRING, description: "One short sentence tagline about the city" }
            },
            required: ["name", "isCapital", "direction", "description"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
};

export const fetchTravelDetails = async (country: string, city: string, date: string, vibes: TravelVibe[]): Promise<{ weather: WeatherData, details: TravelDetails }> => {
  const vibeString = vibes.join(' and ');
  const prompt = `
    I am planning a trip to ${city}, ${country} on ${date}. 
    My desired travel experience is a mix of: "${vibeString}".
    Act as a travel expert and meteorologist.
    
    1. Estimate the likely weather for this specific date.
    2. Suggest clothing.
    3. Suggest local cuisines and 3 famous restaurants.
    4. Provide sunrise/sunset times and a specific location to watch them.
    5. Write a short welcoming message from the perspective of a local guide avatar (anime character).
    6. Write a short summary of the city.
    7. Identify the primary local language.
    8. Suggest 4 specific places/activities in ${city} that strictly match the "${vibeString}" experience.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weather: {
              type: Type.OBJECT,
              properties: {
                currentTemp: { type: Type.NUMBER },
                condition: { type: Type.STRING },
                high: { type: Type.NUMBER },
                low: { type: Type.NUMBER },
                feelsLike: { type: Type.NUMBER },
                humidity: { type: Type.NUMBER },
                windSpeed: { type: Type.NUMBER },
                uvIndex: { type: Type.NUMBER },
                description: { type: Type.STRING },
                hourly: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { time: { type: Type.STRING }, temp: { type: Type.NUMBER }, icon: { type: Type.STRING } }
                  }
                },
                daily: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { day: { type: Type.STRING }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER }, icon: { type: Type.STRING } }
                  }
                }
              }
            },
            details: {
              type: Type.OBJECT,
              properties: {
                citySummary: { type: Type.STRING },
                clothingSuggestion: { type: Type.STRING },
                cuisines: { type: Type.ARRAY, items: { type: Type.STRING } },
                restaurants: { type: Type.ARRAY, items: { type: Type.STRING } },
                sunrise: { type: Type.STRING },
                sunset: { type: Type.STRING },
                bestViewSpot: { type: Type.STRING },
                avatarMessage: { type: Type.STRING },
                localLanguage: { type: Type.STRING },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      type: { type: Type.STRING },
                      location: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Error fetching travel details:", error);
    throw error;
  }
};

export const fetchItinerary = async (country: string, city: string, vibes: TravelVibe[], days: number): Promise<ItineraryDay[]> => {
    const vibeString = vibes.join(' and ');
    const prompt = `
      Create a detailed ${days}-day itinerary for a trip to ${city}, ${country}.
      The trip should focus on these vibes: ${vibeString}.
      For each day, provide a "Theme" and 3-4 distinct activities (Morning, Afternoon, Evening).
      Ensure the flow is logical geographically.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                theme: { type: Type.STRING, description: "A catchy title for the day's vibe" },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING, description: "e.g., Morning, 2:00 PM, Evening" },
                      activity: { type: Type.STRING, description: "Name of the activity or place" },
                      description: { type: Type.STRING, description: "Brief details about what to do" },
                      place: { type: Type.STRING, description: "Specific location name for mapping context" }
                    }
                  }
                }
              }
            }
          }
        }
      });
  
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Error fetching itinerary:", error);
      return [];
    }
};

export const fetchHospitals = async (city: string): Promise<Hospital[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find top 3 major hospitals or medical centers in ${city}.`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const hospitals: Hospital[] = chunks
      .map((c: any) => {
        const source = c.maps || c.web;
        if (!source) return null;
        return {
          name: source.title || "Medical Center",
          uri: source.uri,
        };
      })
      .filter((h: any) => h)
      .slice(0, 5); 
    
    return hospitals.length > 0 ? hospitals : [
        { name: "City General Hospital", address: "Central District" },
        { name: "International Medical Center", address: "Downtown" }
    ];
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    return [];
  }
};

export const getDestinationAvatar = async (country: string, city: string): Promise<string | null> => {
  const prompt = `Create a high-quality, vibrant anime-style character portrait of a friendly tour guide in ${city}, ${country}. 
  The character should have distinctive features, hair, and clothing inspired by modern ${country} fashion with traditional cultural accents suitable for ${city}.
  The art style should be polished, colorful, and inviting, similar to high-budget anime productions.
  The background should be a soft, blurred scenic landmark of ${city}.
  Ensure the character is facing forward and smiling warmly.`;
  return await generateImage(prompt);
};

export const fetchHotels = async (city: string, filters: HotelFilters): Promise<Hotel[]> => {
  const filterDesc = [
    filters.price !== 'any' ? `${filters.price} price range` : '',
    filters.petFriendly ? 'pet friendly' : '',
    filters.childFriendly ? 'child/family friendly with kids activities' : ''
  ].filter(Boolean).join(', ');

  const prompt = `Find 4 real hotels in ${city} that match these criteria: ${filterDesc || 'top rated'}. 
  Provide structured data including specific amenities.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              priceRange: { type: Type.STRING, description: "Use symbols $, $$, or $$$" },
              rating: { type: Type.NUMBER },
              description: { type: Type.STRING },
              isPetFriendly: { type: Type.BOOLEAN },
              isChildFriendly: { type: Type.BOOLEAN },
              location: { type: Type.STRING }
            },
            required: ["name", "priceRange", "rating", "description", "isPetFriendly", "isChildFriendly"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching hotels", error);
    return [];
  }
}

export const fetchFlights = async (origin: string, destination: string, date: string): Promise<FlightOption[]> => {
  const prompt = `
    Find 3 realistic flight options from ${origin} to ${destination} for travel around ${date}.
    Provide realistic airlines operating this route, estimated prices, and durations.
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              airline: { type: Type.STRING },
              flightNumber: { type: Type.STRING },
              departureTime: { type: Type.STRING },
              arrivalTime: { type: Type.STRING },
              duration: { type: Type.STRING },
              price: { type: Type.STRING },
              type: { type: Type.STRING, description: "e.g., Non-stop or 1 Stop" }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following text to ${targetLanguage}. Return ONLY the translated text, no explanation. Text: "${text}"`,
    });
    return response.text || "";
  } catch (error) {
    return "Translation failed.";
  }
}

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS generation failed", error);
    return null;
  }
};

export const getCityPanorama = async (city: string): Promise<string | null> => {
  // Enhanced prompt for better textures and lighting
  const prompt = `Generate an ultra-realistic, 8k resolution, 360-degree equirectangular panoramic image of ${city}.
  The view should be from a prime vantage point (e.g., a rooftop or high hill) capturing the city's iconic skyline and streets.
  Focus on highly detailed textures for buildings, realistic lighting (golden hour or clear day), and atmospheric depth.
  The image must be seamless, photorealistic, and suitable for a high-quality VR skybox. Avoid text or severe distortions at the poles.`;
  return await generateImage(prompt);
};