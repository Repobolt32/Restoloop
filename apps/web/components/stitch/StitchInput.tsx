'use client';

import React from 'react';

interface StitchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function StitchInput({ label, className = '', ...props }: StitchInputProps) {
    return (
        <div className="flex flex-col gap-3 w-full">
            {label && (
                <label className="text-[#FF6B00] text-[10px] font-black uppercase tracking-[0.4em] ml-1">
                    {label}
                </label>
            )}
            <input
                className={`
          w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 
          text-2xl font-mono tracking-widest text-white
          focus:outline-none focus:border-[#FF6B00]/60 focus:bg-white/[0.08] 
          transition-all placeholder:text-neutral-800 uppercase
          ${className}
        `}
                {...props}
            />
        </div>
    );
}
