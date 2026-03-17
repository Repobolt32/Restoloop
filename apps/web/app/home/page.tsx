'use client';

import React from 'react';
import Link from 'next/link';
import { StitchPortal } from '~/components/stitch/StitchPortal';
import { StitchCard } from '~/components/stitch/StitchCard';
import {
  PlusCircle,
  ExternalLink,
  IndianRupee,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';

/**
 * RESTOLOOP MISSION CONTROL (HOME PAGE)
 * Central hub for high-impact actions and brand presence.
 */

export default function HomePage() {
  return (
    <StitchPortal>
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 animate-fade-in-up">

        {/* Central Brand Mark & Tagline */}
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-orange-500/5 border border-orange-500/10 mb-8 animate-bounce transition-all">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-black tracking-[0.4em] text-orange-500 uppercase">Mission Protocol Active</span>
          </div>

          <h1 className="text-[10vw] lg:text-9xl font-black tracking-tighter text-[#FF6B00] leading-none mb-8 drop-shadow-[0_0_50px_rgba(255,107,0,0.3)] select-none">
            Restoloop <span className="text-white">.</span>
          </h1>

          <p className="text-2xl md:text-3xl font-medium text-neutral-400 tracking-tight leading-relaxed px-4">
            If your guest comes once, <br />
            we make sure they <span className="text-white font-bold">come again and again.</span>
          </p>
        </div>

        {/* Action Launchpads (Quick Action Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">

          {/* Manual Add Card */}
          <Link href="/home/restaurant-profile" className="group">
            <StitchCard
              padding="large"
              className="h-full bg-neutral-900/40 border-white/5 hover:border-orange-500/30 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_20px_40px_rgba(255,107,0,0.05)] relative overflow-hidden"
            >

              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-black transition-all">
                <PlusCircle className="w-6 h-6" />
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Manual Add</h3>
              <p className="text-neutral-500 text-sm font-medium mb-8">Directly check-in a guest into your growth protocol.</p>

              <div className="flex items-center gap-2 text-orange-500 text-xs font-black tracking-widest uppercase mt-auto">
                Launch Entry <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </StitchCard>
          </Link>

          {/* Form Terminal Card */}
          <Link href="/home/restaurant-profile" className="group">
            <StitchCard
              padding="large"
              className="h-full bg-neutral-900/40 border-white/5 hover:border-emerald-500/30 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_20px_40px_rgba(16,185,129,0.05)] relative overflow-hidden"
            >

              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <ExternalLink className="w-6 h-6" />
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Form Terminal</h3>
              <p className="text-neutral-500 text-sm font-medium mb-8">Access and share your public customer intake link.</p>

              <div className="flex items-center gap-2 text-emerald-500 text-xs font-black tracking-widest uppercase mt-auto">
                Open Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </StitchCard>
          </Link>

          {/* Billing System Card */}
          <Link href="/home/billing" className="group">
            <StitchCard
              padding="large"
              className="h-full bg-neutral-900/40 border-white/5 hover:border-blue-500/30 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_20px_40px_rgba(59,130,246,0.05)] relative overflow-hidden"
            >

              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:bg-blue-500 group-hover:text-black transition-all">
                <IndianRupee className="w-6 h-6" />
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Billing System</h3>
              <p className="text-neutral-500 text-sm font-medium mb-8">Initialize the high-fidelity transaction terminal.</p>

              <div className="flex items-center gap-2 text-blue-500 text-xs font-black tracking-widest uppercase mt-auto">
                Start POS <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </StitchCard>
          </Link>

        </div>

        {/* Growth Stats Mini-Banner */}
        <div className="mt-20 w-full max-w-6xl border border-white/5 bg-white/[0.01] rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-white/[0.02] transition-all">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-orange-600/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Users className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <div className="text-xs font-black tracking-[0.3em] text-neutral-600 uppercase mb-1">Returning Guest Engine</div>
              <div className="text-4xl font-black tracking-tighter text-white">Monitoring Growth <span className="animate-pulse">...</span></div>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="text-right">
              <div className="text-[10px] font-black tracking-widest text-neutral-600 uppercase mb-1">Status</div>
              <div className="text-emerald-500 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </div>
            </div>
            <Link href="/home/restaurant-profile" className="bg-white text-black font-black py-4 px-10 rounded-2xl text-sm hover:bg-orange-500 hover:text-black transition-all active:scale-95 shadow-xl shadow-white/5">
              Sync Database
            </Link>
          </div>
        </div>

      </div>
    </StitchPortal>
  );
}
