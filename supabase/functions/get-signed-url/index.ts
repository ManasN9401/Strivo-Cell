import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

type AdminClient = SupabaseClient<any, 'public', any>

type VideoAsset = {
  storage_path: string
  quality: string
}

const BUCKET = 'videos'
const EXPIRY = 3600

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

function playlistResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-store',
    },
  })
}

function normalizeObjectPath(path: string) {
  const parts: string[] = []

  for (const part of path.split('/')) {
    if (!part || part === '.') continue

    if (part === '..') {
      parts.pop()
    } else {
      parts.push(part)
    }
  }

  return parts.join('/')
}

function getDirectory(path: string) {
  const idx = path.lastIndexOf('/')
  return idx === -1 ? '' : path.slice(0, idx)
}

function joinPath(baseDir: string, relativePath: string) {
  if (/^https?:\/\//i.test(relativePath)) return relativePath
  if (!baseDir) return normalizeObjectPath(relativePath)

  return normalizeObjectPath(`${baseDir}/${relativePath}`)
}

function isPlaylistPath(path: string) {
  return path.toLowerCase().endsWith('.m3u8')
}

function isAbsoluteUrl(path: string) {
  return /^https?:\/\//i.test(path)
}

function makeFunctionPlaylistUrl(titleId: string, quality: string, playlistPath: string) {
  const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')?.replace(/\/+$/, '')

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  const url = new URL(`${supabaseUrl}/functions/v1/get-signed-url/`)

  url.searchParams.set('title_id', titleId)
  url.searchParams.set('quality', quality)
  url.searchParams.set('path', playlistPath)

  return url.toString()
}

function getRelativeUriFromLine(line: string) {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#')) return null
  if (isAbsoluteUrl(trimmed)) return null

  return trimmed
}

function getUriAttributes(line: string) {
  const matches = [...line.matchAll(/URI="([^"]+)"/g)]
  return matches.map((match) => match[1]).filter(Boolean)
}

async function getSignedUrlMap(admin: AdminClient, paths: string[]) {
  const uniquePaths = Array.from(new Set(paths))

  if (uniquePaths.length === 0) {
    return new Map<string, string>()
  }

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(uniquePaths, EXPIRY)

  if (error || !data) {
    throw new Error(`Could not sign media files: ${error?.message ?? 'unknown error'}`)
  }

  const map = new Map<string, string>()

  for (const item of data) {
    if (item.path && item.signedUrl) {
      map.set(item.path, item.signedUrl)
    }
  }

  return map
}

async function rewritePlaylist({
  admin,
  titleId,
  quality,
  playlistPath,
  playlistText,
}: {
  admin: AdminClient
  titleId: string
  quality: string
  playlistPath: string
  playlistText: string
}) {
  const baseDir = getDirectory(playlistPath)
  const lines = playlistText.split(/\r?\n/)

  const mediaPathsToSign: string[] = []
  let playlistRefCount = 0

  for (const line of lines) {
    const relativeUri = getRelativeUriFromLine(line)

    if (relativeUri) {
      const objectPath = joinPath(baseDir, relativeUri)

      if (isPlaylistPath(objectPath)) {
        playlistRefCount += 1
      } else {
        mediaPathsToSign.push(objectPath)
      }
    }

    for (const uri of getUriAttributes(line)) {
      if (isAbsoluteUrl(uri)) continue

      const objectPath = joinPath(baseDir, uri)

      if (isPlaylistPath(objectPath)) {
        playlistRefCount += 1
      } else {
        mediaPathsToSign.push(objectPath)
      }
    }
  }

  const signedUrlByPath = await getSignedUrlMap(admin, mediaPathsToSign)

  const rewrittenLines = lines.map((line) => {
    const relativeUri = getRelativeUriFromLine(line)

    if (relativeUri) {
      const objectPath = joinPath(baseDir, relativeUri)

      if (isPlaylistPath(objectPath)) {
        return makeFunctionPlaylistUrl(titleId, quality, objectPath)
      }

      const signedUrl = signedUrlByPath.get(objectPath)

      if (!signedUrl) {
        throw new Error(`Missing signed URL for media file: ${objectPath}`)
      }

      return signedUrl
    }

    if (line.includes('URI="')) {
      return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
        if (isAbsoluteUrl(uri)) return `URI="${uri}"`

        const objectPath = joinPath(baseDir, uri)

        if (isPlaylistPath(objectPath)) {
          return `URI="${makeFunctionPlaylistUrl(titleId, quality, objectPath)}"`
        }

        const signedUrl = signedUrlByPath.get(objectPath)

        if (!signedUrl) {
          throw new Error(`Missing signed URL for URI attribute: ${objectPath}`)
        }

        return `URI="${signedUrl}"`
      })
    }

    return line
  })

  return {
    playlist: rewrittenLines.join('\n'),
    signedMediaCount: Array.from(new Set(mediaPathsToSign)).length,
    playlistRefCount,
  }
}

