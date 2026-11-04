-- Combined Supabase-safe migration for Real-time Bingo Platform
-- Run this once in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- rooms
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  host_id uuid references public.profiles(id) on delete cascade,
  is_private boolean default false,
  invite_code text unique,
  max_players int default 6,
  status text default 'waiting' check (status in ('waiting','countdown','playing','finished')),
  created_at timestamptz default now()
);

-- room_players
create table if not exists public.room_players (
  room_id uuid references public.rooms(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  is_host boolean default false,
  is_ready boolean default false,
  joined_at timestamptz default now(),
  primary key (room_id, profile_id)
);

-- games
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text default 'active'
);

-- bingo_cards
create table if not exists public.bingo_cards (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  card_data jsonb not null,
  created_at timestamptz default now(),
  unique(game_id, profile_id)
);

-- called_numbers
create table if not exists public.called_numbers (
  game_id uuid references public.games(id) on delete cascade,
  number int not null,
  letter char(1) not null,
  called_at timestamptz default now(),
  caller_order int not null,
  primary key (game_id, number)
);

-- game_winners
create table if not exists public.game_winners (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  pattern text not null,
  claimed_at timestamptz default now()
);

-- chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

-- player_statistics
create table if not exists public.player_statistics (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  games_played int default 0,
  games_won int default 0,
  fastest_win_seconds int
);

-- Indexes
create index if not exists idx_room_players_room on public.room_players(room_id);
create index if not exists idx_games_room on public.games(room_id);
create index if not exists idx_bingo_cards_game on public.bingo_cards(game_id);
create index if not exists idx_called_numbers_game on public.called_numbers(game_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.games enable row level security;
alter table public.bingo_cards enable row level security;
alter table public.called_numbers enable row level security;
alter table public.game_winners enable row level security;
alter table public.chat_messages enable row level security;
alter table public.player_statistics enable row level security;

-- Profiles policies
create policy if not exists "profiles_select_all" on public.profiles for select using (true);
create policy if not exists "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Rooms policies
create policy if not exists "rooms_select_member" on public.rooms for select using (
  exists (select 1 from public.room_players where room_id = id and profile_id = auth.uid())
  or host_id = auth.uid()
);
create policy if not exists "rooms_insert_own" on public.rooms for insert with check (host_id = auth.uid());
create policy if not exists "rooms_update_host" on public.rooms for update using (host_id = auth.uid());

-- Room players policies
create policy if not exists "room_players_select_member" on public.room_players for select using (
  exists (select 1 from public.rooms where rooms.id = room_id and (host_id = auth.uid() or exists (select 1 from public.room_players rp where rp.room_id = room_id and rp.profile_id = auth.uid())))
);
create policy if not exists "room_players_insert_self" on public.room_players for insert with check (profile_id = auth.uid());
create policy if not exists "room_players_update_self" on public.room_players for update using (profile_id = auth.uid());

-- Games policies
create policy if not exists "games_select_member" on public.games for select using (
  exists (select 1 from public.room_players rp join public.rooms r on r.id = rp.room_id where rp.profile_id = auth.uid() and r.id = room_id)
);

-- Bingo cards policies
create policy if not exists "bingo_cards_select_member" on public.bingo_cards for select using (
  profile_id = auth.uid() or exists (
    select 1 from public.games g join public.room_players rp on rp.room_id = g.room_id
    where g.id = game_id and rp.profile_id = auth.uid()
  )
);

-- Called numbers policies
create policy if not exists "called_numbers_select_member" on public.called_numbers for select using (
  exists (select 1 from public.games g join public.room_players rp on rp.room_id = g.room_id where g.id = game_id and rp.profile_id = auth.uid())
);

-- Game winners policies
create policy if not exists "game_winners_select_member" on public.game_winners for select using (
  exists (select 1 from public.games g join public.room_players rp on rp.room_id = g.room_id where g.id = game_id and rp.profile_id = auth.uid())
);

-- Chat messages policies
create policy if not exists "chat_select_member" on public.chat_messages for select using (
  exists (select 1 from public.room_players rp where rp.room_id = room_id and rp.profile_id = auth.uid())
);
create policy if not exists "chat_insert_member" on public.chat_messages for insert with check (
  profile_id = auth.uid() and exists (select 1 from public.room_players rp where rp.room_id = room_id and rp.profile_id = auth.uid())
);

-- Player statistics policies
create policy if not exists "stats_select_all" on public.player_statistics for select using (true);
create policy if not exists "stats_update_own" on public.player_statistics for update using (profile_id = auth.uid());

-- Profiles trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
