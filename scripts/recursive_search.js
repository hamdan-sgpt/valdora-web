import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

async function recursiveSearch() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST || 'game-gnl-jh3.raznar.net',
      port: Number(process.env.FTP_PORT) || 2022,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })
    console.log('SFTP connected.')

    async function searchDir(dirPath, depth = 0) {
      if (depth > 4) return
      let items = []
      try {
        items = await sftp.list(dirPath)
      } catch (err) {
        return
      }

      for (const item of items) {
        const fullPath = `${dirPath}/${item.name}`
        if (/runish|eeco/i.test(item.name)) {
          console.log(`[NAME MATCH] ${fullPath}`)
        }

        if (item.type === 'd') {
          // Skip huge asset or world dirs
          if (/world|logs|cache|backup|crash-reports/i.test(item.name)) continue
          if (dirPath === '/plugins' && /FastAsyncWorldEdit|CoreProtect|ViaVersion|Chunky/i.test(item.name)) continue
          await searchDir(fullPath, depth + 1)
        } else if (item.type === '-') {
          if (/\.(yml|yaml|json|sk|properties|txt|conf)$/i.test(item.name) && item.size < 500000) {
            try {
              const buf = await sftp.get(fullPath)
              const text = buf.toString('utf-8')
              if (/runish/i.test(text)) {
                console.log(`[CONTENT MATCH RUNISH] ${fullPath}`)
              }
              if (/eeco\b/i.test(text)) {
                console.log(`[CONTENT MATCH EECO] ${fullPath}`)
              }
            } catch {}
          }
        }
      }
    }

    console.log('Searching in /plugins...')
    await searchDir('/plugins')

    console.log('Search completed.')

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await sftp.end()
  }
}

recursiveSearch()
