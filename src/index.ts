#!/usr/bin/env node

/**
 * This is a MCP server that calls Blinko api to write notes.
 * It demonstrates core MCP concepts like tools by allowing:
 * - Writing flash notes (type 0) to Blinko
 * - Writing normal notes (type 1) to Blinko
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BlinkoClient } from "./blinko.js";

/**
 * Parse command line arguments
 * Example: node index.js --blinko_domain=example.com --blinko_api_key=your-api-key
 */
function parseArgs() {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      args[key] = value;
    }
  });
  return args;
}

const args = parseArgs();
const domain = args.blinko_domain || process.env.BLINKO_DOMAIN || "";
const apiKey = args.blinko_api_key || process.env.BLINKO_API_KEY || "";

/**
 * Create an MCP server with capabilities for tools (to write notes to Blinko).
 */
const server = new Server(
  {
    name: "mcp-server-blinko",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes two tools for writing notes to Blinko.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "upsert_blinko_flash_note",
        description: "Write flash note (type 0) to Blinko",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Text content of the note",
            },
          },
          required: ["content"],
        },
      },
      {
        name: "upsert_blinko_note",
        description: "Write note (type 1) to Blinko",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Text content of the note",
            },
          },
          required: ["content"],
        },
      },
    ],
  };
});

/**
 * Handler for the Blinko tools.
 * Creates a new note with the content, saves to Blinko and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "upsert_blinko_flash_note":
    case "upsert_blinko_note": {
      if (!domain) {
        throw new Error("Blinko domain not set");
      }
      if (!apiKey) {
        throw new Error("Blinko API key not set");
      }

      const content = String(request.params.arguments?.content);
      if (!content) {
        throw new Error("Content is required");
      }

      const type = request.params.name === "upsert_blinko_flash_note" ? 0 : 1;
      const blinko = new BlinkoClient({ domain, apiKey });
      const result = await blinko.upsertNote({ content, type });

      if (!result.success) {
        throw new Error("Failed to write note to Blinko");
      }

      return {
        content: [
          {
            type: "text",
            text: `Write note to Blinko success.`,
          },
        ],
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
