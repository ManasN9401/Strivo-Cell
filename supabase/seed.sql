-- ============================================================
-- Strivo Cell — Full database schema + seed data
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Tables ────────────────────────────────────────────────────

create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text unique,
  bio              text,
  avatar_url       text,
  social_twitter   text,
  social_youtube   text,
  social_instagram text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table if not exists public.titles (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  type          text not null check (type in ('movie','series')),
  genre         text[],
  release_year  int,
  duration_mins int,
  is_featured   boolean default false,
  backdrop_path text,
  poster_path   text,
  rating        text,
  tags          text[],
  created_at    timestamptz default now()
);

create table if not exists public.seasons (
  id         uuid primary key default uuid_generate_v4(),
  title_id   uuid references public.titles(id) on delete cascade,
  number     int not null,
  created_at timestamptz default now()
);

create table if not exists public.episodes (
  id             uuid primary key default uuid_generate_v4(),
  season_id      uuid references public.seasons(id) on delete cascade,
  title_id       uuid references public.titles(id) on delete cascade,
  number         int not null,
  title          text not null,
  description    text,
  duration_mins  int,
  thumbnail_path text,
  storage_path   text,
  created_at     timestamptz default now()
);

alter table public.seasons enable row level security;
alter table public.episodes enable row level security;

create policy "Seasons are viewable by everyone" on public.seasons for select using (true);
create policy "Episodes are viewable by everyone" on public.episodes for select using (true);


create table if not exists public.video_assets (
  id           uuid primary key default uuid_generate_v4(),
  title_id     uuid references public.titles(id) on delete cascade unique,
  storage_path text not null,
  quality      text default '4K',
  created_at   timestamptz default now()
);

create table if not exists public.watchlist (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade,
  title_id   uuid references public.titles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, title_id)
);

create table if not exists public.watch_progress (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade,
  title_id       uuid references public.titles(id) on delete cascade,
  episode_id     uuid references public.episodes(id),
  progress_secs  int default 0,
  updated_at     timestamptz default now(),
  unique(user_id, title_id, episode_id)
);

