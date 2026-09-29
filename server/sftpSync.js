import Client from 'ssh2-sftp-client'
import * as ftp from 'basic-ftp'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { resetDbCache } from './db.js'

dotenv.config()

// Direktori cache lokal untuk data yang ditarik secara live dari FTP/SFTP server utama
export const LIVE_DATA_DIR = path.resolve('server', 'live_data')

export const SFTP_CONFIG = {
  type: process.env.FTP_TYPE || 'sftp', // 'sftp' (port 2022 Pterodactyl) atau 'ftp' (port 21)
  host: process.env.FTP_HOST || '',
  port: Number(process.env.FTP_PORT) || 2022,
  user: process.env.FTP_USER || '',
  password: process.env.FTP_PASSWORD || '',
  remotePluginsPath: process.env.FTP_REMOTE_PATH || '/plugins'
}

let isSyncing = false
let lastSyncTime = null
let lastSyncError = null
let autoSyncTimer = null

/**
 * Helper mengunduh file secara aman dengan file sementara (.tmp)
 * untuk menghindari file lock dan file corrupt di Windows.
 */
async function safeDownload(sftp, remotePaths, targetLocalPath) {
  const tmpPath = `${targetLocalPath}.tmp`
  let success = false

  for (const rPath of remotePaths) {
    try {
      await sftp.fastGet(rPath, tmpPath)
      success = true
      break
    } catch {
      // Coba variasi path berikutnya
    }
  }

  if (success && fs.existsSync(tmpPath)) {
    resetDbCache()
    // Jeda sejenak agar OS Windows melepaskan file handle
    await new Promise(r => setTimeout(r, 40))

    try {
      // 1. Gunakan copyFileSync untuk menimpa file tujuan dengan aman di Windows
      fs.copyFileSync(tmpPath, targetLocalPath)
      try { fs.unlinkSync(tmpPath) } catch {}
      return true
    } catch (copyErr) {
      // 2. Fallback: baca buffer lalu tulis ulang jika OS menolak copy
      try {
        const buffer = fs.readFileSync(tmpPath)
        fs.writeFileSync(targetLocalPath, buffer)
        try { fs.unlinkSync(tmpPath) } catch {}
        return true
      } catch (writeErr) {
        console.error(`[SFTP Sync] Gagal memperbarui ${targetLocalPath}:`, writeErr.message)
        throw writeErr
      }
    }
  }
  return false
}

/**
 * Sinkronisasi data live dari SFTP/FTP server utama ke direktori cache lokal
 */
