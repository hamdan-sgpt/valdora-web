import fs from 'fs'
import path from 'path'

const srDir = path.resolve('server', 'live_data', 'SkinsRestorer')
const playersDir = path.join(srDir, 'players')
const cacheDir = path.join(srDir, 'cache')

console.log('Searching for KoarKoar in SkinsRestorer...')

if (fs.existsSync(playersDir)) {
  const pFiles = fs.readdirSync(playersDir)
  for (const f of pFiles) {
    const text = fs.readFileSync(path.join(playersDir, f), 'utf-8')
    if (text.toLowerCase().includes('koarkoa') || f.includes('6bae1b13')) {
      console.log('Found in players:', f, text)
    }
  }
}

if (fs.existsSync(cacheDir)) {
  const cFiles = fs.readdirSync(cacheDir)
  for (const f of cFiles) {
    if (f.toLowerCase().includes('koarkoa')) {
      console.log('Found in cache:', f)
    }
  }
}