create table if not exists public.party_rooms (
  id         uuid primary key default uuid_generate_v4(),
  host_id    uuid references auth.users(id) on delete cascade,
  title_id   uuid references public.titles(id) on delete cascade,
  is_active  boolean default true,
  created_at timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────

create index if not exists idx_watch_progress_user_title
  on public.watch_progress (user_id, title_id);

create index if not exists idx_watch_progress_user_updated
  on public.watch_progress (user_id, updated_at desc);

create index if not exists idx_party_rooms_active
  on public.party_rooms (id) where is_active = true;

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.titles        enable row level security;
alter table public.seasons       enable row level security;
alter table public.episodes      enable row level security;
alter table public.video_assets  enable row level security;
alter table public.watchlist     enable row level security;
alter table public.watch_progress enable row level security;
alter table public.party_rooms   enable row level security;

-- Public read
create policy "Public read profiles"     on public.profiles     for select using (true);
create policy "Public read titles"       on public.titles       for select using (true);
create policy "Public read seasons"      on public.seasons      for select using (true);
create policy "Public read episodes"     on public.episodes     for select using (true);
create policy "Public read video_assets" on public.video_assets for select using (true);

-- Profiles: owner manages
create policy "Users manage profiles"
  on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- Watchlist: owner only
create policy "Users manage watchlist"
  on public.watchlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Progress: owner only
create policy "Users manage progress"
  on public.watch_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Party rooms: read active rooms; host manages their own
create policy "Auth users read active rooms"
  on public.party_rooms for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "Host manages room"
  on public.party_rooms for all
  using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- ── Seed: 20 titles ───────────────────────────────────────────

truncate public.titles restart identity cascade;

insert into public.titles
  (title, description, type, genre, release_year, duration_mins,
   is_featured, backdrop_path, poster_path, rating, tags)
values
('Ironclad Protocol','A rogue intelligence operative dismantles a shadow government from within, leaving encrypted breadcrumbs only his estranged daughter can follow.','movie',ARRAY['Action','Thriller'],2024,128,true,'https://picsum.photos/seed/ironclad-back/1920/1080','https://picsum.photos/seed/ironclad-post/400/600','R',ARRAY['4K','HDR','Dolby Atmos']),
('Zero Meridian','When a satellite crash exposes coordinates to a Cold War weapon cache, three rival agencies race across four continents.','movie',ARRAY['Action','Spy'],2023,114,false,'https://picsum.photos/seed/zeromeridian-back/1920/1080','https://picsum.photos/seed/zeromeridian-post/400/600','PG-13',ARRAY['4K','HDR']),
('Steel Doctrine','A decorated general turned whistleblower must outrun both his own army and the mercenaries hired to silence him.','movie',ARRAY['Action'],2022,107,false,'https://picsum.photos/seed/steeldoc-back/1920/1080','https://picsum.photos/seed/steeldoc-post/400/600','R',ARRAY['4K']),
('The Pale Signal','Receiving a transmission from a probe launched in 1977, humanity discovers it carries not data — but a warning.','movie',ARRAY['Sci-Fi','Drama'],2024,142,true,'https://picsum.photos/seed/palesignal-back/1920/1080','https://picsum.photos/seed/palesignal-post/400/600','PG-13',ARRAY['4K','HDR','Dolby Atmos','IMAX']),
('Lacuna','A memory-erasure corporation loses a subject who shouldn''t exist — and the investigator assigned to find her starts forgetting too.','series',ARRAY['Sci-Fi','Thriller'],2023,null,true,'https://picsum.photos/seed/lacuna-back/1920/1080','https://picsum.photos/seed/lacuna-post/400/600','TV-MA',ARRAY['4K','HDR']),
('Helios Station','The crew of a solar research outpost uncovers evidence that the sun is behaving in ways physics cannot explain.','series',ARRAY['Sci-Fi'],2022,null,false,'https://picsum.photos/seed/helios-back/1920/1080','https://picsum.photos/seed/helios-post/400/600','TV-14',ARRAY['4K','HDR']),
('Nether Drift','Two quantum engineers stranded between parallel timelines must collapse the wavefunction before both versions of Earth vanish.','movie',ARRAY['Sci-Fi'],2023,118,false,'https://picsum.photos/seed/netherdrift-back/1920/1080','https://picsum.photos/seed/netherdrift-post/400/600','PG-13',ARRAY['4K']),
('The Cartographer''s Wife','A 19th-century mapmaker''s widow discovers his final map leads not to undiscovered land — but to the life he kept from her.','movie',ARRAY['Drama','Period'],2023,124,true,'https://picsum.photos/seed/cartographer-back/1920/1080','https://picsum.photos/seed/cartographer-post/400/600','PG',ARRAY['4K','HDR']),
('Saltwater','Three generations of a fishing family in rural Scotland collide when the youngest son returns with a truth that reshapes their history.','movie',ARRAY['Drama'],2022,109,false,'https://picsum.photos/seed/saltwater-back/1920/1080','https://picsum.photos/seed/saltwater-post/400/600','R',ARRAY['4K']),
('Meridiem','A disgraced concert pianist in 1960s Rome attempts a comeback while navigating grief, jealousy, and a complicated muse.','movie',ARRAY['Drama','Music'],2024,131,false,'https://picsum.photos/seed/meridiem-back/1920/1080','https://picsum.photos/seed/meridiem-post/400/600','PG-13',ARRAY['4K','HDR']),
('Closed Circuit','A jury forewoman realises mid-deliberation that she is being watched by the person they are about to convict.','movie',ARRAY['Thriller'],2024,99,true,'https://picsum.photos/seed/closedcircuit-back/1920/1080','https://picsum.photos/seed/closedcircuit-post/400/600','R',ARRAY['4K','HDR']),
('The Handler','A crisis negotiator takes a routine hostage call — then recognises the voice on the other end as her own kidnapped child.','movie',ARRAY['Thriller','Crime'],2023,95,false,'https://picsum.photos/seed/handler-back/1920/1080','https://picsum.photos/seed/handler-post/400/600','R',ARRAY['4K']),
('Deep Vein','A forensic diver investigating a reservoir drowning uncovers a network of crimes reaching back fifty years.','series',ARRAY['Thriller','Crime'],2022,null,false,'https://picsum.photos/seed/deepvein-back/1920/1080','https://picsum.photos/seed/deepvein-post/400/600','TV-MA',ARRAY['4K']),
('Very Bad Optics','A crisis PR firm accidentally goes viral for the wrong reasons and must spin itself out of its own scandal.','series',ARRAY['Comedy'],2024,null,false,'https://picsum.photos/seed/vbo-back/1920/1080','https://picsum.photos/seed/vbo-post/400/600','TV-14',ARRAY['4K','HDR']),
('Flat White','Three baristas inherit a failing Italian espresso chain and discover their wildly incompatible visions for saving it.','movie',ARRAY['Comedy','Drama'],2023,102,false,'https://picsum.photos/seed/flatwhite-back/1920/1080','https://picsum.photos/seed/flatwhite-post/400/600','PG-13',ARRAY['4K']),
('The Conference','A mandatory team-building retreat at a remote hotel becomes a weekend of escalating professional catastrophes.','movie',ARRAY['Comedy'],2022,94,false,'https://picsum.photos/seed/conference-back/1920/1080','https://picsum.photos/seed/conference-post/400/600','R',ARRAY['4K']),
('Saltmarsh','A lighthouse keeper on a remote Scottish island begins receiving log entries from the keeper who vanished three decades ago.','movie',ARRAY['Horror','Mystery'],2024,103,true,'https://picsum.photos/seed/saltmarsh-back/1920/1080','https://picsum.photos/seed/saltmarsh-post/400/600','R',ARRAY['4K','HDR']),
('The Quiet Between','A grief counsellor moves to a rural town and discovers her clients are all dreaming the exact same dream.','movie',ARRAY['Horror','Thriller'],2023,108,false,'https://picsum.photos/seed/quietbetween-back/1920/1080','https://picsum.photos/seed/quietbetween-post/400/600','R',ARRAY['4K']),
('Pale House','A family restoring an abandoned Victorian estate gradually realises the house is not as empty as the estate agent promised.','series',ARRAY['Horror'],2022,null,false,'https://picsum.photos/seed/palehouse-back/1920/1080','https://picsum.photos/seed/palehouse-post/400/600','TV-MA',ARRAY['4K','HDR']),
('Below Tide','Marine archaeologists excavating a submerged Norse settlement awaken something that has been waiting eight centuries to resurface.','movie',ARRAY['Horror','Sci-Fi'],2023,111,false,'https://picsum.photos/seed/belowtide-back/1920/1080','https://picsum.photos/seed/belowtide-post/400/600','R',ARRAY['4K']);

insert into public.video_assets (title_id, storage_path, quality)
select id, 'videos/' || lower(replace(title, ' ', '-')) || '/master.m3u8', '4K'
from public.titles
on conflict (title_id) do nothing;

-- ── Storage ───────────────────────────────────────────────────
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true) 
on conflict do nothing;

