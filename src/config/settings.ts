import dotenv from 'dotenv';

dotenv.config();

// API Configuration
export const BOOKING_API_KEY = process.env.RAPID_API_KEY || '';

// Unused API keys (reserved for future features)
// export const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
// export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
// export const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';

// API URLs
export const BOOKING_BASE_URL = 'https://booking-com15.p.rapidapi.com/api/v1';

// Unused API URLs (reserved for future features)
// export const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';
// export const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';
// export const PERPLEXITY_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Response limits
export const CHARACTER_LIMIT = 25000; // Maximum response size in characters to prevent overwhelming LLM context

// Validation
if (!BOOKING_API_KEY) {
  console.error('Warning: RAPID_API_KEY not set');
}
