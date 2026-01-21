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
 * 2. Auto-detect production and use default backend URL if available
 * 3. Fallback to localhost for development
 */
export function getApiBaseUrl(): string {
  // First, check if environment variable is set (highest priority)
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.trim();
    // Remove trailing slash if present
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  // Auto-detect if running on Vercel
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If deployed on Vercel but VITE_API_URL is not set
    if (hostname.includes('vercel.app') || hostname.includes('adda-millionaire') || hostname.includes('partners.addaeducation')) {
      console.warn(
        '⚠️ VITE_API_URL is not set! Please set it in Vercel environment variables.\n' +
        'Go to: Vercel Project → Settings → Environment Variables → Add VITE_API_URL\n' +
        'Example: https://your-backend.railway.app or https://your-backend.render.com'
      );
      // Try to use a common backend URL pattern (user should set VITE_API_URL)
      // This is a fallback - user MUST set VITE_API_URL in Vercel for production
      return 'https://edurise-backend.railway.app'; // Default fallback - user should override
    }
  }

  // Default to localhost for local development
  return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl();

// Log API URL in development or if there's a warning (helps with debugging)
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname.includes('vercel.app') || hostname.includes('adda-millionaire')) {
    console.log('🌐 API Base URL:', API_BASE_URL);
    if (!import.meta.env.VITE_API_URL) {
      console.warn('⚠️ VITE_API_URL not set! Forms may not work. Set it in Vercel environment variables.');
    }
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🔧 Development Mode - API Base URL:', API_BASE_URL);
  }
}
