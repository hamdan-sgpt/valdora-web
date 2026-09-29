import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPlayerByUsername } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'valdora_secret_key_rpg_auth_2026_super_secure'

/**
 * Keamanan Anti-Brute Force & Anti-Credential Stuffing:
 * 1. IP Lockout: Maks 5 percobaan gagal per IP dalam 5 menit -> Blokir 15 menit.
 * 2. Akun Lockout: Maks 5 percobaan salah untuk 1 username target -> Jeda 5 menit.
 */
const ipAttempts = new Map()
const userAttempts = new Map()

// Pembersihan rutin memori rate limit setiap 10 menit
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of ipAttempts.entries()) {
    if (now > record.resetTime && (!record.lockedUntil || now > record.lockedUntil)) {
      ipAttempts.delete(ip)
    }
  }
  for (const [user, record] of userAttempts.entries()) {
    if (now > record.resetTime && (!record.lockedUntil || now > record.lockedUntil)) {
      userAttempts.delete(user)
    }
  }
}, 10 * 60 * 1000)

export function checkLoginRateLimit(ip, username = '') {
  const now = Date.now()
  const cleanIp = String(ip || '127.0.0.1').trim()
  const cleanUser = String(username || '').trim().toLowerCase()

  // 1. Cek Lockout IP
  const ipRecord = ipAttempts.get(cleanIp)
  if (ipRecord && ipRecord.lockedUntil && now < ipRecord.lockedUntil) {
    const waitSeconds = Math.ceil((ipRecord.lockedUntil - now) / 1000)
    return {
      allowed: false,
      waitSeconds,
      reason: `IP Anda diblokir sementara karena terlalu banyak percobaan login gagal. Mohon tunggu ${waitSeconds} detik.`
    }
  }

  // 2. Cek Lockout Username (Perlindungan Akun dari Distributed Botnet)
  if (cleanUser) {
    const userRecord = userAttempts.get(cleanUser)
    if (userRecord && userRecord.lockedUntil && now < userRecord.lockedUntil) {
      const waitSeconds = Math.ceil((userRecord.lockedUntil - now) / 1000)
      return {
        allowed: false,
        waitSeconds,
        reason: `Akun "${cleanUser}" sedang diamankan sementara dari percobaan login mencurigakan. Mohon tunggu ${waitSeconds} detik.`
      }
    }
  }

  return { allowed: true }
}

export function recordFailedLogin(ip, username = '') {
  const now = Date.now()
  const cleanIp = String(ip || '127.0.0.1').trim()
  const cleanUser = String(username || '').trim().toLowerCase()
  const WINDOW_MS = 5 * 60 * 1000 // Jendela 5 menit
  const MAX_FAILS = 5

  // Catat kegagalan IP
  const ipRecord = ipAttempts.get(cleanIp) || { count: 0, resetTime: now + WINDOW_MS, lockedUntil: null }
  if (now > ipRecord.resetTime) {
    ipRecord.count = 1
    ipRecord.resetTime = now + WINDOW_MS
    ipRecord.lockedUntil = null
  } else {
    ipRecord.count += 1
  }

  if (ipRecord.count >= MAX_FAILS) {
    ipRecord.lockedUntil = now + (15 * 60 * 1000) // Kunci 15 menit
    console.warn(`[Security Alert] 🚨 IP ${cleanIp} dikunci selama 15 menit karena 5x salah password!`)
  }
  ipAttempts.set(cleanIp, ipRecord)

  // Catat kegagalan Username
  if (cleanUser) {
    const userRecord = userAttempts.get(cleanUser) || { count: 0, resetTime: now + WINDOW_MS, lockedUntil: null }
    if (now > userRecord.resetTime) {
      userRecord.count = 1
      userRecord.resetTime = now + WINDOW_MS
      userRecord.lockedUntil = null
    } else {
      userRecord.count += 1
    }

    if (userRecord.count >= MAX_FAILS) {
      userRecord.lockedUntil = now + (5 * 60 * 1000) // Kunci 5 menit
      console.warn(`[Security Alert] 🛡️ Akun "${cleanUser}" diamankan selama 5 menit karena serangan tebakan kata sandi!`)
    }
    userAttempts.set(cleanUser, userRecord)
  }
}

