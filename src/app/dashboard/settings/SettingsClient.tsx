'use client';

import { useState } from 'react';
import { updateMobileAction, updatePasswordAction, requestNameChangeAction } from '@/app/actions/settings';

export default function SettingsClient({ user }: { user: any }) {
  const [mobile, setMobile] = useState(user.mobile || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');

  const [msg, setMsg] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const showMsg = (type: 'error'|'success', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleMobileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateMobileAction(mobile);
    if (res.error) showMsg('error', res.error);
    else showMsg('success', 'Mobile number updated.');
    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showMsg('error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    const res = await updatePasswordAction(password);
    if (res.error) showMsg('error', res.error);
    else {
      showMsg('success', 'Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleNameRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await requestNameChangeAction(firstName, lastName);
    if (res.error) showMsg('error', res.error);
    else showMsg('success', 'Name change request submitted to admin.');
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {msg && (
        <div className={`p-4 rounded-lg text-sm border ${msg.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
          {msg.text}
        </div>
      )}

      {/* Name Change Request Form */}
      <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Request Name Change</h3>
        <p className="text-xs text-gray-500 mb-4">Name changes require admin approval. Once approved, your new name will appear on all your test records.</p>
        <form onSubmit={handleNameRequest} className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input 
              required value={firstName} onChange={e => setFirstName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input 
              required value={lastName} onChange={e => setLastName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            type="submit" disabled={loading || (firstName === user.firstName && lastName === user.lastName)}
            className="col-span-2 bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            Submit Request
          </button>
        </form>
      </section>

      {/* Mobile Form */}
      <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Update Contact</h3>
        <form onSubmit={handleMobileUpdate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input 
              required type="tel" value={mobile} onChange={e => setMobile(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Save Mobile
          </button>
        </form>
      </section>

      {/* Password Form */}
      <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordUpdate} className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input 
              required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input 
              required type="password" minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="col-span-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition"
          >
            Update Password
          </button>
        </form>
      </section>
    </div>
  );
}
