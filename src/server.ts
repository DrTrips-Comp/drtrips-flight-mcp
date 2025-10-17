import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { FlightSearchInputSchema, FlightSearchInput } from './models/flight-models.js';
import { FlightSearchAPI } from './services/flight-api.js';
import { BOOKING_API_KEY, CHARACTER_LIMIT } from './config/settings.js';

/**
 * Format flight search results as human-readable Markdown
 */
function formatFlightsAsMarkdown(responseData: any, validated: FlightSearchInput): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Flight Search Results\n`);
  lines.push(`**${validated.origin}** → **${validated.destination}**\n`);

  // Trip details
  lines.push(`## Trip Details`);
  lines.push(`- **Type**: ${responseData.search_params.trip_type === 'ROUNDTRIP' ? 'Round-trip' : 'One-way'}`);
  lines.push(`- **Departure**: ${validated.departure_date}`);
  if (validated.return_date) {
    lines.push(`- **Return**: ${validated.return_date}`);
  }
  lines.push(`- **Passengers**: ${validated.adults} adult${validated.adults > 1 ? 's' : ''}`);
  if (validated.children_ages && validated.children_ages.length > 0) {
    const childAges = validated.children_ages.map(age => age === 0 ? 'infant' : `${age}yo`).join(', ');
    lines.push(`  - Children: ${childAges}`);
  }
  lines.push(`- **Cabin**: ${validated.cabin_class}`);
  lines.push(`- **Sort**: ${validated.sort}`);
  lines.push(`\n**Found ${responseData.total_flights} flight${responseData.total_flights !== 1 ? 's' : ''}** (${responseData.total_request} API request${responseData.total_request !== 1 ? 's' : ''})\n`);

  // No results
  if (responseData.flights.length === 0) {
    lines.push(`\n*No flights found for these search criteria. Try:*`);
    lines.push(`- Different dates`);
    lines.push(`- Nearby airports`);
    lines.push(`- Different cabin class`);
    return lines.join('\n');
  }

  lines.push(`---\n`);

  // List flights
  responseData.flights.forEach((flight: any, index: number) => {
    lines.push(`## Flight ${index + 1}: ${flight.price.total}`);
    lines.push('');

    // Outbound and return segments
    const outboundSegments = flight.flights.filter((seg: any, i: number) => {
      if (responseData.search_params.trip_type === 'ONEWAY') return true;
      return i === 0; // For round-trip, first segment is outbound
    });

    const returnSegments = responseData.search_params.trip_type === 'ROUNDTRIP'
      ? flight.flights.slice(1)
      : [];

    // Outbound
    if (outboundSegments.length > 0) {
      lines.push(`### ✈️ Outbound`);
      outboundSegments.forEach((segment: any) => {
        const depTime = new Date(segment.departure.time).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
        const arrTime = new Date(segment.arrival.time).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
        const duration = `${Math.floor(segment.duration_minutes / 60)}h ${segment.duration_minutes % 60}m`;

        lines.push(`- **${segment.airline.name}** (${segment.airline.code})`);
        lines.push(`  - **From**: ${segment.departure.code} - ${segment.departure.name}, ${segment.departure.city}`);
        lines.push(`    - ${depTime} • Terminal ${segment.departure.terminal}`);
        lines.push(`  - **To**: ${segment.arrival.code} - ${segment.arrival.name}, ${segment.arrival.city}`);
        lines.push(`    - ${arrTime} • Terminal ${segment.arrival.terminal}`);
        lines.push(`  - **Duration**: ${duration} • **Cabin**: ${segment.cabin_class}`);
        lines.push('');
      });
    }

    // Return
    if (returnSegments.length > 0) {
      lines.push(`### 🔙 Return`);
      returnSegments.forEach((segment: any) => {
        const depTime = new Date(segment.departure.time).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
        const arrTime = new Date(segment.arrival.time).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
        const duration = `${Math.floor(segment.duration_minutes / 60)}h ${segment.duration_minutes % 60}m`;

        lines.push(`- **${segment.airline.name}** (${segment.airline.code})`);
        lines.push(`  - **From**: ${segment.departure.code} - ${segment.departure.name}, ${segment.departure.city}`);
        lines.push(`    - ${depTime} • Terminal ${segment.departure.terminal}`);
        lines.push(`  - **To**: ${segment.arrival.code} - ${segment.arrival.name}, ${segment.arrival.city}`);
        lines.push(`    - ${arrTime} • Terminal ${segment.arrival.terminal}`);
        lines.push(`  - **Duration**: ${duration} • **Cabin**: ${segment.cabin_class}`);
        lines.push('');
      });
    }

    // Price breakdown
    lines.push(`### 💰 Price Breakdown`);
    lines.push(`- **Total**: ${flight.price.total}`);
    lines.push(`- Base Fare: ${flight.price.base_fare}`);
    lines.push(`- Taxes: ${flight.price.taxes}`);
    if (flight.price.discount !== '$0.00') {
      lines.push(`- Discount: ${flight.price.discount}`);
    }
    lines.push('');

    // Booking link
    lines.push(`**[Book this flight on Booking.com](${flight.booking_url})**`);
    lines.push('');
    lines.push(`---\n`);
  });

  return lines.join('\n');
}