export function resetLoginRateLimit(ip, username = '') {
  const cleanIp = String(ip || '127.0.0.1').trim()
  const cleanUser = String(username || '').trim().toLowerCase()
  ipAttempts.delete(cleanIp)
  if (cleanUser) userAttempts.delete(cleanUser)
}

/**
 * Verifikasi password berformat AuthMe SHA256 ($SHA$salt$hash)
 * Algorithm: sha256(sha256(password) + salt)
 * AMAN DARI TIMING ATTACKS: Memakai crypto.timingSafeEqual secara ketat.
 */
export function verifyAuthMePassword(password, storedHash) {
  if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
    return false
  }

  const timingSafeCompareHex = (calculatedHex, expectedHex) => {
    const calcClean = calculatedHex.toLowerCase().trim()
    const expClean = expectedHex.toLowerCase().trim()
    if (calcClean.length !== expClean.length) return false

    const bufCalc = Buffer.from(calcClean, 'utf8')
    const bufExp = Buffer.from(expClean, 'utf8')
    return crypto.timingSafeEqual(bufCalc, bufExp)
  }

  // Format standar AuthMe SHA256: $SHA$salt$hash
  if (storedHash.startsWith('$SHA$')) {
    const parts = storedHash.split('$')
    if (parts.length >= 4) {
      const salt = parts[2]
      const expectedHash = parts[3]
      const step1 = crypto.createHash('sha256').update(password).digest('hex')
      const step2 = crypto.createHash('sha256').update(step1 + salt).digest('hex')
      return timingSafeCompareHex(step2, expectedHash)
    }
  }

  // Format AuthMe SHA256 tanpa leading dollar jika ada: SHA$salt$hash
  if (storedHash.startsWith('SHA$')) {
    const parts = storedHash.split('$')
    if (parts.length >= 3) {
      const salt = parts[1]
      const expectedHash = parts[2]
      const step1 = crypto.createHash('sha256').update(password).digest('hex')
      const step2 = crypto.createHash('sha256').update(step1 + salt).digest('hex')
      return timingSafeCompareHex(step2, expectedHash)
    }
  }

  return false
}

/**
 * Otentikasi pemain menggunakan username & password in-game.
 * STRICTLY READ-ONLY ke database.
 * Terproteksi dari SQL Injection, Timing Attack, Brute Force, dan ReDoS.
 */
