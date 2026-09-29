import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function readKits() {
  const sftp = new Client()
  await sftp.connect({
    host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
    port: Number(process.env.FTP_PORT) || 2022,
    username: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD
  })
  
  const kitsBuf = await sftp.get('/plugins/Essentials/kits.yml').catch(() => null)
  if (kitsBuf) {
    console.log('--- Essentials kits.yml full ---')
    console.log(kitsBuf.toString('utf-8'))
  }

  // Check Essentials/kits folder
  const kitFiles = await sftp.list('/plugins/Essentials/kits').catch(() => [])
  console.log('Essentials/kits files:', kitFiles.map(f => f.name).join(', '))

  // Check RPGIdentityCard config
  const rpgCfg = await sftp.get('/plugins/RPGIdentityCard/config.yml').catch(() => null)
  if (rpgCfg) {
    console.log('--- RPGIdentityCard config.yml ---')
    console.log(rpgCfg.toString('utf-8').slice(0, 1000))
  }

  // Check AuraSkills config
  const auraCfg = await sftp.get('/plugins/AuraSkills/config.yml').catch(() => null)
  if (auraCfg) {
    console.log('--- AuraSkills config.yml ---')
    const lines = auraCfg.toString('utf-8').split('\n')
    lines.filter(l => l.trim().startsWith('permission') || l.trim().startsWith('commands:') || l.trim().startsWith('disabled_skills:')).forEach(l => console.log('  ' + l))
  }

  await sftp.end()
}

readKits()
