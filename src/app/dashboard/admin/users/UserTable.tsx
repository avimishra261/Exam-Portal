'use client';

import { useState } from 'react';
import { makeAdminAction, demoteAdminAction, deleteUserAction, resetPasswordAction, updateEmailAction } from '@/app/actions/admin';

interface UserRow {
  id: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

export default function UserTable({ users, currentUser }: { users: UserRow[]; currentUser: { id: string; role: string; isSuperAdmin: boolean } }) {
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

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
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Feedback message */}
                    {feedback[user.id] && (
                      <span className={`text-xs font-medium ${feedback[user.id].startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                        {feedback[user.id]}
                      </span>
                    )}

                    {!isSelf && !feedback[user.id] && (
                      <>
                        {/* Make Admin */}
                        {user.role === 'STUDENT' && (
                          <button onClick={() => handleMakeAdmin(user.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded">
                            Make Admin
                          </button>
                        )}

                        {/* Demote Admin (super admin only) */}
                        {user.role === 'ADMIN' && !user.isSuperAdmin && currentUser.isSuperAdmin && (
                          <button onClick={() => handleDemote(user.id)} className="text-xs font-medium text-amber-600 hover:text-amber-800 px-2 py-1 bg-amber-50 rounded">
                            Demote
                          </button>
                        )}

                        {/* Reset Password */}
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

                        {/* Change Email */}
                        {editingEmail !== user.id && (
                          <button onClick={() => { setEditingEmail(user.id); setNewEmail(user.email); }} className="text-xs font-medium text-gray-600 hover:text-gray-800 px-2 py-1 bg-gray-50 rounded">
                            Change Email
                          </button>
                        )}

                        {/* Delete User */}
                        {(user.role === 'STUDENT' || (user.role === 'ADMIN' && !user.isSuperAdmin && currentUser.isSuperAdmin)) && (
                          <button onClick={() => handleDelete(user.id)} className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 rounded">
                            Delete
                          </button>
                        )}
                      </>
                    )}

                    {isSelf && <span className="text-xs text-gray-400 italic">You</span>}
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
