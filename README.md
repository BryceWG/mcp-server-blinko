# Blinko MCP Server

A Model Context Protocol (MCP) server for interacting with [Blinko](https://github.com/blinko-space/blinko) note service.

## Features

- Upsert flash notes (type 0) to Blinko
- Upsert normal notes (type 1) to Blinko
- Upsert todos (type 2) to Blinko
- Search notes with various filters
- Get daily review notes
- Clear recycle bin

## Installation
```json
{
  "mcpServers": {
    "mcp-server-blinko": {
      "command": "npx",
      "args": ["-y", "mcp-server-blinko@0.0.6"],
      "env": {
        "BLINKO_DOMAIN": "sample.blinko.com",
        "BLINKO_API_KEY": "eyj..."
      }
    }
  }
}
```

### Domain Configuration Examples

The `BLINKO_DOMAIN` environment variable supports flexible domain formats:

```json
// Pure domain examples
"BLINKO_DOMAIN": "myblinko.com"
"BLINKO_DOMAIN": "localhost:3000"
"BLINKO_DOMAIN": "subdomain.example.com"

// Full URL examples  
"BLINKO_DOMAIN": "https://myblinko.com"
"BLINKO_DOMAIN": "http://localhost:3000"
"BLINKO_DOMAIN": "https://myblinko.com:8080"
```

## Usage

Set the following environment variables:
- `BLINKO_DOMAIN`: Your Blinko service domain. Supports both formats:
  - Pure domain: `example.com` or `example.com:3000`
  - Full URL: `https://example.com` or `http://example.com:3000`
- `BLINKO_API_KEY`: Your Blinko API key

## API Documentation

The server provides 7 MCP tools:

### upsert_blinko_flash_note
- Description: Write flash note (type 0) to Blinko
- Parameters:
  - `content` (string, required): Text content of the note
- Returns: Success message with the created note ID

### upsert_blinko_note
- Description: Write note (type 1) to Blinko
- Parameters:
  - `content` (string, required): Text content of the note
- Returns: Success message with the created note ID

### upsert_blinko_todo
- Description: Write todo (type 2) to Blinko
- Parameters:
  - `content` (string, required): Text content of the todo
- Returns: Success message with the created todo ID

### share_blinko_note
- Description: Share a note or cancel sharing
- Parameters:
  - `noteId` (number, required): ID of the note to share
  - `password` (string, optional): Six-digit password for sharing
  - `isCancel` (boolean, optional): Whether to cancel sharing (default: false)
- Returns: Share status, password (if set), and share link (if successful)

### search_blinko_notes
- Description: Search notes in Blinko with various filters
- Parameters:
  - `searchText` (string, required): Search keyword
  - `size` (number, optional): Number of results to return (default: 5)
  - `type` (number, optional): Note type: -1 for all, 0 for flash notes, 1 for normal notes
  - `isArchived` (boolean, optional): Search in archived notes
  - `isRecycle` (boolean, optional): Search in recycled notes
  - `isUseAiQuery` (boolean, optional): Use AI-powered search (default: true)
  - `startDate` (string, optional): Start date in ISO format
  - `endDate` (string, optional): End date in ISO format
  - `hasTodo` (boolean, optional): Search only in notes with todos
- Returns: List of matching notes with their IDs and content

### review_blinko_daily_notes
- Description: Get today's notes for review
- Parameters: None
- Returns: List of today's review notes with their IDs and content

### clear_blinko_recycle_bin
- Description: Clear the recycle bin in Blinko
- Parameters: None

## Acknowledgment
- [mcp-server-flomo](https://github.com/chatmcp/mcp-server-flomo)

Developed based on mcp-server-flomo project.