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
      {
        name: "upsert_blinko_todo",
        description: "Write todo (type 2) to Blinko",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Text content of the todo",
            },
          },
          required: ["content"],
        },
      },
      {
        name: "share_blinko_note",
        description: "Share a note or cancel sharing",
        inputSchema: {
          type: "object",
          properties: {
            noteId: {
              type: "number",
              description: "ID of the note to share",
            },
            password: {
              type: "string",
              description: "Six-digit password for sharing (optional)",
              pattern: "^\\d{6}$",
            },
            isCancel: {
              type: "boolean",
              description: "Whether to cancel sharing (default: false)",
            },
          },
          required: ["noteId"],
        },
      },
      {
        name: "search_blinko_notes",
        description: "Search for notes in Blinko",
        inputSchema: {
          type: "object",
          properties: {
            searchText: {
              type: "string",
              description: "Search keyword",
            },
            size: {
              type: "number",
              description: "Number of results to return (default: 5)",
            },
            type: {
              type: "number",
              enum: [-1, 0, 1],
              description: "Note type: -1 for all, 0 for flash notes, 1 for normal notes",
            },
            isArchived: {
              type: "boolean",
              description: "Search in archived notes",
            },
            isRecycle: {
              type: "boolean",
              description: "Search in recycled notes",
            },
            isUseAiQuery: {
              type: "boolean",
              description: "Use AI-powered search",
            },
            startDate: {
              type: "string",
              description: "Start date in ISO format (e.g. 2025-03-03T00:00:00.000Z)",
            },
            endDate: {
              type: "string",
              description: "End date in ISO format (e.g. 2025-03-03T00:00:00.000Z)",
            },
            hasTodo: {
              type: "boolean",
              description: "Search only in notes with todos",
            }
          },
          required: ["searchText"],
        },
      },
      {
        name: "review_blinko_daily_notes",
        description: "Get today's notes for review",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "clear_blinko_recycle_bin",
        description: "Clear the recycle bin in Blinko",
        inputSchema: {
          type: "object",
          properties: {},
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
  if (!domain) {
    throw new Error("Blinko domain not set");
  }
  if (!apiKey) {
    throw new Error("Blinko API key not set");
  }

  const blinko = new BlinkoClient({ domain, apiKey });

  switch (request.params.name) {
    case "upsert_blinko_flash_note":
    case "upsert_blinko_note":
    case "upsert_blinko_todo": {
      const content = String(request.params.arguments?.content);
      if (!content) {
        throw new Error("Content is required");
      }

      let type: number;
      if (request.params.name === "upsert_blinko_flash_note") {
        type = 0;
      } else if (request.params.name === "upsert_blinko_note") {
        type = 1;
      } else {
        type = 2; 
      }
      const note = await blinko.upsertNote({ content, type: type as 0 | 1 | 2 });

      return {
        content: [
          {
            type: "text",
            text: `Successfully wrote note to Blinko. Note ID: ${note.id}`,
          },
        ],
      };
    }

    case "search_blinko_notes": {
      const searchText = String(request.params.arguments?.searchText);
      if (!searchText) {
        throw new Error("Search text is required");
      }

      const {
        size,
        type,
        isArchived,
        isRecycle,
        isUseAiQuery,
        startDate,
        endDate,
        hasTodo,
      } = request.params.arguments || {};

      const notes = await blinko.searchNotes({
        searchText,
        size: Number(size) || undefined,
        type: type === 0 || type === 1 ? type : -1,
        isArchived: Boolean(isArchived),
        isRecycle: Boolean(isRecycle),
        isUseAiQuery: isUseAiQuery !== false,
        startDate: startDate ? String(startDate) : null,
        endDate: endDate ? String(endDate) : null,
        hasTodo: Boolean(hasTodo),
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${notes.length} note(s):`,
          },
          ...notes.map((note) => ({
            type: "text",
            text: `- [ID: ${note.id}] ${note.content}`,
          })),
        ],
      };
    }

    case "review_blinko_daily_notes": {
      const notes = await blinko.getDailyReviewNotes();

      return {
        content: [
          {
            type: "text",
            text: `Found ${notes.length} note(s) for today's review:`,
          },
          ...notes.map((note) => ({
            type: "text",
            text: `- [ID: ${note.id}] ${note.content}`,
          })),
        ],
      };
    }

    case "share_blinko_note": {
      const noteId = Number(request.params.arguments?.noteId);
      if (!noteId || isNaN(noteId)) {
        throw new Error("Valid note ID is required");
      }

      const { password, isCancel } = request.params.arguments || {};
      const passwordStr = password ? String(password) : "";
      
      // 验证密码格式（如果提供）
      if (passwordStr && !/^\d{6}$/.test(passwordStr)) {
        throw new Error("Password must be exactly 6 digits");
      }

      const result = await blinko.shareNote({
        id: noteId,
        password: passwordStr,
        isCancel: Boolean(isCancel),
      });

      if (result.isShare) {
        return {
          content: [
            {
              type: "text",
              text: `Successfully shared note (ID: ${result.id})`,
            },
            ...(result.sharePassword ? [{
              type: "text",
              text: `Share password: ${result.sharePassword}`,
            }] : []),
            {
              type: "text",
              text: `Share link: ${result.shareEncryptedUrl || "N/A"}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Successfully cancelled sharing for note (ID: ${result.id})`,
            },
          ],
        };
      }
    }

    case "clear_blinko_recycle_bin": {
      const result = await blinko.clearRecycleBin();

      if (!result.success) {
        throw new Error("Failed to clear recycle bin");
      }

      return {
        content: [
          {
            type: "text",
            text: "Successfully cleared Blinko recycle bin.",
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
