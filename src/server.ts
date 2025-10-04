import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { FlightSearchInputSchema } from './models/flight-models.js';
import { FlightSearchAPI } from './services/flight-api.js';
import { BOOKING_API_KEY } from './config/settings.js';

export function createFlightMcpServer(): Server {
  const server = new Server(
    {
      name: 'flight-mcp-server',
      version: '1.0.0'
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
        name: 'search_flights',
        description: 'Search for flights using Booking.com API. Supports round-trip and one-way flights with flexible passenger configurations (adults, children, infants). Automatically resolves location names to Booking.com identifiers.',
        inputSchema: zodToJsonSchema(FlightSearchInputSchema) as any
      }
    ]
  }));

  // Register tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'search_flights') {
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
          currency: validated.currency
        });

        // Calculate metadata
        const totalFlights = flights.length;
        const tripType = validated.return_date ? 'ROUNDTRIP' : 'ONEWAY';

        // Return structured data as JSON
        const responseData = {
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

        // Return with structured JSON data
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(responseData, null, 2)
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
            cabin_class: validated.cabin_class
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
