import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { name, label } = req.body || {};

    if (!name) {
        return res.status(400).json({ success: false, error: 'Tracker name is required' });
    }

    // Get App / API tokens from Vercel environment variables
    const ADJUST_APP_TOKEN = process.env.ADJUST_APP_TOKEN || process.env.VITE_ADJUST_APP_TOKEN;
    const ADJUST_API_TOKEN = process.env.ADJUST_API_TOKEN || process.env.VITE_ADJUST_API_TOKEN;

    if (!ADJUST_APP_TOKEN || !ADJUST_API_TOKEN) {
        console.error('Missing Adjust tokens in environment');
        return res.status(500).json({
            success: false,
            error: 'Adjust API tokens are not configured in Vercel environment'
        });
    }

    try {
        const url = `https://api.adjust.com/app/${ADJUST_APP_TOKEN}/trackers`;

        const payload: any = {
            name: name
        };
        if (label) {
            payload.label = label;
        }

        console.log(`[Adjust] Creating tracker for ${name}`);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Token token=${ADJUST_API_TOKEN}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data) {
            console.log(`[Adjust] Successfully created tracker: ${data.item?.token || data.token}`);
            return res.status(200).json({
                success: true,
                tracker_token: data.item?.token || data.token || data.tracker_token,
                details: data
            });
        }

        console.error(`[Adjust] Failed to create tracker. Status: ${response.status}`, data);
        return res.status(response.status).json({
            success: false,
            error: data?.error || data?.message || "Failed to create Adjust tracker",
            details: data
        });
    } catch (error: any) {
        console.error('[Adjust] Network error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || "Network error when calling Adjust"
        });
    }
}
