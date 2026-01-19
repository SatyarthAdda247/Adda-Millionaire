# Backend API Server

This is the backend API server for the EduRise affiliate program.

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
BACKEND_URL=http://localhost:3001

# Google OAuth for Admin Login
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_EMAILS=admin1@example.com,admin2@example.com
SESSION_SECRET=your-random-secret-key-change-this-in-production
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
- `POST /api/users/register` - Register a new user and create Trackier link (creates with pending approval)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `GET /api/users` - Get all users (admin only, requires authentication)
- `PUT /api/users/:id` - Update user information (admin only)
- `POST /api/users/:id/approve` - Approve user application (admin only)
- `POST /api/users/:id/reject` - Reject user application (admin only)

### Authentication (Admin)
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current authenticated admin user
- `POST /api/auth/logout` - Logout admin user

## Database

Currently using a JSON file for simplicity. For production, consider migrating to:
- MongoDB
- PostgreSQL
- MySQL

The database file is stored at `./data/database.json` (configurable via `DB_PATH` env variable).
