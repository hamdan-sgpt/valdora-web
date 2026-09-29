import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { handleApiRequest, initAutoSync } from './apiMiddleware.js'
import { getPaths } from './db.js'

dotenv.config()

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 25054

// 1. Sembunyikan fingerprint server untuk keamanan
app.disable('x-powered-by')

// 2. Terapkan CORS dan limit payload JSON maksimum 16KB anti DoS
app.use(cors({
  origin: true,
  credentials: true
}))
app.use(express.json({ limit: '16kb' }))

// 3. Header Keamanan Global (Defense in Depth)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()')
  next()
})

// 4. Mount API middleware (terhubung ke live DB AuthMe, LuckPerms, BattlePass, AuraSkills)
app.use(handleApiRequest)

// 5. Sajikan frontend build
const distPath = fs.existsSync(path.join(currentDir, 'dist'))
  ? path.join(currentDir, 'dist')
  : path.join(currentDir, '../dist')

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    if (filePath.endsWith('.html') || filePath.endsWith('.xml') || filePath.endsWith('.txt') || filePath.endsWith('.ico') || filePath.endsWith('.webmanifest')) {
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate')
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
  }
}))

app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Valdora Server] 🚀 Web & Auth API aktif aman di 0.0.0.0:${PORT}`)
  const paths = getPaths()
  if (paths.isDirect) {
    console.log(`[Valdora Server] ⚡ Terhubung langsung ke folder plugins Minecraft (${paths.authmeDbPath})`)
  } else {
    initAutoSync(30000)
  }
})
