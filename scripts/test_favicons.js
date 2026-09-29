import sharp from 'sharp'
import fs from 'fs'

async function testFavicons() {
  // 1. Trim the emblem first
  const trimmed = await sharp('assets/nobackgrd.png').trim().toBuffer()
  
  // Target icon size: 512x512
  const size = 512
  const emblemWidth = 360
  
  const resizedEmblem = await sharp(trimmed)
    .resize(emblemWidth, null, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true })
    
  console.log('Resized emblem info:', resizedEmblem.info)

  // Background SVG 1: Dark Obsidian with subtle cyan/RPG ambient glow and border
  const svgBgCyan = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgCyan" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#141c2c" />
          <stop offset="70%" stop-color="#0a0d14" />
          <stop offset="100%" stop-color="#05070a" />
        </radialGradient>
        <radialGradient id="glowCyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#00e5ff" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="rimCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.75" />
          <stop offset="50%" stop-color="#0284c7" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="250" fill="url(#bgCyan)" stroke="url(#rimCyan)" stroke-width="7" />
      <circle cx="256" cy="256" r="200" fill="url(#glowCyan)" />
    </svg>
  `

  // Background SVG 2: Premium Obsidian with Golden RPG ring
  const svgBgGold = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGold" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#181a24" />
          <stop offset="70%" stop-color="#0d0f16" />
          <stop offset="100%" stop-color="#06070a" />
        </radialGradient>
        <radialGradient id="glowGold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.16" />
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="rimGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde047" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#b45309" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.7" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="250" fill="url(#bgGold)" stroke="url(#rimGold)" stroke-width="7" />
      <circle cx="256" cy="256" r="200" fill="url(#glowGold)" />
    </svg>
  `

  // Background SVG 3: Sleek Dark Obsidian with metallic silver rim
  const svgBgSilver = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgSilver" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1e2433" />
          <stop offset="70%" stop-color="#0e121a" />
          <stop offset="100%" stop-color="#07090e" />
        </radialGradient>
        <linearGradient id="rimSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#cbd5e1" stop-opacity="0.7" />
          <stop offset="50%" stop-color="#475569" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="250" fill="url(#bgSilver)" stroke="url(#rimSilver)" stroke-width="7" />
    </svg>
  `

  // Background SVG 4: Rounded Squircle (App/Badge style for high-end look)
  const svgBgSquircle = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgSq" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#151d2e" />
          <stop offset="70%" stop-color="#0a0d14" />
          <stop offset="100%" stop-color="#05070a" />
        </radialGradient>
        <linearGradient id="rimSq" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.3" />
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="488" height="488" rx="110" fill="url(#bgSq)" stroke="url(#rimSq)" stroke-width="6" />
    </svg>
  `

  // Center the emblem
  const left = Math.round((size - resizedEmblem.info.width) / 2)
  const top = Math.round((size - resizedEmblem.info.height) / 2)

  await sharp(Buffer.from(svgBgCyan))
    .composite([{ input: resizedEmblem.data, left, top }])
    .png()
    .toFile('test_favicon_cyan.png')

  await sharp(Buffer.from(svgBgGold))
    .composite([{ input: resizedEmblem.data, left, top }])
    .png()
    .toFile('test_favicon_gold.png')

  await sharp(Buffer.from(svgBgSilver))
    .composite([{ input: resizedEmblem.data, left, top }])
    .png()
    .toFile('test_favicon_silver.png')

  await sharp(Buffer.from(svgBgSquircle))
    .composite([{ input: resizedEmblem.data, left, top }])
    .png()
    .toFile('test_favicon_squircle.png')

  console.log('✓ Successfully generated 4 test favicon variants!')
}

testFavicons().catch(console.error)
