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

### flight_search_flights Tool

The MCP server exposes a single tool for flight searches with comprehensive filtering options.

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
| `children_ages` | number[] | No | Array of children ages (0-17, age 0 = infant) |
| `cabin_class` | string | No | Cabin class: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST (default: ECONOMY) |
| `sort` | string | No | Sort by: BEST, CHEAPEST, FASTEST (default: BEST) |
| `currency` | string | No | Currency code (default: USD) |
| `limit` | number | No | Maximum flights to return (1-50, default: 5) |
| `response_format` | string | No | Output format: "markdown" or "json" (default: "markdown") |

\* Either `origin`/`destination` OR `fromId`/`toId` must be provided

#### Response Formats

The tool supports two response formats for different use cases:

##### Markdown Format (default)

Human-readable formatted text with:
- Trip summary with route, dates, passengers
- Flight details with emojis (✈️ Outbound, 🔙 Return, 💰 Price)
- Formatted times and durations
- Price breakdown
- Direct booking links

**Example Markdown Response:**

```markdown
# Flight Search Results

**New York** → **London**

## Trip Details
- **Type**: Round-trip
- **Departure**: 2025-11-20
- **Return**: 2025-11-27
- **Passengers**: 2 adults
- **Cabin**: ECONOMY
- **Sort**: CHEAPEST

**Found 3 flights** (3 API requests)

---

## Flight 1: $1167.00

### ✈️ Outbound
- **Air Canada** (AC)
  - **From**: LGA - LaGuardia Airport, New York
    - Nov 20, 10:35 AM • Terminal B
  - **To**: LHR - London Heathrow Airport, London
    - Nov 21, 7:10 AM • Terminal N/A
  - **Duration**: 15h 35m • **Cabin**: ECONOMY

### 🔙 Return
- **Air Canada** (AC)
  - **From**: LHR - London Heathrow Airport, London
    - Nov 27, 1:25 PM • Terminal 2
  - **To**: LGA - LaGuardia Airport, New York
    - Nov 27, 7:03 PM • Terminal N/A
  - **Duration**: 10h 38m • **Cabin**: ECONOMY

### 💰 Price Breakdown
- **Total**: $1167.00
- Base Fare: $52.00
- Taxes: $1114.39

**[Book this flight on Booking.com](https://flights.booking.com/...)**

---
```

##### JSON Format

Structured data perfect for programmatic processing:

**Example JSON Response:**

```json
{
  "search_params": {
    "origin": "JFK",
    "destination": "LHR",
    "departure_date": "2025-12-01",
    "return_date": "2025-12-08",
    "trip_type": "ROUNDTRIP",
    "adults": 1,
    "children_ages": [8, 12],
    "cabin_class": "BUSINESS",
    "sort": "BEST",
    "currency": "USD"
  },
  "total_flights": 2,
  "total_request": 3,
  "flights": [
    {
      "id": "",
      "price": {
        "total": "$3407.00",
        "base_fare": "$1397.56",
        "taxes": "$2009.00",
        "discount": "$0.00"
      },
      "trip_type": "ROUNDTRIP",
      "booking_url": "https://flights.booking.com/flights/NYC-LON?...",
      "flights": [
        {
          "departure": {
            "name": "Newark Liberty International Airport",
            "code": "EWR",
            "city": "New York",
            "country": "United States",
            "terminal": "N/A",
            "time": "2025-12-01T23:55:00"
          },
          "arrival": {
            "name": "London Gatwick Airport",
            "code": "LGW",
            "city": "London",
            "country": "United Kingdom",
            "terminal": "N/A",
            "time": "2025-12-02T15:45:00"
          },
          "duration_minutes": 650,
          "cabin_class": "ECONOMY",
          "airline": {
            "name": "TAP Portugal",
            "code": "TP",
            "logo": "https://r-xx.bstatic.com/data/airlines_logo/TP.png"
          }
        },
        {
          "departure": {
            "name": "London Gatwick Airport",
            "code": "LGW",
            "city": "London",
            "country": "United Kingdom",
            "terminal": "S",
            "time": "2025-12-08T10:40:00"
          },
          "arrival": {
            "name": "John F. Kennedy International Airport",
            "code": "JFK",
            "city": "New York",
            "country": "United States",
            "terminal": "1",
            "time": "2025-12-08T20:05:00"
          },
          "duration_minutes": 865,
          "cabin_class": "BUSINESS",
          "airline": {
            "name": "TAP Portugal",
            "code": "TP",
            "logo": "https://r-xx.bstatic.com/data/airlines_logo/TP.png"
          }
        }
      ]
    }
  ]
}
```

