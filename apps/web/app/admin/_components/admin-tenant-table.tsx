'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Input } from '@kit/ui/input';
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
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
                <Building className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No tenants yet</h3>
                <p className="text-gray-500 max-w-sm mt-1">Once restaurants start signing up, they will appear here for credit management.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Adjustment Amount:</span>
                <Input
                    type="number"
                    value={creditAmount}
                    onChange={e => setCreditAmount(Number(e.target.value))}
                    className="w-24 text-right"
                />
            </div>
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Tenant Name</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Slug</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Credit Balance</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {tenants.map((t: Tenant) => (
                            <tr key={t.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle font-medium">
                                    {t.name}
                                </td>
                                <td className="p-4 align-middle text-gray-500 font-mono text-xs">
                                    {t.slug}
                                </td>
                                <td className="p-4 align-middle text-center">
                                    <Badge variant={t.credits_balance <= 0 ? "destructive" : "default"}>
                                        {t.credits_balance}
                                    </Badge>
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={loadingMap[t.id]}
                                            onClick={() => handleUpdateCredits(t.id, -Math.abs(creditAmount))}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={loadingMap[t.id]}
                                            onClick={() => handleUpdateCredits(t.id, Math.abs(creditAmount))}
                                        >
                                            {loadingMap[t.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            <span className="ml-1">Add</span>
                                        </Button>
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
