-- Profiles policies
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Rooms policies
create policy "rooms_select_member" on public.rooms for select using (
  exists (select 1 from public.room_players where room_id = id and profile_id = auth.uid())
  or host_id = auth.uid()
);
create policy "rooms_insert_own" on public.rooms for insert with check (host_id = auth.uid());
create policy "rooms_update_host" on public.rooms for update using (host_id = auth.uid());

-- Room players policies
create policy "room_players_select_member" on public.room_players for select using (
  exists (select 1 from public.rooms where rooms.id = room_id and (host_id = auth.uid() or exists (select 1 from public.room_players rp where rp.room_id = room_id and rp.profile_id = auth.uid())))
);
create policy "room_players_insert_self" on public.room_players for insert with check (profile_id = auth.uid());
create policy "room_players_update_self" on public.room_players for update using (profile_id = auth.uid());

-- Games policies
create policy "games_select_member" on public.games for select using (
  exists (select 1 from public.room_players rp join public.rooms r on r.id = rp.room_id where rp.profile_id = auth.uid() and r.id = room_id)
);

-- Bingo cards policies
create policy "bingo_cards_select_member" on public.bingo_cards for select using (
  profile_id = auth.uid() or exists (
    select 1 from public.games g join public.room_players rp on rp.room_id = g.room_id
    where g.id = game_id and rp.profile_id = auth.uid()
  )
);

-- Called numbers policies
create policy "called_numbers_select_member" on public.called_numbers for select using (
  exists (select 1 from public.games g join public.room_players rp on rp.room_id = g.room_id where g.id = game_id and rp.profile_id = auth.uid())
);

-- Game winners policies
create policy "game_winners_select_member" on public.game_winners for select using (
  exists (select 1 from public.games g join public.room_players rp on rp.room_id = g.room_id where g.id = game_id and rp.profile_id = auth.uid())
);

-- Chat messages policies
create policy "chat_select_member" on public.chat_messages for select using (
  exists (select 1 from public.room_players rp where rp.room_id = room_id and rp.profile_id = auth.uid())
);
create policy "chat_insert_member" on public.chat_messages for insert with check (
  profile_id = auth.uid() and exists (select 1 from public.room_players rp where rp.room_id = room_id and rp.profile_id = auth.uid())
);

-- Player statistics policies
create policy "stats_select_all" on public.player_statistics for select using (true);
create policy "stats_update_own" on public.player_statistics for update using (profile_id = auth.uid());
