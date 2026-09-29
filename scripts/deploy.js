import Client from 'ssh2-sftp-client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const config = {
  host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
  port: Number(process.env.FTP_PORT) || 2022,
  username: process.env.FTP_USER || '',
  password: process.env.FTP_PASSWORD || '',
  readyTimeout: 15000
}

async function uploadDir(sftp, localDir, remoteDir) {
  await sftp.mkdir(remoteDir, true)
  const items = fs.readdirSync(localDir)

  for (const item of items) {
    const localPath = path.join(localDir, item)
    const remotePath = `${remoteDir}/${item}`
    const stat = fs.statSync(localPath)

    if (stat.isDirectory()) {
      await uploadDir(sftp, localPath, remotePath)
    } else {
      console.log(`[Upload] Mengunggah: ${item} (${(stat.size / 1024).toFixed(1)} KB)...`)
      await sftp.fastPut(localPath, remotePath)
    }
  }
}

async function deploy() {
  console.log(`[Deploy] Menghubungkan ke SFTP ${config.host}:${config.port}...`)
  const sftp = new Client()

  try {
    await sftp.connect(config)
    console.log('[Deploy] ✓ Terhubung ke SFTP server Raznar!')

    // 1. Buat folder /web di root server
    await sftp.mkdir('/web', true)
    await sftp.mkdir('/web/dist', true)

    // 2. Upload dist folder
    console.log('[Deploy] Mengunggah frontend build (dist/)...')
    await uploadDir(sftp, path.resolve('dist'), '/web/dist')

    // 3. Upload dist-server/index.mjs
    console.log('[Deploy] Mengunggah backend single-file (index.mjs)...')
    await sftp.fastPut(path.resolve('dist-server', 'index.mjs'), '/web/index.mjs')

    // 4. Buat dan upload .env di server
    const serverEnvContent = `PORT=25054\nJWT_SECRET=${process.env.JWT_SECRET || 'valdora_secret_rpg_auth_2026_super_secure'}\nADMIN_SECRET=${process.env.ADMIN_SECRET || 'valdora_admin_sys_2026_top_secret'}\n`
    await sftp.put(Buffer.from(serverEnvContent), '/web/.env')
    console.log('[Deploy] ✓ File konfigurasi .env (PORT=25054, JWT_SECRET, ADMIN_SECRET) dibuat.')

    // 5. Buat Skript auto-start di plugins/Skript/scripts/valdora_web.sk
    const skriptContent = `# ========================================================
# VALDORA WEB SERVER AUTO-LAUNCHER
# Otomatis menyalakan website di port 25054 saat MC boot
# ========================================================

import:
    java.lang.ProcessBuilder
    java.lang.Process
    java.io.File

variables:
    {valdora_web_proc} = null

on script load:
    set {_webDir} to new File("web")
    if {_webDir}.exists():
        send "&e[ValdoraWeb] Menyalakan Web Server Valdora di port 25054..." to console
        try:
            set {_logFile} to new File("web/server.log")
            set {_pb} to new ProcessBuilder("node", "index.mjs")
            {_pb}.directory({_webDir})
            {_pb}.redirectOutput({_logFile})
            {_pb}.redirectErrorStream(true)
            set {valdora_web_proc} to {_pb}.start()
            send "&a[ValdoraWeb] ✓ Web Server Valdora berhasil aktif di port 25054!" to console
        catch {_err}:
            send "&c[ValdoraWeb] Gagal menyalakan node: %{_err}%" to console

on script unload:
    if {valdora_web_proc} is set:
        {valdora_web_proc}.destroy()
        delete {valdora_web_proc}
        send "&e[ValdoraWeb] Web Server dimatikan." to console

command /valdoraweb <text>:
    permission: op
    trigger:
        if arg-1 is "restart":
            if {valdora_web_proc} is set:
                {valdora_web_proc}.destroy()
                delete {valdora_web_proc}
            set {_webDir} to new File("web")
            set {_logFile} to new File("web/server.log")
            set {_pb} to new ProcessBuilder("node", "index.mjs")
            {_pb}.directory({_webDir})
            {_pb}.redirectOutput({_logFile})
            {_pb}.redirectErrorStream(true)
            set {valdora_web_proc} to {_pb}.start()
            send "&a[ValdoraWeb] Web Server direstart di port 25054!" to sender
        else if arg-1 is "stop":
            if {valdora_web_proc} is set:
                {valdora_web_proc}.destroy()
                delete {valdora_web_proc}
                send "&e[ValdoraWeb] Web Server dihentikan." to sender
            else:
                send "&c[ValdoraWeb] Web Server sedang tidak berjalan." to sender
        else if arg-1 is "start":
            set {_webDir} to new File("web")
            set {_logFile} to new File("web/server.log")
            set {_pb} to new ProcessBuilder("node", "index.mjs")
            {_pb}.directory({_webDir})
            {_pb}.redirectOutput({_logFile})
            {_pb}.redirectErrorStream(true)
            set {valdora_web_proc} to {_pb}.start()
            send "&a[ValdoraWeb] Web Server dinyalakan di port 25054!" to sender
        else:
            send "&eGunakan: /valdoraweb start | stop | restart" to sender
`
    try {
      await sftp.mkdir('/plugins/Skript/scripts', true)
      await sftp.put(Buffer.from(skriptContent), '/plugins/Skript/scripts/valdora_web.sk')
      console.log('[Deploy] ✓ Skript valdora_web.sk berhasil diunggah ke /plugins/Skript/scripts/')
    } catch (e) {
      console.warn('[Deploy] Note skript upload:', e.message)
    }

    console.log('[Deploy] ✨ SEMUA FILE BERHASIL DIUNGGAH KE SERVER RAZNAR!')
    await sftp.end()
  } catch (err) {
    console.error('[Deploy Error]', err.message)
    try { await sftp.end() } catch {}
  }
}

deploy()
