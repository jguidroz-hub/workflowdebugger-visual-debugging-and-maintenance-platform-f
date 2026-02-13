'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}</h1>
      <p className="text-gray-600 mb-8">Here's your WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows overview.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded-lg bg-blue-50">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-2xl font-bold text-blue-600">Active</p>
        </div>
        <div className="p-4 border rounded-lg bg-green-50">
          <p className="text-sm text-gray-600">Plan</p>
          <p className="text-2xl font-bold text-green-600">Free</p>
        </div>
        <div className="p-4 border rounded-lg bg-purple-50">
          <p className="text-sm text-gray-600">Since</p>
          <p className="text-2xl font-bold text-purple-600">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          <a href="/dashboard/workflows" className="block p-4 border rounded-lg hover:bg-blue-50 transition">
            <h3 className="font-medium">Workflow Management</h3>
            <p className="text-sm text-gray-500">List and create workflows</p>
          </a>
          <a href="/dashboard/workflows/[id]" className="block p-4 border rounded-lg hover:bg-blue-50 transition">
            <h3 className="font-medium">Workflow Details</h3>
            <p className="text-sm text-gray-500">View and edit specific workflow</p>
          </a>
          <a href="/dashboard/executions" className="block p-4 border rounded-lg hover:bg-blue-50 transition">
            <h3 className="font-medium">Execution Logs</h3>
            <p className="text-sm text-gray-500">Comprehensive workflow execution tracking</p>
          </a>
        <a href="/dashboard/settings" className="block p-4 border rounded-lg hover:bg-blue-50 transition">
          <h3 className="font-medium">Settings</h3>
          <p className="text-sm text-gray-500">Manage your account preferences</p>
        </a>
      </div>
    </div>
  );
}
