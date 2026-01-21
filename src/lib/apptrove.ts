/**
 * AppTrove API Client (Frontend)
 *
 * IMPORTANT:
 * AppTrove's working endpoints (used by our previous backend) are under `/internal/*`
 * and use the header key `api-key` (NOT `X-API-Key`) for API key auth.
 *
 * Env:
 * - VITE_APPTROVE_API_URL (optional, default https://api.apptrove.com)
 * - VITE_APPTROVE_API_KEY (preferred)
 * - VITE_APPTROVE_SECRET_ID + VITE_APPTROVE_SECRET_KEY (fallback; may be blocked by CORS)
 */

const APPTROVE_API_URL = (import.meta.env.VITE_APPTROVE_API_URL || "https://api.apptrove.com").replace(/\/$/, "");
const APPTROVE_API_KEY = import.meta.env.VITE_APPTROVE_API_KEY;
const APPTROVE_SECRET_ID = import.meta.env.VITE_APPTROVE_SECRET_ID;
const APPTROVE_SECRET_KEY = import.meta.env.VITE_APPTROVE_SECRET_KEY;

function baseHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function apiKeyHeaders(): Record<string, string> {
  if (!APPTROVE_API_KEY) throw new Error("AppTrove API key not configured (VITE_APPTROVE_API_KEY).");
  return { ...baseHeaders(), "api-key": APPTROVE_API_KEY };
}

function secretHeaders(): Record<string, string> {
  if (!APPTROVE_SECRET_ID || !APPTROVE_SECRET_KEY) {
    throw new Error("AppTrove secret credentials not configured (VITE_APPTROVE_SECRET_ID/VITE_APPTROVE_SECRET_KEY).");
  }

  // Some endpoints accept these variants.
  return {
    ...baseHeaders(),
    "secret-id": APPTROVE_SECRET_ID,
    "secret-key": APPTROVE_SECRET_KEY,
    "X-Secret-ID": APPTROVE_SECRET_ID,
    "X-Secret-Key": APPTROVE_SECRET_KEY,
  };
}

async function safeJson(res: Response) {
  return await res.json().catch(() => null);
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

/** Templates (Link Templates) - Uses Vercel serverless function to bypass CORS */
export async function getTemplates() {
  // Use Vercel serverless function to bypass CORS
  try {
    const response = await fetch('/api/apptrove/templates', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data.success) {
      return {
        success: true,
        templates: data.templates || [],
      };
    }

    // Don't throw error - just return empty templates
    const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error || 'Failed to fetch templates');
    console.warn('⚠️ Failed to fetch templates (non-critical):', errorMsg);
    return {
      success: false,
      templates: [],
      error: errorMsg,
    };
  } catch (error: any) {
    // Don't throw error - just return empty templates
    console.warn('⚠️ Templates API error (non-critical):', error.message || 'Network error');
    return {
      success: false,
      templates: [],
      error: error.message || 'Network error',
    };
  }
}

