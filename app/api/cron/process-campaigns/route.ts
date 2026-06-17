import { NextResponse } from 'next/server';
import { processCampaigns } from '~/lib/campaigns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');

        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
        }, { status: 500 });
    }
}
