export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Value Proposition: Eliminates the pain of debugging tangled automation workflows by providing visual flow mapping, step-by-step execution tracking, and maintainable logic patterns for complex business automations.

Target Customer: Operations teams at mid-market companies (100-1000 employees) using n8n, Zapier, or custom automation scripts

---
Category: Micro-SaaS
Target Market: Operations teams at mid-market companies (100-1000 employees) using n8n, Zapier, or custom automation scripts
Source Hypothesis ID: b85a3683-9770-466d-8f80-534c6bd031e9
Promotion Type: automatic</p>
        <div className="flex gap-3 justify-center">
          <a href="/auth/signup" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Start Free
          </a>
          <a href="#features" className="px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 transition">
            Learn More
          </a>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">The Problem</h2>
          <p className="text-lg text-gray-600">Solving a key business challenge</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-xl">
            <h3 className="font-bold mb-2">Easy to Use</h3>
            <p className="text-gray-600">Get started in minutes with our intuitive interface.</p>
          </div>
          <div className="p-6 border rounded-xl">
            <h3 className="font-bold mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">Enterprise-grade security with 99.9% uptime.</p>
          </div>
          <div className="p-6 border rounded-xl">
            <h3 className="font-bold mb-2">Built for Teams</h3>
            <p className="text-gray-600">Collaborate seamlessly with your entire team.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-8">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

        <div className={`p-6 border rounded-xl ${false ? 'border-blue-500 shadow-lg' : ''}`}>
          <h3 className="text-lg font-bold">Starter</h3>
          <p className="text-3xl font-bold my-2">$9<span className="text-sm text-gray-500">/mo</span></p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>✓ Core features</li>
            <li>✓ Up to 100 items</li>
            <li>✓ Email support</li>
          </ul>
          <a href="/auth/signup" className="block text-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:opacity-90 transition">
            Get Started
          </a>
        </div>

        <div className={`p-6 border rounded-xl ${true ? 'border-blue-500 shadow-lg' : ''}`}>
          <h3 className="text-lg font-bold">Pro</h3>
          <p className="text-3xl font-bold my-2">$29<span className="text-sm text-gray-500">/mo</span></p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>✓ Everything in Starter</li>
            <li>✓ Unlimited items</li>
            <li>✓ Priority support</li>
            <li>✓ API access</li>
          </ul>
          <a href="/auth/signup" className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 transition">
            Get Started
          </a>
        </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-gray-600 mb-6">Join thousands of small businesses who trust WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows.</p>
        <a href="/auth/signup" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
          Start Free Today
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-4xl mx-auto px-6 flex justify-between text-sm text-gray-500">
          <p>© {new Date().getFullYear()} WorkflowDebugger - Visual debugging and maintenance platform for multi-step automation workflows. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-gray-700">Privacy</a>
            <a href="/terms" className="hover:text-gray-700">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
