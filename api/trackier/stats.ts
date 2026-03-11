/**
 * Vercel Serverless Function: Get Adjust Stats for Unilink
 * 
 * AppTrove unilinks are tracked by Adjust.This endpoint fetches
 * installs, conversions, clicks, and revenue data from Adjust API.
 * 
 * Note: Kept path as api / trackier / stats.ts for frontend backward compatibility
  */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { unilink, linkId, affiliateId, campaignId, startDate, endDate } = req.query;

  // Get Adjust credentials
  const ADJUST_API_TOKEN = process.env.ADJUST_API_TOKEN || '8zTxM99vLdeeZ_kPAc3b-ykVL1QMPJvhfYSyC79cMq7evzxyeA';
  const ADJUST_APP_TOKEN = process.env.ADJUST_APP_TOKEN || '5chd8nwq2pkw';
  const ADJUST_API_URL = process.env.ADJUST_API_URL || 'https://api.adjust.com';

  if (!ADJUST_API_TOKEN || !ADJUST_APP_TOKEN) {
    return res.status(500).json({
      success: false,
      error: 'Adjust API token or App token not configured. Add them to Vercel environment variables.',
    });
  }

  // Extract campaign/affiliate info from unilink if provided
  // Unilink format: https://applink.learnr.co.in/d/Smritibisht?pid=...&camp=...
  let campaignIdToUse = campaignId as string;
  let affiliateIdToUse = affiliateId as string;

  if (unilink && typeof unilink === 'string') {
    try {
      const url = new URL(unilink);
      // Extract campaign from query params
      const camp = url.searchParams.get('camp') || url.searchParams.get('campaign');
      if (camp) campaignIdToUse = camp;

      // Extract affiliate ID from path (e.g., /d/Smritibisht)
      const pathParts = url.pathname.split('/');
      const linkIdentifier = pathParts[pathParts.length - 1];
      if (linkIdentifier && linkIdentifier !== 'd') {
        affiliateIdToUse = linkIdentifier;
      }
    } catch (e) {
      // If unilink is not a full URL, use it as affiliateId
      affiliateIdToUse = unilink;
    }
  }

  // Use linkId as fallback for affiliateId
  if (!affiliateIdToUse && linkId) {
    affiliateIdToUse = linkId as string;
  }

  if (!affiliateIdToUse && !campaignIdToUse) {
    return res.status(400).json({
      success: false,
      error: 'Either unilink, linkId, affiliateId, or campaignId is required',
    });
  }

  // Default date range: last 30 days
  const end = endDate as string || new Date().toISOString().split('T')[0];
  const start = startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const url = `${ADJUST_API_URL}/api/v1/apps/${ADJUST_APP_TOKEN}/reports`;

    // Create query parameters
    const params = new URLSearchParams({
      date_period: `${start}:${end}`,
      dimensions: 'tracker',
      metrics: 'clicks,installs,revenue,network_cost',
    });

    // Add tracker filter if available
    // Note: Assuming affiliateId is the tracker token in Adjust
    if (affiliateIdToUse) {
      params.append('tracker_filter', affiliateIdToUse);
    }

    const requestUrl = `${url}?${params.toString()}`;
    console.log(`[Adjust] Querying Report API: ${requestUrl}`);

    let lastError: any = null;
    let aggregatedStats = {
      clicks: 0,
      conversions: 0,
      installs: 0,
      revenue: 0,
      earnings: 0,
      impressions: 0,
    };

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ADJUST_API_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      const text = await response.text();
      let data: any = null;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (response.ok && data) {
        console.log(`[Adjust] ✅ Success fetching stats`);

        const rows = data.rows || [];

        rows.forEach((item: any) => {
          aggregatedStats.clicks += item.clicks || 0;
          // Treat installs as conversions for now
          aggregatedStats.conversions += item.installs || 0;
          aggregatedStats.installs += item.installs || 0;
          aggregatedStats.revenue += parseFloat(item.revenue || '0');
          aggregatedStats.earnings += parseFloat(item.network_cost || '0');
        });

      } else {
        lastError = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
        console.log(`[Adjust] ❌ Failed query: ${lastError}`);
      }
    } catch (error: any) {
      lastError = error.message;
      console.error(`[Adjust] Error querying report API:`, error);
    }

    // Calculate conversion rate
    const conversionRate = aggregatedStats.clicks > 0
      ? ((aggregatedStats.conversions / aggregatedStats.clicks) * 100).toFixed(2)
      : '0.00';

    return res.status(200).json({
      success: true,
      stats: {
        clicks: aggregatedStats.clicks,
        conversions: aggregatedStats.conversions,
        installs: aggregatedStats.installs,
        revenue: parseFloat(aggregatedStats.revenue.toFixed(2)),
        earnings: parseFloat(aggregatedStats.earnings.toFixed(2)),
        impressions: aggregatedStats.impressions,
        conversionRate: parseFloat(conversionRate),
      },
      source: 'adjust',
      period: { start, end },
      identifiers: {
        unilink: unilink || null,
        linkId: linkId || null,
        affiliateId: affiliateIdToUse || null,
        campaignId: campaignIdToUse || null,
      },
      note: lastError ? `Query failed: ${lastError}` : 'Successfully fetched Adjust stats',
    });
  } catch (error: any) {
    console.error('[Adjust] Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch stats from Adjust',
      details: error.message,
    });
  }
}
