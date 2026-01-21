/**
 * AppTrove API Client (Frontend)
 * 
 * Direct API calls to AppTrove from the frontend.
 * Requires AppTrove API credentials in environment variables:
 * - VITE_APPTROVE_API_KEY (or VITE_APPTROVE_SECRET_ID + VITE_APPTROVE_SECRET_KEY)
 */

const APPTROVE_API_KEY = import.meta.env.VITE_APPTROVE_API_KEY;
const APPTROVE_SECRET_ID = import.meta.env.VITE_APPTROVE_SECRET_ID;
const APPTROVE_SECRET_KEY = import.meta.env.VITE_APPTROVE_SECRET_KEY;
const APPTROVE_BASE_URL = 'https://api.apptrove.com/api/v1';

// Get authentication headers
function getAuthHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Try API Key first
  if (APPTROVE_API_KEY) {
    headers['X-API-Key'] = APPTROVE_API_KEY;
    return headers;
  }

  // Try Secret ID/Key
  if (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
    headers['X-Secret-ID'] = APPTROVE_SECRET_ID;
    headers['X-Secret-Key'] = APPTROVE_SECRET_KEY;
    return headers;
  }

  throw new Error('AppTrove API credentials not configured. Set VITE_APPTROVE_API_KEY or VITE_APPTROVE_SECRET_ID + VITE_APPTROVE_SECRET_KEY');
}

// Get all templates
export async function getTemplates() {
  try {
    const response = await fetch(`${APPTROVE_BASE_URL}/templates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      templates: data.templates || data || [],
    };
  } catch (error: any) {
    console.error('Error fetching AppTrove templates:', error);
    throw new Error(`Failed to fetch templates: ${error.message || 'Unknown error'}`);
  }
}

// Get links for a template
export async function getTemplateLinks(templateId: string) {
  try {
    const response = await fetch(`${APPTROVE_BASE_URL}/templates/${templateId}/links`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      links: data.links || data || [],
    };
  } catch (error: any) {
    console.error('Error fetching AppTrove template links:', error);
    throw new Error(`Failed to fetch template links: ${error.message || 'Unknown error'}`);
  }
}

// Create a new link for a template
export async function createLink(templateId: string, linkData: {
  name?: string;
  description?: string;
  customDomain?: string;
  [key: string]: any;
}) {
  try {
    const response = await fetch(`${APPTROVE_BASE_URL}/templates/${templateId}/links`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(linkData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      link: data.link || data,
      unilink: data.unilink || data.link?.unilink || data.url,
    };
  } catch (error: any) {
    console.error('Error creating AppTrove link:', error);
    throw new Error(`Failed to create link: ${error.message || 'Unknown error'}`);
  }
}

// Get UniLink stats
export async function getUniLinkStats(linkId: string) {
  try {
    const response = await fetch(`${APPTROVE_BASE_URL}/links/${linkId}/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      stats: data.stats || data,
    };
  } catch (error: any) {
    console.error('Error fetching UniLink stats:', error);
    throw new Error(`Failed to fetch stats: ${error.message || 'Unknown error'}`);
  }
}

// Check if AppTrove is configured
export function isAppTroveConfigured(): boolean {
  return !!(APPTROVE_API_KEY || (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY));
}
