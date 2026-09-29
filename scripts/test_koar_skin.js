import fs from 'fs'
import path from 'path'

const skinsDir = path.resolve('server', 'live_data', 'SkinsRestorer', 'skins')
const hash = 'ad136d3b188c6ad376f1963364836c72b838f370cdb1ee16c889c3eb46f21498'

const f1 = path.join(skinsDir, `${hash}_CLASSIC.urlskin`)
const f2 = path.join(skinsDir, `${hash}_SLIM.urlskin`)
const f3 = path.join(skinsDir, `${hash}.urlskin`)

console.log('f1 exists:', fs.existsSync(f1))
console.log('f2 exists:', fs.existsSync(f2))
console.log('f3 exists:', fs.existsSync(f3))

for (const f of [f1, f2, f3]) {
  if (fs.existsSync(f)) {
    const raw = fs.readFileSync(f, 'utf-8')
    console.log(`Content of ${path.basename(f)}:`, raw.slice(0, 200))
    const parsed = JSON.parse(raw)
    if (parsed.value) {
      const dec = JSON.parse(Buffer.from(parsed.value, 'base64').toString('utf-8'))
      console.log('Decoded texture URL:', dec.textures?.SKIN?.url)
    }
  }
}

// Also check all files in skinsDir matching hash
const allFiles = fs.readdirSync(skinsDir)
const matches = allFiles.filter(f => f.includes(hash.slice(0, 16)))
console.log('Matches in skinsDir:', matches)
