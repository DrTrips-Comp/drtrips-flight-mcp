import axios, { AxiosError } from 'axios';
import { BOOKING_API_KEY, BOOKING_BASE_URL } from '../config/settings.js';
import type {
  FlightResult,
  FlightSegment,
  BookingApiResponse,
  LocationSearchResult
} from '../models/flight-models.js';

/**
 * Search parameters passed to format functions
 */
interface SearchContext {
  fromId: string;
  toId: string;
  departure_date: string;
  return_date?: string;
  adults: number;
  children: number[];
  children_ages: number[];
  children_count: number;
  infants: number;
  cabin_class: string;
  sort: string;
  currency: string;
}

export class FlightSearchAPI {
  private readonly headers: Record<string, string>;

  constructor() {
    if (!BOOKING_API_KEY) {
      throw new Error('Booking API key not configured');
    }
    this.headers = {
      'X-RapidAPI-Key': BOOKING_API_KEY,
      'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
    };
  }

  /**
   * Resolve a Booking.com flight location identifier for a free-form query.
   * Prefers CITY type over AIRPORT when available.
   */
  async fetchFlightLocationId(query: string): Promise<string | null> {
    if (!query) {
      return null;
    }

    const url = `${BOOKING_BASE_URL}/flights/searchDestination`;
    const params = { query };

    try {
      const response = await axios.get<LocationSearchResult>(url, {
        headers: this.headers,
        params,
        timeout: 10000
      });

      if (response.status !== 200) {
        console.warn(`Flight destination lookup failed with status ${response.status}`);
        return null;
      }

      const items = response.data?.data || [];
      if (items.length === 0) {
        return null;
      }

      // Prefer CITY type over AIRPORT
      const hasCity = items.some(item => item.type === 'CITY');
      const targetType = hasCity ? 'CITY' : 'AIRPORT';

      for (const item of items) {
        if (item.type === targetType && item.id) {
          return item.id;
        }
      }

      // Fallback to first item
      return items[0]?.id || null;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Flight destination lookup error:', error.message);
      } else {
        console.error('Flight destination lookup error:', error);
      }
      return null;
    }
  }

  /**
   * Search for flights with concurrent processing.
   */
  async searchFlights(params: {
    origin?: string;
    destination?: string;
    fromId?: string;
    toId?: string;
    depart_date: string;
    return_date?: string;
    adults?: number;
    children_ages?: number[];
    cabin_class?: string;
    sort?: string;
    currency?: string;
    limit?: number;
  }): Promise<{ flights: FlightResult[]; total_request: number }> {
    const {
      origin,
      destination,
      fromId,
      toId,
      depart_date,
      return_date,
      adults = 1,
      children_ages = [],
      cabin_class = 'ECONOMY',
      sort = 'BEST',
      currency = 'USD',
      limit = 5
    } = params;

    // Track API requests
    let totalRequests = 0;

    // Resolve location IDs
    let resolvedFromId = fromId;
    let resolvedToId = toId;

    if (!resolvedFromId && origin) {
      resolvedFromId = await this.fetchFlightLocationId(origin) || undefined;
      totalRequests++; // Count location lookup request
    }
    if (!resolvedToId && destination) {
      resolvedToId = await this.fetchFlightLocationId(destination) || undefined;
      totalRequests++; // Count location lookup request
    }

    if (!resolvedFromId) {
      throw new Error(
        `Unable to resolve origin '${origin || fromId}' to a Booking.com location. ` +
        `Try using a specific airport code (e.g., 'JFK' instead of 'New York area') ` +
        `or a major city name (e.g., 'New York' instead of 'NY').`
      );
    }
    if (!resolvedToId) {
      throw new Error(
        `Unable to resolve destination '${destination || toId}' to a Booking.com location. ` +
        `Try using a specific airport code (e.g., 'LHR' instead of 'London area') ` +
        `or a major city name (e.g., 'London' instead of 'LON').`
      );
    }

    // Validate and normalize parameters
    const validCabinClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];
    const cabinValue = validCabinClasses.includes(cabin_class) ? cabin_class : 'ECONOMY';

    const validSorts = ['BEST', 'CHEAPEST', 'FASTEST'];
    const sortValue = validSorts.includes(sort) ? sort : 'BEST';

    // Normalize children ages
    const normalizedChildren: number[] = [];
    for (const age of children_ages) {
      try {
        const ageInt = typeof age === 'number' ? age : parseInt(String(age));
        normalizedChildren.push(Math.min(Math.max(ageInt, 0), 17));
      } catch {
        continue;
      }
    }

    const infantsCount = normalizedChildren.filter(age => age === 0).length;

    // Build search parameters
    const searchParams: Record<string, string> = {
      fromId: resolvedFromId,
      toId: resolvedToId,
      departDate: depart_date,
      pageNo: '1',
      adults: String(Math.max(1, adults)),
      sort: sortValue,
      cabinClass: cabinValue,
      currency_code: currency
    };

    if (return_date) {
      searchParams.returnDate = return_date;
    }

    if (normalizedChildren.length > 0) {
      searchParams.children = String(normalizedChildren.length);
      searchParams.children_age = normalizedChildren.join(',');
    } else {
      searchParams.children = '0';
    }

    // Build search context for formatting
    const searchContext: SearchContext = {
      fromId: resolvedFromId,
      toId: resolvedToId,
      departure_date: depart_date,
      return_date,
      adults,
      children: normalizedChildren,
      children_ages: normalizedChildren,
      children_count: normalizedChildren.length,
      infants: infantsCount,
      cabin_class: cabinValue,
      sort: sortValue,
      currency
    };

    // Execute search
    try {
      const url = `${BOOKING_BASE_URL}/flights/searchFlights`;
      const response = await axios.get<BookingApiResponse>(url, {
        headers: this.headers,
        params: searchParams,
        timeout: 30000
      });

      totalRequests++; // Count flight search request

      if (response.status === 200) {
        const flights = response.data?.data?.flightOffers || [];

        // Process flights up to the specified limit concurrently
        const flightsToProcess = flights.slice(0, limit);
        const formattingPromises = flightsToProcess.map(flight =>
          this.formatFlightDataAsync(flight, searchContext)
        );

        const results = await Promise.allSettled(formattingPromises);

        // Filter out failed results
        const flightResults = results
          .filter((result): result is PromiseFulfilledResult<FlightResult> => result.status === 'fulfilled')
          .map(result => result.value);

        return {
          flights: flightResults,
          total_request: totalRequests
        };
      }

      console.error(`Flight search failed: ${response.status}`);
      return {
        flights: [],
        total_request: totalRequests
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error searching flights:', error.message);
      } else {
        console.error('Error searching flights:', error);
      }
      return {
        flights: [],
        total_request: totalRequests
      };
    }
  }

  /**
   * Construct a Booking.com flight URL.
   */
  private constructBookingUrl(flightData: any, searchParams: SearchContext): string {
    const baseUrl = 'https://flights.booking.com/flights';

    // Get origin and destination codes
    let originCode = searchParams.fromId;
    let destinationCode = searchParams.toId;

    // Extract clean airport codes (remove .AIRPORT or .CITY suffix for URL path)
    const originClean = originCode.split('.')[0];
    const destinationClean = destinationCode.split('.')[0];

    // Determine trip type
    const tripType = searchParams.return_date ? 'ROUNDTRIP' : 'ONEWAY';

    // Construct URL path
    const flightToken = flightData.id || '';
    const urlPath = flightToken
      ? `${originClean}-${destinationClean}/${flightToken}`
      : `${originClean}-${destinationClean}`;

    // Construct query parameters
    const queryParams: Record<string, string | number> = {
      type: tripType,
      adults: searchParams.adults,
      cabinClass: searchParams.cabin_class,
      from: originCode, // Use full origin with .AIRPORT/.CITY suffix
      to: destinationCode, // Use full destination with .AIRPORT/.CITY suffix
      depart: searchParams.departure_date,
      currency: searchParams.currency
    };

    // Add return date for round trips
    if (tripType === 'ROUNDTRIP' && searchParams.return_date) {
      queryParams.return = searchParams.return_date;
    }

    // Add children and infants
    const childrenCount = searchParams.children_count || 0;
    if (childrenCount > 0) {
      queryParams.children = childrenCount;
      if (searchParams.children_ages && searchParams.children_ages.length > 0) {
        queryParams.children_age = searchParams.children_ages.join(',');
      }
    }

    if (searchParams.infants > 0) {
      queryParams.infants = searchParams.infants;
    }

    // Build query string
    const urlParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      urlParams.append(k, String(v));
    });
    const queryString = urlParams.toString();

    return `${baseUrl}/${urlPath}?${queryString}`;
  }

  /**
   * Format flight data asynchronously.
   */
  private async formatFlightDataAsync(
    flight: any,
    searchParams: SearchContext
  ): Promise<FlightResult> {
    try {
      // Price formatting
      const priceBreakdown = flight.priceBreakdown || {};
      const totalRounded = priceBreakdown.totalRounded || {};
      const baseFare = priceBreakdown.baseFare || {};
      const tax = priceBreakdown.tax || {};
      const discount = priceBreakdown.discount || {};

      const formatPrice = (units: number, nanos: number) => {
        const cents = Math.floor(nanos / 10000000);
        return `$${units}.${cents.toString().padStart(2, '0')}`;
      };

      // Determine trip type
      const tripType = searchParams.return_date ? 'ROUNDTRIP' : 'ONEWAY';

      const formattedFlight: FlightResult = {
        id: flight.id || '',
        price: {
          total: formatPrice(totalRounded.units || 0, totalRounded.nanos || 0),
          base_fare: formatPrice(baseFare.units || 0, baseFare.nanos || 0),
          taxes: formatPrice(tax.units || 0, tax.nanos || 0),
          discount: formatPrice(discount.units || 0, discount.nanos || 0)
        },
        trip_type: tripType,
        booking_url: this.constructBookingUrl(flight, searchParams),
        flights: []
      };

      // Process segments concurrently
      const segments = flight.segments || [];
      const segmentPromises = segments.map((segment: any) =>
        this.processSegmentAsync(segment)
      );

      const segmentResults = await Promise.allSettled(segmentPromises);

      formattedFlight.flights = segmentResults
        .filter((result): result is PromiseFulfilledResult<FlightSegment | null> =>
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value as FlightSegment);

      return formattedFlight;

    } catch (error) {
      console.error('Error formatting flight data:', error);
      return {
        id: flight.id || '',
        price: {
          total: '$0.00',
          base_fare: '$0.00',
          taxes: '$0.00',
          discount: '$0.00'
        },
        trip_type: 'ONEWAY',
        booking_url: '',
        flights: []
      };
    }
  }

  /**
   * Process flight segment asynchronously.
   */
  private async processSegmentAsync(segment: any): Promise<FlightSegment | null> {
    try {
      const departureAirport = segment.departureAirport || {};
      const arrivalAirport = segment.arrivalAirport || {};
      const legs = segment.legs || [];

      if (legs.length === 0) {
        return null;
      }

      const leg = legs[0];
      const carriersData = leg.carriersData || [];
      const carrier = carriersData[0] || {};

      const formattedSegment: FlightSegment = {
        departure: {
          name: departureAirport.name || '',
          code: departureAirport.code || '',
          city: departureAirport.cityName || '',
          country: departureAirport.countryName || '',
          terminal: leg.departureTerminal || 'N/A',
          time: segment.departureTime || ''
        },
        arrival: {
          name: arrivalAirport.name || '',
          code: arrivalAirport.code || '',
          city: arrivalAirport.cityName || '',
          country: arrivalAirport.countryName || '',
          terminal: leg.arrivalTerminal || 'N/A',
          time: segment.arrivalTime || ''
        },
        duration_minutes: Math.floor((segment.totalTime || 0) / 60),
        cabin_class: leg.cabinClass || 'ECONOMY',
        airline: {
          name: carrier.name || '',
          code: carrier.code || '',
          logo: carrier.logo || ''
        }
      };

      return formattedSegment;

    } catch (error) {
      console.error('Error processing segment:', error);
      return null;
    }
  }
}
