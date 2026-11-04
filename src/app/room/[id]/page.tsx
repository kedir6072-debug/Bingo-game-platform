'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import { Check, Copy, Users, Clock, Play } from 'lucide-react';

interface RoomPlayer {
  profile_id: string;
  is_host: boolean;
  is_ready: boolean;
  joined_at: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  is_private: boolean;
  invite_code?: string;
  max_players: number;
  created_at: string;
  room_players: RoomPlayer[];
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showingCopyModal, setShowingCopyModal] = useState(false);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        router.push('/auth/login');
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.push('/auth/login');
      }
    });

    return () => supabase.auth.disconnect();
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchData = async () => {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          status,
          is_private,
          invite_code,
          max_players,
          created_at,
          room_players (
            is_host,
            is_ready,
            joined_at,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .eq('id', params.id)
        .single();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        router.push('/lobby');
        return;
      }

      setRoom(roomData);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`room-${params.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_players',
        filter: `room_id=eq.${params.id}`
      }, () => fetchData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms',
        filter: `id=eq.${params.id}`
      }, () => fetchData())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session, params.id, router]);

  const handleToggleReady = async () => {
    if (!room || !session) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase
      .from('room_players')
      .update({ is_ready: !room.room_players.find(p => p.profile_id === session.user.id)?.is_ready })
      .eq('room_id', room.id)
      .eq('profile_id', session.user.id);
  };

  const handleStartGame = async () => {
    if (!room || !session) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase
      .from('rooms')
      .update({ status: 'countdown' })
      .eq('id', room.id);
  };

  const copyInviteCode = () => {
    if (room?.invite_code) {
      navigator.clipboard.writeText(room.invite_code);
      setShowingCopyModal(true);
      setTimeout(() => setShowingCopyModal(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Room not found</p>
      </div>
    );
  }

  const isHost = room.room_players.some(p => p.profile_id === session?.user?.id && p.is_host);
  const allReady = room.room_players.length > 0 && room.room_players.every(p => p.is_ready);
  const playerCount = room.room_players.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-zinc-950 dark:to-zinc-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{room.name}</h1>
              <p className="text-zinc-500 dark:text-zinc-400">Room ID: {room.id.substring(0, 8)}...</p>
            </div>
            
            <div className="text-right">
              {room.is_private && room.invite_code && (
                <button
                  onClick={copyInviteCode}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Copy Invite Code
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {playerCount} / {room.max_players} players
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-500 dark:text-zinc-400">Status: {room.status}</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Players</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {room.room_players.map((player) => (
                <div 
                  key={player.profile_id}
                  className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                >
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {player.profiles?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">
                      {player.profiles?.username || 'Unknown'}
                      {player.is_host && <span className="text-xs text-indigo-600 ml-2">(Host)</span>}
                    </div>
                    {player.is_ready && (
                      <Check className="w-4 h-4 text-green-500 inline-block mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {room.room_players.length < room.max_players && (
            <div className="mb-6">
              <button
                onClick={() => router.push('/room/private')}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Invite others →
              </button>
            </div>
          )}

          {room.status === 'waiting' && (
            <div className="flex gap-4">
              <button
                onClick={handleToggleReady}
                className="flex-1 px-4 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {room.room_players.find(p => p.profile_id === session?.user?.id)?.is_ready 
                  ? 'Not Ready' 
                  : 'Ready Up'}
              </button>
              
              {isHost && allReady && (
                <button
                  onClick={handleStartGame}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Game
                </button>
              )}
            </div>
          )}

          {loading && showingCopyModal && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
              Copied!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}