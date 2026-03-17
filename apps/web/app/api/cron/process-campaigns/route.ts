import { NextResponse } from 'next/server';
import { processCampaigns } from '~/lib/campaigns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');

        // Simple Bearer token check for Cron Secret
        // In local development, we enforce it to be "Bearer dev-cron-secret" if CRON_SECRET is empty
        const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await processCampaigns();

        return NextResponse.json({
            success: true,
            results
        });

    } catch (e: any) {
        console.error('Cron campaign processing error:', e);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: e.message,
            stack: e.stack
        }, { status: 500 });
    }
}
