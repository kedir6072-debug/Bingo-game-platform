'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';

export default function LobbyPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const supabase = getSupabase();
    
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          status,
          max_players,
          room_players(count),
          profiles!rooms_host_id_fkey(username)
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching rooms:', error);
        return;
      }
      setRooms(data || []);
      setLoading(false);
    };

    fetchRooms();

    const channel = supabase
      .channel('rooms-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session]);

  const handleCreateRoom = async () => {
    if (!session) return;
    router.push('/room/create');
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-zinc-950 dark:to-zinc-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">Bingo Lobby</h1>
          <button
            onClick={handleCreateRoom}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            + Create Room
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
            Open Rooms ({rooms.length})
          </h2>
          
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎱</div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">No open rooms yet</p>
              <button
                onClick={handleCreateRoom}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Create First Room
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {(room.room_players?.[0]?.count || 1)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{room.name}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Host: {room.profiles?.username || 'Unknown'} • Max: {room.max_players} players
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Join Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/room/private" className="text-indigo-600 hover:text-indigo-500 underline">
            Join private room with code
          </Link>
        </div>
      </div>
    </div>
  );
}
