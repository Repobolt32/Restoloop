'use client';

import { useState } from 'react';
import { addCredits } from '../_lib/server-actions';
import { Loader2, Plus, Minus, Building } from 'lucide-react';
import { Tenant } from '~/lib/restoloop.types';

export function AdminTenantTable({ initialTenants }: { initialTenants: Tenant[] }) {
    const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [creditAmount, setCreditAmount] = useState<number>(100);

    const handleUpdateCredits = async (tenantId: string, amount: number) => {
        setLoadingMap(prev => ({ ...prev, [tenantId]: true }));
        try {
            const { newBalance } = await addCredits(tenantId, amount);
            setTenants((prev: Tenant[]) => prev.map((t: Tenant) =>
                t.id === tenantId ? { ...t, credits_balance: newBalance! } : t
            ));
        } catch (error) {
            console.error(error);
            alert('Failed to update credits. Ensure SUPER_ADMIN_USER_ID is configured.');
        } finally {
            setLoadingMap(prev => ({ ...prev, [tenantId]: false }));
        }
    };

    if (tenants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-white/10 rounded-2xl bg-white/[0.02]">
                <Building className="h-12 w-12 text-neutral-600 mb-4" />
                <h3 className="text-lg font-black tracking-tight text-white">No tenants yet</h3>
                <p className="text-neutral-500 max-w-sm mt-1 text-sm font-medium">Once restaurants start signing up, they will appear here for credit management.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center gap-3 mb-6 px-8 mt-6">
                <span className="text-xs font-black tracking-[0.2em] text-neutral-500 uppercase">Adjustment Amount:</span>
                <input
                    type="number"
                    value={creditAmount}
                    onChange={e => setCreditAmount(Number(e.target.value))}
                    className="w-24 text-right bg-neutral-900/50 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
            </div>
            <div className="relative w-full overflow-auto px-8 pb-8">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b border-white/5">
                        <tr className="border-b border-white/5 transition-colors">
                            <th className="h-12 px-4 align-middle text-xs font-black tracking-[0.2em] text-neutral-500 uppercase">Tenant Name</th>
                            <th className="h-12 px-4 align-middle text-xs font-black tracking-[0.2em] text-neutral-500 uppercase">Slug</th>
                            <th className="h-12 px-4 align-middle text-xs font-black tracking-[0.2em] text-neutral-500 uppercase text-center">Credit Balance</th>
                            <th className="h-12 px-4 align-middle text-xs font-black tracking-[0.2em] text-neutral-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0 text-white">
                        {tenants.map((t: Tenant) => (
                            <tr key={t.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02] group">
                                <td className="p-4 align-middle font-bold">
                                    {t.name}
                                </td>
                                <td className="p-4 align-middle text-neutral-500 font-mono text-xs">
                                    {t.slug}
                                </td>
                                <td className="p-4 align-middle text-center">
                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black tracking-widest ${t.credits_balance <= 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-white border border-white/10'}`}>
                                        {t.credits_balance}
                                    </span>
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            disabled={loadingMap[t.id]}
                                            onClick={() => handleUpdateCredits(t.id, -Math.abs(creditAmount))}
                                            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-white/10 bg-neutral-900 text-neutral-400 hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <button
                                            disabled={loadingMap[t.id]}
                                            onClick={() => handleUpdateCredits(t.id, Math.abs(creditAmount))}
                                            className="h-9 px-4 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white text-black font-black text-xs hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all disabled:opacity-50 tracking-widest"
                                        >
                                            {loadingMap[t.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                            ADD
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
