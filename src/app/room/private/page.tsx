'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';

export default function JoinPrivateRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setLoading(true);
    setError('');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      setError('Please sign in first');
      setLoading(false);
      return;
    }

    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .single();

    if (error || !room) {
      setError('Invalid room code');
      setLoading(false);
      return;
    }

    if (room.status !== 'waiting') {
      setError('This room is not accepting players');
      setLoading(false);
      return;
    }

    const { error: playerError } = await supabase
      .from('room_players')
      .insert({
        room_id: room.id,
        profile_id: session.user.id
      });

    if (playerError) {
      setError(playerError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/room/${room.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-zinc-950 dark:to-zinc-900">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Join Private Room</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Enter the invite code</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 dark:bg-zinc-800 dark:text-white font-mono text-lg tracking-wider text-center"
              placeholder="ABCDEF123"
              maxLength={6}
              required
            />

            <button
              onClick={handleJoin}
              disabled={loading || code.length < 3}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg py-3 transition-colors"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>

            <button
              onClick={() => router.push('/lobby')}
              className="w-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium"
            >
              ← Back to Lobby
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}