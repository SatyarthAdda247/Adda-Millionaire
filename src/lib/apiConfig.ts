/**
 * API Configuration
 * 
 * NOTE: This app is fully frontend-only. No backend server required.
 * - Data storage: DynamoDB (direct frontend access)
 * - External APIs: Vercel Serverless Functions (/api/*)
 * 
 * API_BASE_URL is deprecated and kept only for backward compatibility.
 * All functionality now uses DynamoDB and serverless functions.
 */

/**
 * Get the API base URL (DEPRECATED - not used anymore)
 * Returns empty string since everything is frontend-only
 */
export function getApiBaseUrl(): string {
  // Everything is frontend-only now - no backend API needed
  return '';
}

export const API_BASE_URL = getApiBaseUrl();

// Log configuration status
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const dynamoDBConfigured = !!(import.meta.env.VITE_AWS_ACCESS_KEY_ID && import.meta.env.VITE_AWS_SECRET_ACCESS_KEY);
  
  if (hostname.includes('vercel.app') || hostname.includes('adda-millionaire') || hostname.includes('partners-adda')) {
    if (dynamoDBConfigured) {
      console.log('✅ Using DynamoDB directly - backend API not required');
    } else {
      console.warn('⚠️ DynamoDB not configured. Please set AWS credentials in Vercel environment variables.');
    }
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (dynamoDBConfigured) {
      console.log('✅ Using DynamoDB directly - backend API not required');
    } else {
      console.log('🔧 Development Mode - Configure DynamoDB for full functionality');
    }
  }
}
