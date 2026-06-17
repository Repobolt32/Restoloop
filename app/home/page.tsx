import React from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  ExternalLink,
  IndianRupee,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';

/**
 * RESTOLOOP HOME
 * Central hub for quick actions.
 */

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12">
      <div className="text-center mb-16 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-[#E8634A] leading-tight mb-4">
          Restoloop
        </h1>
        <p className="text-xl md:text-2xl text-neutral-400">
          Bring your customers back. Automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Link href="/home/restaurant-profile" className="group">
          <div
            className="h-full bg-neutral-900/40 border border-white/5 hover:border-[#E8634A]/30 transition-all rounded-xl p-8"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8634A]/10 border border-[#E8634A]/20 flex items-center justify-center mb-6">
              <PlusCircle className="w-5 h-5 text-[#E8634A]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Add Customer</h3>
            <p className="text-neutral-500 text-sm">Manually add a customer to your list.</p>
          </div>
        </Link>

        <Link href="/home/customers" className="group">
          <div
            className="h-full bg-neutral-900/40 border border-white/5 hover:border-emerald-500/30 transition-all rounded-xl p-8"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Active Guests</h3>
            <p className="text-neutral-500 text-sm">See who's ready to redeem a coupon.</p>
          </div>
        </Link>

        <Link href="/home/coupons" className="group">
          <div
            className="h-full bg-neutral-900/40 border border-white/5 hover:border-blue-500/30 transition-all rounded-xl p-8"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
              <IndianRupee className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Coupons</h3>
            <p className="text-neutral-500 text-sm">Track all coupons sent and redeemed.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