/** OLD METHOD - Direct API calls (blocked by CORS, kept for reference) */
export async function getTemplatesDirect() {
  // Mirrors backend `getLinkTemplates()` logic
  const url = `${APPTROVE_API_URL}/internal/link-template${buildQuery({ status: "active", limit: 100 })}`;

  const tryHeaders = [
    { label: "api-key", headers: APPTROVE_API_KEY ? apiKeyHeaders() : null },
    { label: "secret", headers: APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY ? secretHeaders() : null },
  ].filter((x): x is { label: string; headers: Record<string, string> } => !!x.headers);

  let lastErr: any = null;
  for (const attempt of tryHeaders) {
    try {
      const res = await fetch(url, { method: "GET", headers: attempt.headers });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`);

      // Handle the different response structures the backend supported
      const linkTemplateList =
        data?.data?.linkTemplateList ??
        data?.linkTemplateList ??
        (Array.isArray(data) ? data : []) ??
        [];

      return { success: true, templates: linkTemplateList };
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(`Failed to fetch templates: ${lastErr?.message || "Unknown error"}`);
}

/** Links within a template - Uses Vercel serverless function to bypass CORS */
export async function getTemplateLinks(templateId: string) {
  // Use Vercel serverless function to bypass CORS - NEVER call AppTrove API directly
  try {
    console.log(`[AppTrove] Fetching template links via serverless function for template: ${templateId}`);
    
    const response = await fetch(`/api/apptrove/template-links?templateId=${encodeURIComponent(templateId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[AppTrove] Serverless function returned ${response.status}`);
    }

    const data = await response.json().catch((e) => {
      console.error('[AppTrove] Failed to parse response:', e);
      return null;
    });

    if (response.ok && data && data.success) {
      console.log(`[AppTrove] Successfully fetched ${data.links?.length || 0} template links`);
      return {
        success: true,
        links: data.links || [],
      };
    }

    // Don't throw error - just return empty links
    const errorMsg = typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || data?.details || 'Failed to fetch template links');
    console.warn('[AppTrove] Failed to fetch template links (non-critical):', errorMsg);
    return {
      success: false,
      links: [],
      error: errorMsg,
    };
  } catch (error: any) {
    // Don't throw error - just return empty links
    console.error('[AppTrove] Template links API error (non-critical):', error);
    return {
      success: false,
      links: [],
      error: error.message || 'Network error',
    };
  }
}

/**
 * Create UniLink within a template.
 * Uses Vercel serverless function to bypass CORS restrictions.
 */
export async function createLink(templateId: string, linkData: { name?: string; userId?: string; [key: string]: any }) {
  // Use Vercel serverless function to bypass CORS - NEVER call AppTrove API directly
  try {
    console.log(`[AppTrove] Creating link via serverless function for template: ${templateId}`);
    // Extract affiliate data for tracking
    const affiliateData = {
      id: linkData.userId || linkData.affiliateId || '',
      name: linkData.name || linkData.affiliateName || '',
      email: linkData.email || linkData.affiliateEmail || '',
    };

    const response = await fetch('/api/apptrove/create-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        affiliateData,
        linkData: {
          name: linkData.name || 'Affiliate Link',
          userId: linkData.userId || linkData.affiliateId,
          campaign: linkData.campaign || (linkData.name || 'Affiliate Link').replace(/\s+/g, '-').toLowerCase().substring(0, 50),
          deepLinking: linkData.deepLink || '',
          status: linkData.status || 'active',
          // Include all tracking parameters
          metadata: {
            affiliateId: linkData.userId || linkData.affiliateId,
            createdAt: new Date().toISOString(),
            source: 'admin_dashboard',
            ...linkData.metadata,
          },
          // UTM parameters if provided
          ...(linkData.utm_source && { utm_source: linkData.utm_source }),
          ...(linkData.utm_medium && { utm_medium: linkData.utm_medium }),
          ...(linkData.utm_campaign && { utm_campaign: linkData.utm_campaign }),
          ...(linkData.utm_term && { utm_term: linkData.utm_term }),
          ...(linkData.utm_content && { utm_content: linkData.utm_content }),
          // Include any other fields
          ...linkData,
        },
      }),
    });

    if (!response.ok) {
      console.error(`[AppTrove] Serverless function returned ${response.status}`);
    }

    const data = await response.json().catch((e) => {
      console.error('[AppTrove] Failed to parse response:', e);
      return null;
    });

    if (response.ok && data && data.success) {
      console.log(`[AppTrove] Successfully created link: ${data.unilink}`);
      return {
        success: true,
        link: data.link,
        unilink: data.unilink,
        linkId: data.linkId,
        tracking: data.tracking,
      };
    }

    const errorMsg = data?.error || data?.details || 'Failed to create link';
    console.error('[AppTrove] Link creation failed:', errorMsg, data);
    return {
      success: false,
      error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
      unilink: null,
      details: data?.details,
    };
  } catch (error: any) {
    console.error('[AppTrove] createLink error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
      unilink: null,
    };
  }
}

/**
 * OLD METHOD - Direct API calls (blocked by CORS, kept for reference)
 * Create UniLink within a template.
 * Mirrors backend createUniLinkFromTemplate() - tries multiple endpoints and auth methods.
 */
export async function createLinkDirect(templateId: string, linkData: { name?: string; [key: string]: any }) {
  // Build payload matching backend format
  const campaign = linkData.campaign || (linkData.name || "Affiliate Link").replace(/\s+/g, '-').toLowerCase().substring(0, 50);
  const payload = {
    name: linkData.name || "Affiliate Link",
    campaign: campaign,
    deepLinking: linkData.deepLink || '',
    status: linkData.status || 'active',
    ...linkData,
    templateId: templateId, // Include templateId in payload for some endpoints
  };

  // Try multiple endpoints and auth methods (same as backend)
  const endpoints: Array<{ url: string; auth: "api-key" | "secret" | "basic" }> = [
    // Primary endpoint with template ID in path
    { url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`, auth: "api-key" },
    { url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`, auth: "secret" },
    { url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`, auth: "basic" },
    // Alternative endpoints
    { url: `${APPTROVE_API_URL}/internal/link-template/link`, auth: "api-key" },
    { url: `${APPTROVE_API_URL}/internal/link-template/link`, auth: "secret" },
    { url: `${APPTROVE_API_URL}/internal/unilink`, auth: "api-key" },
    { url: `${APPTROVE_API_URL}/internal/unilink`, auth: "secret" },
    // V2 API
    { url: `${APPTROVE_API_URL}/v2/link-template/${encodeURIComponent(templateId)}/link`, auth: "api-key" },
    { url: `${APPTROVE_API_URL}/v2/link-template/${encodeURIComponent(templateId)}/link`, auth: "secret" },
  ];

  let lastErr: any = null;

  for (const ep of endpoints) {
    try {
      let headers: Record<string, string> | null = null;
      
      if (ep.auth === "api-key" && APPTROVE_API_KEY) {
        headers = apiKeyHeaders();
      } else if (ep.auth === "secret" && APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
        headers = secretHeaders();
      } else if (ep.auth === "basic" && APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) {
        // Basic Auth: secret ID as username, secret key as password
        const authString = btoa(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`);
        headers = { ...baseHeaders(), Authorization: `Basic ${authString}` };
      }
      
      if (!headers) continue;

      const res = await fetch(ep.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      
      const data = await safeJson(res);
      
      // Check for success (200-299)
      if (res.ok || res.status === 200 || res.status === 201) {
        // Extract unilink from various response formats
        const unilink =
          data?.data?.unilink ??
          data?.unilink ??
          data?.data?.link?.link ??
          data?.data?.link?.unilink ??
          data?.link?.link ??
          data?.link?.unilink ??
          data?.url ??
          null;

        // If we got a successful response but no unilink, try to construct it
        if (!unilink && data?.data?.link) {
          // Sometimes AppTrove returns link data but not the full URL
          // We can construct it if we have the domain and link ID
          const linkId = data?.data?.link?.id || data?.data?.link?._id;
          if (linkId) {
            // Try common AppTrove URL patterns
            const domain = data?.data?.link?.domain || 'applink.reevo.in';
            return { 
              success: true, 
              link: data?.data?.link || data?.link || data, 
              unilink: `https://${domain}/d/${linkId}` 
            };
          }
        }

        return { success: true, link: data?.data?.link || data?.link || data, unilink };
      }
      
      // If not successful, throw to try next endpoint
      throw new Error(data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`);
    } catch (e: any) {
      lastErr = e;
      // Continue to next endpoint
      continue;
    }
  }

  // If all endpoints failed, return error (don't throw - let caller handle)
  return { 
    success: false, 
    error: `Failed to create link in template ${templateId}. ${lastErr?.message || "AppTrove API may block browser requests (CORS) or not support programmatic link creation from frontend."}`,
    unilink: null 
  };
}

/** Stats - Uses Vercel serverless function with Reporting API Key */
export async function getUniLinkStats(linkId: string) {
  // Use Vercel serverless function to bypass CORS and use Reporting API Key
  try {
    const response = await fetch(`/api/apptrove/stats?linkId=${encodeURIComponent(linkId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data.success) {
      return {
        success: true,
        stats: data.stats,
      };
    }

    return {
      success: false,
      stats: null,
      error: data.error || data.details || 'Failed to fetch stats',
    };
  } catch (error: any) {
    return {
      success: false,
      stats: null,
      error: error.message || 'Network error',
    };
  }
}

export function isAppTroveConfigured(): boolean {
  return !!(APPTROVE_API_KEY || (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY));
}
