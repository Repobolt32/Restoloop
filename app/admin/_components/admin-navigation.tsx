'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';

export function AdminNavigation() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col gap-2">
            <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname === '/admin' ? 'bg-orange-500/10 text-orange-600 font-medium' : 'hover:bg-secondary/40 opacity-70 hover:opacity-100'
                    }`}
            >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
            </Link>

            <div className="mt-8 border-t border-border/50 pt-4">
                <Link
                    href="/home"
                    className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-secondary/40 opacity-70 hover:opacity-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Exit to Home
                </Link>
            </div>
        </div>
    );
}
