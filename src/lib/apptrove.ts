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

/** Templates (Link Templates) */
export async function getTemplates() {
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
 * NOTE: AppTrove has historically been inconsistent here; we try multiple endpoints like the backend.
 */
export async function createLink(templateId: string, linkData: { name?: string; [key: string]: any }) {
  const endpoints: Array<{ url: string; auth: "api-key" | "secret" }> = [
    { url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`, auth: "api-key" },
    { url: `${APPTROVE_API_URL}/internal/link-template/${encodeURIComponent(templateId)}/link`, auth: "secret" },
    { url: `${APPTROVE_API_URL}/internal/link-template/link`, auth: "api-key" },
    { url: `${APPTROVE_API_URL}/internal/unilink`, auth: "api-key" },
  ];

  const payload = {
    name: linkData.name || "Affiliate Link",
    ...linkData,
    templateId,
  };

  let lastErr: any = null;

  for (const ep of endpoints) {
    try {
      const headers = ep.auth === "api-key"
        ? (APPTROVE_API_KEY ? apiKeyHeaders() : null)
        : (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY ? secretHeaders() : null);
      if (!headers) continue;

      const res = await fetch(ep.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`);

      const unilink =
        data?.data?.unilink ??
        data?.unilink ??
        data?.data?.link?.link ??
        data?.data?.link?.unilink ??
        data?.link?.link ??
        data?.link?.unilink ??
        data?.url ??
        null;

      return { success: true, link: data?.data?.link || data?.link || data, unilink };
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(
    `Failed to create link in template ${templateId}. ` +
    `${lastErr?.message || "AppTrove API may block browser requests or not support programmatic link creation."}`
  );
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
