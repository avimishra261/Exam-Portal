'use client';

import { useState } from 'react';
import { approveStudentAction, rejectStudentAction, approveAllStudentsAction } from '@/app/actions/adminExtended';

export default function ApprovalsClient({ students }: { students: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  const handleApprove = async (id: string) => {
    setLoading(id);
    await approveStudentAction(id);
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    await rejectStudentAction(id);
    setLoading(null);
  };

  const handleApproveAll = async () => {
    setGlobalLoading(true);
    await approveAllStudentsAction();
    setGlobalLoading(false);
  };

  if (students.length === 0) {
    return <p className="text-gray-500">No pending approvals.</p>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleApproveAll}
          disabled={globalLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          {globalLoading ? 'Approving...' : 'Approve All'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4 border-b border-gray-200">Name</th>
              <th className="p-4 border-b border-gray-200">Email</th>
              <th className="p-4 border-b border-gray-200">Mobile</th>
              <th className="p-4 border-b border-gray-200">Registered At</th>
              <th className="p-4 border-b border-gray-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-900">{s.firstName} {s.lastName}</td>
                <td className="p-4 text-gray-600">{s.email}</td>
                <td className="p-4 text-gray-600">{s.mobile || 'N/A'}</td>
                <td className="p-4 text-gray-500 text-sm">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleApprove(s.id)}
                    disabled={loading === s.id}
                    className="text-green-600 hover:text-green-800 font-medium px-3 py-1 bg-green-50 rounded mr-2"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(s.id)}
                    disabled={loading === s.id}
                    className="text-red-600 hover:text-red-800 font-medium px-3 py-1 bg-red-50 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
