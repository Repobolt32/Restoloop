'use client';

import React, { useState, useMemo } from 'react';
import { StitchPortal } from '~/components/stitch/StitchPortal';
import { StitchCard } from '~/components/stitch/StitchCard';
import { StitchInput } from '~/components/stitch/StitchInput';
import { toast } from 'sonner';

/**
 * RESTOLOOP POS BILLING SYSTEM
 * Fully interactive client-side POS experience.
 */

interface BillItem {
    id: number;
    name: string;
    qty: number;
    price: number;
}

export default function BillingPage() {
    const [items, setItems] = useState<BillItem[]>([
        { id: 1, name: 'Butter Chicken', qty: 2, price: 280 },
        { id: 2, name: 'Garlic Naan', qty: 4, price: 45 },
    ]);

    const [coupon, setCoupon] = useState('');
    const [couponStatus, setCouponStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
    const [isTaxEnabled, setIsTaxEnabled] = useState(true);
    const [cgstPercent, setCgstPercent] = useState(2.5);
    const [sgstPercent, setSgstPercent] = useState(2.5);
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Calculations
    const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.qty, 0), [items]);

    const discount = useMemo(() => {
        if (couponStatus !== 'valid') return 0;
        const code = coupon.toUpperCase();
        if (code === 'WELCOME50') return 0.5;
        if (code === 'RESTO10') return 0.1;
        return 0;
    }, [coupon, couponStatus]);

    const discountedSubtotal = subtotal * (1 - discount);
    const taxAmount = useMemo(() => isTaxEnabled ? discountedSubtotal * ((cgstPercent + sgstPercent) / 100) : 0, [discountedSubtotal, isTaxEnabled, cgstPercent, sgstPercent]);
    const grandTotal = discountedSubtotal + taxAmount;

    // Actions
    const updateItem = (id: number, field: keyof BillItem, value: string | number) => {
        setItems(current => current.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const addItem = () => {
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        setItems([...items, { id: newId, name: 'New Item', qty: 1, price: 0 }]);
    };

    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleVerifyCoupon = () => {
        if (!coupon) return;
        setCouponStatus('verifying');
        setTimeout(() => {
            if (coupon.toUpperCase() === 'WELCOME50' || coupon.toUpperCase() === 'RESTO10') {
                setCouponStatus('valid');
            } else {
                setCouponStatus('invalid');
            }
        }, 800);
    };

    const handleConfirm = () => {
        setIsConfirmed(true);
        setTimeout(() => setIsConfirmed(false), 3000);
    };

    return (
        <StitchPortal>
            {/* Success Notification */}
            {isConfirmed && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-black font-bold px-12 py-5 rounded-full shadow-[0_20px_40px_rgba(16,185,129,0.3)] animate-bounce">
                    Bill confirmed successfully
                </div>
            )}

            {/* Page Header - Professional Transaction Terminal Style */}
            <header className="mb-14 flex items-end justify-between border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-bold tracking-[0.4em] text-neutral-500">
                            Secure Transaction Terminal
                        </p>
                    </div>
                    <h1 className="text-8xl font-black tracking-tighter text-orange-500 leading-none drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">Billing <span className="text-white">.</span></h1>
                </div>

                <div className="text-right hidden md:block">
                    <p className="text-[10px] font-bold tracking-[0.3em] text-neutral-700 mb-1">Session Protocol</p>
                    <p className="text-sm font-medium text-neutral-400">Sharma's Family Restaurant — POS_V3</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Bill Items */}
                <div className="lg:col-span-7">
                    <StitchCard padding="none" rounded="huge" className="overflow-hidden border-white/5 bg-neutral-900/40">
                        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="font-bold text-2xl tracking-tight">Bill Items</h2>
                            <span className="text-neutral-500 text-sm tracking-widest">{items.length} Active Items</span>
                        </div>

                        <div className="px-10 py-6 bg-transparent">
                            {/* Header for list */}
                            <div className="grid grid-cols-12 gap-4 text-xs font-bold text-neutral-700 tracking-widest mb-6 px-4">
                                <div className="col-span-5">Item Name</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-center">Price (₹)</div>
                                <div className="col-span-3 text-right">Total</div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-5 mb-10">
                                {items.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-orange-500/20 transition-all">
                                        <div className="col-span-5">
                                            <StitchInput
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                className="bg-neutral-800/50 border-neutral-700/50 text-base py-4 px-6 rounded-xl hover:bg-neutral-800 transition-colors"
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <StitchInput
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800/50 border-neutral-700/50 text-center w-full text-base py-4 px-0 rounded-xl hover:bg-neutral-800 transition-colors"
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <StitchInput
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                                                className="bg-neutral-800/50 border-neutral-700/50 text-center w-full text-base py-4 px-0 rounded-xl hover:bg-neutral-800 transition-colors"
                                            />
                                        </div>
                                        <div className="col-span-3 flex items-center justify-end gap-3 text-right">
                                            <span className="font-bold text-2xl tracking-tight">₹{item.price * item.qty}</span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-900/40 hover:text-red-500 transition-colors w-12 h-12 flex items-center justify-center bg-red-500/5 rounded-lg border border-red-500/10 group-hover:opacity-100 opacity-0 transition-opacity"
                                            >
                                                <span className="text-xl">×</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Item & Subtotal line */}
                            <div className="flex flex-col md:flex-row justify-between items-center mt-12 pb-10 px-4 gap-8">
                                <button
                                    onClick={addItem}
                                    className="w-full md:w-auto flex items-center justify-center gap-4 py-5 px-12 rounded-xl bg-orange-600/5 border border-orange-500/10 text-orange-500 hover:bg-orange-600/10 transition-all group"
                                >
                                    <span className="text-3xl font-bold group-hover:scale-125 transition-transform">+</span>
                                    <span className="text-sm font-bold tracking-[0.2em]">Add Entry</span>
                                </button>

                                <div className="text-right w-full md:w-auto">
                                    <div className="text-sm font-bold tracking-[0.4em] text-white mb-2">Items Subtotal</div>
                                    <div className="text-7xl font-bold tracking-tighter">₹{subtotal.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </StitchCard>
                </div>

                {/* Right Column: Coupon, Tax, Summary */}
                <div className="lg:col-span-5 space-y-10">
                    {/* Coupon Code section */}
                    <StitchCard padding="large" className="bg-neutral-900/40 border-white/5 py-10">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-sm font-bold tracking-[0.4em] text-white">Coupon Code</div>
                            {couponStatus === 'valid' && <span className="text-xs font-bold text-emerald-500 tracking-widest">Applied: 50% Off</span>}
                            {couponStatus === 'invalid' && <span className="text-xs font-bold text-red-500 tracking-widest">Invalid Code</span>}
                        </div>
                        <div className="flex gap-4">
                            <StitchInput
                                placeholder="Enter code e.g. WELCOME50"
                                value={coupon}
                                onChange={(e) => {
                                    setCoupon(e.target.value);
                                    if (couponStatus !== 'idle') setCouponStatus('idle');
                                }}
                                className={`flex-1 bg-neutral-800/50 py-5 text-lg rounded-2xl transition-all ${couponStatus === 'valid' ? 'border-emerald-500/50' : couponStatus === 'invalid' ? 'border-red-500/50' : 'border-neutral-700/50'}`}
                            />
                            <button
                                onClick={handleVerifyCoupon}
                                disabled={couponStatus === 'verifying' || !coupon}
                                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 px-10 rounded-2xl transition-all shadow-lg shadow-orange-600/10 text-base min-w-[140px]"
                            >
                                {couponStatus === 'verifying' ? '...' : 'Verify'}
                            </button>
                        </div>
                    </StitchCard>

                    {/* GST TAX section */}
                    <StitchCard padding="large" className="bg-neutral-900/40 border-white/5 py-10">
                        <div className="flex justify-between items-center mb-8">
                            <div className="text-sm font-bold tracking-[0.4em] text-white">Interactive GST Tax</div>
                            <button
                                onClick={() => setIsTaxEnabled(!isTaxEnabled)}
                                className={`w-16 h-8 rounded-full transition-all relative outline-none ring-offset-black focus:ring-2 ring-orange-500/50 ${isTaxEnabled ? 'bg-orange-600' : 'bg-neutral-800 border border-white/10'}`}
                            >
                                <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${isTaxEnabled ? 'translate-x-[34px]' : 'translate-x-[6px]'}`} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold tracking-wider text-neutral-700 block">CGST (%)</label>
                                <StitchInput
                                    type="number"
                                    value={cgstPercent}
                                    onChange={(e) => setCgstPercent(parseFloat(e.target.value) || 0)}
                                    className="bg-neutral-800/50 border-neutral-700/50 py-5 rounded-xl text-center text-lg hover:bg-neutral-800 transition-colors"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold tracking-wider text-neutral-700 block">SGST (%)</label>
                                <StitchInput
                                    type="number"
                                    value={sgstPercent}
                                    onChange={(e) => setSgstPercent(parseFloat(e.target.value) || 0)}
                                    className="bg-neutral-800/50 border-neutral-700/50 py-5 rounded-xl text-center text-lg hover:bg-neutral-800 transition-colors"
                                />
                            </div>
                        </div>
                    </StitchCard>

                    {/* Bill Summary section */}
                    <StitchCard padding="large" className="bg-neutral-900/40 border-white/5 space-y-12 relative overflow-hidden group py-12">
                        {/* Decorative watermark */}
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <div className="w-32 h-32 border-[12px] border-white rounded-full" />
                        </div>

                        <div className="text-sm font-bold tracking-[0.4em] text-white mb-8">Final Bill Summary</div>

                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <span className="text-base font-medium text-neutral-500">Subtotal</span>
                                <span className="text-2xl text-white">₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-base font-medium text-neutral-500">Tax Calculation</span>
                                <span className={`text-2xl transition-colors ${isTaxEnabled ? 'text-neutral-400' : 'text-neutral-800 line-through'}`}>
                                    {isTaxEnabled ? `+₹${taxAmount.toLocaleString()}` : '+₹0'}
                                </span>
                            </div>

                            <div className="h-px bg-white/5 w-full relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>

                            <div className="flex justify-between items-end pt-6">
                                <span className="text-2xl font-bold tracking-tight">Grand Total</span>
                                <span className="text-8xl font-black tracking-tighter text-white flex items-start gap-2">
                                    <span className="text-4xl mt-5 font-normal opacity-50">₹</span>
                                    {grandTotal.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirm}
                            className="w-full bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-black font-black py-10 rounded-[3rem] text-3xl flex items-center justify-center gap-6 transition-all shadow-2xl shadow-emerald-500/20 group/btn"
                        >
                            Confirm Bill
                            <span className="text-5xl group-hover/btn:translate-x-3 transition-transform">→</span>
                        </button>
                    </StitchCard>
                </div>
            </div>
        </StitchPortal>
    );
}
