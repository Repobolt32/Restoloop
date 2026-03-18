import React from 'react';
import { StitchCard } from '~/components/stitch/StitchCard';


export default function DashboardPage() {
    return (
        <div className="animate-fade-in-up">
            {/* Header Section */}
            <header className="mb-14 flex items-end justify-between border-b border-white/5 pb-10 font-sans">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                        <p className="text-xs font-black tracking-[0.4em] text-neutral-500 uppercase">
                            System Analytics
                        </p>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-[#FF6B00] mb-2 drop-shadow-[0_0_30px_rgba(255,107,0,0.2)]">
                        Dashboard <span className="text-white">.</span>
                    </h1>
                </div>
            </header>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StitchCard className="p-8">
                    <h3 className="text-sm font-black tracking-[0.2em] text-neutral-500 uppercase mb-2">Total Revenue</h3>
                    <div className="text-4xl font-black text-white">$0.00</div>
                    <div className="text-xs text-orange-500 font-bold mt-2">+0% from last month</div>
                </StitchCard>

                <StitchCard className="p-8">
                    <h3 className="text-sm font-black tracking-[0.2em] text-neutral-500 uppercase mb-2">Returning Guests</h3>
                    <div className="text-4xl font-black text-white">0</div>
                    <div className="text-xs text-emerald-500 font-bold mt-2">Active Protocol</div>
                </StitchCard>

                <StitchCard className="p-8">
                    <h3 className="text-sm font-black tracking-[0.2em] text-neutral-500 uppercase mb-2">Pending Bills</h3>
                    <div className="text-4xl font-black text-white">0</div>
                    <div className="text-xs text-neutral-500 font-bold mt-2">Awaiting Settlement</div>
                </StitchCard>
            </div>


        </div>
    );
}
