import Link from 'next/link';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
}: {
  className?: string;
}) {
  return (
    <span className={cn("font-serif text-2xl tracking-tight text-white flex items-center gap-1.5", className)}>
      <span className="w-2.5 h-2.5 rounded-full bg-stitch-orange shadow-[0_0_12px_rgba(243,123,28,0.6)]" />
      Restoloop
    </span>
  );
}


export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} />
    </Link>
  );
}
