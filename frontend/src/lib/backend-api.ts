/**
 * Backend API Client
 * On Vercel: Uses DynamoDB directly if AWS credentials are available
 * On AWS: Uses Python FastAPI backend
 * Local: Uses Python FastAPI backend (localhost:3001)
 */

import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getLinksByUserId, 
  getAnalyticsByUserId,
  isDynamoDBConfigured,
  saveUser as saveUserToDynamoDB
} from './dynamodb';

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
    if (isDynamoDBConfigured()) {
      console.log('✅ Vercel deployment with DynamoDB - using direct DynamoDB access');
    } else {
      console.log('⚠️ Vercel deployment without DynamoDB - backend endpoints will return empty data');
    }
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
  // On Vercel, use DynamoDB directly if configured; otherwise use backend or return empty data
  if (isVercelDeployment() && !endpoint.startsWith('/api/apptrove')) {
    // Check if DynamoDB is configured
    if (isDynamoDBConfigured()) {
      // Use DynamoDB directly for backend endpoints
      try {
        const method = options.method || 'GET';
        console.log(`🔍 DynamoDB Handler: ${method} ${endpoint}`);
        
        // Handle GET /api/users
        if (endpoint.startsWith('/api/users') && method === 'GET' && !endpoint.match(/\/api\/users\/[^\/]+/)) {
          const url = new URL(endpoint, 'http://localhost');
          const filters: any = {};
          url.searchParams.forEach((value, key) => {
            filters[key] = value;
          });
          
          console.log(`📊 Fetching users from DynamoDB with filters:`, filters);
          const users = await getAllUsers(filters);
          console.log(`✅ DynamoDB returned ${users.length} users`);
          return { success: true, users, data: users };
        }
        
        // Handle GET /api/users/:id
        if (endpoint.match(/^\/api\/users\/[^\/]+$/) && method === 'GET') {
          const id = endpoint.split('/api/users/')[1];
          console.log(`📊 Fetching user ${id} from DynamoDB`);
          const user = await getUserById(id);
          return { success: true, user, data: user };
        }
        
        // Handle GET /api/users/:id/analytics
        if (endpoint.match(/^\/api\/users\/[^\/]+\/analytics/) && method === 'GET') {
          const id = endpoint.split('/api/users/')[1].split('/')[0];
          const analytics = await getAnalyticsByUserId(id);
          return { success: true, data: analytics, analytics };
        }
        
        // Handle POST /api/users
        if (endpoint === '/api/users' && method === 'POST') {
          const userData = JSON.parse(options.body as string);
          console.log(`📝 Saving new user to DynamoDB:`, userData.email);
          
          // Generate unique ID for new user
          const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const userWithId = {
            id: userId,
            ...userData,
            approvalStatus: 'pending',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          console.log(`✅ Generated user ID: ${userId}`);
          const result = await saveUserToDynamoDB(userWithId);
          return { success: true, user: result.user, data: result.user, message: 'User created successfully' };
        }
        
        // Handle POST /api/users/:id/approve
        if (endpoint.match(/^\/api\/users\/[^\/]+\/approve$/) && method === 'POST') {
          const id = endpoint.split('/api/users/')[1].split('/')[0];
          const body = JSON.parse(options.body as string);
          await updateUser(id, { 
            approvalStatus: 'approved',
            approvedAt: new Date().toISOString(),
            ...body
          });
          const user = await getUserById(id);
          return { success: true, user, data: user };
        }
        
        // Handle POST /api/users/:id/reject
        if (endpoint.match(/^\/api\/users\/[^\/]+\/reject$/) && method === 'POST') {
          const id = endpoint.split('/api/users/')[1].split('/')[0];
          const body = JSON.parse(options.body as string);
          await updateUser(id, { 
            approvalStatus: 'rejected',
            rejectedAt: new Date().toISOString(),
            ...body
          });
          const user = await getUserById(id);
          return { success: true, user, data: user };
        }
        
        // Handle DELETE /api/users/:id
        if (endpoint.match(/^\/api\/users\/[^\/]+$/) && method === 'DELETE') {
          const id = endpoint.split('/api/users/')[1];
          await deleteUser(id);
          return { success: true, message: 'User deleted' };
        }
        
        // Handle PUT /api/users/:id
        if (endpoint.match(/^\/api\/users\/[^\/]+$/) && method === 'PUT') {
          const id = endpoint.split('/api/users/')[1];
          const updates = JSON.parse(options.body as string);
          await updateUser(id, updates);
          const user = await getUserById(id);
          return { success: true, user, data: user };
        }
        
        // Handle POST /api/users/:id/assign-link
        if (endpoint.match(/^\/api\/users\/[^\/]+\/assign-link$/) && method === 'POST') {
          const id = endpoint.split('/api/users/')[1].split('/')[0];
          const linkData = JSON.parse(options.body as string);
          await updateUser(id, { 
            unilink: linkData.unilink,
            linkId: linkData.linkId,
            templateId: linkData.templateId,
            approvalStatus: 'approved', // Auto-approve when link is assigned
            linkAssignedAt: new Date().toISOString()
          });
          const user = await getUserById(id);
          return { success: true, user, data: user };
        }
        
        // For dashboard endpoints, they're handled in their respective functions
        // Just fall through to backend call attempt
      } catch (error: any) {
        console.error(`DynamoDB Error [${endpoint}]:`, error);
        throw error;
      }
    } else {
      // DynamoDB not configured - return empty data
      const method = options.method || 'GET';
      if (endpoint.includes('/api/users') && method === 'GET') {
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
      return { success: true, data: null };
    }
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
        const method = options.method || 'GET';
        if (endpoint.includes('/api/users') && method === 'GET') {
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
  // On Vercel with DynamoDB, calculate stats from users
  if (isVercelDeployment() && isDynamoDBConfigured()) {
    try {
      const users = await getAllUsers({});
      const links = users.flatMap(u => u.unilink ? [u.unilink] : []);
      
      const totalAffiliates = users.length;
      const pendingApprovals = users.filter(u => u.approvalStatus === 'pending').length;
      const approvedAffiliates = users.filter(u => u.approvalStatus === 'approved').length;
      const totalLinks = links.length;
      
      return {
        success: true,
        totalAffiliates,
        pendingApprovals,
        approvedAffiliates,
        totalLinks,
        totalClicks: 0, // Would need analytics table scan
        totalConversions: 0 // Would need analytics table scan
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
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
  }
  
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
  // On Vercel with DynamoDB, calculate analytics from users and analytics table
  if (isVercelDeployment() && isDynamoDBConfigured()) {
    try {
      const users = await getAllUsers({});
      const approvedUsers = users.filter(u => u.approvalStatus === 'approved');
      
      // Get top affiliates by link count
      const topAffiliates = approvedUsers
        .filter(u => u.unilink)
        .map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          links: 1,
          clicks: 0,
          conversions: 0
        }))
        .slice(0, 10);
      
      return {
        success: true,
        clicks: [],
        conversions: [],
        revenue: 0,
        topAffiliates
      };
    } catch (error) {
      console.error('Error calculating dashboard analytics:', error);
      return {
        success: true,
        clicks: [],
        conversions: [],
        revenue: 0,
        topAffiliates: []
      };
    }
  }
  
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
