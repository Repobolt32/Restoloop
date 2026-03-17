'use client';

import React, { useEffect, useState } from 'react';
import { STITCH_TOKENS } from './tokens';
import { StitchSidebar } from './StitchSidebar';
import { Menu, X } from 'lucide-react';

/**
 * StitchPortal - The High-Fidelity Layout Wrapper
 * Bypasses standard application layout and resets the viewport to pure black.
 */
export function StitchPortal({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Force-kill only the core Makerkit layout wrappers to prevent collision */
      main > [class*="PageBody"], 
      [class*="PageHeader"],
      .flex.flex-col.flex-1.h-screen.overflow-hidden > header {
        display: none !important;
      }
      body, html, #__next {
        background: ${STITCH_TOKENS.colors.black} !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      main {
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(24px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex bg-black text-white selection:bg-[#FF6B00] selection:text-black antialiased overflow-hidden font-sans"
      style={{ backgroundColor: STITCH_TOKENS.colors.black }}
    >
      {/* Atmospheric Depth (Noise) */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Decorative High-End Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#FF6B00] opacity-[0.08] blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FFFFFF] opacity-[0.04] blur-[180px] pointer-events-none" />

      {/* Sidebar Integration */}
      <div
        className={`fixed inset-y-0 left-0 z-[100] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <StitchSidebar />
      </div>

      {/* Sidebar Toggle Button - Top Left */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-8 left-8 z-[110] w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-orange-500/20 hover:border-orange-500/30 transition-all hover:scale-110 active:scale-95 group"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        ) : (
          <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Main Content Area - Scrollable with premium framing */}
      <main
        className={`flex-1 overflow-y-auto scrollbar-hide px-8 md:px-16 lg:px-24 py-16 md:py-24 relative z-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarOpen ? 'pl-[340px]' : 'pl-8 md:pl-16 lg:pl-24'
          }`}
      >
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
