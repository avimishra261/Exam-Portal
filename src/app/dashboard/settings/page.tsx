import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!fullUser) redirect('/login');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Settings</h2>
      <p className="text-gray-500 mb-8">Manage your profile, password, and security settings.</p>
      
      <SettingsClient user={fullUser} />
    </div>
  );
}
