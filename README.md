# Blinko MCP Server

A Model Context Protocol (MCP) server for interacting with [Blinko](https://github.com/blinko-space/blinko) note service.

## Features

- Upsert flash notes (type 0) to Blinko
- Upsert normal notes (type 1) to Blinko
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

## Usage

Set the following environment variables:
- `BLINKO_DOMAIN`: Your Blinko service domain
- `BLINKO_API_KEY`: Your Blinko API key

## API Documentation

The server provides 6 MCP tools:

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