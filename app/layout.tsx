import '../styles/globals.css';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import OfflineProvider from '@/app/offline-provider';
import AuthStatus from '@/components/AuthStatus';
import SessionProvider from '@/components/SessionProvider';
import LayoutClient from '@/components/LayoutClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'nadra — mutuelle',
  description: 'Nadra mutuelle'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            <OfflineProvider />
            <LayoutClient>
              {children}
            </LayoutClient>
            <footer className="border-t bg-white mt-auto">
              <div className="mx-auto max-w-6xl px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                © {new Date().getFullYear()} nadra
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
