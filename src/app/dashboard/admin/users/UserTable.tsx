'use client';

import { useState } from 'react';
import { makeAdminAction, demoteAdminAction, deleteUserAction, resetPasswordAction, updateEmailAction, grantAttemptOverrideAction, banStudentAction } from '@/app/actions/admin';

interface UserRow {
  id: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

export default function UserTable({ 
  users, 
  currentUser,
  exams = [],
  overrides = []
}: { 
  users: UserRow[]; 
  currentUser: { id: string; role: string; isSuperAdmin: boolean };
  exams?: any[];
  overrides?: any[];
  bannedStudents?: any[];
}) {
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editingAttempts, setEditingAttempts] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [overrideAttempts, setOverrideAttempts] = useState('');
  const [overrideDuration, setOverrideDuration] = useState('');

  const showFeedback = (userId: string, msg: string) => {
    setFeedback(prev => ({ ...prev, [userId]: msg }));
    setTimeout(() => setFeedback(prev => { const copy = { ...prev }; delete copy[userId]; return copy; }), 3000);
  };

  const handleMakeAdmin = async (userId: string) => {
    const res = await makeAdminAction(userId);
    if (res.error) showFeedback(userId, `Error: ${res.error}`);
    else showFeedback(userId, 'Promoted to Admin!');
  };

