# Changes Made

## Supabase Storage / HLS

- Confirmed `videos` is the bucket name.
- Updated database `storage_path` to be relative to the bucket:
  - `movies/dragon-ball-super-broly/hls/720p/index.m3u8`
  - not `videos/movies/...`
- Converted `.mkv` to HLS using FFmpeg.
- Used fast remuxing with `-c copy` because the file was already:
  - video: H.264
  - audio: AAC
- Uploaded HLS files into:
  - `movies/dragon-ball-super-broly/hls/720p/`

## Database

- Added a `titles` row for Dragon Ball Super: Broly.
- Added a `video_assets` row linked to that title.
- Set `quality` to `720p`.
- Kept `created_at` and `id` auto-generated.
- Adjusted watch progress indexing for movies/episodes:
  - movie progress where `episode_id is null`
  - episode progress where `episode_id is not null`

## Supabase Auth / Server Client

- Updated `createSupabaseServerClient()` to use async `cookies()`.
- Updated all server-side calls from:
  - `getSession()`
- to:
  - `getUser()`
- Updated all usages of:
  - `session.user.id`
  - `session.user.email`
- to:
  - `user.id`
  - `user.email`
- Added `await createSupabaseServerClient()` everywhere needed.

## Middleware

- Switched middleware to `getAll()` / `setAll()` cookie handling.
- Changed auth check to:
  - `supabase.auth.getUser()`
- Improved protected route matching so `/watch/...` is protected but unrelated paths are not.

## Edge Function

- Replaced old `get-signed-url` behavior.
- Old version returned only:
  - signed `index.m3u8` URL
- New version returns:
  - rewritten playlist text
  - signed URLs for every HLS segment
- Added better error responses for:
  - missing env vars
  - missing asset
  - playlist download failure
  - segment signing failure
- Set/used:
  - `SUPABASE_SECRET_KEY`

## Video Player

- Updated player to call the Edge Function with:
  - `Authorization: Bearer <access_token>`
- Changed player to expect:
  - `{ playlist: "..." }`
- Converted playlist text into a Blob URL.
- Loaded Blob URL into `hls.js`.
- Added cleanup with `URL.revokeObjectURL`.
- Fixed HLS cleanup with `hls.destroy()`.
- Improved event listener cleanup.
- Added safer `play().catch(...)`.

## UI / React Fixes

- Fixed `HeroBannerClient` hook crash by changing:
  - `next/dist/compiled/react`
- to:
  - `react`
- Fixed nested `<a>` hydration error in `MovieCard`.
- Changed poster link and action links to be siblings, not nested anchors.
- Added safer optional access for arrays like:
  - `title.tags ?? []`
  - `title.genre?.[0]`

## Next.js 15 Fixes

- Updated dynamic route params in:
  - `src/app/(protected)/watch/[asset_id]/page.tsx`
- Changed `params` type to a Promise.
- Replaced direct `params.asset_id` access with:
  - `const { asset_id } = await params`