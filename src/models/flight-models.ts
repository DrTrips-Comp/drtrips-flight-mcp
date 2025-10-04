import { z } from 'zod';

/**
 * Validated payload for flight search requests.
 * Migrated from Python Pydantic model.
 */
export const FlightSearchInputSchema = z.object({
  origin: z.string().min(1).describe('Human-readable origin airport code or city'),
  destination: z.string().min(1).describe('Human-readable destination airport code or city'),
  fromId: z.string().optional().describe('Booking.com origin identifier (fromId). Defaults to origin when omitted.'),
  toId: z.string().optional().describe('Booking.com destination identifier (toId). Defaults to destination when omitted.'),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Departure date (YYYY-MM-DD)'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Return date (YYYY-MM-DD) for round trip'),
  adults: z.number().int().min(1).max(9).default(1).describe('Number of adults (1-9)'),
  children: z.number().int().min(0).max(8).default(0).describe('Number of children under 18 (excludes infants)'),
  infants: z.number().int().min(0).max(8).default(0).describe('Number of infants (under 2)'),
  children_ages: z.array(z.number().int().min(0).max(17)).optional().describe('Ages for each child/infant (0-17). Include 0 for infants.'),
  cabin_class: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY').describe('Cabin class preference'),
  sort: z.enum(['BEST', 'CHEAPEST', 'FASTEST']).default('BEST').describe('Sort order for search results'),
  currency: z.string().default('USD').describe('Currency code (Booking flights API requires USD)')
});

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