export async function syncLiveServerFiles() {
  if (!SFTP_CONFIG.host || !SFTP_CONFIG.user || !SFTP_CONFIG.password) {
    return {
      success: false,
      configured: false,
      message: 'Kredensial FTP/SFTP belum diisi di file .env'
    }
  }

  if (isSyncing) {
    return { success: true, message: 'Sinkronisasi sedang berlangsung...', lastSyncTime }
  }

  isSyncing = true
  console.log(`[SFTP Sync] 🔄 Mengambil data live terbaru dari ${SFTP_CONFIG.host}:${SFTP_CONFIG.port}...`)

  try {
    fs.mkdirSync(path.join(LIVE_DATA_DIR, 'AuthMe'), { recursive: true })
    fs.mkdirSync(path.join(LIVE_DATA_DIR, 'BattlePass'), { recursive: true })
    fs.mkdirSync(path.join(LIVE_DATA_DIR, 'RPGIdentityCard', 'data'), { recursive: true })
    fs.mkdirSync(path.join(LIVE_DATA_DIR, 'AuraSkills', 'userdata'), { recursive: true })

    if (SFTP_CONFIG.type === 'sftp') {
      const sftp = new Client()
      sftp.on('error', (err) => {
        console.warn('[SFTP Client Event Warn]:', err.message)
      })
      await sftp.connect({
        host: SFTP_CONFIG.host,
        port: SFTP_CONFIG.port,
        username: SFTP_CONFIG.user,
        password: SFTP_CONFIG.password,
        readyTimeout: 10000
      })

      const base = SFTP_CONFIG.remotePluginsPath.replace(/\/+$/, '')
      const trimSlash = base.replace(/^\//, '')

      // 1. Unduh AuthMe database
      const authmePaths = [`${base}/AuthMe/authme.db`, `${trimSlash}/AuthMe/authme.db`]
      const authmeDownloaded = await safeDownload(sftp, authmePaths, path.join(LIVE_DATA_DIR, 'AuthMe', 'authme.db'))
      if (authmeDownloaded) {
        console.log('[SFTP Sync] ✓ Berhasil mengunduh live AuthMe/authme.db')
      }

      // 2. Unduh BattlePass database & rewards
      const bpDbPaths = [`${base}/BattlePass/battlepass.db`, `${trimSlash}/BattlePass/battlepass.db`]
      await safeDownload(sftp, bpDbPaths, path.join(LIVE_DATA_DIR, 'BattlePass', 'battlepass.db'))

      const bpRewardsPaths = [`${base}/BattlePass/rewards.yml`, `${trimSlash}/BattlePass/rewards.yml`]
      await safeDownload(sftp, bpRewardsPaths, path.join(LIVE_DATA_DIR, 'BattlePass', 'rewards.yml'))

      // 3. Unduh RPGIdentityCard (identities.yml)
      const rpgPaths = [
        `${base}/RPGIdentityCard/data/identities.yml`,
        `${trimSlash}/RPGIdentityCard/data/identities.yml`,
        `${base}/RPGIdentityCard/identities.yml`,
        `${trimSlash}/RPGIdentityCard/identities.yml`
      ]
      await safeDownload(sftp, rpgPaths, path.join(LIVE_DATA_DIR, 'RPGIdentityCard', 'data', 'identities.yml'))

      // 4. Unduh AuraSkills userdata jika tersedia
      try {
        const auraRemote = `${base}/AuraSkills/userdata`
        const auraList = await sftp.list(auraRemote).catch(() => [])
        for (const item of auraList.filter(f => f.name.endsWith('.yml')).slice(0, 50)) {
          await sftp.fastGet(`${auraRemote}/${item.name}`, path.join(LIVE_DATA_DIR, 'AuraSkills', 'userdata', item.name))
        }
      } catch {
        // AuraSkills optional
      }

      // 5. Unduh SkinsRestorer (skin player non-premium) jika tersedia
      try {
        const srPlayersRemote = `${base}/SkinsRestorer/players`
        const srPlayersList = await sftp.list(srPlayersRemote).catch(() => [])
        const localSrPlayers = path.join(LIVE_DATA_DIR, 'SkinsRestorer', 'players')
        fs.mkdirSync(localSrPlayers, { recursive: true })
        const playerFiles = srPlayersList.filter(f => f.name.endsWith('.player'))
        for (let i = 0; i < playerFiles.length; i += 30) {
          const batch = playerFiles.slice(i, i + 30)
          await Promise.all(batch.map(item => {
            const dest = path.join(localSrPlayers, item.name)
            if (!fs.existsSync(dest) || fs.statSync(dest).size !== item.size) {
              return sftp.fastGet(`${srPlayersRemote}/${item.name}`, dest).catch(() => {})
            }
            return Promise.resolve()
          }))
        }

        const srSkinsRemote = `${base}/SkinsRestorer/skins`
        const srSkinsList = await sftp.list(srSkinsRemote).catch(() => [])
        const localSrSkins = path.join(LIVE_DATA_DIR, 'SkinsRestorer', 'skins')
        fs.mkdirSync(localSrSkins, { recursive: true })
        for (let i = 0; i < srSkinsList.length; i += 30) {
          const batch = srSkinsList.slice(i, i + 30)
          await Promise.all(batch.map(item => {
            const dest = path.join(localSrSkins, item.name)
            if (!fs.existsSync(dest) || fs.statSync(dest).size !== item.size) {
              return sftp.fastGet(`${srSkinsRemote}/${item.name}`, dest).catch(() => {})
            }
            return Promise.resolve()
          }))
        }
      } catch {
        // SkinsRestorer optional
      }

      // 6. Unduh Essentials userdata (Ekonomi Runish / Baltop) jika tersedia
      try {
        const essRemote = `${base}/Essentials/userdata`
        const essList = await sftp.list(essRemote).catch(() => [])
        const localEssDir = path.join(LIVE_DATA_DIR, 'Essentials', 'userdata')
        fs.mkdirSync(localEssDir, { recursive: true })
        const ymlFiles = essList.filter(f => f.name.endsWith('.yml'))
        for (let i = 0; i < ymlFiles.length; i += 25) {
          const batch = ymlFiles.slice(i, i + 25)
          await Promise.all(batch.map(item =>
            sftp.fastGet(`${essRemote}/${item.name}`, path.join(localEssDir, item.name)).catch(() => {})
          ))
        }
      } catch (essErr) {
        // Essentials optional
      }

      await sftp.end()
    } else {
      // Plain FTP fallback
      const client = new ftp.Client()
      client.ftp.verbose = false
      await client.access({
        host: SFTP_CONFIG.host,
        port: SFTP_CONFIG.port,
        user: SFTP_CONFIG.user,
        password: SFTP_CONFIG.password,
        secure: false
      })

      const baseRemote = SFTP_CONFIG.remotePluginsPath.replace(/\/+$/, '')
      try {
        resetDbCache()
        await client.downloadTo(path.join(LIVE_DATA_DIR, 'AuthMe', 'authme.db'), `${baseRemote}/AuthMe/authme.db`)
      } catch (err) {
        console.warn('[FTP Sync] Gagal unduh authme.db:', err.message)
      }

      client.close()
    }

    lastSyncTime = new Date()
    lastSyncError = null
    isSyncing = false
    console.log(`[SFTP Sync] ✨ Sinkronisasi data live server Raznar selesai (${lastSyncTime.toLocaleTimeString()})`)
    return { success: true, message: 'Sinkronisasi berhasil!', lastSyncTime }
  } catch (err) {
    isSyncing = false
    lastSyncError = err.message
    console.error('[SFTP Sync Error]', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Status sinkronisasi saat ini
 */
export function getSyncStatus() {
  return {
    configured: Boolean(SFTP_CONFIG.host && SFTP_CONFIG.user && SFTP_CONFIG.password),
    isSyncing,
    lastSyncTime,
    lastSyncError,
    type: SFTP_CONFIG.type,
    host: SFTP_CONFIG.host,
    port: SFTP_CONFIG.port
  }
}

/**
 * Inisialisasi background auto-sync berkala
 */
export function initAutoSync(intervalMs = 30000) {
  if (autoSyncTimer) return
  console.log(`[Auto-Sync] 🚀 Auto-sync SFTP diaktifkan: memeriksa pembaruan server setiap ${intervalMs / 1000} detik.`)
  
  // Sinkronisasi awal setelah server menyala
  setTimeout(() => {
    syncLiveServerFiles().catch(() => {})
  }, 2000)

  // Polling berkala
  autoSyncTimer = setInterval(() => {
    syncLiveServerFiles().catch(() => {})
  }, intervalMs)
}
