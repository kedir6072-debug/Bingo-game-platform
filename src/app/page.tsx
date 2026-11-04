'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function HomePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-zinc-950 dark:to-zinc-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-center">
        <div className="text-center md:text-left mb-10 md:mb-0 md:mr-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-zinc-900 dark:text-white">
            Bingo<span className="text-indigo-600">Platform</span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-300 mb-8 max-w-lg">
            Real-time multiplayer Bingo where you play with friends across a shared board.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4 sm:gap-6">
            {session ? (
              <>
                <Link
                  href="/lobby"
                  className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-colors"
                >
                  Go to Lobby
                </Link>
                <Link
                  href="/room/create"
                  className="inline-block px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-colors"
                >
                  Create Room
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-block px-8 py-4 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="relative">
          <div className="w-80 h-80 md:w-96 md:h-96 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-8 left-8 right-8 bottom-8 p-4">
              <div className="grid grid-cols-5 gap-px bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden mb-4">
                {Array(5).fill(0).map((_, col) => (
                  <div key={col} className="bg-white dark:bg-zinc-900 flex">
                    {Array(5).fill(0).map((_, row) => {
                      const isFree = col === 2 && row === 2;
                      return (
                        <div
                          key={row}
                          className={`aspect-square flex items-center justify-center text-xs font-bold ${
                            isFree 
                              ? 'bg-yellow-400 text-yellow-800' 
                              : 'bg-white dark:bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {isFree ? 'FREE' : (col * 15) + row + 1}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <span className="text-zinc-500">B:</span>
                <span className="text-zinc-500">I:</span>
                <span className="text-zinc-500">N:</span>
                <span className="text-zinc-500">G:</span>
                <span className="text-zinc-500">O:</span>
              </div>
            </div>
          </div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500 rounded-full opacity-20 blur-32"></div>
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-purple-500 rounded-full opacity-20 blur-32"></div>
        </div>
      </main>
    </div>
  );
}