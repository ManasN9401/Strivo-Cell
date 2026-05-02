# CINEMA — Streaming Platform

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%7C%20Storage%20%7C%20Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel" />
  <img alt="License" src="https://img.shields.io/badge/license-All%20Rights%20Reserved-red?style=flat-square" />
</p>

A full-stack Netflix-style streaming platform built with **Next.js 15**, Supabase, and Tailwind CSS.

## Features

- **Secure HLS playback** — Private adaptive streaming through Supabase Edge Functions and signed Storage URLs
- **Authentication** — Supabase Auth with protected routes and session-aware server rendering
- **My List** — Persistent watchlist with optimistic UI updates
- **Continue Watching** — Watch progress saved across sessions
- **Watch Parties** — Realtime synchronized playback using Supabase Realtime
- **Party Chat** — Live chat and emoji reactions during watch parties
- **Search** — Live title search
- **Responsive UI** — Mobile-first interface styled with Tailwind CSS

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
supabase secrets set SUPABASE_PUBLISHABLE_KEY=your-publishable-key
supabase secrets set SUPABASE_SECRET_KEY=your-secret-key
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
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
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
7. Host broadcasts a `SYNC` ping every 10 seconds; guests correct drift when needed

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
