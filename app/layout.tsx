import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows',
  description: 'Value Proposition: Eliminates the pain of debugging tangled automation workflows by providing visual flow mapping, step-by-step execution tracking, and maintainable logic patterns for complex business automations.

Target Customer: Operations teams at mid-market companies (100-1000 employees) using n8n, Zapier, or custom automation scripts

---
Category: Micro-SaaS
Target Market: Operations teams at mid-market companies (100-1000 employees) using n8n, Zapier, or custom automation scripts
Source Hypothesis ID: b85a3683-9770-466d-8f80-534c6bd031e9
Promotion Type: automatic',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <nav className="border-b">
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
              <a href="/" className="font-bold text-lg">WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows</a>
              <div className="flex items-center gap-4">
                <a href="/dashboard" className="text-sm hover:text-blue-600">Dashboard</a>
                <a href="/pricing" className="text-sm hover:text-blue-600">Pricing</a>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
