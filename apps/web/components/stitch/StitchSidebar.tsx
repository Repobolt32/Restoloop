'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    TicketPercent,
    MessageSquare,
    BarChart3,
    Activity,
    FileText,
    Settings,
    LogOut,
    PlusCircle,
    Home
} from 'lucide-react';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';
import { STITCH_TOKENS } from './tokens';

const CORE_ITEMS = [
    { label: 'Home', icon: Home, href: '/home' },
    { label: 'Dashboard', icon: LayoutDashboard, href: '/home/dashboard' },
    { label: 'Profile', icon: Users, href: '/home/restaurant-profile' },
    { label: 'Billing', icon: TicketPercent, href: '/home/billing' },
    { label: 'Settings', icon: Settings, href: '/home/settings' },
];

export function StitchSidebar() {
    const pathname = usePathname();
    const signOut = useSignOut();
    const user = useUser();

    const NavItem = ({ item }: { item: typeof CORE_ITEMS[0] }) => {
        const isActive = pathname === item.href;

        return (
            <Link
                href={item.href}
                className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all group relative ${isActive
                    ? 'bg-orange-500/10 text-white'
                    : 'text-neutral-500 hover:text-white hover:bg-white/[0.02]'
                    }`}
            >
                {isActive && (
                    <div className="absolute left-[-4px] w-1.5 h-10 bg-orange-500 rounded-r-full shadow-[0_0_25px_rgba(249,115,22,0.8)] z-10" />
                )}
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' : ''}`} />
                <span className={`text-base font-bold tracking-tight whitespace-nowrap ${isActive ? 'text-white' : ''}`}>{item.label}</span>
            </Link>
        );
    };

    return (
        <aside className="w-[300px] h-full flex flex-col bg-black border-r border-white/5 py-12 shrink-0">
            {/* Logo area */}
            <div className="px-10 mb-20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] shrink-0">
                    <div className="w-5 h-5 bg-black rotate-45" />
                </div>
                <span className="font-black text-2xl tracking-tighter text-white">Restoloop <span className="text-orange-500">.</span></span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide">
                <div className="px-6 mb-6 text-xs font-black tracking-[0.4em] text-orange-500 uppercase drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]">Restoloop</div>
                {CORE_ITEMS.map((item) => <NavItem key={item.label} item={item} />)}
            </div>

            {/* User Profile Hookup if available */}
            {user.data && (
                <div className="px-10 mb-6 py-4 border-t border-white/5 mx-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-[10px] font-black uppercase text-neutral-500">
                        {user.data.email?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-[10px] font-black tracking-widest text-white truncate uppercase">{user.data.email?.split('@')[0]}</div>
                        <div className="text-[8px] font-bold text-neutral-600 truncate uppercase mt-0.5">Verified Profile</div>
                    </div>
                </div>
            )}

            {/* System Status - Terminal Aesthetic */}
            <div className="px-10 mt-6 pt-6 border-t border-white/5 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                    <span className="text-xs font-black tracking-[0.2em] text-neutral-600 uppercase">System: Online</span>
                </div>
                <div className="text-xs font-medium text-neutral-800 tracking-tight font-mono uppercase">Node_SA_01_Active</div>
            </div>

            {/* Logout */}
            <div className="px-4 mt-auto">
                <button
                    onClick={() => signOut.mutate()}
                    className="flex items-center gap-4 px-6 py-5 rounded-xl text-neutral-700 hover:text-red-400 hover:bg-red-500/5 transition-all w-full group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-base font-bold tracking-tight text-left">Logout</span>
                </button>
            </div>
        </aside>
    );
}
