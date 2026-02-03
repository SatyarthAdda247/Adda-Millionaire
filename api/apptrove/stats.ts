/**
 * Vercel Serverless Function: Get AppTrove Link Stats
 * 
 * Uses Reporting API Key for analytics/reporting endpoints.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { linkId } = req.query;

  if (!linkId || typeof linkId !== 'string') {
    return res.status(400).json({ error: 'Link ID is required' });
  }

  // Get AppTrove credentials from environment variables
  // NOTE: Vercel serverless functions CANNOT access VITE_ prefixed variables
  // Priority: Non-VITE env vars > VITE_ vars (for local dev) > Hardcoded fallbacks
  const APPTROVE_REPORTING_API_KEY = process.env.APPTROVE_REPORTING_API_KEY || process.env.VITE_APPTROVE_REPORTING_API_KEY || '297c9ed1-c4b7-4879-b80a-1504140eb65e';
  const APPTROVE_API_KEY = process.env.APPTROVE_API_KEY || process.env.APPTROVE_S2S_API || process.env.VITE_APPTROVE_API_KEY;
  const APPTROVE_API_URL = (process.env.APPTROVE_API_URL || process.env.VITE_APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

  // Try multiple endpoints for stats (expanded based on common API patterns)
  const endpoints = [
    // Internal endpoints
    `${APPTROVE_API_URL}/internal/unilink/${encodeURIComponent(linkId)}/stats`,
    `${APPTROVE_API_URL}/internal/link/${encodeURIComponent(linkId)}/stats`,
    `${APPTROVE_API_URL}/internal/unilink/${encodeURIComponent(linkId)}/analytics`,
    `${APPTROVE_API_URL}/internal/link/${encodeURIComponent(linkId)}/analytics`,
    
    // Reporting endpoints
    `${APPTROVE_API_URL}/reporting/unilink/${encodeURIComponent(linkId)}/stats`,
    `${APPTROVE_API_URL}/reporting/link/${encodeURIComponent(linkId)}/stats`,
    `${APPTROVE_API_URL}/api/reporting/link/${encodeURIComponent(linkId)}/stats`,
    
    // V1/V2 API endpoints
    `${APPTROVE_API_URL}/v1/links/${encodeURIComponent(linkId)}/stats`,
    `${APPTROVE_API_URL}/v2/links/${encodeURIComponent(linkId)}/stats`,
    
    // Analytics endpoints
    `${APPTROVE_API_URL}/analytics/link/${encodeURIComponent(linkId)}`,
    `${APPTROVE_API_URL}/analytics/unilink/${encodeURIComponent(linkId)}`,
  ];

  // Try all possible authentication methods
  const APPTROVE_S2S_API = process.env.APPTROVE_S2S_API || process.env.VITE_APPTROVE_S2S_API;
  const APPTROVE_SDK_KEY = process.env.APPTROVE_SDK_KEY || process.env.VITE_APPTROVE_SDK_KEY;
  const APPTROVE_SECRET_ID = process.env.APPTROVE_SECRET_ID || process.env.VITE_APPTROVE_SECRET_ID;
  const APPTROVE_SECRET_KEY = process.env.APPTROVE_SECRET_KEY || process.env.VITE_APPTROVE_SECRET_KEY;
  
  const tryHeaders = [
    { label: 'reporting-api-key-lowercase', headers: {
      'api-key': APPTROVE_REPORTING_API_KEY,
      'Accept': 'application/json'
    } },
    { label: 'reporting-api-key-uppercase', headers: {
      'X-Api-Key': APPTROVE_REPORTING_API_KEY,
      'Accept': 'application/json'
    } },
    { label: 'bearer-reporting-key', headers: {
      'Authorization': `Bearer ${APPTROVE_REPORTING_API_KEY}`,
      'Accept': 'application/json'
    } },
    { label: 's2s-api-key-lowercase', headers: {
      'api-key': APPTROVE_S2S_API,
      'Accept': 'application/json'
    } },
    { label: 's2s-api-key-uppercase', headers: {
      'X-Api-Key': APPTROVE_S2S_API,
      'Accept': 'application/json'
    } },
    { label: 'bearer-s2s-key', headers: {
      'Authorization': `Bearer ${APPTROVE_S2S_API}`,
      'Accept': 'application/json'
    } },
    { label: 'sdk-key-lowercase', headers: {
      'api-key': APPTROVE_SDK_KEY,
      'Accept': 'application/json'
    } },
    { label: 'sdk-key-uppercase', headers: {
      'X-Api-Key': APPTROVE_SDK_KEY,
      'Accept': 'application/json'
    } },
    { label: 'basic-auth', headers: {
      'Authorization': `Basic ${Buffer.from(`${APPTROVE_SECRET_ID}:${APPTROVE_SECRET_KEY}`).toString('base64')}`,
      'Accept': 'application/json'
    } },
  ].filter(h => Object.values(h.headers).every(v => v && v !== 'undefined'));

  let lastError: any = null;
  const attemptLog: any[] = [];

  for (const url of endpoints) {
    for (const attempt of tryHeaders) {
      try {
        console.log(`[Stats] Trying: ${attempt.label} at ${url}`);
        const response = await fetch(url, { method: 'GET', headers: attempt.headers });
        const text = await response.text();
        let data = null;
        
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        attemptLog.push({
          url,
          method: attempt.label,
          status: response.status,
          response: data
        });

        if (response.ok) {
          console.log(`[Stats] ✅ Success with ${attempt.label}`);
          return res.status(200).json({
            success: true,
            stats: data?.data || data?.stats || data,
          });
        }

        lastError = data?.message || data?.error || text || `HTTP ${response.status}: ${response.statusText}`;
        console.log(`[Stats] ❌ Failed: ${lastError}`);
      } catch (error: any) {
        lastError = error.message || 'Network error';
        console.error(`[Stats] ❌ Error:`, error);
        attemptLog.push({
          url,
          method: attempt.label,
          error: error.message
        });
      }
    }
  }

  console.error(`[Stats] All attempts failed for linkId: ${linkId}`);
  return res.status(500).json({
    success: false,
    error: `Failed to fetch stats for link ${linkId}`,
    details: lastError || 'Unknown error',
    attempts: attemptLog,
    note: 'AppTrove may not support stats API, or the link may not have any activity yet. Consider using Trackier for detailed analytics.'
  });
}
