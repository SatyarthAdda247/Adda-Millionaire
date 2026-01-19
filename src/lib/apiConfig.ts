/**
 * API Configuration
 * 
 * This utility handles API URL configuration for both development and production.
 * 
 * For production deployment on Vercel:
 * 1. Set VITE_API_URL in Vercel environment variables to your backend URL
 * 2. Backend should be deployed separately (Railway, Render, etc.)
 * 3. Backend CORS must allow requests from adda-millionaire.vercel.app
 */

/**
 * Get the API base URL
 * Priority:
 * 1. VITE_API_URL environment variable (set in Vercel) - REQUIRED for production
 * 2. Auto-detect production and warn if not set
 * 3. Fallback to localhost for development
 */
export function getApiBaseUrl(): string {
  // First, check if environment variable is set (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Auto-detect if running on Vercel
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If deployed on Vercel but VITE_API_URL is not set, show warning
    if (hostname.includes('vercel.app') || hostname.includes('adda-millionaire')) {
      console.warn(
        '⚠️ VITE_API_URL is not set! Please set it in Vercel environment variables.\n' +
        'Go to: Vercel Project → Settings → Environment Variables → Add VITE_API_URL'
      );
      // Return a placeholder that will fail gracefully
      // User MUST set VITE_API_URL in Vercel for production
      return 'https://your-backend-url.vercel.app'; // This will fail - user must set VITE_API_URL
    }
  }

  // Default to localhost for local development
  return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl();
