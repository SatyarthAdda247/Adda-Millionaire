# Backend API Server

This is the backend API server for the Millionaire's Adda affiliate program.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
PORT=3001
APPTROVE_API_KEY=your_api_key_here
APPTROVE_API_URL=https://api.apptrove.com
DB_PATH=./data/database.json
FRONTEND_URL=http://localhost:5173
```

4. Get your AppTrove API Key:
   - Click on your setting icon in the bottom left corner of the sidebar
   - Select Development tab menu
   - Locate the API key associated with your account

5. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Templates
- `GET /api/templates` - Get available link templates from AppTrove

### Users
- `POST /api/users/register` - Register a new user and create Trackier link
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `GET /api/users` - Get all users (admin)

## Database

Currently using a JSON file for simplicity. For production, consider migrating to:
- MongoDB
- PostgreSQL
- MySQL

The database file is stored at `./data/database.json` (configurable via `DB_PATH` env variable).
