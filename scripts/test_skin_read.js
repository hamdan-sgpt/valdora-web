import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function testSkinRead() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })

    // Read Hamdun_ham's .player file
    const hamdunBuf = await sftp.get('/plugins/SkinsRestorer/players/71bb7dd9-07b4-3224-a662-e96475a04fa8.player')
    console.log('=== Hamdun_ham .player ===')
    console.log(hamdunBuf.toString('utf-8'))

    // Also read a couple more .player files
    const pList = await sftp.list('/plugins/SkinsRestorer/players')
    for (const p of pList.slice(0, 4)) {
      const buf = await sftp.get(`/plugins/SkinsRestorer/players/${p.name}`)
      console.log(`=== ${p.name} ===`)
      console.log(buf.toString('utf-8'))
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

testSkinRead()
