'use client';

import React, { useActionState, useState } from 'react';

export interface DashboardStats {
    revenue: number;
    customers: number;
    redeemed: number;
    couponsSent: number;
    credits_balance: number;
    revenueData: { month: string; revenue: number }[];
    couponStats: {
        welcome: { sent: number; redeemed: number };
        birthday: { sent: number; redeemed: number };
        winback: { sent: number; redeemed: number };
    };
    recentActivity: { id: string; name: string; action: string; timeAgo: string }[];
    tenantSlug: string;
}

export interface RetryResult {
    success: boolean;
    data?: DashboardStats;
    error?: string;
}

interface DashboardContentProps {
    data: DashboardStats | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    onRetry: (newData?: DashboardStats) => void;
    retryAction?: (prevState: RetryResult | null, formData: FormData) => Promise<RetryResult>;
}

export default function DashboardContent({
    data,
    isLoading,
    isError,
    error,
    onRetry,
    retryAction,
}: DashboardContentProps) {
    const [currentData, setCurrentData] = useState<DashboardStats | undefined>(data);
    const [currentError, setCurrentError] = useState<{ isError: boolean; error: Error | null }>({
        isError,
        error,
    });

    const [_retryState, retryFormAction, retryPending] = useActionState<RetryResult | null, FormData>(
        retryAction
            ? async (prevState: RetryResult | null, formData: FormData) => {
                const result = await retryAction(prevState, formData);
                if (result.success && result.data) {
                    setCurrentData(result.data);
                    setCurrentError({ isError: false, error: null });
                    onRetry(result.data);
                }
                return result;
            }
            : async (prevState: RetryResult | null) => prevState,
        null
    );

    return (
        <>
            {isLoading && (
                <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-neutral-900/40 border border-white/5 rounded-xl p-6 animate-pulse"
                            >
                                <div className="h-4 w-24 bg-neutral-800 rounded mb-4" />
                                <div className="h-10 w-16 bg-neutral-800 rounded" />
                            </div>
                        ))}
                    </div>
                    <p className="text-neutral-500">Loading...</p>
                </div>
            )}

            {currentError.isError && (
                <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-6 mb-12">
                    <p className="text-red-400 mb-4">
                        Error: {currentError.error?.message || 'Failed to load dashboard data'}
                    </p>
                    <form action={retryFormAction}>
                        <button
                            type="submit"
                            disabled={retryPending}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {retryPending ? 'Retrying...' : 'Retry'}
                        </button>
                    </form>
                </div>
            )}

            {currentData && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-neutral-500 mb-2">Total Customers</h3>
                            <div className="text-3xl font-bold text-white">{currentData.customers}</div>
                        </div>
                        <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-neutral-500 mb-2">Coupons Sent</h3>
                            <div className="text-3xl font-bold text-white">{currentData.couponsSent}</div>
                        </div>
                        <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-neutral-500 mb-2">Credits Remaining</h3>
                            <div className="text-3xl font-bold text-white">{currentData.credits_balance}</div>
                        </div>
                    </div>

                    {/* Coupon Stats Breakdown */}
                    <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-6 mb-12">
                        <h2 className="text-lg font-semibold text-white mb-4">Coupon Performance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(['welcome', 'birthday', 'winback'] as const).map((type) => (
                                <div key={type} className="bg-neutral-800/40 rounded-lg p-4">
                                    <p className="text-sm font-medium text-neutral-500 capitalize mb-1">{type}</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-400">
                                            Sent: <span className="text-white font-medium">{currentData.couponStats[type].sent}</span>
                                        </span>
                                        <span className="text-neutral-400">
                                            Redeemed: <span className="text-white font-medium">{currentData.couponStats[type].redeemed}</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
                        {currentData.recentActivity.length === 0 ? (
                            <p className="text-neutral-500">No recent activity</p>
                        ) : (
                            <div className="space-y-3">
                                {currentData.recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0"
                                    >
                                        <div className="flex gap-2">
                                            <span className="text-white font-medium">{activity.name}</span>
                                            <span className="text-neutral-400">{activity.action}</span>
                                        </div>
                                        <span className="text-xs text-neutral-500">{activity.timeAgo}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
