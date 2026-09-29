import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()
import { authenticatePlayer, verifyToken } from './auth.js'
import { getPlayerByUsername, getPublicPlayerProfile, getPlayersDirectory, getBaltopLeaderboard, withAuthMeDb, getPlayerSkinInfo, getStaffTeam } from './db.js'
import { syncLiveServerFiles, SFTP_CONFIG, getSyncStatus, initAutoSync } from './sftpSync.js'
import { getGalleryPhotos, getGalleryCacheTimestamp } from './gallery.js'
import { getMediaPosts, getMediaCacheTimestamp } from './mediaSync.js'

export { initAutoSync }

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'valdora_admin_sys_2026_top_secret'

let cachedServerStatus = null
let lastStatusFetchTime = 0
const STATUS_CACHE_MS = 10000 // 10 detik cache

// Rate Limiter API Publik (Anti-Scraping / Anti-Flooding)
const publicApiLimits = new Map()

// Pembersihan rutin memori rate limit setiap 10 menit
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of publicApiLimits.entries()) {
    if (now > record.resetTime) {
      publicApiLimits.delete(ip)
    }
  }
}, 10 * 60 * 1000)

function checkPublicApiRateLimit(ip) {
  const now = Date.now()
  const cleanIp = String(ip || '127.0.0.1').trim().slice(0, 45)
  const windowMs = 60 * 1000 // 1 menit
  const maxRequests = 120 // Maks 120 request per menit per IP

  const record = publicApiLimits.get(cleanIp) || { count: 0, resetTime: now + windowMs }
  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + windowMs
    publicApiLimits.set(cleanIp, record)
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count += 1
  publicApiLimits.set(cleanIp, record)
  return true
}

/**
 * Verifikasi Otorisasi Administrator menggunakan timing-safe comparison
 */
function verifyAdminAuth(req) {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  const urlObj = new URL(req.originalUrl || req.url, 'http://localhost')
  const queryKey = urlObj.searchParams.get('adminKey') || urlObj.searchParams.get('key')

  const candidate = String(token || queryKey || '').trim()
  if (!candidate || candidate.length !== ADMIN_SECRET.length) {
    return false
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(candidate, 'utf8'), Buffer.from(ADMIN_SECRET, 'utf8'))
  } catch {
    return false
  }
}

async function fetchMinecraftServerStatus() {
  const serverAddress = process.env.MC_SERVER_ADDRESS || 'game-gnl-jh3.raznar.net:25071'

  // 1. Coba baca live_status.json lokal yang di-generate real-time oleh Skript
  const liveCandidates = [
    path.resolve('live_status.json'),
    path.resolve('web', 'live_status.json'),
    '/home/container/web/live_status.json'
  ]
  for (const lPath of liveCandidates) {
    if (fs.existsSync(lPath)) {
      try {
        const raw = fs.readFileSync(lPath, 'utf8')
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.playersOnline === 'number') {
          return {
            ...parsed,
            hostname: serverAddress,
            updatedAt: Date.now()
          }
        }
      } catch {}
    }
  }

  const now = Date.now()
  if (cachedServerStatus && (now - lastStatusFetchTime) < STATUS_CACHE_MS) {
    return cachedServerStatus
  }
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(serverAddress)}`, {
      headers: { 'User-Agent': 'ValdoraUniverse-Web/1.0' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const rawList = data.players?.list || []
    const enrichedList = rawList.map(p => {
      const name = typeof p === 'string' ? p : p.name
      const uuid = typeof p === 'string' ? null : p.uuid
      const skin = getPlayerSkinInfo(uuid, name)
      return {
        name,
        uuid,
        avatarUrl: skin.textureHash
          ? `https://mc-heads.net/avatar/${skin.textureHash}/24`
          : `https://mc-heads.net/avatar/${encodeURIComponent(name)}/24`
      }
    })
    cachedServerStatus = {
      online: Boolean(data.online),
      playersOnline: data.players?.online || 0,
      playersMax: data.players?.max || 100,
      playerList: enrichedList,
      version: data.version || '1.21.x',
      motd: data.motd?.clean ? data.motd.clean.join(' ') : 'VALDORA [1.21.X]',
      hostname: serverAddress,
      updatedAt: now
    }
    lastStatusFetchTime = now
    return cachedServerStatus
  } catch (err) {
    if (cachedServerStatus) return cachedServerStatus
    return {
      online: false,
      playersOnline: 0,
      playersMax: 100,
      playerList: [],
      version: '1.21.x',
      motd: 'VALDORA [1.21.X]',
      hostname: serverAddress,
      updatedAt: now,
      error: 'Status server offline atau sedang memuat.'
    }
  }
}

