import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function inspectMore() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })

    // 1. Denizen script
    try {
      const dscBuf = await sftp.get('/plugins/Denizen/scripts/valdoradsc.dsc')
      const dsc = dscBuf.toString('utf-8')
      console.log('=== Denizen valdoradsc.dsc (length: ' + dsc.length + ') ===')
      // Search for eco, runish, rune, money, bal, vault, currency
      dsc.split('\n').forEach((line, idx) => {
        if (/runish|eeco|currency|uang|koin|coin|money|bal|rupiah|gold/i.test(line)) {
          console.log(`  Line ${idx+1}: ${line.trim()}`)
        }
      })
    } catch (e) {
      console.log('Denizen err:', e.message)
    }

    // 2. Check RPGIdentityCard config
    try {
      const rpgCfg = await sftp.get('/plugins/RPGIdentityCard/config.yml').catch(() => null)
      if (rpgCfg) {
        console.log('=== RPGIdentityCard config.yml ===')
        console.log(rpgCfg.toString('utf-8').slice(0, 1000))
      }
    } catch (e) {
      console.log('RPGIdentityCard err:', e.message)
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

inspectMore()
