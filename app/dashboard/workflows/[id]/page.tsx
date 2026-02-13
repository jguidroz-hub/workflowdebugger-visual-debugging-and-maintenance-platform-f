'use client';

import { useState, useEffect } from 'react';

interface Workflows/[id]Item {
  id: string;
  title?: string;
  status?: string;
  createdAt: string;
  [key: string]: any;
}

export default function Workflows/[id]Page() {
  const [items, setItems] = useState<Workflows/[id]Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetch('/api/workflows/[id]')
      .then(r => r.json())
      .then(data => { setItems(data.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch('/api/workflows/[id]', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems(prev => [item, ...prev]);
      setNewTitle('');
      setShowCreate(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/workflows/[id]/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workflow Details</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + New
        </button>
      </div>

      <p className="text-gray-600 mb-6">View and edit specific workflow</p>

      {showCreate && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Enter title..."
            className="w-full p-2 border rounded mb-2"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1 bg-gray-200 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No items yet</p>
          <p>Create your first item to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium">{item.title || item.id}</h3>
                <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.status && (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">{item.status}</span>
                )}
                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
