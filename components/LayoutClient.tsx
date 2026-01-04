"use client";

import { useState, ReactNode, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import AuthStatus from '@/components/AuthStatus';

export default function LayoutClient({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <>
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Sidebar toggle on mobile/tablet */}
          <button
            type="button"
            className="lg:hidden flex flex-col items-center justify-center p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors touch-manipulation"
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <span className={`block w-5 h-0.5 bg-gray-700 rounded-sm mb-1 transition-all duration-300 ${sidebarOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 rounded-sm mb-1 transition-all duration-300 ${sidebarOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 rounded-sm transition-all duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
          <div className="font-semibold text-lg sm:text-xl">Nadra</div>
          <div className="flex-1" />
          <AuthStatus />
        </div>
      </header>
      <div className="flex flex-1 relative w-full max-w-6xl mx-auto">
        {/* Sidebar: overlay on mobile, persistent on desktop */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        {/* Overlay clicks close sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden"
            onClick={closeSidebar}
            onTouchStart={closeSidebar}
            aria-hidden="true"
          />
        )}
        <main className="flex-1 min-w-0 px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6">
          {children}
        </main>
      </div>
    </>
  );
}
