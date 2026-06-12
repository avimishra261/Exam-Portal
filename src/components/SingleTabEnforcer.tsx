'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function SingleTabEnforcer({ role }: { role: string }) {
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    // Only enforce for students
    if (role === 'ADMIN') return;

    const channelId = 'examportal_tab_sync';
    const channel = new BroadcastChannel(channelId);
    
    // Create a unique ID for this tab
    const tabId = Math.random().toString(36).substring(2, 9);

    // When this tab starts up, announce itself to see if another is open
    channel.postMessage({ type: 'PING', tabId });

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      
      if (data.type === 'PING') {
        // Someone else just opened a tab, tell them we are here!
        channel.postMessage({ type: 'PONG', tabId });
      } else if (data.type === 'PONG') {
        // We received a PONG, which means another tab was already open before us
        setIsDuplicate(true);
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [role]);

  if (!isDuplicate) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-8 text-center font-sans">
      <ShieldAlert className="w-20 h-20 text-red-600 mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Security Violation</h1>
      <p className="text-lg text-gray-600 max-w-lg mb-8">
        ExamPortal is already open in another tab or window. For security and integrity reasons, you are only allowed to have one active session tab at a time.
      </p>
      <p className="text-sm text-gray-500 font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-100">
        Please close this duplicate tab and continue your work in the original tab.
      </p>
    </div>
  );
}
