import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function inspectPluginsMore() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })

    // 1. RPUniverse
    try {
      const rpFiles = await sftp.list('/plugins/RPUniverse')
      console.log('=== /plugins/RPUniverse ===')
      for (const f of rpFiles) {
        console.log(`  ${f.name}`)
        if (f.name.endsWith('.yml')) {
          const buf = await sftp.get(`/plugins/RPUniverse/${f.name}`)
          console.log(`--- ${f.name} ---`)
          console.log(buf.toString('utf-8').slice(0, 500))
        }
      }
    } catch (e) {
      console.log('RPUniverse err:', e.message)
    }

    // 2. DeluxeMenus
    try {
      const dmFiles = await sftp.list('/plugins/DeluxeMenus/gui_menus').catch(() => [])
      console.log('=== /plugins/DeluxeMenus/gui_menus ===')
      dmFiles.forEach(f => console.log(`  ${f.name}`))
      for (const f of dmFiles) {
        if (/bal|eco|bank|uang|shop/i.test(f.name)) {
          const buf = await sftp.get(`/plugins/DeluxeMenus/gui_menus/${f.name}`)
          console.log(`--- Menu ${f.name} ---`)
          console.log(buf.toString('utf-8').slice(0, 1000))
        }
      }
    } catch (e) {
      console.log('DM err:', e.message)
    }

    // 3. Denizen scripts
    try {
      const denizenFiles = await sftp.list('/plugins/Denizen/scripts').catch(() => [])
      console.log('=== /plugins/Denizen/scripts ===')
      denizenFiles.forEach(f => console.log(`  ${f.name}`))
    } catch (e) {
      console.log('Denizen err:', e.message)
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

inspectPluginsMore()
