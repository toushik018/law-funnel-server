# Law Funnel Server

Backend server for the Law Funnel application built with Node.js, Express.js, and TypeScript.

## Features

- TypeScript for type safety
- Express.js web framework
- CORS enabled for client communication
- Rate limiting for API protection
- Security middleware (Helmet)
- Environment variable configuration

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` file with your configuration.

3. Build the project:
   ```bash
   npm run build
   ```

## Development

Run the server in development mode with hot reload:

```bash
npm run dev
```

## Production

Build and start the server:

```bash
npm run build
npm start
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - Basic API information

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `GEMINI_API_KEY` - Google Gemini API key
