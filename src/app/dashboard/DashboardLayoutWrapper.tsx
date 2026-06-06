'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

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
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0">
        {sidebar}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
          {header}
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
