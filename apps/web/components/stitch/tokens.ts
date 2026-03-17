/**
 * STITCH DESIGN TOKENS
 * Absolute source of truth for Restoloop UI Fidelity.
 */

export const STITCH_TOKENS = {
    colors: {
        orange: '#FF6B00',
        black: '#000000',
        neutral: {
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
        }
    },
    glass: {
        bg: 'rgba(255, 255, 255, 0.03)',
        border: 'rgba(255, 255, 255, 0.08)',
        blur: 'backdrop-blur-3xl',
    },
    typography: {
        serif: 'font-serif',
        mono: 'font-mono',
        sans: 'font-sans',
    }
} as const;
