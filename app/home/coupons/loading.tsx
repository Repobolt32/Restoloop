export default function Loading() {
  return (
    <div className="w-full animate-pulse space-y-6">
      <div className="flex flex-wrap gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 bg-neutral-200 rounded-md" />
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3"><div className="h-4 w-16 bg-neutral-200 rounded" /></th>
              <th className="px-4 py-3"><div className="h-4 w-16 bg-neutral-200 rounded" /></th>
              <th className="px-4 py-3"><div className="h-4 w-16 bg-neutral-200 rounded" /></th>
              <th className="px-4 py-3"><div className="h-4 w-16 bg-neutral-200 rounded" /></th>
              <th className="px-4 py-3"><div className="h-4 w-16 bg-neutral-200 rounded" /></th>
              <th className="px-4 py-3"><div className="h-4 w-16 bg-neutral-200 rounded" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-20 bg-neutral-100 rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-12 bg-neutral-100 rounded-full" /></td>
                <td className="px-4 py-3"><div className="h-4 w-8 bg-neutral-100 rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-12 bg-neutral-100 rounded-full" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-neutral-100 rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-32 bg-neutral-100 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