create policy "Avatars are publicly accessible." 
on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload avatars." 
on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update avatars." 
on storage.objects for update with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- ── Seasons & Episodes (Series) ───────────────────────────────
-- Deep Vein — Season 1
insert into public.seasons (id, title_id, number)
select gen_random_uuid(), t.id, 1
from public.titles t where t.title = 'Deep Vein'
on conflict do nothing;

insert into public.episodes (season_id, title_id, number, title, description, duration_mins)
select
  s.id,
  t.id,
  ep.num,
  ep.title,
  ep.descr,
  ep.dur
from public.seasons s
join public.titles t on t.id = s.title_id
cross join (values
  (1, 'The Body in the Reservoir',   'A forensic diver is called to the scene of a routine drowning — but the body has been there far longer than anyone expected.', 52),
  (2, 'Cold Current',                'Evidence from the lake floor points to a network of crimes stretching back to the 1970s. The diver goes off-book.', 49),
  (3, 'Depth Charge',                'A second victim surfaces, and the diver realises she is now a target herself.', 54),
  (4, 'Silt',                        'Archives reveal a cover-up involving local officials. The investigation nearly costs the diver her career.', 51),
  (5, 'The Weight of Water',         'The truth behind the original drowning is uncovered — and it implicates someone the diver trusted.', 57),
  (6, 'Surface Tension',             'A tense finale as the diver confronts the conspirators on the water where it all began.', 61)
) as ep(num, title, descr, dur)
where t.title = 'Deep Vein'
on conflict do nothing;

