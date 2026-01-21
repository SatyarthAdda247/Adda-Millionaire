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
  const APPTROVE_REPORTING_API_KEY = process.env.VITE_APPTROVE_REPORTING_API_KEY || process.env.APPTROVE_REPORTING_API_KEY || '297c9ed1-c4b7-4879-b80a-1504140eb65e';
  const APPTROVE_API_KEY = process.env.VITE_APPTROVE_API_KEY || process.env.APPTROVE_API_KEY;
  const APPTROVE_API_URL = (process.env.VITE_APPTROVE_API_URL || process.env.APPTROVE_API_URL || 'https://api.apptrove.com').replace(/\/$/, '');

  // Try multiple endpoints for stats
  const endpoints = [
    `${APPTROVE_API_URL}/internal/unilink/${encodeURIComponent(linkId)}/stats`,
    `${APPTROVE_API_URL}/internal/link/${encodeURIComponent(linkId)}/stats`,
    `${APPTROVE_API_URL}/api/reporting/link/${encodeURIComponent(linkId)}/stats`,
  ];

  // Try Reporting API Key first, then regular API Key
  const tryHeaders = [
    { label: 'reporting-api-key', headers: APPTROVE_REPORTING_API_KEY ? {
      'api-key': APPTROVE_REPORTING_API_KEY,
      'X-Reporting-API-Key': APPTROVE_REPORTING_API_KEY,
      'Accept': 'application/json'
    } : null },
    { label: 'api-key', headers: APPTROVE_API_KEY ? {
      'api-key': APPTROVE_API_KEY,
      'Accept': 'application/json'
    } : null },
  ].filter((x): x is { label: string; headers: Record<string, string> } => !!x.headers);

  let lastError: any = null;

  for (const url of endpoints) {
    for (const attempt of tryHeaders) {
      try {
        const response = await fetch(url, { method: 'GET', headers: attempt.headers });
        const data = await response.json().catch(() => null);

        if (response.ok) {
          return res.status(200).json({
            success: true,
            stats: data?.data || data?.stats || data,
          });
        }

        lastError = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch (error: any) {
        lastError = error.message || 'Network error';
      }
    }
  }

  return res.status(500).json({
    success: false,
    error: `Failed to fetch stats for link ${linkId}`,
    details: lastError || 'Unknown error',
  });
}
