# Blinko MCP Server

A Model Context Protocol (MCP) server for interacting with [Blinko](https://github.com/blinko-space/blinko) note service.

## Features

- Upsert flash notes (type 0) to Blinko
- Upsert normal notes (type 1) to Blinko

## Installation
```json
{
  "mcpServers": {
    "mcp-server-blinko": {
      "command": "npx",
      "args": ["-y", "mcp-server-blinko"],
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

The server provides two MCP tools:

### upsert_blinko_flash_note
- Description: Write flash note (type 0) to Blinko
- Parameters: 
  - `content` (string, required): Text content of the note

### upsert_blinko_note
- Description: Write note (type 1) to Blinko
- Parameters:
  - `content` (string, required): Text content of the note

## Acknowledgment
- [mcp-server-flomo](https://github.com/chatmcp/mcp-server-flomo)

Developed based on mcp-server-flomo project.