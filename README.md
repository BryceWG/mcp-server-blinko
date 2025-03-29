# Blinko MCP Server

A Model Context Protocol (MCP) server for interacting with Blinko note service.

## Features

- Upsert flash notes (type 0) to Blinko
- Upsert normal notes (type 1) to Blinko

## Installation

```bash
npm install -g mcp-server-blinko
```

## Usage

Set the following environment variables:
- `BLINKO_DOMAIN`: Your Blinko service domain
- `BLINKO_API_KEY`: Your Blinko API key

Or pass them as command line arguments:
```bash
mcp-server-blinko --blinko_domain=your.domain --blinko_api_key=your-api-key
```

## Development

```bash
npm install
npm run dev  # Development mode with ts-node
npm run build  # Build production version
npm start  # Run production build
```

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