export function createFlightMcpServer(): Server {
  const server = new Server(
    {
      name: 'flight-mcp-server',
      version: '1.0.10'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const flightAPI = new FlightSearchAPI();

  // Register tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'flight_search_flights',
        description: `Search for flights using Booking.com API with comprehensive filtering and passenger options.

This tool searches for both round-trip and one-way flights, automatically resolving city/airport names to Booking.com IDs. Supports flexible passenger configurations including adults, children with specific ages, and infants. Returns up to 50 flights with complete pricing, flight details, and direct booking URLs.

Args:
  - origin (string): Departure city or airport name/code (e.g., "New York", "JFK")
  - destination (string): Arrival city or airport name/code (e.g., "London", "LHR")
  - fromId (string, optional): Pre-resolved Booking.com origin ID (e.g., "JFK.AIRPORT")
  - toId (string, optional): Pre-resolved Booking.com destination ID
  - departure_date (string): Departure date in YYYY-MM-DD format (e.g., "2025-12-01")
  - return_date (string, optional): Return date for round-trip in YYYY-MM-DD format (omit for one-way)
  - adults (number): Number of adult passengers, 1-9 (default: 1)
  - children_ages (number[]): Ages of children 0-17, where 0 = infant (e.g., [0, 8, 12] for infant, 8yo, 12yo)
  - cabin_class ('ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'): Cabin preference (default: 'ECONOMY')
  - sort ('BEST' | 'CHEAPEST' | 'FASTEST'): Sort order (default: 'BEST')
  - currency (string): Currency code for prices (default: 'USD')
  - limit (number): Maximum flights to return, 1-50 (default: 5)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "search_params": {
      "origin": string,
      "destination": string,
      "departure_date": string,
      "return_date": string | null,
      "trip_type": "ROUNDTRIP" | "ONEWAY",
      "adults": number,
      "children_ages": number[],
      "cabin_class": string,
      "sort": string,
      "currency": string
    },
    "total_flights": number,        // Number of flights returned
    "total_request": number,        // API requests made
    "flights": [
      {
        "id": string,               // Flight offer ID
        "price": {
          "total": string,          // Total price (e.g., "$850.00")
          "base_fare": string,
          "taxes": string,
          "discount": string
        },
        "trip_type": "ROUNDTRIP" | "ONEWAY",
        "booking_url": string,      // Direct Booking.com URL
        "flights": [                // Flight segments (outbound + return if applicable)
          {
            "departure": {
              "name": string,       // Airport name
              "code": string,       // IATA code
              "city": string,
              "country": string,
              "terminal": string,
              "time": string        // ISO datetime
            },
            "arrival": { /* same structure as departure */ },
            "duration_minutes": number,
            "cabin_class": string,
            "airline": {
              "name": string,
              "code": string,
              "logo": string        // URL
            }
          }
        ]
      }
    ]
  }

  For Markdown format: Human-readable formatted text with flight details, prices, and booking links.

Examples:
  - Use when: "Find flights from NYC to London next month for 2 adults"
    -> params: { origin: "New York", destination: "London", departure_date: "2025-11-01", return_date: "2025-11-08", adults: 2 }
  - Use when: "Search business class flights LAX to Tokyo round-trip"
    -> params: { origin: "LAX", destination: "Tokyo", cabin_class: "BUSINESS", ... }
  - Use when: "Find cheapest one-way from Chicago to Miami for family of 4 (2 adults, kids aged 8 and 12)"
    -> params: { origin: "Chicago", destination: "Miami", adults: 2, children_ages: [8, 12], sort: "CHEAPEST", ... }
  - Don't use when: Need to book the flight (this only searches; use booking_url from results to complete purchase)

Error Handling:
  - Returns "Unable to resolve origin" if location lookup fails
    Solution: Try using specific airport codes (e.g., "JFK" instead of "New York area") or major city names
  - Returns empty flights array if no results found
    Solution: Try different dates, nearby airports, or broader search criteria
  - Returns "Booking API key not configured" if RAPID_API_KEY environment variable not set
    Solution: Set RAPID_API_KEY in environment or .env file`,
        inputSchema: zodToJsonSchema(FlightSearchInputSchema) as any,
        annotations: {
          readOnlyHint: true,       // Does not modify data, only searches
          destructiveHint: false,   // Not destructive
          idempotentHint: true,     // Same query returns same results
          openWorldHint: true       // Interacts with external Booking.com API
        }
      }
    ]
  }));

  // Register tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'flight_search_flights') {
      try {
        // Validate input
        const validated = FlightSearchInputSchema.parse(args);

        // Call API
        const { flights, total_request } = await flightAPI.searchFlights({
          origin: validated.origin,
          destination: validated.destination,
          fromId: validated.fromId,
          toId: validated.toId,
          depart_date: validated.departure_date,
          return_date: validated.return_date,
          adults: validated.adults,
          children_ages: validated.children_ages,
          cabin_class: validated.cabin_class,
          sort: validated.sort,
          currency: validated.currency,
          limit: validated.limit
        });

        // Calculate metadata
        const totalFlights = flights.length;
        const tripType = validated.return_date ? 'ROUNDTRIP' : 'ONEWAY';

        // Build response data
        const responseData: any = {
          search_params: {
            origin: validated.origin,
            destination: validated.destination,
            departure_date: validated.departure_date,
            return_date: validated.return_date,
            trip_type: tripType,
            adults: validated.adults,
            children_ages: validated.children_ages,
            cabin_class: validated.cabin_class,
            sort: validated.sort,
            currency: validated.currency
          },
          total_flights: totalFlights,
          total_request: total_request,
          flights: flights
        };

        // Format response based on requested format
        let responseText: string;

        if (validated.response_format === 'markdown') {
          // Human-readable Markdown format
          responseText = formatFlightsAsMarkdown(responseData, validated);
        } else {
          // Machine-readable JSON format
          responseText = JSON.stringify(responseData, null, 2);
        }

        // Check character limit and truncate if necessary
        if (responseText.length > CHARACTER_LIMIT) {
          const truncatedFlights = Math.max(1, Math.floor(flights.length / 2));
          responseData.flights = flights.slice(0, truncatedFlights);

          if (validated.response_format === 'markdown') {
            responseText = formatFlightsAsMarkdown(responseData, validated);
            responseText += `\n\n---\n\n⚠️ **Response Truncated**: Results were truncated from ${flights.length} to ${truncatedFlights} flights due to size limits (${CHARACTER_LIMIT} characters). To see more results:\n- Use smaller \`limit\` parameter (currently: ${validated.limit})\n- Add more specific filters (dates, cabin class)\n- Request JSON format for more compact output`;
          } else {
            responseData.flights = flights.slice(0, truncatedFlights);
            responseData.truncated = true;
            responseData.truncation_message = `Response truncated from ${flights.length} to ${truncatedFlights} flights due to size limits. Use smaller limit parameter or add filters to see more results.`;
            responseText = JSON.stringify(responseData, null, 2);
          }
        }

        // Return formatted response
        return {
          content: [{
            type: 'text',
            text: responseText
          }],
          metadata: {
            total_flights: totalFlights,
            total_request: total_request,
            origin: validated.origin,
            destination: validated.destination,
            departure_date: validated.departure_date,
            return_date: validated.return_date,
            trip_type: tripType,
            adults: validated.adults,
            cabin_class: validated.cabin_class,
            response_format: validated.response_format
          }
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `❌ Error searching flights: ${errorMessage}`
          }],
          isError: true
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}
