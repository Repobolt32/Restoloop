'use client';

import React from 'react';
import { STITCH_TOKENS } from './tokens';

interface StitchCardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    variant?: 'default' | 'glass';
    padding?: 'none' | 'small' | 'large';
    rounded?: 'default' | 'huge';
}

export function StitchCard({
    children,
    className = '',
    style,
    variant = 'glass',
    padding = 'large',
    rounded = 'huge'
}: StitchCardProps) {

    const baseStyles = "border border-white/5 transition-all duration-700";

    const variants = {
        default: "bg-black",
        glass: `${STITCH_TOKENS.glass.bg} ${STITCH_TOKENS.glass.blur} border-[rgba(255,255,255,0.08)]`
    };

    const paddings = {
        none: "",
        small: "p-6",
        large: "p-10 md:p-12"
    };

    const rounding = {
        default: "rounded-3xl",
        huge: "rounded-[2.5rem] md:rounded-[3.5rem]"
    };

    return (
        <div
            className={`
      ${baseStyles} 
      ${variants[variant]} 
      ${paddings[padding]} 
      ${rounding[rounded]} 
      ${className}
    `}
            style={style}
        >
            {children}
        </div>
    );
}
