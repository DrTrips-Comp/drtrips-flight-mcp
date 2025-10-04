# drtrips-flight-mcp

TypeScript-based MCP (Model Context Protocol) server for flight search functionality using the Booking.com Flights API via RapidAPI.

## Features

- 🔍 Flight search with Booking.com API integration
- ✈️ Support for round-trip and one-way flights
- 👥 Flexible passenger configurations (adults, children, infants)
- 🌍 Automatic location resolution (city names/airport codes → Booking.com IDs)
- ⚡ Concurrent processing with Promise-based architecture
- 🔗 Direct booking URL generation
- 🛡️ Full TypeScript type safety with Zod validation

## Installation

```bash
npm install
```

## Configuration

1. Create a `.env` file in the project root:

```bash
RAPID_API_KEY=your_rapidapi_key_here
```

2. Get your RapidAPI key from [RapidAPI Booking.com Flights](https://rapidapi.com/DataCrawler/api/booking-com15)

## Build

```bash
# Build TypeScript
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch
```

## Usage

### Run Standalone

```bash
# Production
npm start

# Development mode
npm run dev
```

### Use with Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "flight-search": {
      "command": "node",
      "args": ["path/to/drtrips-flight-mcp/dist/index.js"],
      "env": {
        "RAPID_API_KEY": "your_rapidapi_key_here"
      }
    }
  }
}
```

### Available MCP Tools

- **search_flights**: Search for flights with flexible parameters
  - Origin/destination (city names or airport codes)
  - Departure/return dates
  - Passenger details (adults, children, infants)
  - Cabin class preferences
  - Sort options

## Example

```typescript
// Request to Claude with MCP tool
{
  "origin": "New York",
  "destination": "London",
  "departure_date": "2025-11-01",
  "return_date": "2025-11-08",
  "adults": 2,
  "cabin_class": "ECONOMY"
}
```

## Architecture

- **src/config/settings.ts** - Environment configuration
- **src/models/flight-models.ts** - Zod schemas and TypeScript types
- **src/services/flight-api.ts** - Flight search API client with concurrent processing
- **src/server.ts** - MCP server implementation
- **src/index.ts** - Entry point with stdio transport

## License

MIT
