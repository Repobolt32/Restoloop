'use client';

import React from 'react';

interface StitchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'giant';
    fullWidth?: boolean;
}

export function StitchButton({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}: StitchButtonProps) {

    const base = "font-black uppercase tracking-tighter transition-all duration-300 flex items-center justify-center active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[#FF6B00] text-black hover:bg-white hover:text-black shadow-[0_15px_30px_rgba(255,107,0,0.2)]",
        secondary: "bg-white text-black hover:bg-[#FF6B00] hover:text-black",
        ghost: "bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10",
        danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
    };

    const sizes = {
        sm: "px-4 py-2 text-xs tracking-widest",
        md: "px-8 py-4 text-sm",
        lg: "px-10 py-6 text-xl rounded-2xl",
        giant: "py-10 text-3xl rounded-[2.5rem]"
    };

    return (
        <button
            className={`
        ${base} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
            {...props}
        >
            {children}
        </button>
    );
}
