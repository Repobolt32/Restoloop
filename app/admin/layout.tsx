import { redirect } from 'next/navigation';
import { AdminNavigation } from './_components/admin-navigation';
import { createClient } from '~/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminLayout(props: React.PropsWithChildren) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = authData?.user?.id;
    const adminId = process.env.SUPER_ADMIN_USER_ID;

    if (!userId || !adminId || userId !== adminId) {
        // Basic protection: simply redirect non-admins back to their home
        redirect('/home');
    }

    return (
        <div className="flex min-h-[100dvh] w-full flex-col md:grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-full border-r border-border/50 relative">
                <div className="flex h-[100dvh] flex-col gap-4 sticky top-0 px-4 py-8 overflow-y-auto">
                    <div className="px-2 mb-4">
                        <span className="text-xs font-black tracking-[0.2em] uppercase opacity-50">Admin Panel</span>
                    </div>
                    <AdminNavigation />
                </div>
            </aside>

            {/* Mobile Header & Nav */}
            <div className="md:hidden flex flex-col w-full border-b border-border/50 sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <header className="flex h-16 w-full items-center justify-between px-4">
                    <span className="text-xs font-black tracking-[0.2em] uppercase opacity-70">Admin Panel</span>
                </header>
                <details className="group px-4 pb-2">
                    <summary className="cursor-pointer list-none font-medium text-sm flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                        Directory
                        <span className="group-open:rotate-180 transition-transform text-xs">▼</span>
                    </summary>
                    <nav className="pt-4 pb-4 animate-in slide-in-from-top-2">
                        <AdminNavigation />
                    </nav>
                </details>
            </div>

            <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                {props.children}
            </main>
        </div>
    );
}
