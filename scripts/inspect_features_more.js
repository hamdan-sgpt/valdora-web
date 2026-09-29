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
    console.log('Connected to SFTP.\n')

    // 1. Pl-Hide-Free
    console.log('=== 1. Pl-Hide-Free Config ===')
    try {
      const buf = await sftp.get('/plugins/Pl-Hide-Free/config.yml')
      console.log(buf.toString('utf-8').slice(0, 1500))
    } catch (e) {
      console.log('Error reading Pl-Hide-Free:', e.message)
    }

    // 2. CommandHider
    console.log('\n=== 2. CommandHider Config ===')
    try {
      const buf = await sftp.get('/plugins/CommandHider/config.yml')
      console.log(buf.toString('utf-8').slice(0, 1500))
    } catch (e) {
      console.log('Error reading CommandHider:', e.message)
    }

    // 3. SimplePortals
    console.log('\n=== 3. SimplePortals Portals List ===')
    try {
      const list = await sftp.list('/plugins/SimplePortals')
      console.log('SimplePortals files:', list.map(f => f.name).join(', '))
      const pBuf = await sftp.get('/plugins/SimplePortals/portals.yml').catch(() => null)
      if (pBuf) {
        console.log('Portals.yml snippet:\n', pBuf.toString('utf-8').slice(0, 1000))
      }
    } catch (e) {
      console.log('Error reading SimplePortals:', e.message)
    }

    // 4. BattlePass
    console.log('\n=== 4. BattlePass Configuration ===')
    try {
      const bpList = await sftp.list('/plugins/BattlePass').catch(() => [])
      console.log('BattlePass files:', bpList.map(f => f.name).join(', '))
      const bpCfg = await sftp.get('/plugins/BattlePass/config.yml').catch(() => null)
      if (bpCfg) {
        const lines = bpCfg.toString('utf-8').split('\n')
        lines.slice(0, 40).forEach(l => console.log('  ' + l))
      }
    } catch (e) {
      console.log('Error reading BattlePass:', e.message)
    }

    // 5. ItemsAdder
    console.log('\n=== 5. ItemsAdder Configuration ===')
    try {
      const iaCfg = await sftp.get('/plugins/ItemsAdder/config.yml').catch(() => null)
      if (iaCfg) {
        const lines = iaCfg.toString('utf-8').split('\n')
        lines.filter(l => l.trim().startsWith('resource-pack:') || l.trim().startsWith('hosting:') || l.trim().startsWith('kick_player:')).forEach(l => console.log('  ' + l))
      }
    } catch (e) {
      console.log('Error reading ItemsAdder:', e.message)
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

inspectMore()
