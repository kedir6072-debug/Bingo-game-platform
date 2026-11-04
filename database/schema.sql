-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- rooms
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.rooms(id) on delete cascade,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text default 'active'
);

-- bingo_cards
create table if not exists public.bingo_cards (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  pattern text not null,
  claimed_at timestamptz default now()
);

-- chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
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

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.games enable row level security;
alter table public.bingo_cards enable row level security;
alter table public.called_numbers enable row level security;
alter table public.game_winners enable row level security;
alter table public.chat_messages enable row level security;
alter table public.player_statistics enable row level security;
