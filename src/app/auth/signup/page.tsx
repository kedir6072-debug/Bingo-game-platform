import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-6">Create account</h1>
        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <button className="w-full bg-indigo-600 text-white rounded-lg py-2">Sign Up</button>
        </form>
        <p className="mt-4 text-sm text-zinc-600">Have an account? <Link href="/auth/login" className="text-indigo-600">Sign in</Link></p>
      </div>
    </main>
  );
}
