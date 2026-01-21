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

    return {
      success: false,
      templates: [],
      error: data.error || 'Failed to fetch templates',
    };
  } catch (error: any) {
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

/** Links within a template */
export async function getTemplateLinks(templateId: string) {
  // Endpoint varies; try a few known patterns.
  const endpoints = [
    `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`,
    `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/links`,
  ];

  const headers = APPTROVE_API_KEY ? apiKeyHeaders() : secretHeaders();
  let lastErr: any = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: "GET", headers });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`);

      const links = data?.data?.linkList ?? data?.linkList ?? data?.data?.links ?? data?.links ?? (Array.isArray(data) ? data : []);
      return { success: true, links };
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(`Failed to fetch template links: ${lastErr?.message || "Unknown error"}`);
}

/**
 * Create UniLink within a template.
 * Uses Vercel serverless function to bypass CORS restrictions.
 */
export async function createLink(templateId: string, linkData: { name?: string; [key: string]: any }) {
  // Use Vercel serverless function to bypass CORS
  try {
    const response = await fetch('/api/apptrove/create-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        linkData: {
          name: linkData.name || 'Affiliate Link',
          campaign: linkData.campaign || (linkData.name || 'Affiliate Link').replace(/\s+/g, '-').toLowerCase().substring(0, 50),
          deepLinking: linkData.deepLink || '',
          status: linkData.status || 'active',
          ...linkData,
        },
      }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data.success) {
      return {
        success: true,
        link: data.link,
        unilink: data.unilink,
      };
    }

    return {
      success: false,
      error: data.error || data.details || 'Failed to create link',
      unilink: null,
    };
  } catch (error: any) {
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

/** Stats (best-effort; endpoint may differ) */
export async function getUniLinkStats(linkId: string) {
  const endpoints = [
    `${APPTROVE_API_URL}/internal/unilink/${encodeURIComponent(linkId)}/stats`,
    `${APPTROVE_API_URL}/internal/link/${encodeURIComponent(linkId)}/stats`,
  ];

  const headers = APPTROVE_API_KEY ? apiKeyHeaders() : secretHeaders();
  let lastErr: any = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: "GET", headers });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`);
      return { success: true, stats: data?.data || data };
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(`Failed to fetch stats: ${lastErr?.message || "Unknown error"}`);
}

export function isAppTroveConfigured(): boolean {
  return !!(APPTROVE_API_KEY || (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY));
}
