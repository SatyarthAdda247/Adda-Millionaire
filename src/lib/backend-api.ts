/**
 * Backend API Client
 * All API calls go through the old backend (localhost:3001)
 */

const BACKEND_URL = 'http://localhost:3001';

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
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
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
  
  return apiCall(endpoint, { method: 'GET' });
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
  
  return apiCall(endpoint, { method: 'GET' });
}

/** Get dashboard stats */
export async function getDashboardStats() {
  return apiCall('/api/dashboard/stats', { method: 'GET' });
}

/** Get dashboard analytics */
export async function getDashboardAnalytics() {
  return apiCall('/api/dashboard/analytics', { method: 'GET' });
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
