import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function inspectServer() {
  const sftp = new Client()
  console.log('Connecting to SFTP server...')
  
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })
    console.log('SFTP connected successfully!\n')

    // 1. Root directory listing
    console.log('=== 1. ROOT DIRECTORY LISTING ===')
    const rootFiles = await sftp.list('/')
    console.log(rootFiles.map(f => `${f.type === 'd' ? '[DIR]' : '[FILE]'} ${f.name} (${f.size} B)`).join('\n'))

    // 2. server.properties check
    console.log('\n=== 2. SERVER.PROPERTIES AUDIT ===')
    try {
      const serverPropsBuf = await sftp.get('/server.properties')
      const serverProps = serverPropsBuf.toString('utf-8')
      const importantProps = [
        'server-port',
        'server-ip',
        'online-mode',
        'white-list',
        'enforce-whitelist',
        'enforce-secure-profile',
        'motd',
        'view-distance',
        'simulation-distance',
        'max-players'
      ]
      serverProps.split('\n').forEach(line => {
        const trimmed = line.trim()
        if (importantProps.some(p => trimmed.startsWith(`${p}=`))) {
          console.log(`  ${trimmed}`)
        }
      })
    } catch (e) {
      console.log('  Could not read /server.properties:', e.message)
    }

    // 3. Plugins directory listing
    console.log('\n=== 3. PLUGINS DIRECTORY AUDIT ===')
    let plugins = []
    try {
      plugins = await sftp.list('/plugins')
      console.log(`Total items in /plugins: ${plugins.length}`)
      const jars = plugins.filter(f => f.name.endsWith('.jar')).map(f => f.name)
      const dirs = plugins.filter(f => f.type === 'd').map(f => f.name)
      console.log('\nInstalled Plugin JARs:')
      jars.forEach(j => console.log(`  - ${j}`))
      console.log('\nPlugin Folders:')
      dirs.forEach(d => console.log(`  - ${d}`))
    } catch (e) {
      console.log('  Could not read /plugins:', e.message)
    }

    // 4. GeyserMC & Floodgate Audit
    console.log('\n=== 4. GEYSERMC & FLOODGATE (BEDROCK SUPPORT) AUDIT ===')
    const hasGeyserDir = plugins.some(p => p.name.toLowerCase().includes('geyser'))
    const hasFloodgateDir = plugins.some(p => p.name.toLowerCase().includes('floodgate'))
    console.log(`Geyser Plugin detected: ${hasGeyserDir ? 'YES' : 'NO'}`)
    console.log(`Floodgate Plugin detected: ${hasFloodgateDir ? 'YES' : 'NO'}`)

    // Check Geyser config
    const geyserConfigPaths = [
      '/plugins/Geyser-Spigot/config.yml',
      '/plugins/Geyser/config.yml'
    ]
    for (const gPath of geyserConfigPaths) {
      try {
        const buf = await sftp.get(gPath)
        console.log(`\nFound Geyser config at ${gPath}:`)
        const cfg = buf.toString('utf-8')
        cfg.split('\n').forEach(line => {
          const trimmed = line.trim()
          if (
            trimmed.startsWith('address:') ||
            trimmed.startsWith('port:') ||
            trimmed.startsWith('auth-type:') ||
            trimmed.startsWith('passthrough-motd:') ||
            trimmed.startsWith('clone-remote-port:') ||
            trimmed.startsWith('use-direct-connection:') ||
            trimmed.startsWith('auto-update:') ||
            trimmed.startsWith('enable-proxy-connections:')
          ) {
            console.log(`  ${line}`)
          }
        })
        break
      } catch {}
    }

    // Check Floodgate config
    const floodgateConfigPaths = [
      '/plugins/floodgate/config.yml',
      '/plugins/floodgate-spigot/config.yml',
      '/plugins/Floodgate/config.yml'
    ]
    for (const fPath of floodgateConfigPaths) {
      try {
        const buf = await sftp.get(fPath)
        console.log(`\nFound Floodgate config at ${fPath}:`)
        const cfg = buf.toString('utf-8')
        cfg.split('\n').forEach(line => {
          const trimmed = line.trim()
          if (
            trimmed.startsWith('username-prefix:') ||
            trimmed.startsWith('replace-spaces:') ||
            trimmed.startsWith('auto-link:') ||
            trimmed.startsWith('auth-type:')
          ) {
            console.log(`  ${line}`)
          }
        })
        break
      } catch {}
    }

    // 5. Auth plugin check (AuthMe / nLogin)
    console.log('\n=== 5. AUTH PLUGIN AUDIT (BEDROCK ACCESS CHECK) ===')
    const authMeConfigPaths = [
      '/plugins/AuthMe/config.yml',
      '/plugins/nLogin/config.yml'
    ]
    for (const aPath of authMeConfigPaths) {
      try {
        const buf = await sftp.get(aPath)
        console.log(`\nFound Auth config at ${aPath}:`)
        const cfg = buf.toString('utf-8')
        cfg.split('\n').forEach(line => {
          const trimmed = line.trim()
          if (
            trimmed.includes('allowedNicknameCharacters') ||
            trimmed.includes('regEx') ||
            trimmed.includes('minNickLength') ||
            trimmed.includes('maxNickLength') ||
            trimmed.includes('hookFloodgate') ||
            trimmed.includes('floodgate') ||
            trimmed.includes('autoLogin')
          ) {
            console.log(`  ${line}`)
          }
        })
        break
      } catch {}
    }

    // 6. LuckPerms check
    console.log('\n=== 6. LUCKPERMS (DEFAULT PERMISSIONS) AUDIT ===')
    try {
      const lpDirs = await sftp.list('/plugins/LuckPerms').catch(() => [])
      console.log('LuckPerms contents:', lpDirs.map(f => f.name).join(', '))
      
      // Try yaml storage groups
      const groupFiles = await sftp.list('/plugins/LuckPerms/yaml-storage/groups').catch(() => [])
      if (groupFiles.length > 0) {
        console.log('LuckPerms YAML groups found:', groupFiles.map(f => f.name).join(', '))
        for (const gf of groupFiles) {
          try {
            const gBuf = await sftp.get(`/plugins/LuckPerms/yaml-storage/groups/${gf.name}`)
            console.log(`\n--- Group: ${gf.name} ---`)
            console.log(gBuf.toString('utf-8'))
          } catch {}
        }
      } else {
        console.log('No yaml-storage/groups. Checking config.yml storage method...')
        const lpConfigBuf = await sftp.get('/plugins/LuckPerms/config.yml').catch(() => null)
        if (lpConfigBuf) {
          const lines = lpConfigBuf.toString('utf-8').split('\n')
          lines.forEach(l => {
            if (l.trim().startsWith('storage-method:')) {
              console.log('  LuckPerms storage method:', l.trim())
            }
          })
        }
      }
    } catch (e) {
      console.log('  Could not inspect LuckPerms:', e.message)
    }

    // 7. Skript scripts listing
    console.log('\n=== 7. SKRIPT SCRIPTS AUDIT ===')
    try {
      const scripts = await sftp.list('/plugins/Skript/scripts').catch(() => [])
      console.log(`Total scripts in /plugins/Skript/scripts: ${scripts.length}`)
      scripts.forEach(s => console.log(`  - ${s.name} (${s.size} B)`))
    } catch (e) {
      console.log('  Could not inspect Skript scripts:', e.message)
    }

  } catch (err) {
    console.error('SFTP Inspection Error:', err)
  } finally {
    await sftp.end()
    console.log('\nSFTP connection closed.')
  }
}

inspectServer()
