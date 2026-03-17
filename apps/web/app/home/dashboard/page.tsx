'use client';

import React from 'react';
import { StitchPortal } from '~/components/stitch/StitchPortal';
import { DashboardDemo } from '../_components/dashboard-demo';

/**
 * RESTOLOOP ANALYTICS DASHBOARD
 * Dedicated page for performance tracking and charts.
 */

export default function DashboardPage() {
    return (
        <StitchPortal>
            <div className="animate-fade-in">
                {/* Header Section */}
                <div className="mb-12">
                    <h1 className="text-7xl font-black tracking-tighter text-[#FF6B00] mb-2 drop-shadow-[0_0_30px_rgba(255,107,0,0.2)]">
                        Dashboard <span className="text-white">.</span>
                    </h1>
                    <p className="text-neutral-500 font-medium tracking-tight">System analysis and growth metrics.</p>
                </div>

                {/* Dashboard Content */}
                <div className="bg-neutral-900/20 border border-white/5 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl shadow-black/20">
                    <DashboardDemo />
                </div>
            </div>
        </StitchPortal>
    );
}