export async function authenticatePlayer(rawUsername, rawPassword, rawIp = '127.0.0.1') {
  const clientIp = String(rawIp || '127.0.0.1').trim().slice(0, 45) // Batasi panjang IP IPv6/IPv4

  // 1. Validasi Input Dasar
  if (typeof rawUsername !== 'string' || typeof rawPassword !== 'string') {
    return {
      success: false,
      code: 'INVALID_INPUT',
      message: 'Format username atau password tidak valid.'
    }
  }

  const username = rawUsername.trim()
  const password = rawPassword

  // Validasi format username Minecraft (Java / Bedrock .prefix)
  // Hanya izinkan 3-16 karakter alfanumerik & underscore (atau diawali titik untuk bedrock)
  const MINECRAFT_USER_REGEX = /^\.?[a-zA-Z0-9_]{3,16}$/
  if (!MINECRAFT_USER_REGEX.test(username)) {
    return {
      success: false,
      code: 'INVALID_USERNAME',
      message: 'Username Minecraft tidak valid. Gunakan 3-16 karakter alfanumerik dan garis bawah.'
    }
  }

  // Batasi panjang password agar tidak dapat diserang hash-DoS (maks 128 karakter)
  if (password.length < 1 || password.length > 128) {
    return {
      success: false,
      code: 'INVALID_PASSWORD',
      message: 'Kata sandi tidak boleh kosong dan maksimal 128 karakter.'
    }
  }

  // 2. Cek Rate Limiting & Lockout
  const rateLimit = checkLoginRateLimit(clientIp, username)
  if (!rateLimit.allowed) {
    return {
      success: false,
      code: 'RATE_LIMITED',
      message: rateLimit.reason
    }
  }

  // 3. Ambil data pemain (STRICTLY READ-ONLY dari DB)
  console.log(`[Auth] 🔑 Mencoba otentikasi aman untuk "${username}" (IP: ${clientIp})`)
  const player = await getPlayerByUsername(username)
  if (!player) {
    recordFailedLogin(clientIp, username)
    console.warn(`[Auth] ❌ Username "${username}" tidak ditemukan di database live!`)
    return {
      success: false,
      code: 'NOT_FOUND',
      message: `Akun "${username}" tidak ditemukan di database server. Pastikan username sama persis dengan nama karakter di Minecraft.`
    }
  }

  // 4. Verifikasi Password (AuthMe SHA256 -> BCrypt)
  let passwordMatches = false

  // A. Verifikasi AuthMe SHA256 (Standar Server Live Raznar)
  if (player.password && (player.password.startsWith('$SHA$') || player.password.startsWith('SHA$'))) {
    passwordMatches = verifyAuthMePassword(password, player.password)
  }

  // B. Verifikasi BCrypt (nLogin / alternatif)
  if (!passwordMatches && player.password && (player.password.startsWith('$2a$') || player.password.startsWith('$2y$') || player.password.startsWith('$2b$'))) {
    try {
      passwordMatches = bcrypt.compareSync(password, player.password)
    } catch (err) {
      console.warn('[BCrypt Error]:', err.message)
    }
  }

  // C. Fallback kata sandi demo untuk local testing
  if (!passwordMatches && player.fallback_passwords && Array.isArray(player.fallback_passwords)) {
    if (player.fallback_passwords.includes(password)) {
      passwordMatches = true
    }
  }

  // Jika kata sandi tidak cocok
  if (!passwordMatches) {
    recordFailedLogin(clientIp, username)
    console.warn(`[Auth] ❌ Kata sandi salah untuk username "${username}"`)
    return {
      success: false,
      code: 'WRONG_PASSWORD',
      message: 'Password in-game salah. Masukkan kata sandi yang biasa kamu ketik saat /login di server.'
    }
  }

  // 5. Sukses login, reset catatan kegagalan rate limiter
  resetLoginRateLimit(clientIp, username)
  console.log(`[Auth] ✓ Verifikasi kata sandi cocok untuk "${username}"`)

  // 6. Buat JWT Token dengan batasan waktu (24 Jam) dan algoritma eksplisit HS256
  const payload = {
    username: player.last_name,
    uuid: player.unique_id,
    premium: Boolean(player.premium)
  }

  const token = jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h'
  })

  // 7. Siapkan profile publik yang aman (HAPUS PASSWORD, HASH, IP, & EMAIL)
  const safeProfile = {
    username: player.last_name,
    uuid: player.unique_id,
    premium: Boolean(player.premium),
    lastSeen: player.last_seen,
    race: player.race,
    battlePass: player.battlePass,
    stats: player.stats || {
      combat: 15,
      mining: 20,
      foraging: 10,
      farming: 14,
      agility: 12
    },
    avatarUrl: player.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(player.last_name)}/128`,
    bodyUrl: player.bodyUrl || `https://mc-heads.net/body/${encodeURIComponent(player.last_name)}/280`,
    skinInfo: player.skinInfo || null,
    isRealDb: player.isRealDb
  }

  return {
    success: true,
    token,
    profile: safeProfile
  }
}

/**
 * Verifikasi token JWT untuk otorisasi endpoint yang membutuhkan login.
 * Menggunakan algoritma HS256 secara ketat untuk mencegah exploit alg:none.
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  } catch (err) {
    return null
  }
}
