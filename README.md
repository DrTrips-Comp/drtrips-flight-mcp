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

## Installation

### Option 1: Use with npx (Recommended)

No installation required! Use directly with npx:

```bash
npx flight-mcp-server
```

### Option 2: Global Installation

Install globally for system-wide access:

```bash
npm install -g flight-mcp-server
```

Then run with:

```bash
flight-mcp-server
```

### Option 3: Local Installation

Install in your project:

```bash
npm install flight-mcp-server
```

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

**Alternative: Using Global Installation**

If you installed globally:

```json
{
  "mcpServers": {
    "flight-search": {
      "command": "flight-mcp-server",
      "env": {
        "RAPID_API_KEY": "your_rapidapi_key_here"
      }
    }
  }
}
```

### Restart Claude Desktop

After updating the configuration:

1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. The flight search tool will be available in new conversations

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

### Server Not Appearing in Claude Desktop

1. **Verify configuration file location**:
   - MacOS/Linux: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Check JSON syntax**: Ensure valid JSON with proper commas and brackets

3. **Restart Claude Desktop**: Fully quit and restart the application

4. **Check logs**:
   - MacOS/Linux: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`

### API Key Issues

**Error: "Invalid API key"**

- Verify your RapidAPI key is correct
- Ensure you're subscribed to the Booking.com Flights API
- Check for extra spaces or quotes in the configuration

**Error: "Rate limit exceeded"**

- Check your RapidAPI plan limits
- Consider upgrading your subscription
- Wait for the rate limit to reset

### No Results Returned

**Location not found**:
- Try using airport codes instead of city names (e.g., "LAX" instead of "Los Angeles")
- Verify the location name spelling
- Use major airports or cities

**No flights available**:
- Try different dates (some routes may not be available)
- Check if the route exists (some city pairs have no direct connections)
- Extend your date range

### Installation Issues

**Node version error**:
```bash
node --version  # Should be 18 or higher
```

Update Node.js from [nodejs.org](https://nodejs.org/)

**npx command not found**:
- Ensure npm is installed: `npm --version`
- Reinstall Node.js which includes npm

**Permission errors on Linux/Mac**:
```bash
sudo npm install -g flight-mcp-server
```

Or configure npm to install globally without sudo:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/DrTrips-Comp/drtrips-flight-mcp.git
cd drtrips-flight-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Watch mode (auto-rebuild on changes)
npm run watch
```

### Project Structure

```
flight-mcp-server/
├── src/
│   ├── config/
│   │   └── settings.ts          # Environment configuration and API settings
│   ├── models/
│   │   └── flight-models.ts     # Zod schemas and TypeScript types
│   ├── services/
│   │   └── flight-api.ts        # Flight search API client with concurrent processing
│   ├── server.ts                # MCP server implementation
│   └── index.ts                 # Entry point with stdio transport
├── dist/                        # Compiled JavaScript (generated)
├── package.json                 # NPM configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

### Testing MCP Protocol

Test the server directly with JSON-RPC:

```bash
# Initialize the server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npx flight-mcp-server

# List available tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | npx flight-mcp-server
```

## Architecture

### Core Components

1. **Configuration Layer** (`src/config/settings.ts`)
   - Environment variable loading with dotenv
   - API credentials management
   - Base URL configuration for external services

2. **Data Models** (`src/models/flight-models.ts`)
   - Zod validation schemas for runtime type checking
   - TypeScript types for compile-time safety
   - Input validation and sanitization

3. **API Service** (`src/services/flight-api.ts`)
   - Booking.com API integration with axios
   - Concurrent processing with Promise.allSettled()
   - Automatic location ID resolution
   - Flight data formatting and enrichment

4. **MCP Server** (`src/server.ts`)
   - Tool registration and request handling
   - Schema-based input validation
   - Formatted output generation

5. **Entry Point** (`src/index.ts`)
   - Stdio transport for MCP protocol
   - Server lifecycle management

### Data Flow

1. Claude sends search request via MCP protocol
2. Server validates input with Zod schemas
3. Location names resolved to Booking.com IDs (if needed)
4. Parallel API requests for flight search and location data
5. Concurrent formatting of flight results
6. Structured response sent back to Claude

### Performance Optimizations

- **Concurrent Processing**: Uses `Promise.allSettled()` for parallel operations
- **Smart Caching**: Location IDs could be cached (future enhancement)
- **Result Limiting**: Returns top 5 flights to reduce response time
- **Efficient Formatting**: Parallel segment processing for each flight

## Technical Details

### TypeScript & Type Safety

- Strict TypeScript configuration with `strict: true`
- Runtime validation with Zod schemas
- Type inference using `z.infer<typeof Schema>`
- Full interface definitions for API responses

### Error Handling

- Graceful degradation on API failures
- Detailed error logging to stderr
- User-friendly error messages
- Fallback behaviors for missing data

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

### Booking.com API via RapidAPI

- **Rate Limits**: Vary by subscription plan (check RapidAPI dashboard)
- **Request Limits**: Typically 100-500 requests/day on free tier
- **Data Freshness**: Flight data may be cached up to 15 minutes
- **Availability**: Some routes or dates may have limited results
- **Pricing**: Prices are estimates and may differ on booking site

### Recommendations

- Use specific airport codes for better results
- Search popular routes for more options
- Book directly through generated URLs for best prices
- Verify all details on Booking.com before purchasing

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests on [GitHub](https://github.com/DrTrips-Comp/drtrips-flight-mcp).

### Development Guidelines

1. Follow TypeScript best practices
2. Maintain type safety with strict mode
3. Add Zod schemas for new inputs
4. Write clear error messages
5. Update documentation for new features
6. Test with MCP protocol before submitting

## Changelog

### Version 1.0.9 (Current)

- Published to npm registry
- Added MCP registry integration
- Improved documentation
- Enhanced error handling

### Version 1.0.0

- Initial TypeScript implementation
- Migrated from Python to TypeScript
- Full MCP SDK integration
- Concurrent processing support
- Comprehensive type safety

## Related Projects

Part of the larger lanflow-recommendation system:

- **distance_matrix_mcp** - Distance and travel time calculations
- **google_place_api_mcp** - Google Places integration
- **hotel_mcp** - Hotel search functionality
- **research_mcp** - Travel research capabilities
- **weather_mcp** - Weather information service

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/DrTrips-Comp/drtrips-flight-mcp/issues)
- **Documentation**: [MCP Registry](https://modelcontextprotocol.io/registry/io.github.drtrips-comp/flight-search)
- **RapidAPI Support**: [RapidAPI Help Center](https://support.rapidapi.com/)

## Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by [Booking.com Flights API](https://rapidapi.com/DataCrawler/api/booking-com15)
- Uses [Zod](https://github.com/colinhacks/zod) for runtime validation
- HTTP requests via [Axios](https://github.com/axios/axios)

---

**Note**: This is an unofficial integration and is not affiliated with or endorsed by Booking.com. All flight data is provided by the Booking.com Flights API via RapidAPI.
