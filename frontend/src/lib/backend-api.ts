/**
 * Backend API Client
 * All API calls go through the old backend (localhost:3001)
 */

// Use production API URL or fallback to localhost for development
function getBackendUrl(): string {
  // Check environment variable first
  if (typeof process !== 'undefined' && process.env?.VITE_BACKEND_URL) {
    return process.env.VITE_BACKEND_URL;
  }
  
  // Check if we're in production (browser environment)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Vercel deployment detection
    if (hostname.includes('vercel.app') || hostname.includes('partners-adda.vercel.app')) {
      // Use relative API routes on Vercel (serverless functions)
      return '';
    }
    
    // Production domain detection (AWS deployment)
    // Frontend: partners.addaeducation.com
    // Backend: api.partners.addaeducation.com
    if (hostname === 'partners.addaeducation.com' || 
        hostname === 'www.partners.addaeducation.com' ||
        hostname.includes('addaeducation.com')) {
      // Try production API domain first
      // If DNS not configured, fallback to same-origin (if backend on same server)
      // Or use relative URL if backend is proxied through frontend
      return 'https://api.partners.addaeducation.com';
    }
    
    // Development fallback
    return 'http://localhost:3001';
  }
  
  // Server-side or fallback
  return 'http://localhost:3001';
}

const BACKEND_URL = getBackendUrl();

// Helper to detect Vercel deployment
function isVercelDeployment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.includes('vercel.app') || hostname.includes('partners-adda.vercel.app');
}

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔧 Backend URL:', BACKEND_URL, '(Hostname:', window.location.hostname + ')');
  if (isVercelDeployment()) {
    console.log('⚠️ Vercel deployment detected - backend endpoints will return empty data');
  }
}

// Helper to handle DNS resolution failures
async function checkBackendAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Backend not available at:', url, error);
    return false;
  }
}

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // On Vercel, backend endpoints are not available (only AppTrove API routes exist)
  // Return empty/default responses for non-AppTrove endpoints
  if (isVercelDeployment() && !endpoint.startsWith('/api/apptrove')) {
    console.warn(`⚠️ Backend endpoint not available on Vercel: ${endpoint}`);
    console.warn(`   Admin dashboard requires AWS backend deployment`);
    
    // Return empty/default data based on endpoint
    if (endpoint.includes('/api/users') && options.method === 'GET') {
      return { success: true, users: [], data: [] };
    }
    if (endpoint.includes('/api/dashboard/stats')) {
      return { 
        success: true, 
        totalAffiliates: 0,
        pendingApprovals: 0,
        approvedAffiliates: 0,
        totalLinks: 0,
        totalClicks: 0,
        totalConversions: 0
      };
    }
    if (endpoint.includes('/api/dashboard/analytics')) {
      return { 
        success: true, 
        clicks: [],
        conversions: [],
        revenue: 0,
        topAffiliates: []
      };
    }
    if (endpoint.includes('/analytics')) {
      return { success: true, data: [] };
    }
    
    // Default empty response
    return { success: true, data: null };
  }
  
  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`🌐 ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || data?.detail || `HTTP ${response.status}`;
      console.error(`API Error [${endpoint}]:`, errorMsg);
      throw new Error(errorMsg);
    }

    return data || { success: true, data: null };
  } catch (error: any) {
    // Handle DNS resolution errors
    if (error?.message?.includes('ERR_NAME_NOT_RESOLVED') || 
        error?.message?.includes('Failed to fetch') ||
        (error?.name === 'TypeError' && error?.message?.includes('fetch'))) {
      console.error(`❌ Backend DNS/Connection Error [${endpoint}]:`, error);
      console.error(`   Backend URL: ${BACKEND_URL}`);
      console.error(`   ⚠️ DNS may not be configured for api.partners.addaeducation.com`);
      console.error(`   ⚠️ Or backend service is not running`);
      
      // On Vercel, return empty data instead of throwing
      if (isVercelDeployment()) {
        console.warn(`   Returning empty data for Vercel deployment`);
        if (endpoint.includes('/api/users') && options.method === 'GET') {
          return { success: true, users: [], data: [] };
        }
        if (endpoint.includes('/api/dashboard/stats')) {
          return { success: true, totalAffiliates: 0, pendingApprovals: 0, approvedAffiliates: 0, totalLinks: 0 };
        }
        if (endpoint.includes('/api/dashboard/analytics')) {
          return { success: true, clicks: [], conversions: [], revenue: 0 };
        }
        return { success: true, data: null };
      }
      
      throw new Error(`Backend unavailable. Please check DNS configuration for api.partners.addaeducation.com or ensure backend is running.`);
    }
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/** Create new user/affiliate */
export async function createUser(userData: {
  name: string;
  email: string;
  phone: string;
  platform: string;
  socialHandle: string;
  followerCount?: number;
}) {
  return apiCall('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/** Get all affiliates/users */
export async function getAllAffiliates(filters?: {
  search?: string;
  platform?: string;
  status?: string;
  approvalStatus?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  
  const queryString = params.toString();
  const endpoint = `/api/users${queryString ? `?${queryString}` : ''}`;
  
  const result = await apiCall(endpoint, { method: 'GET' });
  // Ensure consistent response structure
  return {
    success: result?.success ?? true,
    users: result?.users ?? result?.data ?? [],
    data: result?.data ?? result?.users ?? []
  };
}

/** Get affiliate by ID */
export async function getAffiliateById(id: string) {
  return apiCall(`/api/users/${id}`, { method: 'GET' });
}

/** Update affiliate */
export async function updateAffiliate(id: string, data: any) {
  return apiCall(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Approve affiliate */
export async function approveAffiliate(id: string, data: { adminNotes?: string; approvedBy?: string }) {
  return apiCall(`/api/users/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Reject affiliate */
