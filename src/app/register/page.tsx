'use client';

import { registerAction, sendOtpAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  async function handleSendOtp(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    if (!emailInput?.value) {
      setError('Please enter your email first.');
      return;
    }
    setError('');
    
    // Call server action to send OTP
    const res = await sendOtpAction(emailInput.value);
    if (res.error) {
      setError(res.error);
    } else {
      setOtpSent(true);
      setError('An OTP has been sent to your email. (Check server console)');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsPending(true);
    setError('');
    
    const res = await registerAction(formData);
    
    if (res?.error) {
      setError(res.error);
      setIsPending(false);
    } else if (res?.pending) {
      setSuccessMsg('Registration successful! Your account is pending admin approval. You will be notified once admitted.');
    }
  }

  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent</h2>
          <p className="text-gray-600 mb-6">{successMsg}</p>
          <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-xl w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join ExamPortal as a Student</p>
        </div>
        
        {error && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-6 text-sm border border-blue-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input required name="firstName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input required name="lastName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input required type="tel" name="mobile" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+91 9876543210" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="flex gap-2">
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
              <button 
                onClick={handleSendOtp}
                type="button"
                className="whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg border border-gray-300"
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification OTP</label>
              <input 
                required 
                name="otp" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                name="password" 
                required 
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword" 
                required 
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!otpSent || isPending}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
          >
            {isPending ? 'Submitting...' : 'Register as Student'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
