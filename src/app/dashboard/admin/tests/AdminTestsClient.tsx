'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  deleteTestAction, 
  reopenTestAction, 
  toggleTestDraftStatusAction, 
  bulkUploadTextAction,
  hideAndEditDatesAction,
  searchStudentsAction,
  reopenForStudentAction
} from '@/app/actions/admin';
import { Search, X } from 'lucide-react';

export default function AdminTestsClient({ initialTests }: { initialTests: any[] }) {
  const [loading, setLoading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  // Hide Modal State
  const [hideModalTestId, setHideModalTestId] = useState<string | null>(null);
  const [hideStartDate, setHideStartDate] = useState('');
  const [hideEndDate, setHideEndDate] = useState('');

  // Reopen Modal State
  const [reopenModalTestId, setReopenModalTestId] = useState<string | null>(null);
  const [reopenMode, setReopenMode] = useState<'EVERYONE' | 'SPECIFIC'>('EVERYONE');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [reopenEndDate, setReopenEndDate] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    setLoading(true);
    await deleteTestAction(id);
    setLoading(false);
  };

  const handleToggleDraft = async (id: string, isDraft: boolean) => {
    setLoading(true);
    await toggleTestDraftStatusAction(id, isDraft);
    setLoading(false);
  };

  const handleHideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hideModalTestId) return;
    setLoading(true);
    const start = hideStartDate ? new Date(hideStartDate).toISOString() : null;
    const end = hideEndDate ? new Date(hideEndDate).toISOString() : null;
    
    await hideAndEditDatesAction(hideModalTestId, true, start, end);
    setLoading(false);
    setHideModalTestId(null);
  };

  const openHideModal = (test: any) => {
    setHideModalTestId(test.id);
    if (test.startTime) {
      const d = new Date(test.startTime);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setHideStartDate(d.toISOString().slice(0,16));
    } else setHideStartDate('');
    if (test.endTime) {
      const d = new Date(test.endTime);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setHideEndDate(d.toISOString().slice(0,16));
    } else setHideEndDate('');
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenModalTestId) return;
    setLoading(true);
    
    if (reopenMode === 'EVERYONE') {
      await reopenTestAction(reopenModalTestId);
      alert('Test reopened for everyone successfully.');
    } else {
      if (selectedStudents.length === 0) {
        alert('Please select at least one student.');
        setLoading(false);
        return;
      }
      if (!reopenEndDate) {
        alert('Please provide a new end date/deadline for these students.');
        setLoading(false);
        return;
      }
      
      const endISO = new Date(reopenEndDate).toISOString();
      for (const student of selectedStudents) {
        await reopenForStudentAction(reopenModalTestId, student.id, endISO);
      }
      alert('Test reopened for selected students successfully.');
    }
    
    setLoading(false);
    setReopenModalTestId(null);
    setSelectedStudents([]);
    setSearchQuery('');
    setSearchResults([]);
    setReopenEndDate('');
  };

  const handleSearchStudents = async () => {
    if (searchQuery.length < 2) return;
    setLoading(true);
    const res = await searchStudentsAction(searchQuery);
    setLoading(false);
    if (res.students) {
      setSearchResults(res.students);
    }
  };

  const toggleStudentSelection = (student: any) => {
    if (selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
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

      {/* Hide Modal */}
      {hideModalTestId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Hide Test</h3>
              <button onClick={() => setHideModalTestId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">This will hide the test from students. You can also optionally update the dates.</p>
            <form onSubmit={handleHideSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="datetime-local" value={hideStartDate} onChange={e => setHideStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input type="datetime-local" value={hideEndDate} onChange={e => setHideEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setHideModalTestId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50">{loading ? 'Saving...' : 'Hide & Save Dates'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {reopenModalTestId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reopen Test</h3>
              <button onClick={() => setReopenModalTestId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex gap-4 border-b border-gray-200 mb-4 pb-2">
              <button 
                onClick={() => setReopenMode('EVERYONE')}
                className={`text-sm font-bold ${reopenMode === 'EVERYONE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >Reopen for Everyone</button>
              <button 
                onClick={() => setReopenMode('SPECIFIC')}
                className={`text-sm font-bold ${reopenMode === 'SPECIFIC' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >Reopen for Specific Students</button>
            </div>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              {reopenMode === 'EVERYONE' ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">This will completely remove the test deadline and make it active for everyone who hasn't submitted yet. Are you sure?</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Search students to grant them a fresh attempt with an extended deadline.</p>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchStudents())}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <button type="button" onClick={handleSearchStudents} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Search</button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                      {searchResults.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2 hover:bg-white rounded-md">
                          <div className="text-sm">
                            <span className="font-bold text-gray-800">{s.name || 'No Name'}</span>
                            <span className="text-gray-500 ml-2">{s.email}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => toggleStudentSelection(s)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                          >
                            {selectedStudents.find(sel => sel.id === s.id) ? 'Remove' : 'Add'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedStudents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Selected Students:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudents.map(s => (
                          <div key={s.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            {s.name || s.email}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => toggleStudentSelection(s)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">New Extended Deadline for Selected Students</label>
                    <input type="datetime-local" required value={reopenEndDate} onChange={e => setReopenEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setReopenModalTestId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Processing...' : (reopenMode === 'EVERYONE' ? 'Reopen for Everyone' : 'Reopen for Selected')}
                </button>
              </div>
            </form>
          </div>
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
                  <button onClick={() => test.isDraft ? handleToggleDraft(test.id, false) : openHideModal(test)} disabled={loading} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 disabled:opacity-50">
                    {test.isDraft ? 'Publish' : 'Hide'}
                  </button>
                  <button onClick={() => setReopenModalTestId(test.id)} disabled={loading} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-200 disabled:opacity-50">
                    Reopen
                  </button>
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
