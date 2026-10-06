'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
        },
      }}
    />
  );
}
