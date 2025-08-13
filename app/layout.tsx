import '../styles/globals.css';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import OfflineProvider from '@/app/offline-provider';
import AuthStatus from '@/components/AuthStatus';
import SessionProvider from '@/components/SessionProvider';
import Sidebar from '@/components/Sidebar';

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
            <header className="border-b bg-white">
              <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                <div className="font-semibold text-xl">Nadra</div>
                <AuthStatus />
              </div>
            </header>
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 px-4 py-6">{children}</main>
            </div>
            <footer className="border-t bg-white">
              <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-gray-500">© {new Date().getFullYear()} nadra</div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}


