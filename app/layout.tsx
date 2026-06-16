import { cookies } from 'next/headers';

import { RootProviders } from '~/components/root-providers';
import { heading, sans, serif } from '~/lib/fonts';

import '../styles/globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getTheme();
  const className = getClassName(theme);

  return (
    <html lang="en" className={className}>
      <body>
        <RootProviders theme={theme}>
          {children}
        </RootProviders>
      </body>
    </html>
  );
}

function getClassName(theme?: string) {
  const dark = theme === 'dark';
  const light = !dark;

  const font = [sans.variable, heading.variable, serif.variable].reduce<string[]>(
    (acc, curr) => {
      if (acc.includes(curr)) return acc;

      return [...acc, curr];
    },
    [],
  );

  return `bg-black min-h-screen antialiased ${font.join(' ')} ${dark ? 'dark' : ''} ${light ? 'light' : ''}`;
}

async function getTheme() {
  const cookiesStore = await cookies();
  return cookiesStore.get('theme')?.value as 'light' | 'dark' | 'system';
}