async function getAuthedClients(
  req: Request
): Promise<{ admin: AdminClient; errorResponse?: never } | { admin?: never; errorResponse: Response }> {
  const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')
  const publishableKey = Deno.env.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  const secretKey = Deno.env.get('NEXT_SUPABASE_SECRET_KEY')

  if (!supabaseUrl || !publishableKey || !secretKey) {
    return {
      errorResponse: json(
        {
          error: 'Missing Edge Function environment variables',
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasPublishableKey: Boolean(publishableKey),
          hasSecretKey: Boolean(secretKey),
        },
        500
      ),
    }
  }

  const authHeader = req.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { errorResponse: json({ error: 'Unauthorized' }, 401) }
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })

  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser()

  if (authErr || !user) {
    return { errorResponse: json({ error: 'Unauthorized' }, 401) }
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as AdminClient

  return { admin }
}

async function getAsset(
  admin: AdminClient,
  titleId: string,
  quality: string
): Promise<VideoAsset | null> {
  const { data: asset, error } = await admin
    .from('video_assets')
    .select('storage_path, quality')
    .eq('title_id', titleId)
    .eq('quality', quality)
    .maybeSingle()

  if (error) {
    throw new Error(`Asset query failed: ${error.message}`)
  }

  return asset as VideoAsset | null
}

async function downloadPlaylist(admin: AdminClient, path: string) {
  const { data, error } = await admin.storage.from(BUCKET).download(path)

  if (error || !data) {
    throw new Error(`Could not download playlist: ${error?.message ?? path}`)
  }

  const text = await data.text()

  if (!text.includes('#EXTM3U')) {
    throw new Error(`Downloaded file is not a valid m3u8 playlist: ${path}`)
  }

  return text
}

async function handlePlaylistRequest(
  req: Request,
  titleId: string,
  quality: string,
  requestedPath?: string
) {
  const { admin, errorResponse } = await getAuthedClients(req)

  if (errorResponse) return errorResponse

  const asset = await getAsset(admin, titleId, quality)

  if (!asset?.storage_path) {
    return json({ error: 'Asset not found' }, 404)
  }

  const rootPath = normalizeObjectPath(asset.storage_path)
  const rootDir = getDirectory(rootPath)
  const playlistPath = requestedPath ? normalizeObjectPath(requestedPath) : rootPath

  if (!isPlaylistPath(playlistPath)) {
    return json({ error: 'Requested path is not a playlist' }, 400)
  }

  if (playlistPath !== rootPath && !playlistPath.startsWith(`${rootDir}/`)) {
    return json(
      {
        error: 'Requested playlist is outside asset HLS folder',
        rootPath,
        rootDir,
        playlistPath,
      },
      403
    )
  }

  const playlistText = await downloadPlaylist(admin, playlistPath)

  const rewritten = await rewritePlaylist({
    admin,
    titleId,
    quality,
    playlistPath,
    playlistText,
  })

  return {
    rootPath,
    playlistPath,
    ...rewritten,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url)

      const titleId = url.searchParams.get('title_id')
      const quality = url.searchParams.get('quality') ?? '720p'
      const path = url.searchParams.get('path') ?? undefined

      if (!titleId) {
        return json({ error: 'title_id required' }, 400)
      }

      const result = await handlePlaylistRequest(req, titleId, quality, path)

      if (result instanceof Response) return result

      return playlistResponse(result.playlist)
    }

    if (req.method === 'POST') {
      const { title_id, quality = '720p' } = await req.json()

      if (!title_id || typeof title_id !== 'string') {
        return json({ error: 'title_id required' }, 400)
      }

      const result = await handlePlaylistRequest(req, title_id, quality)

      if (result instanceof Response) return result

      return json({
        playlist: result.playlist,
        expires_in: EXPIRY,
        storage_path: result.playlistPath,
        signed_segments: result.signedMediaCount,
        playlist_refs: result.playlistRefCount,
      })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error(err)

    return json(
      {
        error: 'Internal server error',
        details: err instanceof Error ? err.message : String(err),
      },
      500
    )
  }
})