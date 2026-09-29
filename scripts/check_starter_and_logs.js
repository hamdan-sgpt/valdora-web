import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function checkStarter() {
  const sftp = new Client()
  await sftp.connect({
    host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
    port: Number(process.env.FTP_PORT) || 2022,
    username: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD
  })
  
  // 1. FirstJoin.sk
  const fjBuf = await sftp.get('/plugins/Skript/scripts/FirstJoin.sk').catch(() => null)
  if (fjBuf) {
    console.log('--- FirstJoin.sk ---')
    console.log(fjBuf.toString('utf-8'))
  }

  // 2. aNewbie config
  const anBuf = await sftp.get('/plugins/aNewbie/config.yml').catch(() => null)
  if (anBuf) {
    console.log('--- aNewbie config.yml ---')
    console.log(anBuf.toString('utf-8').slice(0, 1000))
  }

  // 3. Check logs to see what happens when server runs, if any errors with Geyser or commands
  const logBuf = await sftp.get('/logs/latest.log').catch(() => null)
  if (logBuf) {
    const lines = logBuf.toString('utf-8').split('\n')
    console.log('\n--- latest.log last 50 lines ---')
    console.log(lines.slice(-50).join('\n'))
  }

  await sftp.end()
}

checkStarter()
