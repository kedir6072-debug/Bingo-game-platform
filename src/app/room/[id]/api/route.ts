import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomId = url.pathname.split('/').pop();
  
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

  // Get game if exists
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('room_id', roomId)
    .single();

  return Response.json({ game });
}