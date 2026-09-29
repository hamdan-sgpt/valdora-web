import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function inspectDetails() {
  const sftp = new Client()
  
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })
    console.log('Connected to SFTP.\n')

    // 1. Inspect Gacha_Rass 2.0.sk
    console.log('=== 1. Gacha_Rass 2.0.sk (Pemilihan Ras) ===')
    try {
      const buf = await sftp.get('/plugins/Skript/scripts/Gacha_Rass 2.0.sk')
      const content = buf.toString('utf-8')
      const lines = content.split('\n')
      console.log('Commands defined in Gacha_Rass 2.0.sk:')
      lines.forEach((l, idx) => {
        if (l.trim().startsWith('command ') || l.trim().startsWith('permission:') || l.trim().startsWith('trigger:')) {
          console.log(`  Line ${idx+1}: ${l.trim()}`)
        }
      })
      console.log('\nFirst 40 lines snippet:')
      console.log(lines.slice(0, 40).join('\n'))
    } catch (e) {
      console.log('Error reading Gacha_Rass:', e.message)
    }

    // 2. Inspect gameplayvaldora.sk
    console.log('\n=== 2. gameplayvaldora.sk ===')
    try {
      const buf = await sftp.get('/plugins/Skript/scripts/gameplayvaldora.sk')
      const lines = buf.toString('utf-8').split('\n')
      console.log('Commands defined in gameplayvaldora.sk:')
      lines.forEach((l, idx) => {
        if (l.trim().startsWith('command ') || l.trim().startsWith('permission:')) {
          console.log(`  Line ${idx+1}: ${l.trim()}`)
        }
      })
    } catch (e) {
      console.log('Error reading gameplayvaldora.sk:', e.message)
    }

    // 3. Inspect dungeon.sk
    console.log('\n=== 3. dungeon.sk ===')
    try {
      const buf = await sftp.get('/plugins/Skript/scripts/dungeon.sk')
      const lines = buf.toString('utf-8').split('\n')
      console.log('Commands defined in dungeon.sk:')
      lines.forEach((l, idx) => {
        if (l.trim().startsWith('command ') || l.trim().startsWith('permission:')) {
          console.log(`  Line ${idx+1}: ${l.trim()}`)
        }
      })
    } catch (e) {
      console.log('Error reading dungeon.sk:', e.message)
    }

    // 4. Inspect Bansos.sk
    console.log('\n=== 4. Bansos.sk ===')
    try {
      const buf = await sftp.get('/plugins/Skript/scripts/Bansos.sk')
      const lines = buf.toString('utf-8').split('\n')
      console.log('Commands defined in Bansos.sk:')
      lines.forEach((l, idx) => {
        if (l.trim().startsWith('command ') || l.trim().startsWith('permission:')) {
          console.log(`  Line ${idx+1}: ${l.trim()}`)
        }
      })
    } catch (e) {
      console.log('Error reading Bansos.sk:', e.message)
    }

    // 5. Inspect Essentials commands & disabled commands
    console.log('\n=== 5. Essentials / CommandHider / Pl-Hide ===')
    try {
      const essBuf = await sftp.get('/plugins/Essentials/config.yml')
      const essLines = essBuf.toString('utf-8').split('\n')
      essLines.forEach(l => {
        const trimmed = l.trim()
        if (
          trimmed.startsWith('player-commands:') ||
          trimmed.startsWith('disabled-commands:') ||
          trimmed.startsWith('spawnpoint:') ||
          trimmed.startsWith('respawn-at-home:')
        ) {
          console.log(`  Essentials: ${trimmed}`)
        }
      })
    } catch (e) {
      console.log('Error reading Essentials config:', e.message)
    }

    // 6. Inspect AuthMe full config for Floodgate / bedrock hooks
    console.log('\n=== 6. AuthMe Full Bedrock & Hooks ===')
    try {
      const authBuf = await sftp.get('/plugins/AuthMe/config.yml')
      const authLines = authBuf.toString('utf-8').split('\n')
      authLines.forEach((l, idx) => {
        const trimmed = l.trim()
        if (
          trimmed.startsWith('allowedNicknameCharacters:') ||
          trimmed.startsWith('hookFloodgate:') ||
          trimmed.startsWith('autoLogin:') ||
          trimmed.startsWith('maxNickLength:') ||
          trimmed.startsWith('minNickLength:')
        ) {
          console.log(`  AuthMe Line ${idx+1}: ${l}`)
        }
      })
    } catch (e) {
      console.log('Error reading AuthMe:', e.message)
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

inspectDetails()
