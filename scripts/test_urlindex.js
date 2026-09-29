import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const skinsDir = path.resolve('server', 'live_data', 'SkinsRestorer', 'skins')

if (fs.existsSync(skinsDir)) {
  const files = fs.readdirSync(skinsDir)
  const urlIndexes = files.filter(f => f.endsWith('.urlindex'))
  const urlSkins = files.filter(f => f.endsWith('.urlskin'))
  console.log(`Found ${urlIndexes.length} urlindex files and ${urlSkins.length} urlskin files.`)

  for (const idx of urlIndexes.slice(0, 5)) {
    const content = fs.readFileSync(path.join(skinsDir, idx), 'utf-8')
    console.log(`\nurlindex ${idx}:`)
    console.log(content)
  }

  // Let's test KoarKoar's URL
  const koarUrl = "https://cdn.discordapp.com/attachments/1493198005422002176/1550420810538164224/RaokRaokDemonForm.png?ex=6aaeee26&is=6aad9ca6&hm=29af4654a72f19b43c16e5321b33dad733f4463f66552aa7c417ea0c08a89287&"
  console.log('\nTesting hash of KoarKoar URL:', crypto.createHash('sha256').update(koarUrl).digest('hex'))
  console.log('Testing hash of KoarKoar URL trimmed:', crypto.createHash('sha256').update(koarUrl.trim()).digest('hex'))
  // Check if any urlindex file contains RaokRaokDemonForm or discord
  for (const idx of urlIndexes) {
    const text = fs.readFileSync(path.join(skinsDir, idx), 'utf-8')
    if (text.includes('RaokRaokDemonForm') || text.includes('1550420810538164224')) {
      console.log('MATCH FOUND IN urlindex:', idx, text)
    }
  }
}
