'use client';

import { ThemeProvider } from 'next-themes';

import appConfig from '~/config/app.config';

export function RootProviders({
  theme = appConfig.theme,
  children,
}: React.PropsWithChildren<{
  theme?: string;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem
      disableTransitionOnChange
      defaultTheme={theme}
      enableColorScheme={false}
    >
      {children}
    </ThemeProvider>
  );
}
