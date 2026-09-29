import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function checkRemote() {
  const sftp = new Client()
  await sftp.connect({
    host: process.env.FTP_HOST,
    port: Number(process.env.FTP_PORT),
    username: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD
  })

  const hash = 'ad136d3b188c6ad376f1963364836c72b838f370cdb1ee16c889c3eb46f21498'
  const remoteFiles = await sftp.list('/plugins/SkinsRestorer/skins')
  const matched = remoteFiles.filter(f => f.name.includes(hash))
  console.log('Remote matches for KoarKoar hash:', matched.map(m => m.name))

  for (const m of matched) {
    const buf = await sftp.get(`/plugins/SkinsRestorer/skins/${m.name}`)
    console.log(`Content of ${m.name}:`, buf.toString('utf-8'))
  }

  await sftp.end()
}

checkRemote()
