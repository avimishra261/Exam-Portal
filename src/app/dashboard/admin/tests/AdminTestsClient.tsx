'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { deleteTestAction, reopenTestAction, toggleTestDraftStatusAction, bulkUploadTextAction } from '@/app/actions/admin';

export default function AdminTestsClient({ initialTests }: { initialTests: any[] }) {
  const [loading, setLoading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    setLoading(true);
    await deleteTestAction(id);
    setLoading(false);
  };

  const handleReopen = async (id: string) => {
    setLoading(true);
    await reopenTestAction(id);
    setLoading(false);
  };

  const handleToggleDraft = async (id: string, isDraft: boolean) => {
    setLoading(true);
    await toggleTestDraftStatusAction(id, isDraft);
    setLoading(false);
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('content', uploadText);
    const res = await bulkUploadTextAction(formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      alert(`Successfully uploaded ${res?.count} test(s)`);
      setUploadText('');
      setShowUpload(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-4">
        <Link href="/dashboard/admin/tests/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          + Create Test Manually
        </Link>
        <button onClick={() => setShowUpload(!showUpload)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
          Bulk Upload via Text
        </button>
      </div>

      {showUpload && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-2">Bulk Upload Format</h3>
          <pre className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 mb-4 overflow-x-auto">
{`TEST_START
Title: Sample Test
Duration: 60
Q: What is 2+2?
Type: MCQ
Marks: 1
*A) 4
B) 5
TEST_END`}
          </pre>
          <form onSubmit={handleBulkUpload}>
            <textarea
              required
              className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your tests here..."
              value={uploadText}
              onChange={e => setUploadText(e.target.value)}
            />
            <button disabled={loading} type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Uploading...' : 'Upload Tests'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
              <th className="p-4 border-b border-gray-200">Title</th>
              <th className="p-4 border-b border-gray-200">Status</th>
              <th className="p-4 border-b border-gray-200">Questions</th>
              <th className="p-4 border-b border-gray-200">Dates</th>
              <th className="p-4 border-b border-gray-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialTests.map(test => (
              <tr key={test.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{test.title}</p>
                  <p className="text-xs text-gray-500">{test.durationMinutes} mins | {test.submissionsCount} submissions</p>
                </td>
                <td className="p-4">
                  {test.isDraft ? (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">Draft / Hidden</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Published</span>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-700 font-medium">{test.questionsCount}</td>
                <td className="p-4 text-xs text-gray-500">
                  <div>Start: {test.startTime ? new Date(test.startTime).toLocaleString() : 'Not Set'}</div>
                  <div>End: {test.endTime ? new Date(test.endTime).toLocaleString() : 'Not Set'}</div>
                </td>
                <td className="p-4 text-right space-x-2">
                  <Link href={`/dashboard/admin/tests/${test.id}/monitor`} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold hover:bg-purple-200">
                    Monitor
                  </Link>
                  <button onClick={() => handleToggleDraft(test.id, !test.isDraft)} disabled={loading} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 disabled:opacity-50">
                    {test.isDraft ? 'Publish' : 'Hide'}
                  </button>
                  {test.endTime && new Date(test.endTime) < new Date() && (
                    <button onClick={() => handleReopen(test.id)} disabled={loading} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-200 disabled:opacity-50">
                      Reopen
                    </button>
                  )}
                  <button onClick={() => handleDelete(test.id)} disabled={loading} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold hover:bg-red-200 disabled:opacity-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {initialTests.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No tests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
