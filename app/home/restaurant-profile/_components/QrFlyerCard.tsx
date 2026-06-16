'use client';

import { Printer } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface QrFlyerCardProps {
  slug?: string;
}

export function QrFlyerCard({ slug }: QrFlyerCardProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
          <Printer className="w-5 h-5 text-[#FF6B00]" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase">
            Table Flyer Generator
          </h3>
          <p className="text-sm text-neutral-500 font-medium">
            Print a branded A5 flyer with your QR code for table placement.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <p className="text-sm text-neutral-400 max-w-md">
          Generates a print-ready A5 flyer. Customers scan the QR code to open your intake form and claim the welcome coupon.
        </p>
        <Button
          variant="secondary"
          size="lg"
          disabled={!slug}
          onClick={handlePrint}
          className="min-w-[200px]"
        >
          <Printer className="w-4 h-4 mr-2" />
          Download Flyer
        </Button>
      </div>

      {!slug && (
        <p className="mt-4 text-xs text-neutral-600">
          Save your restaurant name to generate a flyer.
        </p>
      )}
    </div>
  );
}
