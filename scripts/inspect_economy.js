import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function inspectEconomy() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })
    console.log('SFTP connected.')

    const plugins = await sftp.list('/plugins')
    console.log('=== ALL PLUGINS ===')
    plugins.forEach(p => {
      console.log(`${p.type === 'd' ? '[DIR]' : '[JAR]'} ${p.name}`)
    })

    // Specifically search for anything with eco, run, currenc, vault
    const ecoMatches = plugins.filter(p => /eco|run|curren|vault|coin|money/i.test(p.name))
    console.log('\n=== MATCHING PLUGINS ===')
    ecoMatches.forEach(p => console.log(`- ${p.name}`))

    for (const match of ecoMatches) {
      if (match.type === 'd') {
        try {
          const contents = await sftp.list(`/plugins/${match.name}`)
          console.log(`\nContents of /plugins/${match.name}:`)
          contents.forEach(c => console.log(`  ${c.type === 'd' ? '[DIR]' : '[FILE]'} ${c.name} (${c.size} bytes)`))
        } catch (err) {
          console.log(`  Failed to list /plugins/${match.name}:`, err.message)
        }
      }
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

inspectEconomy()
