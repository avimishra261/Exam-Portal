'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function DashboardLayoutWrapper({
  sidebar,
  header,
  children
}: {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Hide sidebar/header on the active test taking page and analysis page
  // Route patterns: /dashboard/tests/[id] and /dashboard/analysis/[id]
  const isTestEngineRoute = /^\/dashboard\/tests\/[a-zA-Z0-9_-]+$/.test(pathname);
  const isAnalysisRoute = /^\/dashboard\/analysis\/[a-zA-Z0-9_-]+$/.test(pathname);
  const isMonitorRoute = /^\/dashboard\/admin\/tests\/[a-zA-Z0-9_-]+\/monitor$/.test(pathname);
  
  const isFullscreenRoute = isTestEngineRoute || isAnalysisRoute || isMonitorRoute;

  if (isFullscreenRoute) {
    return (
      <div className="h-screen w-screen bg-white overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg md:shadow-sm transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-4 right-4 md:hidden">
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>
        {sidebar}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-8 shadow-sm flex-shrink-0 gap-4">
          <button 
            className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            {header}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
