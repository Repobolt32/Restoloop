export default function Loading() {
    return (
        <div className="flex flex-col gap-8 p-8 animate-pulse">
            <div className="w-1/3 h-12 bg-neutral-800 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-neutral-800/50 rounded-2xl" />
                ))}
            </div>
            <div className="flex-1 min-h-[400px] bg-neutral-800/50 rounded-2xl mt-4" />
        </div>
    );
}
