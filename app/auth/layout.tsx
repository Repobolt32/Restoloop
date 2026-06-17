import { AppLogo } from '~/components/app-logo';

function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white overflow-hidden flex flex-col font-sans">
      {/* Immersive Background Fire Glows */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-[#FF6B00]/15 blur-[180px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-30%] right-[-10%] w-[50%] h-[50%] bg-[#FF6B00]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[20%] h-[20%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Logo */}
      <div className="absolute top-6 left-6 md:top-12 md:left-12 z-50 mix-blend-difference">
        <AppLogo />
      </div>

      {/* Content Container (Card) */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 w-full mt-16 md:mt-0">
        <div className="w-full max-w-[420px] relative group">
          {/* Glassmorphic Shadow Surface */}
          <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] transition-all duration-700 group-hover:border-white/20" />

          <div className="absolute -inset-[1px] bg-gradient-to-b from-[#FF6B00]/30 to-transparent rounded-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100 pointer-events-none" />

          {/* Internal Frame */}
          <div className="relative z-10 p-8 sm:p-12 flex flex-col gap-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
