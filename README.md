# CINEMA — Streaming Platform

A full-stack Netflix-style streaming platform built with Next.js 15, Supabase, and Tailwind CSS.

## Features

- 🎬 **HLS video playback** — Secure streaming via signed URLs
- 🔐 **Authentication** — Supabase Auth with protected routes
- 📚 **My List** — Persistent watchlist with optimistic UI
- ▶️ **Continue Watching** — Progress tracking across sessions
- 🎉 **Watch Parties** — Real-time sync via Supabase Realtime
- 🔍 **Search** — Live title search
- 📱 **Responsive** — Mobile-first design

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 15 (App Router), TypeScript |
| Styling    | Tailwind CSS ("Obsidian Cobalt")    |
| Backend    | Supabase (PostgreSQL + Auth)        |
| Storage    | Supabase Storage (HLS + images)     |
| Realtime   | Supabase Realtime (Watch Parties)   |
| Video      | HLS.js                              |
| Hosting    | Vercel                              |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/cinema.git
cd cinema
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in your values from Supabase Dashboard → Project Settings → API.

### 4. Run the database schema + seed data

In Supabase → SQL Editor, paste and run the contents of:

```
supabase/seed.sql
```

This creates all tables, RLS policies, indexes, and seeds 20 mock titles.

### 5. Create storage buckets

In Supabase → Storage:

- Create bucket `images` → **Public: ON**
- Create bucket `videos` → **Public: OFF**

### 6. Deploy the Edge Function

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy get-signed-url --no-verify-jwt
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your Vercel URL)
4. Deploy

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup (public)
│   ├── (protected)/      # Library, watch, settings, party (auth required)
│   ├── browse/           # Genre browsing
│   ├── titles/[id]/      # Title detail page
│   └── api/search/       # Search API route
├── components/           # All UI components
├── lib/
│   ├── supabase/         # Client, server, queries, realtime
│   └── actions/          # Server Actions (auth, watchlist, progress, party)
└── types/                # Shared TypeScript types
supabase/
├── functions/
│   └── get-signed-url/   # Edge Function — issues HLS signed URLs
└── seed.sql              # Schema + 20 mock titles
```

---

## Watch Party Flow

1. User opens a title → clicks **◈ Watch Party** (or goes to `/party/new`)
2. Server creates a room and redirects host to `/party/[room_id]`
3. Host copies invite link and shares it
4. Guests navigate to the link, join the Realtime presence channel
5. Host presses play → `PLAY` event broadcasts to all guests
6. Guests apply events with latency compensation
7. Host broadcasts a `SYNC` ping every 5 seconds; guests correct drift > 2s

---

## Adding Real Video Content

Replace the placeholder `storage_path` values in `video_assets` with real paths:

```
videos/
  ironclad-protocol/
    master.m3u8       ← HLS manifest
    segment_000.ts
    segment_001.ts
    ...
```

Upload HLS segments to the `videos` Supabase Storage bucket (private). The Edge Function generates signed URLs for the manifest on demand.
