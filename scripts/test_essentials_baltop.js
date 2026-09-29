import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

async function testEssentialsBaltop() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })
    console.log('Connected.')

    const localDir = path.resolve('server', 'live_data', 'Essentials', 'userdata')
    fs.mkdirSync(localDir, { recursive: true })

    const files = await sftp.list('/plugins/Essentials/userdata')
    console.log(`Found ${files.length} userdata files in Essentials. Downloading in batches...`)

    const batchSize = 25
    for (let i = 0; i < files.length; i += batchSize) {
      const chunk = files.slice(i, i + batchSize)
      await Promise.all(chunk.map(async f => {
        if (!f.name.endsWith('.yml')) return
        const localPath = path.join(localDir, f.name)
        try {
          await sftp.fastGet(`/plugins/Essentials/userdata/${f.name}`, localPath)
        } catch {}
      }))
      process.stdout.write(`Downloaded ${Math.min(i + batchSize, files.length)}/${files.length} files...\r`)
    }
    console.log('\nDownload complete!')

    // Now parse locally
    const localFiles = fs.readdirSync(localDir)
    const balances = []

    for (const f of localFiles) {
      if (!f.endsWith('.yml')) continue
      try {
        const text = fs.readFileSync(path.join(localDir, f), 'utf-8')
        let money = 0
        let username = ''
        const moneyMatch = text.match(/money:\s*['"]?([0-9.]+)/)
        if (moneyMatch) {
          money = parseFloat(moneyMatch[1])
        }
        const nameMatch = text.match(/last-account-name:\s*([^\r\n]+)/)
        if (nameMatch) {
          username = nameMatch[1].trim()
        }
        const uuid = f.replace('.yml', '')
        balances.push({ uuid, username: username || uuid, money })
      } catch {}
    }

    balances.sort((a, b) => b.money - a.money)

    console.log('\n=== TOP 20 BALTOP (VALDORA RUNISH / EECO) ===')
    balances.slice(0, 20).forEach((b, idx) => {
      console.log(`${idx + 1}. ${b.username}: ${b.money.toLocaleString()} Runish (${b.uuid})`)
    })

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

testEssentialsBaltop()
