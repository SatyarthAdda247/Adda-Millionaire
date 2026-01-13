# Backend Setup Guide

This project now includes a backend API server for user profile creation and Trackier link management.

## Quick Start

### 1. Backend Setup

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3001
APPTROVE_API_KEY=your_api_key_here
APPTROVE_API_URL=https://api.apptrove.com
DB_PATH=./data/database.json
FRONTEND_URL=http://localhost:5173
```

**To get your AppTrove API Key:**
1. Log in to your AppTrove account
2. Click on the settings icon in the bottom left corner
3. Select the "Development" tab
4. Copy your API key

### 3. Start the Backend Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:3001`

### 4. Frontend Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
```

### 5. Start the Frontend

```bash
npm run dev
```

## How It Works

1. **User Registration**: When a user fills out the signup form, the frontend sends a POST request to `/api/users/register`

2. **Profile Creation**: The backend creates a user profile and stores it in the database (JSON file for now)

3. **Trackier Link Creation**: The backend:
   - Fetches available link templates from AppTrove API
   - Creates a UniLink for the user using the template
   - Stores the link in the database

4. **Link Display**: The user receives their Trackier link immediately after registration

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/templates` - Get available link templates
- `POST /api/users/register` - Register new user and create link
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `GET /api/users` - Get all users (admin)

## Database

Currently using a JSON file (`./data/database.json`) for simplicity. For production, consider migrating to:
- MongoDB
- PostgreSQL  
- MySQL

## Notes

- The AppTrove API integration may need adjustment based on the actual API documentation
- The UniLink creation endpoint might differ - check AppTrove API docs for the correct endpoint
- For production, add authentication, rate limiting, and proper error handling
