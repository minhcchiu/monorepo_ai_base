import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/common/providers';

export const metadata: Metadata = {
  title: 'CloudPulse Admin Panel',
  description: 'CloudPulse Admin Panel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
