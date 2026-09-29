// ========================================================
// VALDORA UNIVERSE - DISCORD AUTO-SYNC MEDIA & LIVE SERVICE
// Sinkronisasi otomatis konten live stream & video dari channel #share-media
// ========================================================

let cachedMedia = {
  items: [],
  timestamp: 0
}

const CACHE_TTL_MS = 25 * 1000 // Cache 25 detik agar feed baru Discord cepat tampil
const MIN_DISCORD_INTERVAL_MS = 8 * 1000 // Batas aman 8 detik antar panggilan Discord API
let lastDiscordFetchTime = 0

export function getMediaCacheTimestamp() {
  return cachedMedia.timestamp
}

/**
 * Parsing satu pesan Discord dari channel #share-media menjadi objek media terstruktur
 */
function parseMediaMessage(msg) {
  const content = msg.content || ''
  const embeds = Array.isArray(msg.embeds) ? msg.embeds : []
  const embed = embeds[0] || null

  // Cari tautan URL dari konten pesan atau embed
  const urlRegex = /(https?:\/\/[^\s]+)/i
  const match = content.match(urlRegex) || (embed && embed.url ? [embed.url] : null)
  const rawUrl = match ? match[0] : ''

  let platform = 'other'
  let isLive = false
  let youtubeId = null
  let embedUrl = null
  let thumbnail = embed?.thumbnail?.proxy_url || embed?.thumbnail?.url || null
  let title = embed?.title || 'Konten Petualang Valdora'
  let description = embed?.description || ''

  // Deteksi Platform & Metadata
  if (/youtube\.com|youtu\.be/i.test(rawUrl)) {
    platform = 'youtube'
    const ytLiveMatch = rawUrl.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/i)
    const ytWatchMatch = rawUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/i)
    const ytShortMatch = rawUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i)
    youtubeId = (ytLiveMatch && ytLiveMatch[1]) || (ytWatchMatch && ytWatchMatch[1]) || (ytShortMatch && ytShortMatch[1]) || null

    if (ytLiveMatch || /live/i.test(rawUrl) || /live/i.test(title)) {
      isLive = true
    }

    if (youtubeId) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`
      if (!thumbnail) {
        thumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      }
    }
  } else if (/tiktok\.com/i.test(rawUrl)) {
    platform = 'tiktok'
    if (/live/i.test(rawUrl) || /live/i.test(title) || /live/i.test(description)) {
      isLive = true
    }
  } else if (/twitch\.tv/i.test(rawUrl)) {
    platform = 'twitch'
    isLive = true
    const twitchUserMatch = rawUrl.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i)
    if (twitchUserMatch && twitchUserMatch[1]) {
      embedUrl = `https://player.twitch.tv/?channel=${twitchUserMatch[1]}&parent=localhost&muted=true`
    }
  } else if (/kick\.com/i.test(rawUrl)) {
    platform = 'kick'
    isLive = true
  }

  // Jika ada lampiran langsung (misal video file atau screenshot)
  const attachments = Array.isArray(msg.attachments) ? msg.attachments : []
  const firstAttachment = attachments[0] || null
  if (!thumbnail && firstAttachment && (firstAttachment.content_type?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(firstAttachment.filename))) {
    thumbnail = firstAttachment.proxy_url || firstAttachment.url
  }

  const authorName = msg.author?.global_name || msg.author?.username || 'Petualang Valdora'
  const authorAvatar = msg.author?.avatar 
    ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
    : null

  return {
    id: msg.id,
    author: authorName,
    username: msg.author?.username || 'member',
    avatar: authorAvatar,
    content: msg.content?.trim() || '',
    rawUrl,
    platform,
    isLive,
    youtubeId,
    embedUrl,
    thumbnail,
    title: title.trim(),
    description: description.trim(),
    timestamp: msg.timestamp || new Date().toISOString()
  }
}

/**
 * Mengambil daftar postingan media dari Discord channel #share-media
 */
export async function getMediaPosts(forceRefresh = false) {
  const now = Date.now()

  // Gunakan cache jika belum expired (< 25s) atau jika forceRefresh dipanggil terlalu cepat (< 8s)
  if (!forceRefresh && cachedMedia.items.length > 0 && (now - cachedMedia.timestamp < CACHE_TTL_MS)) {
    return cachedMedia.items
  }

  if (forceRefresh && cachedMedia.items.length > 0 && (now - lastDiscordFetchTime < MIN_DISCORD_INTERVAL_MS)) {
    return cachedMedia.items
  }

  const token = process.env.DISCORD_BOT_TOKEN
  const channelId = process.env.DISCORD_MEDIA_CHANNEL_ID || '1541267152718266517'

  if (!token) {
    console.warn('[MediaSync] DISCORD_BOT_TOKEN belum diset.')
    return cachedMedia.items
  }

  try {
    lastDiscordFetchTime = now

    // Ambil 35 pesan terbaru dari channel #share-media
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=35`, {
      headers: { Authorization: `Bot ${token}` }
    })

    if (!res.ok) {
      throw new Error(`Discord API error: ${res.status} ${res.statusText}`)
    }

    const messages = await res.json()
    if (!Array.isArray(messages)) {
      throw new Error('Format balasan Discord tidak valid.')
    }

    const parsedItems = messages
      .map(parseMediaMessage)
      .filter(item => Boolean(item.rawUrl || item.thumbnail)) // Hanya tampilkan pesan yang memiliki link atau media

    if (parsedItems.length > 0) {
      cachedMedia = {
        items: parsedItems,
        timestamp: now
      }
      console.log(`[MediaSync] Berhasil menyinkronkan ${parsedItems.length} media/live stream dari Discord #share-media`)
    }

    return cachedMedia.items.length > 0 ? cachedMedia.items : parsedItems
  } catch (err) {
    console.error('[MediaSync] Sinkronisasi Discord share-media gagal:', err.message)
    return cachedMedia.items
  }
}
