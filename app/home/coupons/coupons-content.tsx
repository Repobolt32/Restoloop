'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CouponType } from '~/lib/restoloop.types';
import { Button } from '../../../components/ui/button';

export interface CouponRow {
  id: string;
  code: string;
  type: CouponType;
  discount: number;
  status: 'pending' | 'sent' | 'redeemed' | 'expired';
  sentDate: string;
  customerName: string;
}

interface CouponsContentProps {
  data: CouponRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry?: () => void;
}

const TYPE_LABELS: Record<CouponType, string> = {
  welcome: 'Welcome',
  bday: 'Birthday',
  winback: 'Winback',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'pending',
  sent: 'sent',
  redeemed: 'redeemed',
  expired: 'expired',
};

const TYPE_COLORS: Record<CouponType, string> = {
  welcome: 'bg-blue-100 text-blue-700 border-blue-200',
  bday: 'bg-purple-100 text-purple-700 border-purple-200',
  winback: 'bg-orange-100 text-orange-700 border-orange-200',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  redeemed: 'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
};

export default function CouponsContent({
  data,
  isLoading,
  isError,
  error,
  onRetry,
}: CouponsContentProps) {
  const [filter, setFilter] = useState<'All' | CouponType>('All');
  const router = useRouter();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      router.refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-6 text-center">
        <div className="p-4 rounded-full bg-red-50 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-neutral-900 font-medium">Error loading coupons</h2>
        <p className="text-neutral-500 text-sm max-w-xs">{error?.message || 'An unexpected error occurred'}</p>
        <Button onClick={handleRetry} variant="outline">Retry</Button>
      </div>
    );
  }

  const filteredData = filter === 'All'
    ? (data || [])
    : (data || []).filter(c => c.type === filter);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <p className="text-neutral-500">No coupons sent yet</p>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <p className="text-neutral-500">No coupons match filter</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'All' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('All')}
        >
          All
        </Button>
        {(Object.keys(TYPE_LABELS) as CouponType[]).map(type => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
          >
            {TYPE_LABELS[type]}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-neutral-50 text-neutral-600 font-medium border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sent Date</th>
              <th className="px-4 py-3">Customer Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredData.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-neutral-900">{coupon.code}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[coupon.type]}`}>
                    {TYPE_LABELS[coupon.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-700">₹{coupon.discount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[coupon.status]}`}>
                    {STATUS_LABELS[coupon.status] || coupon.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600">{coupon.sentDate}</td>
                <td className="px-4 py-3 text-neutral-900 font-medium">{coupon.customerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