#### Response Metadata

The tool also returns metadata in the MCP response:

```json
{
  "total_flights": 3,
  "total_request": 3,
  "origin": "New York",
  "destination": "London",
  "departure_date": "2025-11-20",
  "return_date": "2025-11-27",
  "trip_type": "ROUNDTRIP",
  "adults": 2,
  "cabin_class": "ECONOMY",
  "response_format": "markdown"
}
```

**Metadata Fields:**
- `total_flights`: Number of flights returned in results
- `total_request`: Number of API requests made (includes location lookups)
- `origin`: Departure location as provided
- `destination`: Arrival location as provided
- `departure_date`: Departure date
- `return_date`: Return date (null for one-way)
- `trip_type`: "ROUNDTRIP" or "ONEWAY"
- `adults`: Number of adult passengers
- `cabin_class`: Selected cabin class
- `response_format`: Format used ("markdown" or "json")

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

### Response Format Options

- `markdown` - Human-readable formatted text with emojis and structured layout (default)
- `json` - Machine-readable structured data with complete flight details

### Sort Options

- `BEST` - Booking.com's recommended flights (default)
- `CHEAPEST` - Lowest price first
- `FASTEST` - Shortest flight time first

### Children and Infants

- Children ages specified as array in `children_ages`: `[8, 12, 14]`
- Age 0 is treated as an infant (typically free or reduced fare)
- Ages 1-17 are children (may have reduced fares)
- Each airline has different age policies

### Pagination

- Use `limit` parameter to control number of results (1-50)
- Default: 5 flights per search
- Higher limits may result in longer response times

### Character Limits

- Responses are limited to 25,000 characters to prevent overwhelming LLM context
- If exceeded, results are automatically truncated with a clear message
- Truncation message provides guidance on how to get more results
- Use smaller `limit` values or more specific filters to avoid truncation

### Currency Codes

Specify any ISO 4217 currency code:
- `USD` - US Dollar
- `EUR` - Euro
- `GBP` - British Pound
- `JPY` - Japanese Yen
- And more...

## Output Structure Details

### Flight Object Schema

Each flight in the results contains:

```typescript
{
  id: string;                    // Flight offer ID from Booking.com
  price: {
    total: string;               // Total price formatted (e.g., "$850.00")
    base_fare: string;           // Base fare before taxes
    taxes: string;               // Total taxes and fees
    discount: string;            // Any discounts applied
  };
  trip_type: "ROUNDTRIP" | "ONEWAY";
  booking_url: string;           // Direct booking link with all parameters
  flights: Array<{               // Array of segments (outbound + return)
    departure: {
      name: string;              // Airport full name
      code: string;              // IATA airport code
      city: string;              // City name
      country: string;           // Country name
      terminal: string;          // Terminal (or "N/A")
      time: string;              // ISO 8601 datetime
    };
    arrival: {
      // Same structure as departure
    };
    duration_minutes: number;    // Flight duration in minutes
    cabin_class: string;         // Actual cabin class for this segment
    airline: {
      name: string;              // Airline full name
      code: string;              // IATA airline code
      logo: string;              // URL to airline logo image
    };
  }>;
}
```

### API Request Tracking

The `total_request` field in responses tracks:
1. Location lookup requests (origin + destination if needed)
2. Flight search API request

Example: Searching "New York" to "London" requires 3 requests:
- 1 request to resolve "New York" to NYC.CITY
- 1 request to resolve "London" to LON.CITY
- 1 request to search flights

## Troubleshooting

### No Results Returned

**Location not found**:
- Error message will suggest using specific airport codes
- Try IATA codes instead of city names (e.g., "LAX" instead of "Los Angeles")
- Verify location name spelling
- Use major airports or cities

**No flights available**:
- Try different dates (some routes may not be available)
- Check if the route exists (some city pairs have no direct connections)
- Extend your date range
- Try nearby airports

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
