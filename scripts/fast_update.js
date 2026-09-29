import Client from 'ssh2-sftp-client'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

async function fastUpdate() {
  const sftp = new Client()
  await sftp.connect({
    host: process.env.FTP_HOST,
    port: Number(process.env.FTP_PORT),
    username: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD
  })
  console.log('✓ Terhubung ke SFTP')

  // 1. Upload index.mjs
  console.log('Mengunggah index.mjs...')
  await sftp.fastPut(path.resolve('dist-server', 'index.mjs'), '/web/index.mjs')
  console.log('✓ index.mjs terunggah')

  // 2. Upload dist/index.html, favicon suite, robots.txt, sitemap.xml, dan file verifikasi Google
  console.log('Mengunggah file root dist (index.html, favicon suite, robots, sitemap, verifikasi)...')
  const distFiles = fs.readdirSync(path.resolve('dist'))
  for (const f of distFiles) {
    const fullPath = path.resolve('dist', f)
    if (fs.statSync(fullPath).isFile()) {
      await sftp.fastPut(fullPath, `/web/dist/${f}`)
      console.log(`✓ Terunggah: ${f}`)
    }
  }
  console.log('✓ Seluruh file root dist terunggah')

  // 3. Bersihkan asset lama dan upload asset baru
  const remoteAssets = await sftp.list('/web/dist/assets').catch(() => [])
  const remoteMap = new Map(remoteAssets.map(f => [f.name, f.size]))

  const localAssets = fs.readdirSync(path.resolve('dist', 'assets'))
  const localSet = new Set(localAssets)

  // Bersihkan JS/CSS lama
  for (const rFile of remoteAssets) {
    if ((rFile.name.endsWith('.js') || rFile.name.endsWith('.css')) && !localSet.has(rFile.name)) {
      await sftp.delete(`/web/dist/assets/${rFile.name}`).catch(() => {})
    }
  }

  // Upload aset (JS, CSS, MP4, WebM, JPG, PNG) jika belum ada atau ukurannya berbeda
  for (const file of localAssets) {
    const localFilePath = path.resolve('dist', 'assets', file)
    const localStat = fs.statSync(localFilePath)
    const remoteSize = remoteMap.get(file)

    if (remoteSize === undefined || remoteSize !== localStat.size) {
      console.log(`Mengunggah asset (${(localStat.size / (1024 * 1024)).toFixed(2)} MB): ${file}...`)
      await sftp.fastPut(localFilePath, `/web/dist/assets/${file}`)
    }
  }
  // 4. Update /web/.env dengan rahasia keamanan
  try {
    const serverEnvContent = `PORT=25054
JWT_SECRET=${process.env.JWT_SECRET || ''}
ADMIN_SECRET=${process.env.ADMIN_SECRET || ''}
DISCORD_BOT_TOKEN=${process.env.DISCORD_BOT_TOKEN || ''}
DISCORD_GUILD_ID=${process.env.DISCORD_GUILD_ID || ''}
DISCORD_GALLERY_CHANNEL_ID=${process.env.DISCORD_GALLERY_CHANNEL_ID || ''}
DISCORD_MEDIA_CHANNEL_ID=${process.env.DISCORD_MEDIA_CHANNEL_ID || ''}
`
    await sftp.put(Buffer.from(serverEnvContent), '/web/.env')
    console.log('✓ .env terkonfigurasi dengan aman')
  } catch (envErr) {
    console.warn('Note .env update:', envErr.message)
  }

  // 5. Buat trigger restart agar Skript me-reload server
  try {
    await sftp.put(Buffer.from(String(Date.now())), '/web/restart.trigger')
    console.log('✓ restart.trigger dikirim ke server')
  } catch {}

  await sftp.end()
  console.log('✨ UPDATE BERHASIL!')
}

fastUpdate().catch(console.error)
