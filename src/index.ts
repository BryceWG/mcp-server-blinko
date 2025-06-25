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
        description: "Create or update a flash note (type 0) in Blinko. Flash notes are designed for quick thoughts, ideas, or brief observations that you want to capture rapidly.",
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
        description: "Create or update a normal note (type 1) in Blinko. Normal notes are suitable for detailed content, longer thoughts, documentation, or structured information.",
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
        description: "Create or update a todo note (type 2) in Blinko. Todo notes are designed for task management, checklists, and action items that need to be tracked and completed.",
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
        description: "Share a note publicly or cancel an existing share. Creates a public link that others can access, optionally protected with a password.",
        inputSchema: {
          type: "object",
          properties: {
            noteId: {
              type: "number",
              description: "ID of the note to share. Use the ID from search results or note creation responses.",
            },
            password: {
              type: "string",
              description: "Optional six-digit password for sharing protection (e.g., '123456'). If provided, viewers will need this password to access the shared note.",
              pattern: "^\\d{6}$",
            },
            isCancel: {
              type: "boolean",
              description: "Set to true to cancel/disable sharing for this note (default: false). Use this to revoke public access to a previously shared note.",
            },
          },
          required: ["noteId"],
        },
      },
      {
        name: "search_blinko_notes",
        description: "Search for notes in Blinko. Returns notes with content, timestamps, and metadata.",
        inputSchema: {
          type: "object",
          properties: {
            searchText: {
              type: "string",
              description: "Search keyword or phrase. Use this to find notes containing specific text content.",
            },
            size: {
              type: "number",
              description: "Number of results to return (default: 5). Use larger values when you need more comprehensive search results.",
            },
            type: {
              type: "number",
              enum: [-1, 0, 1, 2],
              description: "Note type filter: -1 for all types (default), 0 for flash notes, 1 for normal notes, 2 for todo notes. Use specific types when you need to filter by note category.",
            },
            isArchived: {
              type: "boolean",
              description: "Search in archived notes (default: false). Set to true when you need to find notes that have been archived for long-term storage.",
            },
            isRecycle: {
              type: "boolean",
              description: "Search in recycled/deleted notes (default: false). Set to true when you need to recover or find deleted notes.",
            },
            isUseAiQuery: {
              type: "boolean",
              description: "Use AI-powered semantic search (default: true). Set to false for exact text matching only. AI search is better for finding conceptually related content.",
            },
            startDate: {
              type: "string",
              description: "Start date for time-based filtering in ISO format (e.g. 2025-03-03T00:00:00.000Z). Use when searching for notes created after a specific date.",
            },
            endDate: {
              type: "string",
              description: "End date for time-based filtering in ISO format (e.g. 2025-03-03T00:00:00.000Z). Use when searching for notes created before a specific date.",
            },
            hasTodo: {
              type: "boolean",
              description: "Search only in notes containing todo items (default: false). Set to true when looking for notes with task lists or checkboxes.",
            }
          },
          required: ["searchText"],
        },
      },
      {
        name: "review_blinko_daily_notes",
        description: "Retrieve today's notes for daily review and reflection. This helps with reviewing recent thoughts, tasks, and ideas to maintain productivity and mindfulness.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "clear_blinko_recycle_bin",
        description: "Permanently delete all notes in the recycle bin. WARNING: This action cannot be undone. Use only when you're certain you want to permanently remove all deleted notes.",
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

      // Support type 2 (todo notes) in addition to existing types
      let noteType: -1 | 0 | 1 | 2 = -1;
      if (type === 0 || type === 1 || type === 2) {
        noteType = type;
      }

      const notes = await blinko.searchNotes({
        searchText,
        size: Number(size) || undefined,
        type: noteType,
        isArchived: Boolean(isArchived),
        isRecycle: Boolean(isRecycle),
        isUseAiQuery: isUseAiQuery !== false,
        startDate: startDate ? String(startDate) : null,
        endDate: endDate ? String(endDate) : null,
        hasTodo: Boolean(hasTodo),
      });

      // Helper function to format date
      const formatDate = (dateStr: string) => {
        try {
          return new Date(dateStr).toLocaleString();
        } catch {
          return dateStr;
        }
      };

      // Helper function to get note type description
      const getTypeDescription = (type: number) => {
        switch (type) {
          case 0: return "Flash Note";
          case 1: return "Normal Note";
          case 2: return "Todo Note";
          default: return "Unknown";
        }
      };

      return {
        content: [
          {
            type: "text",
            text: `Found ${notes.length} note(s):`,
          },
          ...notes.map((note) => ({
            type: "text",
            text: `- [ID: ${note.id}] [${getTypeDescription(note.type)}] ${note.content}\n  Created: ${formatDate(note.createdAt)} | Updated: ${formatDate(note.updatedAt)}`,
          })),
        ],
      };
    }

    case "review_blinko_daily_notes": {
      const notes = await blinko.getDailyReviewNotes();

      // Helper function to format date
      const formatDate = (dateStr: string) => {
        try {
          return new Date(dateStr).toLocaleString();
        } catch {
          return dateStr;
        }
      };

      // Helper function to get note type description
      const getTypeDescription = (type: number) => {
        switch (type) {
          case 0: return "Flash Note";
          case 1: return "Normal Note";
          case 2: return "Todo Note";
          default: return "Unknown";
        }
      };

      return {
        content: [
          {
            type: "text",
            text: `Found ${notes.length} note(s) for today's review:`,
          },
          ...notes.map((note) => ({
            type: "text",
            text: `- [ID: ${note.id}] [${getTypeDescription(note.type)}] ${note.content}\n  Created: ${formatDate(note.createdAt)} | Updated: ${formatDate(note.updatedAt)}`,
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
