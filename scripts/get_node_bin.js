import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

const NODE_URL = 'https://nodejs.org/dist/latest-v22.x/node-v22.23.3-linux-x64.tar.gz'
const TAR_FILE = path.resolve('node-linux-x64.tar.gz')
const EXTRACTED_BIN = path.resolve('node-linux-bin')

async function downloadAndUpload() {
  console.log('[1/4] Mengunduh Node.js v22 (Linux x64) resmi dari nodejs.org...')
  
  if (!fs.existsSync(TAR_FILE)) {
    const res = await fetch(NODE_URL)
    if (!res.ok) throw new Error(`HTTP error: ${res.statusText}`)
    const arrayBuffer = await res.arrayBuffer()
    fs.writeFileSync(TAR_FILE, Buffer.from(arrayBuffer))
    console.log(`✓ Terunduh (${(fs.statSync(TAR_FILE).size / 1024 / 1024).toFixed(1)} MB)`)
  } else {
    console.log('✓ Menggunakan cache lokal node-linux-x64.tar.gz')
  }

  console.log('[2/4] Mengekstrak binary "bin/node" dari arsip tar.gz...')
  try {
    // Gunakan tar bawaan Windows untuk ekstrak hanya file bin/node
    execSync(`tar -xzf "${TAR_FILE}" --strip-components=2 "node-v22.23.3-linux-x64/bin/node"`, { stdio: 'inherit' })
    if (fs.existsSync('node') && !fs.existsSync(EXTRACTED_BIN)) {
      fs.renameSync('node', EXTRACTED_BIN)
    }
  } catch (err) {
    console.error('Error saat ekstrak tar:', err.message)
    throw err
  }

  const binPath = fs.existsSync(EXTRACTED_BIN) ? EXTRACTED_BIN : path.resolve('node')
  if (!fs.existsSync(binPath)) {
    throw new Error('File binary node tidak ditemukan setelah ekstraksi')
  }

  const binSizeMb = (fs.statSync(binPath).size / 1024 / 1024).toFixed(1)
  console.log(`✓ Binary Node Linux berhasil diekstrak (${binSizeMb} MB): ${binPath}`)

  console.log('[3/4] Menghubungkan ke SFTP server Raznar...')
  const sftp = new Client()
  await sftp.connect({
    host: process.env.FTP_HOST,
    port: Number(process.env.FTP_PORT),
    username: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD
  })
  console.log('✓ Terhubung ke SFTP!')

  console.log('[4/4] Mengunggah binary node portable ke /web/node di server Minecraft...')
  await sftp.fastPut(binPath, '/web/node')
  console.log('✓ Binary /web/node BERHASIL DIUNGGAH!')

  // Beri izin eksekusi jika sftp mendukung chmod
  try {
    await sftp.chmod('/web/node', 0o755)
    console.log('✓ Izin eksekusi chmod 755 diterapkan ke /web/node')
  } catch (e) {
    console.log('Catatan chmod via SFTP:', e.message)
  }

  await sftp.end()
  console.log('✨ SELESAI! Node.js Linux portable sekarang siap digunakan di server Minecraft.')
}

downloadAndUpload().catch(console.error)
