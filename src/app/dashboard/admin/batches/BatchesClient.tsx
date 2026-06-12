'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBatchAction, deleteBatchAction } from '@/app/actions/adminExtended';

export default function BatchesClient({ batches }: { batches: any[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const isMutating = loading || isPending;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await createBatchAction(name);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setName('');
      startTransition(() => {
        router.refresh();
        setLoading(false);
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    setLoading(true);
    const res = await deleteBatchAction(id);
    if (res.error) {
      alert(res.error);
      setLoading(false);
    } else {
      startTransition(() => {
        router.refresh();
        setLoading(false);
      });
    }
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-8 flex gap-3 items-start">
        <div className="flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="New Batch Name" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button 
          type="submit" 
          disabled={isMutating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
        >
          {isMutating ? 'Creating...' : 'Create Batch'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map(b => (
          <Link href={`/dashboard/admin/batches/${b.id}`} key={b.id} className="block border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-white hover:shadow-md transition relative group cursor-pointer">
            <h3 className="font-bold text-lg text-gray-800 mb-1">
              {b.name} 
              {b.isDefault && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full align-middle">Default</span>}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {b._count.users} Students • {b._count.exams} Tests
            </p>
            {!b.isDefault && (
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(b.id); }}
                className="text-red-600 hover:text-red-800 text-sm font-medium opacity-100 md:opacity-0 group-hover:opacity-100 transition absolute bottom-5 right-5"
              >
                Delete
              </button>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
