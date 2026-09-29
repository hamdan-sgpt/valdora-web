import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function inspectSkinsRestorer() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })

    console.log('Connected to SFTP.')
    const srItems = await sftp.list('/plugins/SkinsRestorer')
    console.log('=== /plugins/SkinsRestorer contents ===')
    srItems.forEach(i => console.log(`  ${i.type === 'd' ? '[DIR]' : '[FILE]'} ${i.name} (${i.size} B)`))

    for (const item of srItems) {
      if (item.type === 'd') {
        const sub = await sftp.list(`/plugins/SkinsRestorer/${item.name}`).catch(() => [])
        console.log(`\nContents of /plugins/SkinsRestorer/${item.name} (${sub.length} items):`)
        sub.slice(0, 10).forEach(s => console.log(`  ${s.name} (${s.size} B)`))
      }
    }

    // Check config.yml of SkinsRestorer
    try {
      const cfgBuf = await sftp.get('/plugins/SkinsRestorer/config.yml')
      console.log('\n=== SkinsRestorer config.yml (excerpt) ===')
      const cfg = cfgBuf.toString('utf-8')
      cfg.split('\n').filter(l => /storage|mysql|sqlite|database|service/i.test(l)).forEach(l => console.log('  ' + l.trim()))
    } catch {}

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

inspectSkinsRestorer()