  const handleDemote = async (userId: string) => {
    if (!confirm('Are you sure you want to demote this admin?')) return;
    const res = await demoteAdminAction(userId);
    if (res.error) showFeedback(userId, `Error: ${res.error}`);
    else showFeedback(userId, 'Demoted to Student!');
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('This will permanently delete the user and all their data. Are you sure?')) return;
    const res = await deleteUserAction(userId);
    if (res.error) showFeedback(userId, `Error: ${res.error}`);
    else showFeedback(userId, 'User deleted.');
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      showFeedback(userId, 'Error: Password must be at least 6 characters.');
      return;
    }
    const res = await resetPasswordAction(userId, newPassword);
    if (res.error) showFeedback(userId, `Error: ${res.error}`);
    else { showFeedback(userId, 'Password reset!'); setEditingPassword(null); setNewPassword(''); }
  };

  const handleUpdateEmail = async (userId: string) => {
    if (!newEmail || !newEmail.includes('@')) {
      showFeedback(userId, 'Error: Please enter a valid email.');
      return;
    }
    const res = await updateEmailAction(userId, newEmail);
    if (res.error) showFeedback(userId, `Error: ${res.error}`);
    else { showFeedback(userId, 'Email updated!'); setEditingEmail(null); setNewEmail(''); }
  };

  const handleGrantOverride = async (userId: string) => {
    if (!selectedExamId) {
      showFeedback(userId, 'Error: Select an exam first.');
      return;
    }
    const num = parseInt(overrideAttempts);
    if (isNaN(num) || num < 1) {
      showFeedback(userId, 'Error: Enter a valid number of attempts.');
      return;
    }
    const durNum = overrideDuration ? parseInt(overrideDuration) : null;
    const res = await grantAttemptOverrideAction(userId, selectedExamId, num, isNaN(durNum as any) ? null : durNum);
    if (res.error) showFeedback(userId, `Error: ${res.error}`);
    else { 
      showFeedback(userId, 'Overrides applied!'); 
      setEditingAttempts(null); 
    }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    if (!selectedExamId) {
      showFeedback(userId, 'Error: Select an exam first.');
      return;
    }
    const res = await banStudentAction(selectedExamId, userId, isBanned);
    if (res.error) showFeedback(userId, `Error: ${res.error}`);
    else { 
      showFeedback(userId, isBanned ? 'User banned from test.' : 'User ban removed.'); 
    }
  };

  const startEditingAttempts = (userId: string) => {
    setEditingAttempts(userId);
    setSelectedExamId(exams[0]?.id || '');
    setOverrideAttempts('2');
    setOverrideDuration('');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
            <th className="p-4 border-b border-gray-200">Email</th>
            <th className="p-4 border-b border-gray-200">Role</th>
            <th className="p-4 border-b border-gray-200">Joined</th>
            <th className="p-4 border-b border-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map(user => {
            const isSelf = user.id === currentUser.id;
            return (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                  {editingEmail === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder={user.email}
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      />
                      <button onClick={() => handleUpdateEmail(user.id)} className="text-xs font-medium text-blue-600 hover:underline">Save</button>
                      <button onClick={() => { setEditingEmail(null); setNewEmail(''); }} className="text-xs font-medium text-gray-500 hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <span className="font-medium text-gray-900">{user.email}</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Feedback message */}
                      {feedback[user.id] && (
                        <span className={`text-xs font-medium ${feedback[user.id].startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                          {feedback[user.id]}
                        </span>
                      )}

                      {!isSelf && !feedback[user.id] && (
                        <>
                          {user.role === 'STUDENT' && (
                            <>
                              <button onClick={() => handleMakeAdmin(user.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded">
                                Make Admin
                              </button>
                              
                              {editingAttempts !== user.id && (
                                <button onClick={() => startEditingAttempts(user.id)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 bg-indigo-50 rounded">
                                  Manage Access
                                </button>
                              )}
                            </>
                          )}

                          {user.role === 'ADMIN' && !user.isSuperAdmin && currentUser.isSuperAdmin && (
                            <button onClick={() => handleDemote(user.id)} className="text-xs font-medium text-amber-600 hover:text-amber-800 px-2 py-1 bg-amber-50 rounded">
                              Demote
                            </button>
                          )}

                          {editingPassword === user.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="New password"
                                className="px-2 py-1 border border-gray-300 rounded text-xs w-28 text-gray-900 bg-white"
                              />
                              <button onClick={() => handleResetPassword(user.id)} className="text-xs font-medium text-blue-600">Set</button>
                              <button onClick={() => { setEditingPassword(null); setNewPassword(''); }} className="text-xs font-medium text-gray-500">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingPassword(user.id); setNewPassword(''); }} className="text-xs font-medium text-gray-600 hover:text-gray-800 px-2 py-1 bg-gray-50 rounded">
                              Reset Password
                            </button>
                          )}

                          {editingEmail !== user.id && (
                            <button onClick={() => { setEditingEmail(user.id); setNewEmail(user.email); }} className="text-xs font-medium text-gray-600 hover:text-gray-800 px-2 py-1 bg-gray-50 rounded">
                              Change Email
                            </button>
                          )}

                          {(user.role === 'STUDENT' || (user.role === 'ADMIN' && !user.isSuperAdmin && currentUser.isSuperAdmin)) && (
                            <button onClick={() => handleDelete(user.id)} className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 rounded">
                              Delete
                            </button>
                          )}
                        </>
                      )}

                      {isSelf && <span className="text-xs text-gray-400 italic">You</span>}
                    </div>

                    {/* Manage Attempts UI */}
                    {editingAttempts === user.id && (
                      <div className="flex flex-col gap-2 mt-2 bg-indigo-50 p-3 rounded border border-indigo-100 w-fit">
                        <div className="flex items-center gap-2">
                          <select 
                            className="text-xs px-2 py-1 border border-indigo-200 rounded max-w-[150px]"
                            value={selectedExamId}
                            onChange={(e) => {
                              setSelectedExamId(e.target.value);
                              const existingOvr = overrides.find(o => o.userId === user.id && o.examId === e.target.value);
                              setOverrideAttempts(existingOvr?.allowedAttempts?.toString() || '2');
                              setOverrideDuration(existingOvr?.durationOverride?.toString() || '');
                            }}
                          >
                            {exams.map(ex => (
                              <option key={ex.id} value={ex.id}>{ex.title}</option>
                            ))}
                          </select>
                          
                          {(() => {
                            const isBanned = bannedStudents?.some((b: any) => b.userId === user.id && b.examId === selectedExamId);
                            return isBanned ? (
                              <button onClick={() => handleBanToggle(user.id, false)} className="text-xs px-2 py-1 bg-green-100 text-green-700 font-bold rounded hover:bg-green-200">Unban</button>
                            ) : (
                              <button onClick={() => handleBanToggle(user.id, true)} className="text-xs px-2 py-1 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200">Ban</button>
                            );
                          })()}
                        </div>

                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1"
                            placeholder="Attempts"
                            title="Allowed Attempts"
                            value={overrideAttempts}
                            onChange={(e) => setOverrideAttempts(e.target.value)}
                            className="w-20 text-xs px-2 py-1 border border-indigo-200 rounded"
                          />
                          <input 
                            type="number" 
                            min="1"
                            placeholder="Mins (Opt)"
                            title="Duration Override (Mins)"
                            value={overrideDuration}
                            onChange={(e) => setOverrideDuration(e.target.value)}
                            className="w-24 text-xs px-2 py-1 border border-indigo-200 rounded"
                          />
                          <button onClick={() => handleGrantOverride(user.id)} className="text-xs px-2 py-1 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700">Apply</button>
                          <button onClick={() => setEditingAttempts(null)} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-200 rounded">Close</button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
