import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

function createIcoFromPngs(pngBuffers) {
  const count = pngBuffers.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // ICO type
  header.writeUInt16LE(count, 4) // count of images

  let offset = 6 + count * 16
  const dirEntries = []
  
  for (const png of pngBuffers) {
    const entry = Buffer.alloc(16)
    const w = png.readUInt32BE(16)
    const h = png.readUInt32BE(20)
    entry.writeUInt8(w >= 256 ? 0 : w, 0)
    entry.writeUInt8(h >= 256 ? 0 : h, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    dirEntries.push(entry)
    offset += png.length
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers])
}

async function generateAll() {
  console.log('Generating optimized Valdora favicon suite...')

  // 1. Trim the raw emblem from assets/nobackgrd.png
  const trimmed = await sharp('assets/nobackgrd.png').trim().toBuffer()

  // 2. Build the Master 512x512 Dark Shield
  const size = 512
  const emblemTargetWidth = 368

  // Resize emblem with high quality Lanczos3
  const resizedEmblem = await sharp(trimmed)
    .resize(emblemTargetWidth, null, { fit: 'inside', kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true })

  // Optical centering adjustment (the right wing tip extends further right and up,
  // so we shift it slightly right and down for perfect optical center of mass)
  const left = Math.round((size - resizedEmblem.info.width) / 2) + 6
  const top = Math.round((size - resizedEmblem.info.height) / 2) + 4

  // SVG background: Sleek Dark Obsidian with cyan RPG ambient rim
  const svgBadge = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stop-color="#141a29" />
          <stop offset="65%" stop-color="#090d15" />
          <stop offset="100%" stop-color="#040609" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.22" />
          <stop offset="60%" stop-color="#00b4d8" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#0077b6" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="rim" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85" />
          <stop offset="35%" stop-color="#0284c7" stop-opacity="0.45" />
          <stop offset="70%" stop-color="#38bdf8" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#0369a1" stop-opacity="0.5" />
        </linearGradient>
      </defs>
      <!-- Base Shield -->
      <circle cx="256" cy="256" r="250" fill="url(#bg)" stroke="url(#rim)" stroke-width="8" />
      <!-- Ambient RPG Core Glow -->
      <circle cx="256" cy="256" r="210" fill="url(#glow)" />
    </svg>
  `

  // Master 512x512 PNG
  const masterBuffer = await sharp(Buffer.from(svgBadge))
    .composite([{ input: resizedEmblem.data, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer()

  // Make sure target directories exist
  for (const dir of ['public', 'public/assets', 'dist', 'dist/assets']) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  // Save master 512x512
  fs.writeFileSync('public/android-chrome-512x512.png', masterBuffer)
  fs.writeFileSync('dist/android-chrome-512x512.png', masterBuffer)
  fs.writeFileSync('public/assets/logo-badge.png', masterBuffer)
  fs.writeFileSync('dist/assets/logo-badge.png', masterBuffer)

  // 192x192 Android Chrome
  const p192 = await sharp(masterBuffer).resize(192, 192, { kernel: 'lanczos3' }).png().toBuffer()
  fs.writeFileSync('public/android-chrome-192x192.png', p192)
  fs.writeFileSync('dist/android-chrome-192x192.png', p192)

  // 180x180 Apple Touch Icon
  const p180 = await sharp(masterBuffer).resize(180, 180, { kernel: 'lanczos3' }).png().toBuffer()
  fs.writeFileSync('public/apple-touch-icon.png', p180)
  fs.writeFileSync('dist/apple-touch-icon.png', p180)

  // 96x96 Favicon
  const p96 = await sharp(masterBuffer).resize(96, 96, { kernel: 'lanczos3' }).png().toBuffer()
  fs.writeFileSync('public/favicon-96x96.png', p96)
  fs.writeFileSync('dist/favicon-96x96.png', p96)

  // 48x48 Favicon (CRITICAL FOR GOOGLE SEARCH!)
  const p48 = await sharp(masterBuffer).resize(48, 48, { kernel: 'lanczos3' }).png().toBuffer()
  fs.writeFileSync('public/favicon-48x48.png', p48)
  fs.writeFileSync('dist/favicon-48x48.png', p48)

  // 32x32 Favicon
  const p32 = await sharp(masterBuffer).resize(32, 32, { kernel: 'lanczos3' }).png().toBuffer()

  // 16x16 Favicon
  const p16 = await sharp(masterBuffer).resize(16, 16, { kernel: 'lanczos3' }).png().toBuffer()

  // Generate multi-resolution favicon.ico (16, 32, 48)
  const icoBuffer = createIcoFromPngs([p16, p32, p48])
  fs.writeFileSync('public/favicon.ico', icoBuffer)
  fs.writeFileSync('dist/favicon.ico', icoBuffer)

  // Web App Manifest
  const manifest = {
    name: 'Valdora Universe',
    short_name: 'Valdora',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    theme_color: '#0c0f14',
    background_color: '#0c0f14',
    display: 'standalone'
  }
  fs.writeFileSync('public/site.webmanifest', JSON.stringify(manifest, null, 2))
  fs.writeFileSync('dist/site.webmanifest', JSON.stringify(manifest, null, 2))

  // Create Visual Comparison Mockup Image (Before vs After) for the user!
  const mockupSvg = `
    <svg width="780" height="340" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgMock" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#181e29" />
          <stop offset="100%" stop-color="#0f131a" />
        </linearGradient>
      </defs>
      <rect width="780" height="340" fill="url(#bgMock)" rx="16" />
      
      <!-- Headers -->
      <text x="390" y="38" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">Perbandingan Tampilan Logo di Google Search</text>
      
      <!-- Left Box: BEFORE -->
      <rect x="30" y="65" width="345" height="240" fill="#202124" rx="12" stroke="#3c4043" stroke-width="1.5" />
      <rect x="50" y="85" width="110" height="26" fill="#ea4335" rx="6" />
      <text x="105" y="103" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="bold">SEBELUM (RUSAK)</text>
      
      <!-- Simulated Google Search Row (Before) -->
      <circle cx="75" cy="155" r="20" fill="#ffffff" />
      <text x="105" y="150" fill="#dadce0" font-family="Arial, sans-serif" font-size="13">valdora.my.id</text>
      <text x="105" y="167" fill="#9aa0a6" font-family="Arial, sans-serif" font-size="11">https://valdora.my.id › players</text>
      <text x="55" y="205" fill="#8ab4f8" font-family="Arial, sans-serif" font-size="17" font-weight="bold">Valdora Universe | Server ...</text>
      <text x="55" y="235" fill="#bdc1c6" font-family="Arial, sans-serif" font-size="12">Logo transparan 3:2 tanpa background.</text>
      <text x="55" y="255" fill="#ea4335" font-family="Arial, sans-serif" font-size="12">Sayap putih hilang ditelan lingkaran putih Google.</text>

      <!-- Right Box: AFTER -->
      <rect x="405" y="65" width="345" height="240" fill="#202124" rx="12" stroke="#38bdf8" stroke-width="1.5" />
      <rect x="425" y="85" width="125" height="26" fill="#0284c7" rx="6" />
      <text x="487" y="103" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="bold">SESUDAH (OPTIMAL)</text>

      <!-- Simulated Google Search Row (After) -->
      <circle cx="450" cy="155" r="20" fill="#ffffff" />
      <text x="480" y="150" fill="#dadce0" font-family="Arial, sans-serif" font-size="13">valdora.my.id</text>
      <text x="480" y="167" fill="#9aa0a6" font-family="Arial, sans-serif" font-size="11">https://valdora.my.id › players</text>
      <text x="430" y="205" fill="#8ab4f8" font-family="Arial, sans-serif" font-size="17" font-weight="bold">Valdora Universe | Server ...</text>
      <text x="430" y="235" fill="#bdc1c6" font-family="Arial, sans-serif" font-size="12">Favicon 48x48 standar Google rasio 1:1.</text>
      <text x="430" y="255" fill="#38bdf8" font-family="Arial, sans-serif" font-size="12">Badge Obsidian + sayap platinum kontras tinggi.</text>
    </svg>
  `

  // Render the old 28px on circle (left: cx 75, cy 155 -> x 55, y 135)
  // and the new 40px badge on circle (right: cx 450, cy 155 -> x 430, y 135)
  const oldIcon28 = await sharp('test_old_google_28.png').resize(28, 28).png().toBuffer()
  const newIcon38 = await sharp(masterBuffer).resize(38, 38, { kernel: 'lanczos3' }).png().toBuffer()

  await sharp(Buffer.from(mockupSvg))
    .composite([
      { input: oldIcon28, left: 61, top: 141 },
      { input: newIcon38, left: 431, top: 136 }
    ])
    .png()
    .toFile('public/favicon-comparison.png')

  console.log('✓ All favicon suite files and comparison mockup generated successfully!')
}

generateAll().catch(console.error)
