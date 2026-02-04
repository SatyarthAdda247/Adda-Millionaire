/**
 * Vercel Serverless Function: Get Trackier Stats for Unilink
 * 
 * AppTrove unilinks are tracked by Trackier. This endpoint fetches
 * installs, conversions, clicks, and revenue data from Trackier API.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { unilink, linkId, affiliateId, campaignId, startDate, endDate } = req.query;

  // Get Trackier credentials
  const TRACKIER_API_KEY = process.env.TRACKIER_API_KEY || process.env.TRACKIER_PUBLISHER_API_KEY;
  const TRACKIER_API_URL = process.env.TRACKIER_API_URL || 'https://api.trackier.com/v2';

  if (!TRACKIER_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Trackier API key not configured. Add TRACKIER_API_KEY or TRACKIER_PUBLISHER_API_KEY to Vercel environment variables.',
    });
  }

  // Extract campaign/affiliate info from unilink if provided
  // Unilink format: https://applink.reevo.in/d/Smritibisht?pid=...&camp=...
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
    // Try multiple Trackier endpoints
    const endpoints = [
      // Publisher API - Affiliate Reports
      {
        url: `${TRACKIER_API_URL}/publisher/reports/affiliates`,
        params: new URLSearchParams({
          start,
          end,
          ...(affiliateIdToUse && { affiliate_id: affiliateIdToUse }),
          ...(campaignIdToUse && { campaign_id: campaignIdToUse }),
        }),
        label: 'Publisher Affiliate Reports',
      },
      // Publisher API - Campaign Reports
      {
        url: `${TRACKIER_API_URL}/publisher/reports/campaigns`,
        params: new URLSearchParams({
          start,
          end,
          ...(campaignIdToUse && { campaign_id: campaignIdToUse }),
        }),
        label: 'Publisher Campaign Reports',
      },
      // Conversions API
      {
        url: `${TRACKIER_API_URL}/conversions`,
        params: new URLSearchParams({
          start,
          end,
          ...(affiliateIdToUse && { affiliate_id: affiliateIdToUse }),
          ...(campaignIdToUse && { campaign_id: campaignIdToUse }),
        }),
        label: 'Conversions',
      },
      // Clicks API
      {
        url: `${TRACKIER_API_URL}/clicks`,
        params: new URLSearchParams({
          start,
          end,
          ...(affiliateIdToUse && { affiliate_id: affiliateIdToUse }),
          ...(campaignIdToUse && { campaign_id: campaignIdToUse }),
        }),
        label: 'Clicks',
      },
    ];

    let lastError: any = null;
    let aggregatedStats = {
      clicks: 0,
      conversions: 0,
      installs: 0,
      revenue: 0,
      earnings: 0,
      impressions: 0,
    };

    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        const url = `${endpoint.url}?${endpoint.params.toString()}`;
        console.log(`[Trackier] Trying ${endpoint.label}: ${url}`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-Api-Key': TRACKIER_API_KEY,
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
          console.log(`[Trackier] ✅ Success with ${endpoint.label}`);

          // Aggregate stats from different endpoint formats
          if (Array.isArray(data)) {
            // If response is an array of events
            data.forEach((item: any) => {
              aggregatedStats.clicks += item.clicks || item.click_count || 0;
              aggregatedStats.conversions += item.conversions || item.conversion_count || 0;
              aggregatedStats.installs += item.installs || item.install_count || 0;
              aggregatedStats.revenue += parseFloat(item.revenue || item.revenue_amount || 0);
              aggregatedStats.earnings += parseFloat(item.payout || item.earning || 0);
              aggregatedStats.impressions += item.impressions || item.impression_count || 0;
            });
          } else if (data.data && Array.isArray(data.data)) {
            // If response has data array
            data.data.forEach((item: any) => {
              aggregatedStats.clicks += item.clicks || item.click_count || 0;
              aggregatedStats.conversions += item.conversions || item.conversion_count || 0;
              aggregatedStats.installs += item.installs || item.install_count || 0;
              aggregatedStats.revenue += parseFloat(item.revenue || item.revenue_amount || 0);
              aggregatedStats.earnings += parseFloat(item.payout || item.earning || 0);
              aggregatedStats.impressions += item.impressions || item.impression_count || 0;
            });
          } else {
            // If response is a single object with stats
            aggregatedStats.clicks += data.clicks || data.click_count || data.total_clicks || 0;
            aggregatedStats.conversions += data.conversions || data.conversion_count || data.total_conversions || 0;
            aggregatedStats.installs += data.installs || data.install_count || data.total_installs || 0;
            aggregatedStats.revenue += parseFloat(data.revenue || data.revenue_amount || data.total_revenue || 0);
            aggregatedStats.earnings += parseFloat(data.payout || data.earning || data.total_payout || 0);
            aggregatedStats.impressions += data.impressions || data.impression_count || data.total_impressions || 0;
          }
        } else {
          lastError = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
          console.log(`[Trackier] ❌ Failed ${endpoint.label}: ${lastError}`);
        }
      } catch (error: any) {
        lastError = error.message;
        console.error(`[Trackier] Error with ${endpoint.label}:`, error);
      }
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
      source: 'trackier',
      period: { start, end },
      identifiers: {
        unilink: unilink || null,
        linkId: linkId || null,
        affiliateId: affiliateIdToUse || null,
        campaignId: campaignIdToUse || null,
      },
      note: lastError ? `Some endpoints failed: ${lastError}` : 'All endpoints queried successfully',
    });
  } catch (error: any) {
    console.error('[Trackier] Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch stats from Trackier',
      details: error.message,
    });
  }
}
