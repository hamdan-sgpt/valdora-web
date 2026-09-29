import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function readWholeFile() {
  const sftp = new Client()
  await sftp.connect({
    host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
    port: Number(process.env.FTP_PORT) || 2022,
    username: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD
  })
  
  const chBuf = await sftp.get('/plugins/CommandHider/config.yml')
  console.log('--- CommandHider full config ---')
  console.log(chBuf.toString('utf-8'))

  // Let's also check SimplePortals portals
  const portalsList = await sftp.list('/plugins/SimplePortals/portals').catch(() => [])
  console.log('\n--- SimplePortals/portals ---')
  for (const pf of portalsList) {
    const pBuf = await sftp.get(`/plugins/SimplePortals/portals/${pf.name}`)
    console.log(`Portal ${pf.name}:`, pBuf.toString('utf-8'))
  }

  // Let's also check Essentials kits
  const kitsBuf = await sftp.get('/plugins/Essentials/kits.yml').catch(() => null)
  if (kitsBuf) {
    console.log('\n--- Essentials kits ---')
    console.log(kitsBuf.toString('utf-8').slice(0, 1000))
  }

  await sftp.end()
}

readWholeFile()
