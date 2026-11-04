import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get('roomId');
  
  if (!roomId) {
    return Response.json({ error: 'Room ID required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is in the room
  const { data: player } = await supabase
    .from('room_players')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('profile_id', session.user.id)
    .single();

  if (!player) {
    return Response.json({ error: 'Not in room' }, { status: 403 });
  }

  // Check if game exists
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (!game) {
    return Response.json({ error: 'Game not found' }, { status: 404 });
  }

  return Response.json({ game });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { roomId, action } = body;
  
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  switch (action) {
    case 'start_game': {
      // Validate host
      const { data: room } = await supabase
        .from('rooms')
        .select('host_id, status')
        .eq('id', roomId)
        .single();

      if (!room) {
        return Response.json({ error: 'Room not found' }, { status: 404 });
      }

      if (room.host_id !== session.user.id) {
        return Response.json({ error: 'Only host can start game' }, { status: 403 });
      }

      if (room.status !== 'waiting') {
        return Response.json({ error: 'Room not ready' }, { status: 400 });
      }

      // Create game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          room_id: roomId,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Update room status
      await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', roomId);

      // Get players
      const { data: players } = await supabase
        .from('room_players')
        .select('profile_id')
        .eq('room_id', roomId);

      // Generate cards for each player
      const { createClient } = await import('@supabase/supabase-js');
      const seed = game.id.split('-').reduce((a, b) => {
        try { return a + parseInt(b, 36); } catch { return a; }
      }, 0);
      
      for (const player of players || []) {
        const card = generateBingoCard(seed + player.profile_id.split('-').reduce((a, b) => {
          try { return a + parseInt(b, 36); } catch { return a; }
        }, 0));
        
        await supabase
          .from('bingo_cards')
          .insert({
            game_id: game.id,
            profile_id: player.profile_id,
            card_data: JSON.stringify(card)
          });
      }

      return Response.json({ game });
    }
    
    default:
      return Response.json({ error: 'Unknown action' }, { status: 400 });
  }
}

// Game engine helper
function generateBingoCard(seed: number): number[][] {
  function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  
  const rng = mulberry32(seed);
  const card: number[][] = [];
  const letters = ['B', 'I', 'N', 'G', 'O'];
  
  for (let col = 0; col < 5; col++) {
    const [min, max] = BINGO_RANGES[letters[col] as keyof typeof BINGO_RANGES];
    const nums = new Set<number>();
    while (nums.size < 5) {
      nums.add(Math.floor(rng() * (max - min + 1)) + min);
    }
    const sorted = Array.from(nums).sort((a, b) => a - b);
    for (let row = 0; row < 5; row++) {
      if (!card[row]) card[row] = [0, 0, 0, 0, 0];
      card[row][col] = sorted[row];
    }
  }
  
  card[2][2] = 0; // Free space
  return card;
}

const BINGO_RANGES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};
}