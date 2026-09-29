import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function searchKeywords() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })
    console.log('SFTP connected.')

    // 1. Check Skript scripts
    try {
      const skriptFiles = await sftp.list('/plugins/Skript/scripts')
      console.log('\n=== Skript Scripts ===')
      skriptFiles.forEach(f => console.log(`  ${f.name}`))
      for (const f of skriptFiles) {
        if (f.name.endsWith('.sk')) {
          const buf = await sftp.get(`/plugins/Skript/scripts/${f.name}`)
          const text = buf.toString('utf-8')
          if (/runish|eeco|eco|baltop|money|balance|uang/i.test(text)) {
            console.log(`\nMatch in /plugins/Skript/scripts/${f.name}:`)
            text.split('\n').forEach((l, idx) => {
              if (/runish|eeco|baltop|money|balance|uang|eco/i.test(l)) {
                console.log(`  Line ${idx+1}: ${l.trim()}`)
              }
            })
          }
        }
      }
    } catch (e) {
      console.log('Error Skript:', e.message)
    }

    // 2. Check Essentials config & userdata
    try {
      console.log('\n=== Essentials config check ===')
      const essConfigBuf = await sftp.get('/plugins/Essentials/config.yml')
      const essText = essConfigBuf.toString('utf-8')
      essText.split('\n').forEach(line => {
        if (/currency|economy|symbol|format|baltop/i.test(line)) {
          console.log(`  ${line.trim()}`)
        }
      })
      const essUserdata = await sftp.list('/plugins/Essentials/userdata').catch(() => [])
      console.log(`Total Essentials userdata files: ${essUserdata.length}`)
      if (essUserdata.length > 0) {
        // Read 1 sample
        const sampleBuf = await sftp.get(`/plugins/Essentials/userdata/${essUserdata[0].name}`)
        console.log(`Sample userdata (${essUserdata[0].name}):\n`, sampleBuf.toString('utf-8').slice(0, 400))
      }
    } catch (e) {
      console.log('Error Essentials:', e.message)
    }

    // 3. Check ajLeaderboards
    try {
      const ajFiles = await sftp.list('/plugins/ajLeaderboards').catch(() => [])
      console.log('\n=== ajLeaderboards files ===')
      ajFiles.forEach(f => console.log(`  ${f.name}`))
      for (const f of ajFiles) {
        if (f.name.endsWith('.yml') || f.name.endsWith('.db')) {
          console.log(`  Checking ${f.name}...`)
        }
      }
      const ajCfg = await sftp.get('/plugins/ajLeaderboards/config.yml').catch(() => null)
      if (ajCfg) {
        console.log('ajLeaderboards config.yml snippet:')
        console.log(ajCfg.toString('utf-8').slice(0, 1000))
      }
      const ajBoards = await sftp.get('/plugins/ajLeaderboards/boards.yml').catch(() => null)
      if (ajBoards) {
        console.log('ajLeaderboards boards.yml snippet:')
        console.log(ajBoards.toString('utf-8').slice(0, 1000))
      }
    } catch (e) {
      console.log('Error ajLeaderboards:', e.message)
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

searchKeywords()