-- Very Bad Optics — Season 1
insert into public.seasons (id, title_id, number)
select gen_random_uuid(), t.id, 1
from public.titles t where t.title = 'Very Bad Optics'
on conflict do nothing;

insert into public.episodes (season_id, title_id, number, title, description, duration_mins)
select s.id, t.id, ep.num, ep.title, ep.descr, ep.dur
from public.seasons s
join public.titles t on t.id = s.title_id
cross join (values
  (1, 'The Tweet',           'A single misread post sends the firm into full crisis mode — for themselves.', 28),
  (2, 'Spinning Plates',     'The partners attempt five different strategies in one day. None of them work.', 31),
  (3, 'No Comment',          'A journalist shows up at the office and refuses to leave. The intern accidentally goes viral.', 29),
  (4, 'Damage Control',      'The team hires an outside consultant who is somehow worse at PR than they are.', 30),
  (5, 'The Apology Tour',    'A national apology tour is arranged. Logistics immediately spiral out of control.', 32),
  (6, 'Good Press',          'Against all odds, the firm stumbles into genuinely positive coverage — then ruins it.', 33)
) as ep(num, title, descr, dur)
where t.title = 'Very Bad Optics'
on conflict do nothing;

-- Pale House — Season 1
insert into public.seasons (id, title_id, number)
select gen_random_uuid(), t.id, 1
from public.titles t where t.title = 'Pale House'
on conflict do nothing;

insert into public.episodes (season_id, title_id, number, title, description, duration_mins)
select s.id, t.id, ep.num, ep.title, ep.descr, ep.dur
from public.seasons s
join public.titles t on t.id = s.title_id
cross join (values
  (1, 'Moving In',           'The Calloway family arrive at their Victorian estate. The first night does not go as planned.', 47),
  (2, 'Settlement',          'Strange sounds in the walls. The youngest child begins talking to someone the parents cannot see.', 44),
  (3, 'The East Wing',       'A locked room is finally opened. What is inside changes the family''s understanding of the house.', 51),
  (4, 'Rot',                 'The restoration contractor refuses to return. The family begins to understand why.', 49),
  (5, 'Threshold',           'The parents disagree about whether to leave. The house appears to be listening.', 52),
  (6, 'What Remains',        'A confrontation with the estate''s history reveals who — or what — has been waiting for them.', 58)
) as ep(num, title, descr, dur)
where t.title = 'Pale House'
on conflict do nothing;

-- ── RLS Policies (Just in case they weren't enabled) ─────────
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'seasons' and policyname = 'Seasons are viewable by everyone') then
    create policy "Seasons are viewable by everyone" on public.seasons for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'episodes' and policyname = 'Episodes are viewable by everyone') then
    create policy "Episodes are viewable by everyone" on public.episodes for select using (true);
  end if;
end $$;


