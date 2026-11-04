'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import { Check, Clock, Users, AlertCircle, Trophy, Reload } from 'lucide-react';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
const BINGO_RANGES = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };

type BingoCard = number[][];
type CalledNumber = { number: number; letter: string; called_at: string; caller_order: number };

export default function GamePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [card, setCard] = useState<BingoCard | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<CalledNumber[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'countdown' | 'playing' | 'finished'>('waiting');
  const [winner, setWinner] = useState<any>(null);
  const [countdownValue, setCountdownValue] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) router.push('/auth/login');
    });

    return () => supabase.auth.disconnect();
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchRoom = async () => {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', params.id)
        .single();

      if (!roomData) {
        router.push('/lobby');
        return;
      }

      setRoom(roomData);

      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('room_id', params.id)
        .single();

      setGame(gameData);
      setGameStatus(gameData?.status || roomData.status);

      const { data: cardData } = await supabase
        .from('bingo_cards')
        .select('card_data')
        .eq('game_id', gameData?.id || 'temp')
        .eq('profile_id', session.user.id)
        .single();

      if (gameData && cardData) {
        setCard(JSON.parse(cardData.card_data));
      }

      const { data: calledData } = await supabase
        .from('called_numbers')
        .select('*')
        .eq('game_id', gameData?.id)
        .order('caller_order', { ascending: true });

      setCalledNumbers(calledData || []);
    };

    fetchRoom();

    const channel = supabase
      .channel(`game-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => fetchRoom())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'called_numbers' }, () => fetchRoom())
      .subscribe();

    return () => channel.unsubscribe();
  }, [session, params.id, router]);

  useEffect(() => {
    if (gameStatus === 'countdown' && room?.status === 'countdown') {
      setCountdownValue(3);
      setShowCountdown(true);
      
      countdownRef.current = setInterval(() => {
        setCountdownValue((prev) => {
          if (prev === 1) {
            setShowCountdown(false);
            return 3;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [gameStatus, room?.status]);

  useEffect(() => {
    if (gameStatus === 'finished') {
      const interval = setInterval(() => {
        fetch('/api/game/status/' + params.id).catch(() => {});
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [gameStatus, params.id]);

  const isMarked = (num: number) => calledNumbers.some(c => c.number === num);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-950 dark:to-zinc-900">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Bingo Game</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Room: {room?.name || 'Loading...'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="font-medium">{room?.room_players?.length || 0} players</span>
            </div>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        </div>

        {/* Current Number Display */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-center">
            <div className="inline-block w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-3">
              <div className="text-center">
                <div className="text-6xl font-bold text-white">{calledNumbers.length > 0 ? BINGO_LETTERS[calledNumbers.length - 1] : 'B'}</div>
                <div className="text-4xl font-bold text-white mt-1">
                  {calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1].number : '---'}
                </div>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {calledNumbers.length > 0 ? 'Number Called' : 'Waiting for Host'}
            </h2>
          </div>
        </div>

        {/* Recent Numbers */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Called Numbers ({calledNumbers.length})</h3>
          <div className="flex flex-wrap gap-2">
            {calledNumbers.length > 0 ? (
              calledNumbers.slice(-20).map((num) => (
                <div 
                  key={num.number} 
                  className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                >
                  {num.letter}-{num.number}
                </div>
              ))
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">No numbers called yet</p>
            )}
          </div>
        </div>

        {/* Countdown Modal */}
        {showCountdown && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center">
              <div className="text-6xl font-bold text-indigo-600 mb-4">{countdownValue}</div>
              <p className="text-zinc-500 dark:text-zinc-400">Next number in...</p>
            </div>
          </div>
        )}

        {/* Bingo Card */}
        {card ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Your Card</h3>
              <button
                onClick={() => {}}
                className="px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded"
              >
                🔄 Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-px bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden">
              {BINGO_LETTERS.map((letter, colIdx) => (
                <div key={letter} className="bg-white dark:bg-zinc-900">
                  <div className="h-8 flex items-center justify-center font-bold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {letter}
                  </div>
                  {card.map((row, rowIdx) => {
                    const num = row[colIdx];
                    const marked = isMarked(num);
                    const isFree = letter === 'N' && colIdx === 2 && rowIdx === 2;
                    
                    return (
                      <div 
                        key={`${rowIdx}-${colIdx}`}
                        className={`aspect-square flex items-center justify-center text-sm font-medium transition-all ${
                          isFree 
                            ? 'bg-yellow-400 text-yellow-800' 
                            : marked 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {isFree ? 'FREE' : num}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 mb-6 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">Loading your Bingo card...</p>
          </div>
        )}

        {/* Action Buttons */}
        {gameStatus === 'playing' && card && (
          <button
            onClick={() => {}}
            className="w-full max-w-md mx-auto bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-6 rounded-xl shadow-lg transition-colors"
          >
            CLAIM BINGO 🏆
          </button>
        )}
      </main>
    </div>
  );
}

// Game Engine Component would go here
function useGameEngine() {
  // This will be implemented with server-side validation
  return null;
}