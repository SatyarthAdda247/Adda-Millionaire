# Admin Dashboard Setup Guide

## Overview

The admin dashboard allows authorized social media team members to review and approve/reject affiliate applications. It uses Google OAuth for secure authentication.

## Features

1. **Google OAuth Authentication** - Secure admin login using Google accounts
2. **Approval Workflow** - Review pending applications and approve/reject them
3. **Admin Notes** - Add notes when approving or rejecting applications
4. **Filtering & Search** - Filter by approval status and search affiliates
5. **Status Tracking** - Track pending, approved, and rejected applications

## Setup Instructions

### 1. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen:
   - User Type: Internal (for organization) or External
   - Add your email as a test user
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback` (for development)
   - For production: `https://yourdomain.com/api/auth/google/callback`
7. Copy the Client ID and Client Secret

### 2. Backend Configuration

Add to your `server/.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Admin emails (comma-separated)
ADMIN_EMAILS=admin1@example.com,admin2@example.com,admin3@example.com

# Session secret (generate a random string)
SESSION_SECRET=your-random-secret-key-minimum-32-characters

# Backend URL (for OAuth callback)
BACKEND_URL=http://localhost:3001
```

### 3. Frontend Configuration

The frontend is already configured. Just ensure your `.env` file has:

```env
VITE_API_URL=http://localhost:3001
```

### 4. Access the Admin Dashboard

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Navigate to: `http://localhost:5173/admin/login`

4. Click "Continue with Google" and sign in with an authorized admin email

5. You'll be redirected to the admin dashboard at `/admin/dashboard`

## Current Input Fields

The signup form collects:
- ✅ **Name** - Full name
- ✅ **Email** - Email address
- ✅ **Phone** - Phone number
- ✅ **Platform** - Primary social media platform (Instagram, YouTube, etc.)
- ✅ **Social Handle** - Username/handle on the platform
- ✅ **Follower Count** - Range of followers (1K-5K, 5K-10K, etc.)

**These fields are sufficient for profile setup and approval workflow.**

## Approval Workflow

1. **User Registration**: When a user signs up, their profile is created with `approvalStatus: 'pending'`

2. **Admin Review**: Admins can:
   - View all pending applications
   - See user details (name, email, phone, platform, handle, followers)
   - Add admin notes
   - Approve or reject applications

3. **Approval Actions**:
   - **Approve**: Sets status to 'approved' and 'active', creates Trackier link
   - **Reject**: Sets status to 'rejected' and 'inactive', requires admin notes

4. **Status Tracking**:
   - **Pending**: Waiting for review
   - **Approved**: Approved and active
   - **Rejected**: Rejected with reason

## API Endpoints

### Admin Only (Requires Authentication)

- `GET /api/users` - Get all affiliates with filters
- `GET /api/dashboard/stats` - Get dashboard statistics
- `PUT /api/users/:id` - Update user information
- `POST /api/users/:id/approve` - Approve user
- `POST /api/users/:id/reject` - Reject user

### Authentication

- `GET /api/auth/google` - Start Google OAuth
- `GET /api/auth/me` - Get current admin user
- `POST /api/auth/logout` - Logout

## Security Notes

1. **Admin Emails**: Only emails listed in `ADMIN_EMAILS` can access the admin dashboard
2. **Session Security**: Sessions expire after 24 hours
3. **HTTPS**: In production, ensure HTTPS is enabled for secure cookie transmission
4. **Session Secret**: Use a strong, random session secret in production

## Troubleshooting

### "Access denied" error
- Ensure your email is in the `ADMIN_EMAILS` environment variable
- Check that Google OAuth is properly configured

### OAuth callback fails
- Verify the redirect URI matches exactly in Google Cloud Console
- Check that `BACKEND_URL` is correctly set

### Session not persisting
- Ensure cookies are enabled in your browser
- Check CORS configuration allows credentials
- Verify `SESSION_SECRET` is set

## Production Deployment

1. Update `BACKEND_URL` to your production backend URL
2. Add production redirect URI in Google Cloud Console
3. Set `SESSION_SECRET` to a strong random string
4. Enable HTTPS for secure cookie transmission
5. Update `FRONTEND_URL` to your production frontend URL
