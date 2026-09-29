import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function checkDetails() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })

    // 1. Check ajLeaderboards cache_storage.yml
    try {
      const ajBuf = await sftp.get('/plugins/ajLeaderboards/cache_storage.yml')
      console.log('=== ajLeaderboards/cache_storage.yml ===')
      console.log(ajBuf.toString('utf-8').slice(0, 1500))
    } catch (e) {
      console.log('ajLeaderboards error:', e.message)
    }

    // 2. Check /commands.yml at root
    try {
      const cmdBuf = await sftp.get('/commands.yml')
      console.log('=== /commands.yml ===')
      console.log(cmdBuf.toString('utf-8'))
    } catch (e) {
      console.log('commands.yml error:', e.message)
    }

    // 3. Check /plugins/PlaceholderAPI/config.yml or expansion list
    try {
      const papiFiles = await sftp.list('/plugins/PlaceholderAPI/expansions').catch(() => [])
      console.log('=== PAPI Expansions ===')
      papiFiles.forEach(f => console.log(`  ${f.name}`))
    } catch (e) {
      console.log('papi error:', e.message)
    }

    // 4. Check if there are other files mentioning "eeco" or "runish"
    const plugins = await sftp.list('/plugins')
    for (const p of plugins) {
      if (/eco|eeco|runish/i.test(p.name)) {
        console.log('Matched plugin item:', p.name)
      }
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

checkDetails()
