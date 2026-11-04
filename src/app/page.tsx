export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-4">Bingo Platform</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">Real-time multiplayer Bingo</p>
        <div className="space-y-2 text-sm text-zinc-500">
          <p>Phase 0 scaffold complete</p>
          <p>Next: Supabase setup & Auth</p>
        </div>
      </div>
    </main>
  );
}
