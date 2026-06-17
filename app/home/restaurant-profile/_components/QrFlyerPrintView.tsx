'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QrFlyerPrintViewProps {
  restaurantName: string;
  slug: string;
  couponValue: number;
}

export function QrFlyerPrintView({ restaurantName, slug, couponValue }: QrFlyerPrintViewProps) {
  const formUrl = slug ? `https://restoloop.app/form/${slug}` : '';
  const promoText = couponValue && couponValue > 0
    ? `Scan to get ₹${couponValue} off your first visit`
    : 'Scan to check in';

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #qr-flyer-print-view {
            display: flex !important;
            position: fixed;
            inset: 0;
            background: white;
            align-items: center;
            justify-content: center;
            z-index: 99999;
          }
          @page {
            size: A5 portrait;
            margin: 0;
          }
        }
      `}</style>
      <div
        id="qr-flyer-print-view"
        className="hidden"
        style={{ display: 'none' }}
      >
        <div
          className="flex flex-col items-center justify-between"
          style={{
            width: '148mm',
            height: '210mm',
            padding: '16mm',
            backgroundColor: '#000000',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="text-center">
            <h2
              className="font-black text-white tracking-tight"
              style={{ fontSize: '2rem', lineHeight: 1.1 }}
            >
              {restaurantName || 'Your Restaurant'}
            </h2>
          </div>

          <div className="flex items-center justify-center">
            {formUrl ? (
              <QRCodeSVG
                value={formUrl}
                size={360}
                level="M"
                marginSize={4}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            ) : (
              <div
                className="flex items-center justify-center bg-neutral-800 text-neutral-500 font-mono text-sm"
                style={{ width: 360, height: 360 }}
              >
                No QR available
              </div>
            )}
          </div>

          <div className="text-center space-y-4">
            <p
              className="font-black uppercase tracking-widest"
              style={{ fontSize: '1.25rem', color: '#FF6B00' }}
            >
              {promoText}
            </p>
            <p className="text-neutral-500 text-sm font-medium tracking-wide">
              restoloop.app
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
