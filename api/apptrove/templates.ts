/**
 * Vercel Serverless Function: Get AppTrove Templates
 * 
 * This proxies AppTrove API calls to bypass CORS restrictions.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get AppTrove credentials from environment variables
    const APPTROVE_API_KEY = process.env.VITE_APPTROVE_API_KEY || process.env.APPTROVE_API_KEY;
    const APPTROVE_SDK_KEY = process.env.VITE_APPTROVE_SDK_KEY || process.env.APPTROVE_SDK_KEY || '5d11fe82-cab7-4b00-87d0-65a5fa40232f';
    const APPTROVE_SECRET_ID = process.env.VITE_APPTROVE_SECRET_ID || process.env.APPTROVE_SECRET_ID;
    const APPTROVE_SECRET_KEY = process.env.VITE_APPTROVE_SECRET_KEY || process.env.APPTROVE_SECRET_KEY;
    const APPTROVE_API_URL = (process.env.VITE_APPTROVE_API_URL || process.env.APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

    const url = `${APPTROVE_API_URL}/internal/link-template?status=active&limit=100`;

    // Try api-key first (API Key or SDK Key), then secret headers
    const tryHeaders = [
      { label: 'api-key', headers: APPTROVE_API_KEY ? { 'api-key': APPTROVE_API_KEY, 'Accept': 'application/json' } : null },
      { label: 'sdk-key', headers: APPTROVE_SDK_KEY ? { 
        'api-key': APPTROVE_SDK_KEY, 
        'X-SDK-Key': APPTROVE_SDK_KEY,
        'Accept': 'application/json' 
      } : null },
      { label: 'secret', headers: (APPTROVE_SECRET_ID && APPTROVE_SECRET_KEY) ? {
        'secret-id': APPTROVE_SECRET_ID,
        'secret-key': APPTROVE_SECRET_KEY,
        'X-Secret-ID': APPTROVE_SECRET_ID,
        'X-Secret-Key': APPTROVE_SECRET_KEY,
        'Accept': 'application/json'
      } : null },
    ].filter((x): x is { label: string; headers: Record<string, string> } => !!x.headers);

    let lastError: any = null;

    for (const attempt of tryHeaders) {
      try {
        const response = await fetch(url, { method: 'GET', headers: attempt.headers });
        const data = await response.json().catch(() => null);

        if (response.ok) {
          // Handle different response structures
          const linkTemplateList =
            data?.data?.linkTemplateList ??
            data?.linkTemplateList ??
            (Array.isArray(data) ? data : []) ??
            [];

          return res.status(200).json({ success: true, templates: linkTemplateList });
        }

        lastError = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch (error: any) {
        lastError = error.message || 'Network error';
      }
    }

    // Return empty templates instead of error - don't crash
    return res.status(200).json({
      success: false,
      error: `Failed to fetch templates: ${lastError || 'Unknown error'}`,
      templates: []
    });
  } catch (error: any) {
    console.error('Serverless function error:', error);
    // Return empty templates instead of crashing
    return res.status(200).json({
      success: false,
      error: 'Internal server error',
      templates: [],
      details: error.message || 'Unknown error occurred',
    });
  }
}
