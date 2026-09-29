// ========================================================
// VALDORA UNIVERSE - DISCORD AUTO-SYNC GALLERY SERVICE
// Sinkronisasi otomatis screenshot komunitas dari channel #gallery
// ========================================================

let cachedGallery = {
  items: [],
  timestamp: 0
}

const CACHE_TTL_MS = 25 * 1000 // Cache 25 detik agar foto baru Discord cepat tampil
const MIN_DISCORD_INTERVAL_MS = 8 * 1000 // Batas aman 8 detik antar panggilan Discord API
let lastDiscordFetchTime = 0

export function getGalleryCacheTimestamp() {
  return cachedGallery.timestamp
}

export async function getGalleryPhotos(forceRefresh = false) {
  const now = Date.now()

  // Gunakan cache jika belum expired (< 25s) atau jika forceRefresh dipanggil terlalu cepat (< 8s)
  if (!forceRefresh && cachedGallery.items.length > 0 && (now - cachedGallery.timestamp < CACHE_TTL_MS)) {
    return cachedGallery.items
  }

  if (forceRefresh && cachedGallery.items.length > 0 && (now - lastDiscordFetchTime < MIN_DISCORD_INTERVAL_MS)) {
    return cachedGallery.items
  }

  const token = process.env.DISCORD_BOT_TOKEN
  const guildId = process.env.DISCORD_GUILD_ID || '1541267151631941784'
  const parentId = process.env.DISCORD_GALLERY_CHANNEL_ID || '1541372010192437302'

  if (!token) {
    console.warn('[Gallery] DISCORD_BOT_TOKEN belum diset.')
    return cachedGallery.items
  }

  try {
    lastDiscordFetchTime = now
    // 1. Ambil daftar thread aktif di server Discord
    const threadRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/threads/active`, {
      headers: { Authorization: `Bot ${token}` }
    })

    if (!threadRes.ok) {
      throw new Error(`Discord API error: ${threadRes.status} ${threadRes.statusText}`)
    }

    const threadData = await threadRes.json()
    const galleryThreads = (threadData.threads || []).filter(t => String(t.parent_id) === String(parentId))

    // 2. Fetch lampiran gambar dari tiap thread secara concurrent
    const threadPromises = galleryThreads.slice(0, 20).map(async (thread) => {
      try {
        const msgRes = await fetch(`https://discord.com/api/v10/channels/${thread.id}/messages?limit=3`, {
          headers: { Authorization: `Bot ${token}` }
        })
        if (!msgRes.ok) return []
        const msgs = await msgRes.json()

        const photos = []
        for (const msg of msgs) {
          const authorName = msg.author?.global_name || msg.author?.username || 'Petualang Valdora'
          const authorAvatar = msg.author?.avatar 
            ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
            : null

          for (const att of (msg.attachments || [])) {
            const isImage = att.content_type?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(att.filename)
            if (isImage) {
              photos.push({
                id: att.id,
                threadId: thread.id,
                title: thread.name || 'Momen Petualangan',
                author: authorName,
                username: msg.author?.username || 'member',
                avatar: authorAvatar,
                caption: msg.content?.trim() || thread.name,
                url: att.url,
                proxyUrl: att.proxy_url || att.url,
                width: att.width,
                height: att.height,
                createdAt: msg.timestamp || thread.thread_metadata?.create_timestamp || new Date().toISOString()
              })
            }
          }
        }
        return photos
      } catch (err) {
        console.warn(`[Gallery] Gagal memuat thread ${thread.id}:`, err.message)
        return []
      }
    })

    const results = await Promise.all(threadPromises)
    const allPhotos = results.flat()

    // Urutkan dari yang paling baru
    allPhotos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    if (allPhotos.length > 0) {
      cachedGallery = {
        items: allPhotos,
        timestamp: now
      }
      console.log(`[Gallery] ✓ Berhasil menyinkronkan ${allPhotos.length} foto dari Discord #gallery`)
    }

    return cachedGallery.items.length > 0 ? cachedGallery.items : allPhotos
  } catch (err) {
    console.error('[Gallery] Sinkronisasi Discord gagal:', err.message)
    // Fallback ke cache sebelumnya jika ada
    return cachedGallery.items
  }
}
