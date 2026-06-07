'use client';

import { useState } from 'react';
import { approveNameChangeAction, rejectNameChangeAction } from '@/app/actions/adminExtended';

export default function NotificationsClient({ requests }: { requests: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    await approveNameChangeAction(id);
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    await rejectNameChangeAction(id);
    setLoading(null);
  };

  if (requests.length === 0) {
    return <p className="text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-200">No pending name change requests.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
            <th className="p-4 border-b border-gray-200">User Email</th>
            <th className="p-4 border-b border-gray-200">Old Name</th>
            <th className="p-4 border-b border-gray-200">Requested Name</th>
            <th className="p-4 border-b border-gray-200 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {requests.map(req => (
            <tr key={req.id} className="hover:bg-gray-50 transition">
              <td className="p-4 text-gray-600">{req.user.email}</td>
              <td className="p-4 text-gray-500 line-through">{req.user.firstName} {req.user.lastName}</td>
              <td className="p-4 font-medium text-gray-900">{req.newFirstName} {req.newLastName}</td>
              <td className="p-4 text-right">
                <button 
                  onClick={() => handleApprove(req.id)}
                  disabled={loading === req.id}
                  className="text-green-600 hover:text-green-800 font-medium px-3 py-1 bg-green-50 rounded mr-2"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReject(req.id)}
                  disabled={loading === req.id}
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
  );
}
