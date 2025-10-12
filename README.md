# Flight Search MCP Server

[![npm version](https://img.shields.io/npm/v/flight-mcp-server.svg)](https://www.npmjs.com/package/flight-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/flight-mcp-server.svg)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue)](https://modelcontextprotocol.io)

A TypeScript-based MCP (Model Context Protocol) server that enables AI assistants like Claude to search for flights using the Booking.com Flights API. This server provides intelligent flight search capabilities with automatic location resolution, concurrent processing, and comprehensive booking information.

## Quick Links

- [NPM Package](https://www.npmjs.com/package/flight-mcp-server)
- [MCP Registry](https://modelcontextprotocol.io/registry/io.github.drtrips-comp/flight-search)
- [GitHub Repository](https://github.com/DrTrips-Comp/drtrips-flight-mcp)
- [Booking.com API](https://rapidapi.com/DataCrawler/api/booking-com15)

## Features

- **Flight Search**: Comprehensive flight search with Booking.com API integration
- **Round-trip & One-way**: Support for both round-trip and one-way flight searches
- **Flexible Passengers**: Configure adults, children (with ages), and infants
- **Smart Location Resolution**: Automatically converts city names and airport codes to Booking.com IDs
- **Concurrent Processing**: Promise-based architecture for optimal performance
- **Direct Booking URLs**: Generates ready-to-use Booking.com URLs with all search parameters
- **Type Safety**: Full TypeScript implementation with Zod runtime validation
- **Cabin Class Options**: Economy, Premium Economy, Business, and First Class support
- **Flexible Sorting**: Sort by price, duration, departure time, arrival time, or quality

## Prerequisites

- **Node.js**: Version 18 or higher
- **RapidAPI Account**: Required for Booking.com Flights API access
  - Sign up at [RapidAPI](https://rapidapi.com/)
  - Subscribe to [Booking.com Flights API](https://rapidapi.com/DataCrawler/api/booking-com15)
  - Get your API key from the API dashboard

## Configuration

### Environment Variables

The server requires a RapidAPI key to access the Booking.com Flights API. You can provide this in two ways:

#### Method 1: Environment Variable (Recommended for Claude Desktop)

Set the environment variable directly in your MCP server configuration (see Claude Desktop setup below).

#### Method 2: .env File (For local development)

Create a `.env` file in your working directory:

```bash
RAPID_API_KEY=your_rapidapi_key_here
```

### Getting Your RapidAPI Key

1. Visit [RapidAPI Booking.com Flights API](https://rapidapi.com/DataCrawler/api/booking-com15)
2. Click "Subscribe to Test" or choose a pricing plan
3. Navigate to the "Endpoints" tab
4. Copy your API key from the `X-RapidAPI-Key` header in the code snippets

## Usage with Claude Desktop

### Configuration

Add the following to your Claude Desktop configuration file:

**MacOS/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "flight-search": {
      "command": "npx",
      "args": ["-y", "flight-mcp-server"],
      "env": {
        "RAPID_API_KEY": "your_rapidapi_key_here"
      }
    }
  }
}
```


## API Reference

### search_flights Tool

The MCP server exposes a single tool for flight searches:

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `origin` | string | Yes* | Departure city or airport (e.g., "New York" or "JFK") |
| `destination` | string | Yes* | Arrival city or airport (e.g., "London" or "LHR") |
| `fromId` | string | No | Booking.com location ID for origin (auto-resolved if not provided) |
| `toId` | string | No | Booking.com location ID for destination (auto-resolved if not provided) |
| `departure_date` | string | Yes | Departure date in YYYY-MM-DD format |
| `return_date` | string | No | Return date in YYYY-MM-DD format (omit for one-way) |
| `adults` | number | No | Number of adults (1-9, default: 1) |
| `children_age` | number[] | No | Array of children ages (0-17, age 0 = infant) |
| `cabin_class` | string | No | Cabin class: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST (default: ECONOMY) |
| `sort` | string | No | Sort by: BEST, PRICE, DURATION, DEPARTURE_TIME, ARRIVAL_TIME (default: BEST) |
| `currency_code` | string | No | Currency for prices (default: USD) |

\* Either `origin`/`destination` OR `fromId`/`toId` must be provided

#### Response

The tool returns a formatted text response containing:

- **Trip Summary**: Type (round-trip/one-way), origin, destination, dates, passengers
- **Flight List**: Up to 5 flights with detailed information:
  - Price (with currency)
  - Outbound segments (airline, flight number, airports, times, duration)
  - Return segments (for round-trips)
  - Direct booking URL
- **Metadata**: Total flights found, API response time

#### Example Response Structure

```
Found 42 flights from New York to London

Trip Details:
- Type: round-trip
- Route: New York (JFK.AIRPORT) → London (LON.CITY)
- Dates: 2025-11-01 to 2025-11-08
- Passengers: 2 adults

Flight 1:
Price: $850.00 USD

Outbound - November 1, 2025:
  Segment 1: British Airways BA 178
    JFK (John F. Kennedy International) → LHR (London Heathrow)
    Depart: 10:30 PM | Arrive: 10:45 AM (+1 day)
    Duration: 7h 15m

Return - November 8, 2025:
  Segment 1: British Airways BA 177
    LHR (London Heathrow) → JFK (John F. Kennedy International)
    Depart: 1:30 PM | Arrive: 4:45 PM
    Duration: 8h 15m

Book: https://www.booking.com/flights/...

---
[Additional flights...]
```

## Example Queries

Once configured with Claude Desktop, you can ask Claude natural language questions:

### Basic Round-trip Search

> "Search for flights from New York to London departing November 1st and returning November 8th for 2 adults"

### One-way Flight

> "Find one-way flights from Los Angeles to Tokyo on December 15th for 1 adult in business class"

### Family Travel

> "Search for flights from Chicago to Orlando departing July 10th and returning July 17th for 2 adults and 2 children ages 8 and 12"

### Budget-Conscious Search

> "Find the cheapest flights from Boston to Miami for March 5-12 for 1 adult in economy"

### Specific Airport

> "Search flights from SFO to CDG departing June 1st returning June 15th for 2 adults in premium economy"

## Advanced Usage

### Cabin Classes

- `ECONOMY` - Standard economy class
- `PREMIUM_ECONOMY` - Premium economy with extra legroom
- `BUSINESS` - Business class
- `FIRST` - First class

### Sort Options

- `BEST` - Booking.com's recommended flights (default)
- `PRICE` - Lowest price first
- `DURATION` - Shortest flight time first
- `DEPARTURE_TIME` - Earliest departure first
- `ARRIVAL_TIME` - Earliest arrival first

### Children and Infants

- Children ages are specified as an array: `[8, 12, 14]`
- Age 0 is treated as an infant (typically free or reduced fare)
- Ages 1-17 are children (may have reduced fares)
- Each airline has different age policies

### Currency Codes

Specify any ISO 4217 currency code:
- `USD` - US Dollar
- `EUR` - Euro
- `GBP` - British Pound
- `JPY` - Japanese Yen
- And more...

## Troubleshooting

### No Results Returned

**Location not found**:
- Try using airport codes instead of city names (e.g., "LAX" instead of "Los Angeles")
- Verify the location name spelling
- Use major airports or cities

**No flights available**:
- Try different dates (some routes may not be available)
- Check if the route exists (some city pairs have no direct connections)
- Extend your date range

### Data Flow

1. Claude sends search request via MCP protocol
2. Server validates input with Zod schemas
3. Location names resolved to Booking.com IDs (if needed)
4. Parallel API requests for flight search and location data
5. Concurrent formatting of flight results
6. Structured response sent back to Claude


## Technical Details

### Location Resolution

1. Attempts to match user input (city name or airport code)
2. Prefers CITY type over AIRPORT when both available
3. Falls back to first result if preferred type not found
4. Returns detailed error if no match found

### Booking URL Generation

- Includes flight token when available
- Dynamically constructs round-trip vs one-way URLs
- Preserves all search parameters (dates, passengers, cabin class)
- Cleans location IDs for URL compatibility

## API Limitations

### Recommendations

- Use specific airport codes for better results
- Search popular routes for more options
- Book directly through generated URLs for best prices
- Verify all details on Booking.com before purchasing


## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by [Booking.com Flights API](https://rapidapi.com/DataCrawler/api/booking-com15)
- Uses [Zod](https://github.com/colinhacks/zod) for runtime validation
- HTTP requests via [Axios](https://github.com/axios/axios)

---

**Note**: This is an unofficial integration and is not affiliated with or endorsed by Booking.com. All flight data is provided by the Booking.com Flights API via RapidAPI.