export async function rejectAffiliate(id: string, data: { adminNotes?: string; approvedBy?: string }) {
  return apiCall(`/api/users/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Delete affiliate */
export async function deleteAffiliate(id: string) {
  return apiCall(`/api/users/${id}`, { method: 'DELETE' });
}

/** Get analytics for affiliate */
export async function getAffiliateAnalytics(id: string, options?: {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}) {
  const params = new URLSearchParams();
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  
  const queryString = params.toString();
  const endpoint = `/api/users/${id}/analytics${queryString ? `?${queryString}` : ''}`;
  
  const result = await apiCall(endpoint, { method: 'GET' });
  // Ensure consistent response structure
  return {
    success: result?.success ?? true,
    data: result?.data ?? [],
    clicks: result?.clicks ?? [],
    conversions: result?.conversions ?? [],
    ...result
  };
}

/** Get dashboard stats */
export async function getDashboardStats() {
  const result = await apiCall('/api/dashboard/stats', { method: 'GET' });
  // Ensure consistent response structure
  return {
    success: result?.success ?? true,
    totalAffiliates: result?.totalAffiliates ?? 0,
    pendingApprovals: result?.pendingApprovals ?? 0,
    approvedAffiliates: result?.approvedAffiliates ?? 0,
    totalLinks: result?.totalLinks ?? 0,
    totalClicks: result?.totalClicks ?? 0,
    totalConversions: result?.totalConversions ?? 0,
    ...result
  };
}

/** Get dashboard analytics */
export async function getDashboardAnalytics() {
  const result = await apiCall('/api/dashboard/analytics', { method: 'GET' });
  // Ensure consistent response structure
  return {
    success: result?.success ?? true,
    clicks: result?.clicks ?? [],
    conversions: result?.conversions ?? [],
    revenue: result?.revenue ?? 0,
    topAffiliates: result?.topAffiliates ?? [],
    ...result
  };
}

/** Assign link to user */
export async function assignLinkToAffiliate(id: string, data: {
  unilink: string;
  linkId?: string;
  templateId?: string;
}) {
  return apiCall(`/api/users/${id}/assign-link`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
