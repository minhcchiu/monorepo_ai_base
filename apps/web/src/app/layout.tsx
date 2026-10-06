import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/common/providers';

export const metadata: Metadata = {
  title: 'CloudPulse — Modern Infrastructure Orchestrator',
  description: 'VPS and Server Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
