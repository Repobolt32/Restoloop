export function PremiumSkeleton() {
    return (
        <div className="w-full h-full flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="w-1/3 h-12 bg-white/[0.03] rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>

            {/* Cards Skeleton Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-white/[0.02] rounded-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" style={{ animationDelay: `${i * 0.15}s` }} />
                    </div>
                ))}
            </div>

            {/* Main Content Area Skeleton */}
            <div className="flex-1 min-h-[400px] bg-white/[0.02] rounded-2xl border border-white/5 mt-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>

            {/* Inject Global Shimmer Keyframes just for loader states */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
}
