'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
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

    const newCode = isPrivate ? generateInviteCode() : null;
    setInviteCode(newCode);

    const { data, error } = await supabase.from('rooms').insert({
      name: roomName,
      host_id: session.user.id,
      is_private: isPrivate,
      invite_code: newCode,
      max_players: 6
    }).select().single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.from('room_players').insert({
      room_id: data.id,
      profile_id: session.user.id,
      is_host: true
    });

    setLoading(false);
    router.push(`/room/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-zinc-950 dark:to-zinc-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Create Room</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Start a new Bingo game</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 dark:bg-zinc-800 dark:text-white"
                placeholder="My Bingo Game"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Private Room</span>
              </label>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                {isPrivate 
                  ? 'Only invited players can join with the code'
                  : 'Anyone can join from the lobby'
                }
              </p>
            </div>

            {isPrivate && inviteCode && (
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Share this code: <span className="font-bold text-lg letter-font">{inviteCode}</span>
                </p>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg py-3 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>

            <button
              onClick={() => router.back()}
              className="w-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}