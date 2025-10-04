#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createFlightMcpServer } from './server.js';
import { BOOKING_API_KEY } from './config/settings.js';

/**
 * Main entry point for stdio-based MCP server for flight search.
 * Can be run via npx or directly with node.
 */
async function runServer() {
  try {
    // Create the MCP server
    const server = createFlightMcpServer();

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('Flight MCP Server running on stdio');
    console.error('Booking API Key configured:', BOOKING_API_KEY ? 'Yes' : 'No');
  } catch (error) {
    console.error('Fatal error running server:', error);
    process.exit(1);
  }
}

// Start the server
runServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