/**
 * Middleware untuk menangani request API /api/...
 * Kompatibel dengan Vite configureServer dan Express server.
 * Terproteksi dari DDoS, SQL Injection, ReDoS, Information Leak, dan Path Traversal.
 */
export async function handleApiRequest(req, res, next) {
  const url = (req.originalUrl || req.url).split('?')[0]

  // Hanya proses rute /api/
  if (!url.startsWith('/api/')) {
    return next ? next() : null
  }

  // Helper mengirimkan respon JSON dengan Header Keamanan Lengkap
  const sendJson = (statusCode, data) => {
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()')
    res.end(JSON.stringify(data))
  }

  // Dapatkan client IP yang aman
  const rawFwd = req.headers['x-forwarded-for']
  const clientIp = (typeof rawFwd === 'string' ? rawFwd.split(',')[0].trim() : req.socket?.remoteAddress || '127.0.0.1').slice(0, 45)

  // Batasi kecepatan request publik
  if (!checkPublicApiRateLimit(clientIp)) {
    return sendJson(429, {
      success: false,
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak permintaan API. Mohon perlambat laju akses Anda.'
    })
  }

  // Parse JSON helper dengan batas ukuran payload (Maks 16KB anti-DoS)
  const parseJsonBody = () => {
    if (req.body && typeof req.body === 'object') {
      return Promise.resolve(req.body)
    }
    if (req.readableEnded) {
      return Promise.resolve(req.body || {})
    }
    return new Promise((resolve, reject) => {
      const MAX_BYTES = 16 * 1024 // 16 KB
      let totalBytes = 0
      let body = ''

      const contentLength = parseInt(req.headers['content-length'] || '0', 10)
      if (contentLength > MAX_BYTES) {
        return reject(new Error('PAYLOAD_TOO_LARGE'))
      }

      req.on('data', chunk => {
        totalBytes += chunk.length
        if (totalBytes > MAX_BYTES) {
          req.destroy()
          return reject(new Error('PAYLOAD_TOO_LARGE'))
        }
        body += chunk
      })

      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {})
        } catch {
          resolve({})
        }
      })

      req.on('error', err => reject(err))
    })
  }

  // RUTE: POST /api/auth/login
  if (req.method === 'POST' && url === '/api/auth/login') {
    parseJsonBody().then(async (body) => {
      try {
        const { username, password } = body || {}
        const result = await authenticatePlayer(username, password, clientIp)
        if (!result.success) {
          const status = result.code === 'RATE_LIMITED' ? 429 : (result.code === 'NOT_FOUND' ? 404 : 401)
          return sendJson(status, result)
        }
        return sendJson(200, result)
      } catch (err) {
        console.error('[API Login Internal Error]:', err)
        return sendJson(500, { success: false, message: 'Terjadi kesalahan sistem saat otentikasi akun.' })
      }
    }).catch(err => {
      if (err.message === 'PAYLOAD_TOO_LARGE') {
        return sendJson(413, { success: false, message: 'Ukuran data permintaan melebihi batas 16KB.' })
      }
      return sendJson(400, { success: false, message: 'Format data JSON login tidak valid.' })
    })
    return
  }

  // RUTE: GET /api/player/me (Profil pemain yang sedang login via Bearer JWT)
  if (req.method === 'GET' && url === '/api/player/me') {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

    const decoded = verifyToken(token)
    if (!decoded || !decoded.username) {
      return sendJson(401, { success: false, message: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.' })
    }

    getPlayerByUsername(decoded.username).then(player => {
      if (!player) {
        return sendJson(404, { success: false, message: 'Data pemain tidak ditemukan di server.' })
      }

      sendJson(200, {
        success: true,
        profile: {
          username: player.last_name,
          uuid: player.unique_id,
          premium: Boolean(player.premium),
          lastSeen: player.last_seen,
          race: player.race,
          battlePass: player.battlePass,
          stats: player.stats || {
            combat: 10,
            mining: 15,
            foraging: 8,
            farming: 12,
            agility: 10
          },
          avatarUrl: player.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(player.last_name)}/128`,
          bodyUrl: player.bodyUrl || `https://mc-heads.net/body/${encodeURIComponent(player.last_name)}/280`,
          skinInfo: player.skinInfo || null,
          isRealDb: player.isRealDb
        }
      })
    }).catch(err => {
      console.error('[API Player Me Error]:', err)
      sendJson(500, { success: false, message: 'Terjadi gangguan saat mengambil data profil.' })
    })
    return
  }

  // RUTE: GET /api/player/profile?username=... (Profil publik siapapun tanpa auth)
  if (req.method === 'GET' && url === '/api/player/profile') {
    const rawUrl = req.originalUrl || req.url || ''
    const query = new URL(rawUrl, 'http://localhost').searchParams
    const username = query.get('username') || query.get('u')
    if (!username || typeof username !== 'string') {
      return sendJson(400, { success: false, message: 'Parameter username diperlukan.' })
    }
    const cleanUser = username.trim()
    if (!/^\.?[a-zA-Z0-9_-]{1,36}$/.test(cleanUser)) {
      return sendJson(400, { success: false, message: 'Format username atau UUID tidak valid.' })
    }

    getPublicPlayerProfile(cleanUser).then(profile => {
      if (!profile) {
        return sendJson(404, { success: false, message: 'Karakter pemain tidak ditemukan di server.' })
      }
      sendJson(200, { success: true, profile })
    }).catch(err => {
      console.error('[API Public Profile Error]:', err)
      sendJson(500, { success: false, message: 'Terjadi gangguan saat memuat profil publik.' })
    })
    return
  }

  // RUTE: GET /api/player/avatar/:username (Resolver avatar skin: SkinsRestorer cracked maupun Mojang)
  const avatarMatch = url.match(/^\/api\/player\/avatar\/([^\/]+)$/)
  if (req.method === 'GET' && avatarMatch) {
    const rawName = decodeURIComponent(avatarMatch[1] || '').trim()
    const rawUrl = req.originalUrl || req.url || ''
    const query = new URL(rawUrl, 'http://localhost').searchParams
    const size = parseInt(query.get('size') || '48', 10) || 48

    if (!rawName || !/^\.?[a-zA-Z0-9_-]{1,36}$/.test(rawName)) {
      res.statusCode = 302
      res.setHeader('Location', `https://mc-heads.net/avatar/Steve/${size}`)
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.end()
      return
    }

    try {
      const skinInfo = getPlayerSkinInfo(null, rawName)
      const targetUrl = skinInfo?.textureHash
        ? `https://mc-heads.net/avatar/${skinInfo.textureHash}/${size}`
        : `https://mc-heads.net/avatar/${encodeURIComponent(rawName)}/${size}`

      res.statusCode = 302
      res.setHeader('Location', targetUrl)
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.end()
    } catch {
      res.statusCode = 302
      res.setHeader('Location', `https://mc-heads.net/avatar/${encodeURIComponent(rawName)}/${size}`)
      res.end()
    }
    return
  }

  // RUTE: GET /api/staff (Daftar tim pengurus, founder, developer, dan staf Valdora)
  if (req.method === 'GET' && url === '/api/staff') {
    try {
      const staff = getStaffTeam()
      return sendJson(200, { success: true, staff })
    } catch (err) {
      console.error('[API Staff Error]:', err)
      return sendJson(500, { success: false, message: 'Gagal memuat data staf server.' })
    }
  }

  // RUTE: GET /api/players (Direktori pemain dengan filter ras, battlepass, sorting & pagination)
  if (req.method === 'GET' && url === '/api/players') {
    const rawUrl = req.originalUrl || req.url || ''
    const query = new URL(rawUrl, 'http://localhost').searchParams
    const race = query.get('race') || 'all'
    const bp = query.get('bp') || 'all'
    const search = query.get('search') || query.get('q') || ''
    const sort = query.get('sort') || 'tier'
    const page = Number(query.get('page')) || 1
    const limit = Number(query.get('limit')) || 24

    getPlayersDirectory({ race, bp, search, sort, page, limit }).then(data => {
      sendJson(200, { success: true, ...data })
    }).catch(err => {
      console.error('[API Players Directory Error]:', err)
      sendJson(500, { success: false, message: 'Terjadi gangguan saat memuat direktori pemain.' })
    })
    return
  }

  // RUTE: GET /api/baltop (Leaderboard kekayaan pemain / Baltop Runish by Essentials eeco)
  if (req.method === 'GET' && url === '/api/baltop') {
    const rawUrl = req.originalUrl || req.url || ''
    const query = new URL(rawUrl, 'http://localhost').searchParams
    const search = query.get('search') || query.get('q') || ''
    const race = query.get('race') || 'all'
    const page = Number(query.get('page')) || 1
    const limit = Number(query.get('limit')) || 50

    try {
      const data = getBaltopLeaderboard({ limit, page, search, race })
      sendJson(200, { success: true, ...data })
    } catch (err) {
      console.error('[API Baltop Error]:', err)
      sendJson(500, { success: false, message: 'Gagal memuat papan peringkat Baltop.' })
    }
    return
  }

  // RUTE: GET /api/server/status (Status server Minecraft live)
  if (req.method === 'GET' && url === '/api/server/status') {
    fetchMinecraftServerStatus().then(status => {
      sendJson(200, { success: true, status })
    }).catch(err => {
      console.error('[API Status Error]:', err)
      sendJson(500, { success: false, message: 'Gagal memuat status live server.' })
    })
    return
  }

  // ========================================================
  // RUTE ADMINISTRATOR (WAJIB MEMILIKI KUNCI ADMIN OTORISASI)
  // ========================================================

  // RUTE: POST /api/server/sync-ftp
  if (req.method === 'POST' && url === '/api/server/sync-ftp') {
    if (!verifyAdminAuth(req)) {
      return sendJson(403, { success: false, message: 'Akses ditolak: Memerlukan otorisasi administrator.' })
    }
    syncLiveServerFiles().then(result => {
      sendJson(result.success ? 200 : 400, result)
    }).catch(err => {
      sendJson(500, { success: false, error: 'Sinkronisasi gagal.' })
    })
    return
  }

  // RUTE: GET /api/server/sync-ftp
  if (req.method === 'GET' && url === '/api/server/sync-ftp') {
    if (!verifyAdminAuth(req)) {
      return sendJson(403, { success: false, message: 'Akses ditolak: Memerlukan otorisasi administrator.' })
    }
    const rawUrl = req.url || ''
    if (rawUrl.includes('sync=now') || rawUrl.includes('trigger=true')) {
      syncLiveServerFiles().then(result => {
        sendJson(200, { success: result.success, ...getSyncStatus(), result })
      }).catch(err => {
        sendJson(500, { success: false, error: 'Gagal memicu sinkronisasi.', ...getSyncStatus() })
      })
      return
    }
    return sendJson(200, { success: true, ...getSyncStatus() })
  }

  // RUTE: GET /api/server/test-db (Diagnostik aman hanya untuk admin)
  if (req.method === 'GET' && url === '/api/server/test-db') {
    if (!verifyAdminAuth(req)) {
      return sendJson(403, { success: false, message: 'Akses ditolak: Memerlukan otorisasi administrator.' })
    }
    const rawUrl = req.url || ''
    const userQueryMatch = rawUrl.match(/[?&]user=([^&]+)/)
    const searchUser = userQueryMatch ? decodeURIComponent(userQueryMatch[1]).toLowerCase() : null

    let result = {}
    withAuthMeDb(db => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
      let users = []
      let totalCount = 0
      let searchedUser = null
      try {
        const countRow = db.prepare('SELECT count(*) as count FROM authme').get()
        totalCount = countRow ? countRow.count : 0
        // HAPUS PASSWORD / HASH PREFIX - TIDAK BOLEH DIBOCORKAN
        users = db.prepare('SELECT id, username, realname, lastlogin FROM authme ORDER BY id DESC LIMIT 5').all()

        if (searchUser && /^\.?[a-zA-Z0-9_]{1,16}$/.test(searchUser)) {
          searchedUser = db.prepare('SELECT id, username, realname, lastlogin FROM authme WHERE LOWER(username) = ? LIMIT 1').get(searchUser)
        }
      } catch (err) {
        users = 'Terjadi kendala saat membaca data.'
      }
      result = { tables, totalCount, users, searchedUser }
    })
    return sendJson(200, { success: true, result })
  }

  // RUTE: GET /api/server/remote-tree (Pemeriksaan file root hanya untuk admin)
  if (req.method === 'GET' && url === '/api/server/remote-tree') {
    if (!verifyAdminAuth(req)) {
      return sendJson(403, { success: false, message: 'Akses ditolak: Memerlukan otorisasi administrator.' })
    }
    import('ssh2-sftp-client').then(async ({ default: Client }) => {
      const sftp = new Client()
      try {
        await sftp.connect({
          host: SFTP_CONFIG.host,
          port: SFTP_CONFIG.port,
          username: SFTP_CONFIG.user,
          password: SFTP_CONFIG.password,
          readyTimeout: 10000
        })
        const rootList = await sftp.list('/')
        const skriptList = await sftp.list('/plugins/Skript/scripts').catch(() => [])
        await sftp.end()
        return sendJson(200, {
          success: true,
          root: rootList.map(f => ({ name: f.name, type: f.type, size: f.size })),
          skriptScripts: skriptList.map(f => ({ name: f.name, type: f.type, size: f.size }))
        })
      } catch (err) {
        return sendJson(500, { success: false, error: 'Koneksi remote tree gagal.' })
      }
    })
    return
  }

  // RUTE: GET /api/gallery (Sinkronisasi otomatis Discord #gallery)
  if (req.method === 'GET' && url === '/api/gallery') {
    try {
      const fullUrl = req.originalUrl || req.url || ''
      const hasRefreshParam = fullUrl.includes('refresh=1') || fullUrl.includes('refresh=true')
      const photos = await getGalleryPhotos(hasRefreshParam)
      return sendJson(200, {
        success: true,
        count: photos.length,
        photos,
        syncedAt: getGalleryCacheTimestamp() || Date.now()
      })
    } catch (err) {
      return sendJson(500, { success: false, message: 'Gagal memuat galeri Discord.' })
    }
  }

  // RUTE: GET /api/media (Sinkronisasi otomatis Discord #share-media & live streams)
  if (req.method === 'GET' && url === '/api/media') {
    try {
      const fullUrl = req.originalUrl || req.url || ''
      const hasRefreshParam = fullUrl.includes('refresh=1') || fullUrl.includes('refresh=true')
      const items = await getMediaPosts(hasRefreshParam)
      const liveStreams = items.filter(i => i.isLive)
      return sendJson(200, {
        success: true,
        count: items.length,
        liveCount: liveStreams.length,
        items,
        liveStreams,
        syncedAt: getMediaCacheTimestamp() || Date.now()
      })
    } catch (err) {
      return sendJson(500, { success: false, message: 'Gagal memuat feed media Discord.' })
    }
  }

  // RUTE: POST /api/auth/logout
  if (req.method === 'POST' && url === '/api/auth/logout') {
    return sendJson(200, { success: true, message: 'Berhasil keluar dari sesi petualang.' })
  }

  // Default jika endpoint tidak dikenal
  sendJson(404, { success: false, message: 'Endpoint API tidak ditemukan.' })
}
