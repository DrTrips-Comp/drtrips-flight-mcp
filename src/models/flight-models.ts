import { z } from 'zod';

/**
 * Validated payload for flight search requests.
 * Migrated from Python Pydantic model.
 */
export const FlightSearchInputSchema = z.object({
  origin: z.string().min(1).describe('Human-readable origin airport code or city (e.g., "New York", "JFK")'),
  destination: z.string().min(1).describe('Human-readable destination airport code or city (e.g., "London", "LHR")'),
  fromId: z.string().optional().describe('Booking.com origin identifier (fromId). Defaults to origin when omitted.'),
  toId: z.string().optional().describe('Booking.com destination identifier (toId). Defaults to destination when omitted.'),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Departure date in YYYY-MM-DD format (e.g., "2025-12-01")'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Return date in YYYY-MM-DD format for round trip (omit for one-way)'),
  adults: z.number().int().min(1).max(9).default(1).describe('Number of adult passengers (1-9, default: 1)'),
  children_ages: z.array(z.number().int().min(0).max(17)).optional().describe('Ages for each child/infant (0-17). Age 0 represents infant. Example: [0, 8, 12] for infant, 8-year-old, and 12-year-old'),
  cabin_class: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY').describe('Cabin class preference (default: ECONOMY)'),
  sort: z.enum(['BEST', 'CHEAPEST', 'FASTEST']).default('BEST').describe('Sort order for search results (default: BEST)'),
  currency: z.string().default('USD').describe('Currency code for prices (default: USD)'),
  limit: z.number().int().min(1).max(50).default(5).describe('Maximum number of flights to return (1-50, default: 5)'),
  response_format: z.enum(['json', 'markdown']).default('markdown').describe("Output format: 'markdown' for human-readable or 'json' for structured data (default: markdown)")
}).strict();

export type FlightSearchInput = z.infer<typeof FlightSearchInputSchema>;

/**
 * Airport/City information
 */
export interface AirportInfo {
  name: string;
  code: string;
  city: string;
  country: string;
  terminal: string;
  time: string;
}

/**
 * Airline information
 */
export interface AirlineInfo {
  name: string;
  code: string;
  logo: string;
}

/**
 * Flight segment details
 */
export interface FlightSegment {
  departure: AirportInfo;
  arrival: AirportInfo;
  duration_minutes: number;
  cabin_class: string;
  airline: AirlineInfo;
}

/**
 * Price breakdown
 */
export interface PriceInfo {
  total: string;
  base_fare: string;
  taxes: string;
  discount: string;
}

/**
 * Complete flight result
 */
export interface FlightResult {
  id: string;
  price: PriceInfo;
  trip_type: 'ROUNDTRIP' | 'ONEWAY';
  booking_url: string;
  flights: FlightSegment[];
}

/**
 * API response structure from Booking.com
 */
export interface BookingApiResponse {
  data?: {
    flightOffers?: any[];
  };
}

/**
 * Location search result from Booking.com
 */
export interface LocationSearchResult {
  data?: Array<{
    id?: string;
    type?: string;
  }>;
}
