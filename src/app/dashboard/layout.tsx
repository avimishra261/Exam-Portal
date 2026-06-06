import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import DashboardLayoutWrapper from './DashboardLayoutWrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const sidebar = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-xl font-bold text-blue-600">ExamPortal</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Home
        </Link>

        {user.role === 'STUDENT' && (
          <>
            <Link href="/dashboard/tests" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Tests
            </Link>
          </>
        )}

        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Performance
          </p>
        </div>
        <Link href="/dashboard/analysis" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Analysis
        </Link>
        <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Reports
        </Link>

        {user.role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin Controls
              </p>
            </div>
            <Link href="/dashboard/admin/tests" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Manage Tests
            </Link>
            <Link href="/dashboard/admin/users" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Manage Users
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center px-4 py-3 mb-2 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            Log out
          </button>
        </form>
      </div>
    </>
  );

  const header = (
    <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
  );

  return (
    <DashboardLayoutWrapper sidebar={sidebar} header={header}>
      {children}
    </DashboardLayoutWrapper>
  );
}
