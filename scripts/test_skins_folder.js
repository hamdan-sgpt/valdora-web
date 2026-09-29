import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function testSkinsFolder() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })

    const skinsList = await sftp.list('/plugins/SkinsRestorer/skins')
    console.log(`Total skins files: ${skinsList.length}`)
    
    // Test read 1 playerskin and 1 urlskin
    const pSkins = skinsList.filter(s => s.name.endsWith('.playerskin'))
    const urlSkins = skinsList.filter(s => s.name.endsWith('.urlskin'))
    const customSkins = skinsList.filter(s => s.name.endsWith('.customskin'))
    console.log(`playerskin: ${pSkins.length}, urlskin: ${urlSkins.length}, customskin: ${customSkins.length}`)

    if (pSkins.length > 0) {
      const buf = await sftp.get(`/plugins/SkinsRestorer/skins/${pSkins[0].name}`)
      console.log(`Sample playerskin (${pSkins[0].name}):`)
      const parsed = JSON.parse(buf.toString('utf-8'))
      console.log('parsed keys:', Object.keys(parsed))
      if (parsed.value) {
        const decoded = JSON.parse(Buffer.from(parsed.value, 'base64').toString('utf-8'))
        console.log('decoded textures:', decoded.textures)
      }
    }

    // Check if Hamdun's current URL skin or previous player skin exists
    for (const name of ['d5b7bcaa-7cac-43d5-978c-dbdc95aea4e0.playerskin', '27912adb-91d2-45c2-bab3-480214a68986.playerskin']) {
      try {
        const buf = await sftp.get(`/plugins/SkinsRestorer/skins/${name}`)
        const parsed = JSON.parse(buf.toString('utf-8'))
        const decoded = JSON.parse(Buffer.from(parsed.value, 'base64').toString('utf-8'))
        console.log(`Skin ${name} texture URL:`, decoded.textures?.SKIN?.url)
      } catch (e) {
        console.log(`Skin ${name} error:`, e.message)
      }
    }

    // Check urlskins matching discord URL
    for (const u of urlSkins.slice(0, 3)) {
      const buf = await sftp.get(`/plugins/SkinsRestorer/skins/${u.name}`)
      const parsed = JSON.parse(buf.toString('utf-8'))
      if (parsed.value) {
        const decoded = JSON.parse(Buffer.from(parsed.value, 'base64').toString('utf-8'))
        console.log(`urlskin ${u.name} texture URL:`, decoded.textures?.SKIN?.url)
      }
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

testSkinsFolder()
