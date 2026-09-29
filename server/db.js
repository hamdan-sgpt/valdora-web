import { DatabaseSync } from 'node:sqlite'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Menghitung UUID v3 pemain Minecraft secara offline (Algoritma resmi Spigot/Purpur)
 */
export function getOfflineMinecraftUUID(username) {
  if (!username || typeof username !== 'string') return null
  const clean = username.trim()
  const md5Bytes = crypto.createHash('md5').update('OfflinePlayer:' + clean).digest()
  md5Bytes[6] = (md5Bytes[6] & 0x0f) | 0x30
  md5Bytes[8] = (md5Bytes[8] & 0x3f) | 0x80

  const hex = md5Bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Validasi ketat format UUID Minecraft (v3/v4 berhyphen atau hex 32 karakter)
 * Mencegah path traversal dan injection pada query file & DB.
 */
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$|^[0-9a-fA-F]{32}$/

export function isValidMinecraftUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false
  return UUID_REGEX.test(uuid.trim())
}

export function escapeRegex(str) {
  if (!str) return ''
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const LIVE_DATA_DIR = path.resolve('server', 'live_data')

export function getPaths() {
  // 1. Cek apakah ada folder plugins langsung (ketika di-hosting bareng server Minecraft)
  const candidates = [
    process.env.MC_SERVER_PATH,
    path.resolve('..', 'plugins'),
    path.resolve('plugins'),
    path.resolve('/home/container/plugins')
  ].filter(Boolean)

  for (const cPath of candidates) {
    const testAuthMe = path.join(cPath, 'AuthMe', 'authme.db')
    if (fs.existsSync(testAuthMe)) {
      const rootDir = path.resolve(cPath, '..')
      return {
        isLive: true,
        isDirect: true,
        authmeDbPath: testAuthMe,
        bpDbPath: path.join(cPath, 'BattlePass', 'battlepass.db'),
        rpgIdentitiesPath: path.join(cPath, 'RPGIdentityCard', 'data', 'identities.yml'),
        rewardsPath: path.join(cPath, 'BattlePass', 'rewards.yml'),
        skillsDir: path.join(cPath, 'AuraSkills', 'userdata'),
        skriptVarsPath: path.join(cPath, 'Skript', 'variables.csv'),
        luckpermsDbPath: path.join(cPath, 'LuckPerms', 'luckperms-h2-v2.mv.db'),
        skinsRestorerDir: path.join(cPath, 'SkinsRestorer'),
        essentialsUserdataDir: path.join(cPath, 'Essentials', 'userdata'),
        usercachePath: path.join(rootDir, 'usercache.json'),
        liveStatusPath: path.resolve('live_status.json'),
        nloginPath: null
      }
    }
  }

  // 2. Mode lokal cache SFTP
  const liveAuthMe = path.join(LIVE_DATA_DIR, 'AuthMe', 'authme.db')
  const liveBP = path.join(LIVE_DATA_DIR, 'BattlePass', 'battlepass.db')
  const liveRPG = path.join(LIVE_DATA_DIR, 'RPGIdentityCard', 'data', 'identities.yml')
  const liveRewards = path.join(LIVE_DATA_DIR, 'BattlePass', 'rewards.yml')
  const liveSkillsDir = path.join(LIVE_DATA_DIR, 'AuraSkills', 'userdata')
  const liveSkript = path.join(LIVE_DATA_DIR, 'Skript', 'variables.csv')
  const liveLuckPerms = path.join(LIVE_DATA_DIR, 'LuckPerms', 'luckperms-h2-v2.mv.db')
  const liveSkinsRestorer = path.join(LIVE_DATA_DIR, 'SkinsRestorer')
  const liveEssentials = path.join(LIVE_DATA_DIR, 'Essentials', 'userdata')

  return {
    isLive: fs.existsSync(liveAuthMe),
    isDirect: false,
    authmeDbPath: fs.existsSync(liveAuthMe) ? liveAuthMe : null,
    bpDbPath: fs.existsSync(liveBP) ? liveBP : null,
    rpgIdentitiesPath: fs.existsSync(liveRPG) ? liveRPG : null,
    rewardsPath: fs.existsSync(liveRewards) ? liveRewards : null,
    skillsDir: fs.existsSync(liveSkillsDir) ? liveSkillsDir : null,
    skriptVarsPath: fs.existsSync(liveSkript) ? liveSkript : null,
    luckpermsDbPath: fs.existsSync(liveLuckPerms) ? liveLuckPerms : null,
    skinsRestorerDir: fs.existsSync(liveSkinsRestorer) ? liveSkinsRestorer : null,
    essentialsUserdataDir: fs.existsSync(liveEssentials) ? liveEssentials : null,
    usercachePath: path.join(LIVE_DATA_DIR, 'usercache.json'),
    liveStatusPath: path.resolve('live_status.json'),
    nloginPath: null
  }
}

let cachedAuthMeDb = null
let cachedBpDb = null
let mysqlPool = null

/**
 * Tutup koneksi SQLite sementara agar file database bisa diupdate dengan aman tanpa locking di Windows
 */
export function resetDbCache() {
  cachedPlayersList = null
  lastPlayersFetchTime = 0
  cachedEconomyMap = null
  lastEconomyFetchTime = 0
}

/**
 * Pool koneksi MySQL jika dikonfigurasi di .env
 */
export function getMySQLPool() {
  if (process.env.DB_HOST && process.env.DB_USER) {
    if (!mysqlPool) {
      try {
        mysqlPool = mysql.createPool({
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'authme',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 5000
        })
        console.log(`[DB] MySQL pool aktif: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'authme'}`)
      } catch (err) {
        console.warn('[DB] Gagal membuat pool MySQL:', err.message)
        mysqlPool = null
      }
    }
    return mysqlPool
  }
  return null
}

/**
 * Membuka koneksi AuthMe DB sesaat dan otomatis menutupnya setelah query selesai
 * agar file tidak terkunci di OS Windows.
 */
export function withAuthMeDb(callback) {
  const { authmeDbPath } = getPaths()
  if (!authmeDbPath || !fs.existsSync(authmeDbPath)) return null
  let db = null
  try {
    db = new DatabaseSync(authmeDbPath, { readOnly: true })
    return callback(db)
  } catch (err) {
    console.warn('[DB] AuthMe query error:', err.message)
    return null
  } finally {
    if (db) {
      try { db.close() } catch {}
    }
  }
}

/**
 * Membuka koneksi BattlePass DB sesaat dan otomatis menutupnya setelah query selesai
 */
export function withBattlePassDb(callback) {
  const { bpDbPath } = getPaths()
  if (!bpDbPath || !fs.existsSync(bpDbPath)) return null
  let db = null
  try {
    db = new DatabaseSync(bpDbPath, { readOnly: true })
    return callback(db)
  } catch (err) {
    console.warn('[DB] BattlePass query error:', err.message)
    return null
  } finally {
    if (db) {
      try { db.close() } catch {}
    }
  }
}

function formatUuid(hex) {
  if (!hex) return null
  const clean = String(hex).replace(/-/g, '')
  if (clean.length !== 32) return String(hex)
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`
}

/**
 * Membaca data BattlePass player live dari battlepass.db (tabel bp_players)
 */
export function getPlayerBattlePass(username, candidateUuid) {
  const row = withBattlePassDb(bpDb => {
    let r = null
    if (candidateUuid) {
      r = bpDb.prepare('SELECT * FROM bp_players WHERE uuid = ? LIMIT 1').get(candidateUuid)
    }
    if (!r && username) {
      r = bpDb.prepare('SELECT * FROM bp_players WHERE LOWER(player_name) = ? LIMIT 1').get(username.toLowerCase())
    }
    return r
  })

  if (row) {
    const isPrem = Boolean(row.premium)
    const tier = Number(row.tier) || 1
    const xp = Number(row.xp) || 0
    const claimedFree = row.claimed_free ? String(row.claimed_free).split(',').filter(Boolean) : []
    const claimedPrem = row.claimed_premium ? String(row.claimed_premium).split(',').filter(Boolean) : []
    const completedQuests = row.completed_quests ? String(row.completed_quests).split(',').filter(Boolean) : []

    return {
      passId: isPrem ? 'premium' : 'free',
      isPremium: isPrem,
      passName: isPrem ? 'BattlePass Premium ★' : 'BattlePass Free',
      tier: Math.min(Math.max(tier, 1), 35),
      maxTiers: 35,
      points: xp,
      maxPoints: 1000,
      completedDaily: completedQuests.length,
      claimedFree,
      claimedPremium: claimedPrem,
      completedQuests,
      questProgress: row.quest_progress || '',
      lastReset: row.last_daily_reset || '',
      status: isPrem ? 'VIP Premium Pass (35 Tier)' : 'Free Pass (35 Tier)',
      isReal: true,
      uuid: row.uuid
    }
  }

  // Standar default jika belum tercatat di battlepass.db
  return {
    passId: 'free',
    isPremium: false,
    passName: 'BattlePass Free',
    tier: 1,
    maxTiers: 35,
    points: 0,
    maxPoints: 1000,
    completedDaily: 0,
    claimedFree: [],
    claimedPremium: [],
    completedQuests: [],
    status: 'Free Tier (35 Tier)',
    isReal: false
  }
}

function decodeSkriptHex(hexStr) {
  if (!hexStr) return null
  const clean = hexStr.trim()
  const hex = clean.startsWith('80') ? clean.slice(4) : clean
  try {
    return Buffer.from(hex, 'hex').toString('utf8').trim()
  } catch {
    return null
  }
}

export function getPlayerUuidFromCache(username) {
  if (!username) return null
  const { usercachePath } = getPaths()
  if (usercachePath && fs.existsSync(usercachePath)) {
    try {
      const cache = JSON.parse(fs.readFileSync(usercachePath, 'utf8'))
      const found = cache.find(x => x.name && x.name.toLowerCase() === username.toLowerCase())
      if (found && found.uuid) return found.uuid
    } catch {}
  }
  return null
}

export function getPlayerSkriptRace(uuid) {
  if (!uuid || !isValidMinecraftUUID(uuid)) return null
  const { skriptVarsPath } = getPaths()
  if (!skriptVarsPath || !fs.existsSync(skriptVarsPath)) return null
  try {
    const cleanUuid = escapeRegex(String(uuid).trim().toLowerCase())
    const formatted = escapeRegex(formatUuid(cleanUuid) || cleanUuid)
    const raw = escapeRegex(cleanUuid.replace(/-/g, ''))
    const content = fs.readFileSync(skriptVarsPath, 'utf8')
    const regex = new RegExp(`^ras::(?:${cleanUuid}|${formatted}|${raw}),\\s*string,\\s*([a-f0-9]+)`, 'mi')
    const match = content.match(regex)
    if (match) {
      return decodeSkriptHex(match[1])
    }
  } catch (err) {
    console.warn('[DB Skript Vars Read Error]:', err.message)
  }
  return null
}

export function getPlayerLuckPermsData(uuid, username) {
  const { luckpermsDbPath } = getPaths()
  const cleanUuid = (uuid || '').toLowerCase().trim()
  const cleanName = (username || '').toLowerCase().trim()

  // 1. Periksa apakah pemain adalah staf resmi di getStaffTeam()
  const staff = getStaffTeam()
  const officialStaff = staff.find(s => 
    (cleanName && s.ign?.toLowerCase() === cleanName) ||
    (cleanName && s.altIgn?.toLowerCase() === cleanName) ||
    (cleanUuid && s.uuid?.toLowerCase() === cleanUuid)
  )

  const raceKeys = [
    'raja-xylvos', 'raja-human', 'raja-zalvashar', 'raja-zelvashar', 'raja-grozmarr', 'raja-grozmar', 'raja-xurgoth', 'raja-elf', 'raja-demon', 'raja-dwarf',
    'xylvos', 'human', 'zelvashar', 'grozmarr', 'grozmar', 'xurgoth', 'elf', 'demon', 'dwarf',
    'valthor'
  ]
  const staffKeys = ['delveloper', 'modeler', 'petugas', 'admin', 'owner']

  let foundRace = null
  let foundStaff = null

  if (luckpermsDbPath && fs.existsSync(luckpermsDbPath)) {
    try {
      const text = fs.readFileSync(luckpermsDbPath, 'latin1')
      let targetUuid = (cleanUuid && isValidMinecraftUUID(cleanUuid)) ? cleanUuid : null
      if (!targetUuid && cleanName) {
        const cached = getPlayerUuidFromCache(cleanName)
        if (cached && isValidMinecraftUUID(cached)) {
          targetUuid = cached.toLowerCase()
        }
      }

      // Cari permission node group per UUID agar TIDAK terkontaminasi oleh log audit perintah admin
      if (targetUuid) {
        const regex = new RegExp(escapeRegex(targetUuid) + '[^\\n\\r]{0,60}?(group\\.[a-zA-Z0-9_\\-]+)', 'gi')
        let m
        while ((m = regex.exec(text)) !== null) {
          const fullGroup = m[1].toLowerCase()
          const gName = fullGroup.replace('group.', '').replace(/ajglobal.*/, '').replace(/0f$/, '').trim()
          for (const rk of raceKeys) {
            if (gName === rk) {
              if (!foundRace || rk.startsWith('raja-')) foundRace = rk
            }
          }
          for (const sk of staffKeys) {
            if (gName === sk) {
              foundStaff = sk
            }
          }
        }
      }
    } catch (err) {
      console.warn('[DB LuckPerms Parse Error]:', err.message)
    }
  }

  // Jika staf resmi terdaftar
  if (officialStaff) {
    let roleRank = officialStaff.role || 'Staff'
    if (officialStaff.roleBadge === 'FOUNDER') roleRank = 'Founder'
    else if (officialStaff.roleBadge === 'LEAD DEV') roleRank = 'Developer'
    else if (officialStaff.roleBadge === 'SKRIPTER') roleRank = 'Lead Skripter'
    else if (officialStaff.roleBadge === 'MODELER') roleRank = 'Modeler'

    return {
      race: foundRace,
      rank: roleRank,
      roleBadge: officialStaff.roleBadge || 'STAFF',
      isStaff: true
    }
  }

  // Jika memiliki grup staf langsung di LuckPerms
  if (foundStaff) {
    let rank = 'Staff'
    let roleBadge = 'STAFF'
    if (foundStaff === 'delveloper') { rank = 'Developer'; roleBadge = 'DEV'; }
    else if (foundStaff === 'modeler') { rank = 'Modeler'; roleBadge = 'MODELER'; }
    else if (foundStaff === 'petugas') { rank = 'Staff Petugas'; roleBadge = 'STAFF'; }
    else if (foundStaff === 'admin') { rank = 'Administrator'; roleBadge = 'ADMIN'; }
    else if (foundStaff === 'owner') { rank = 'Owner'; roleBadge = 'OWNER'; }

    return {
      race: foundRace,
      rank,
      roleBadge,
      isStaff: true
    }
  }

  // Pemain biasa (bukan staf)
  return {
    race: foundRace,
    rank: null,
    roleBadge: null,
    isStaff: false
  }
}

/**
 * Membaca data kartu fisik RPGIdentityCard pemain jika tersedia
 * Dilindungi dari Path Traversal dan ReDoS.
 */
export function getPlayerCardData(uuid) {
  if (!uuid || !isValidMinecraftUUID(uuid)) return null
  const { rpgIdentitiesPath } = getPaths()
  if (!rpgIdentitiesPath || !fs.existsSync(rpgIdentitiesPath)) return null
  try {
    const content = fs.readFileSync(rpgIdentitiesPath, 'utf8')
    const cleanUuid = escapeRegex(String(uuid).trim().toLowerCase())
    const regex = new RegExp(`(?:^|\\n)\\s*${cleanUuid}:([\\s\\S]*?)(?=\\n\\s*[a-f0-9\\-]+:|$)`, 'i')
    const match = content.match(regex)
    if (match) {
      const block = match[1]
      const namaM = block.match(/nama:\s*['"]?([^'"\r\n]+)['"]?/i)
      const umurM = block.match(/umur:\s*(\d+)/i)
      const profesiM = block.match(/profesi:\s*([^\r\n]+)/i)
      const raceM = block.match(/race:\s*([^\r\n]+)/i)
      const idNumM = block.match(/idNumber:\s*([^\r\n]+)/i)
      const regM = block.match(/registered:\s*(true|false)/i)
      return {
        nama: namaM ? namaM[1].trim() : null,
        umur: umurM ? parseInt(umurM[1], 10) : 20,
        profesi: profesiM ? profesiM[1].trim() : null,
        race: raceM ? raceM[1].trim().toUpperCase() : null,
        idNumber: idNumM ? idNumM[1].trim() : null,
        registered: regM ? regM[1].toLowerCase() === 'true' : false
      }
    }
  } catch (err) {
    console.warn('[DB RPG Card Error]:', err.message)
  }
  return null
}

/**
 * Membaca data identitas & ras player live dari LuckPerms, RPGIdentityCard, & Skript
 */
export function getPlayerRPGIdentity(rawUuid, fallbackUsername) {
  const uuid = rawUuid ? String(rawUuid) : ''
  const lpData = getPlayerLuckPermsData(uuid, fallbackUsername)
  const skriptRace = getPlayerSkriptRace(uuid)
  const cardData = getPlayerCardData(uuid)

  const raceMap = {
    // 0. Bangsa Human & Takhta Raja Human (Xyl'vos)
    'RAJA-XYLVOS': {
      name: "Raja Xyl'vos",
      title: 'Raja Bangsa Human',
      tier: 'Raja Ras',
      badgeColor: '#38bdf8',
      lore: "Pemimpin takhta tertinggi bangsa Human (Xyl'vos) Valdora dengan otoritas petir purba dan kedaulatan mutlak."
    },
    'RAJA-HUMAN': {
      name: "Raja Xyl'vos",
      title: 'Raja Bangsa Human',
      tier: 'Raja Ras',
      badgeColor: '#38bdf8',
      lore: "Pemimpin takhta tertinggi bangsa Human (Xyl'vos) Valdora dengan otoritas petir purba dan kedaulatan mutlak."
    },
    'XYLVOS': {
      name: "Human (Xyl'vos)",
      title: 'Bangsa Pejuang Celestial',
      tier: 'Bangsa Human',
      badgeColor: '#38bdf8',
      lore: "Ksatria Human berdaya petir kosmik yang memiliki ketangkasan tinggi, stamina tangguh, dan sambaran petir surga."
    },
    'HUMAN': {
      name: "Human (Xyl'vos)",
      title: 'Bangsa Pejuang Celestial',
      tier: 'Bangsa Human',
      badgeColor: '#38bdf8',
      lore: "Ksatria Human berdaya petir kosmik yang memiliki ketangkasan tinggi, stamina tangguh, dan sambaran petir surga."
    },

    // 1. Bangsa Elf & Takhta Raja Elf (Zel'vashar)
    'RAJA-ZALVASHAR': {
      name: "Raja Zel'vashar",
      title: 'Raja Bangsa Elf',
      tier: 'Raja Ras',
      badgeColor: '#22c55e',
      lore: 'Pemimpin takhta tertinggi bangsa Elf Valdora dengan otoritas sihir rimba purba dan berkah kehidupan abadi.'
    },
    'RAJA-ZELVASHAR': {
      name: "Raja Zel'vashar",
      title: 'Raja Bangsa Elf',
      tier: 'Raja Ras',
      badgeColor: '#22c55e',
      lore: 'Pemimpin takhta tertinggi bangsa Elf Valdora dengan otoritas sihir rimba purba dan berkah kehidupan abadi.'
    },
    'RAJA-ELF': {
      name: "Raja Zel'vashar",
      title: 'Raja Bangsa Elf',
      tier: 'Raja Ras',
      badgeColor: '#22c55e',
      lore: 'Pemimpin takhta tertinggi bangsa Elf Valdora dengan otoritas sihir rimba purba dan berkah kehidupan abadi.'
    },
    'ZELVASHAR': {
      name: "Elf (Zel'vashar)",
      title: 'Bangsa Peri Rimba',
      tier: 'Bangsa Elf',
      badgeColor: '#22c55e',
      lore: 'Penjaga rimba purba dan kedalaman alam Valdora dengan kelincahan tinggi, regenerasi alami, dan afinitas sihir rimba.'
    },
    'ELF': {
      name: "Elf (Zel'vashar)",
      title: 'Bangsa Peri Rimba',
      tier: 'Bangsa Elf',
      badgeColor: '#22c55e',
      lore: 'Penjaga rimba purba dan kedalaman alam Valdora dengan kelincahan tinggi, regenerasi alami, dan afinitas sihir rimba.'
    },

    // 2. Bangsa Demon & Takhta Raja Demon (Xurgoth)
    'RAJA-XURGOTH': {
      name: 'Raja Xurgoth',
      title: 'Raja Bangsa Demon',
      tier: 'Raja Ras',
      badgeColor: '#a855f7',
      lore: 'Pemimpin takhta tertinggi bangsa Demon penakluk kegelapan yang menguasai kutukan purba terkuat di jagat Valdora.'
    },
    'RAJA-DEMON': {
      name: 'Raja Xurgoth',
      title: 'Raja Bangsa Demon',
      tier: 'Raja Ras',
      badgeColor: '#a855f7',
      lore: 'Pemimpin takhta tertinggi bangsa Demon penakluk kegelapan yang menguasai kutukan purba terkuat di jagat Valdora.'
    },
    'XURGOTH': {
      name: 'Demon (Xurgoth)',
      title: 'Penakluk Kegelapan',
      tier: 'Bangsa Demon',
      badgeColor: '#a855f7',
      lore: 'Bangsa perkasa penguasa kutukan purba dan energi bayangan dengan daya hancur mematikan di garis depan pertempuran.'
    },
    'DEMON': {
      name: 'Demon (Xurgoth)',
      title: 'Penakluk Kegelapan',
      tier: 'Bangsa Demon',
      badgeColor: '#a855f7',
      lore: 'Bangsa perkasa penguasa kutukan purba dan energi bayangan dengan daya hancur mematikan di garis depan pertempuran.'
    },

    // 3. Bangsa Dwarf & Takhta Raja Dwarf (Grozmar)
    'RAJA-GROZMARR': {
      name: 'Raja Grozmar',
      title: 'Raja Bangsa Dwarf',
      tier: 'Raja Ras',
      badgeColor: '#f59e0b',
      lore: 'Pemimpin takhta tertinggi bangsa Dwarf penguasa kerak bumi, tambang emas kramat, dan tungku tempa purba tak tergoyahkan.'
    },
    'RAJA-GROZMAR': {
      name: 'Raja Grozmar',
      title: 'Raja Bangsa Dwarf',
      tier: 'Raja Ras',
      badgeColor: '#f59e0b',
      lore: 'Pemimpin takhta tertinggi bangsa Dwarf penguasa kerak bumi, tambang emas kramat, dan tungku tempa purba tak tergoyahkan.'
    },
    'RAJA-DWARF': {
      name: 'Raja Grozmar',
      title: 'Raja Bangsa Dwarf',
      tier: 'Raja Ras',
      badgeColor: '#f59e0b',
      lore: 'Pemimpin takhta tertinggi bangsa Dwarf penguasa kerak bumi, tambang emas kramat, dan tungku tempa purba tak tergoyahkan.'
    },
    'GROZMARR': {
      name: 'Dwarf (Grozmar)',
      title: 'Titan Kerak Bumi & Penempa',
      tier: 'Bangsa Dwarf',
      badgeColor: '#f59e0b',
      lore: 'Penguasa kerak bumi, mineral purba, dan pandai besi dengan ketahanan fisik luar biasa serta efisiensi tambang ganda.'
    },
    'GROZMAR': {
      name: 'Dwarf (Grozmar)',
      title: 'Titan Kerak Bumi & Penempa',
      tier: 'Bangsa Dwarf',
      badgeColor: '#f59e0b',
      lore: 'Penguasa kerak bumi, mineral purba, dan pandai besi dengan ketahanan fisik luar biasa serta efisiensi tambang ganda.'
    },
    'DWARF': {
      name: 'Dwarf (Grozmar)',
      title: 'Titan Kerak Bumi & Penempa',
      tier: 'Bangsa Dwarf',
      badgeColor: '#f59e0b',
      lore: 'Penguasa kerak bumi, mineral purba, dan pandai besi dengan ketahanan fisik luar biasa serta efisiensi tambang ganda.'
    },

    // Legacy Fallback
    'VALTHOR': {
      name: 'Demon (Xurgoth)',
      title: 'Penakluk Kegelapan',
      tier: 'Bangsa Demon',
      badgeColor: '#a855f7',
      lore: 'Bangsa perkasa penguasa kutukan purba dan energi bayangan.'
    }
  }

  // Tentukan ras final: Prioritas LuckPerms -> Skript -> RPGIdentityCard -> default XYLVOS
  const chosenKey = (lpData.race || skriptRace || (cardData && cardData.race) || 'XYLVOS').toUpperCase()
  const raceInfo = raceMap[chosenKey] || raceMap['XYLVOS']
  const rank = lpData.rank || (raceInfo.tier === 'Raja Ras' ? raceInfo.title : 'Petualang')
  const roleBadge = lpData.roleBadge || (raceInfo.tier === 'Raja Ras' ? 'RAJA' : null)

  return {
    name: raceInfo.name,
    title: raceInfo.title,
    lore: raceInfo.lore,
    tier: raceInfo.tier,
    badgeColor: raceInfo.badgeColor,
    rank,
    roleBadge,
    isStaff: lpData.isStaff,
    characterName: (cardData && cardData.nama) || fallbackUsername || 'Adventurer',
    age: (cardData && cardData.umur) || 20,
    profession: lpData.isStaff ? (lpData.rank || 'Realm Creator') : ((cardData && cardData.profesi) || raceInfo.title || 'Ksatria Realm'),
    idNumber: (cardData && cardData.idNumber) || (uuid.length >= 8 ? `ID-${uuid.slice(0, 4)}-${uuid.slice(4, 8)}` : 'ID-VALDORA'),
    registered: cardData ? cardData.registered : true,
    level: 5,
    skillpoints: 3,
    isReal: Boolean(lpData.race || skriptRace || cardData || lpData.isStaff),
    uuid
  }
}

/**
 * Membaca skill AuraSkills pemain jika tersedia (semua 11 skill, XP & level)
 * Terlindungi dari Path Traversal dan Directory Escape.
 */
export function getPlayerAuraSkills(uuid) {
  const { skillsDir } = getPaths()
  if (uuid && isValidMinecraftUUID(uuid) && skillsDir && fs.existsSync(skillsDir)) {
    const cleanUuid = String(uuid).trim().toLowerCase()
    const formatted = formatUuid(cleanUuid) || cleanUuid
    const raw = cleanUuid.replace(/-/g, '')

    let sPath = path.join(skillsDir, `${cleanUuid}.yml`)
    if (!fs.existsSync(sPath) && formatted) {
      sPath = path.join(skillsDir, `${formatted}.yml`)
    }
    if (!fs.existsSync(sPath)) {
      sPath = path.join(skillsDir, `${raw}.yml`)
    }

    // Proteksi Path Traversal: pastikan file berada di dalam folder userdata
    const resolvedPath = path.resolve(sPath)
    const resolvedDir = path.resolve(skillsDir)
    if (!resolvedPath.startsWith(resolvedDir)) {
      console.warn(`[Security Alert] 🚨 Percobaan Path Traversal terdeteksi dan diblokir: "${uuid}"`)
      return null
    }

    if (fs.existsSync(sPath)) {
      try {
        const content = fs.readFileSync(sPath, 'utf8')
        const getSkill = (skillName) => {
          const lvlMatch = content.match(new RegExp(`auraskills\\/${skillName}:[\\s\\S]*?level:\\s*(\\d+)`, 'i'))
          const xpMatch = content.match(new RegExp(`auraskills\\/${skillName}:[\\s\\S]*?xp:\\s*([0-9.]+)`, 'i'))
          return {
            level: lvlMatch ? parseInt(lvlMatch[1], 10) : 0,
            xp: xpMatch ? Math.round(parseFloat(xpMatch[1])) : 0
          }
        }

        const defense = getSkill('defense')
        const fighting = getSkill('fighting')
        const mining = getSkill('mining')
        const foraging = getSkill('foraging')
        const archery = getSkill('archery')
        const agility = getSkill('agility')
        const farming = getSkill('farming')
        const fishing = getSkill('fishing')
        const alchemy = getSkill('alchemy')
        const enchanting = getSkill('enchanting')
        const excavation = getSkill('excavation')

        const manaMatch = content.match(/mana:\s*([0-9.]+)/i)
        const mana = manaMatch ? Math.round(parseFloat(manaMatch[1])) : 20

        const totalLevel = (
          defense.level + fighting.level + mining.level +
          foraging.level + archery.level + agility.level +
          farming.level + fishing.level + alchemy.level +
          enchanting.level + excavation.level
        )

        return {
          totalLevel,
          mana,
          combat: fighting.level,
          defense: defense.level,
          mining: mining.level,
          farming: farming.level,
          foraging: foraging.level,
          agility: agility.level,
          archery: archery.level,
          fishing: fishing.level,
          alchemy: alchemy.level,
          enchanting: enchanting.level,
          excavation: excavation.level,
          skills: [
            { id: 'defense', name: 'Defense', icon: '🛡', level: defense.level, xp: defense.xp, desc: 'Pertahanan armor & reduksi damage' },
            { id: 'fighting', name: 'Fighting', icon: '🗡', level: fighting.level, xp: fighting.xp, desc: 'Kekuatan tebasan pedang & critical strike' },
            { id: 'mining', name: 'Mining', icon: '⛏', level: mining.level, xp: mining.xp, desc: 'Kecepatan menambang & ekstraksi bijih ganda' },
            { id: 'foraging', name: 'Foraging', icon: '🪓', level: foraging.level, xp: foraging.xp, desc: 'Penebangan kayu pohon & drop apel emas' },
            { id: 'archery', name: 'Archery', icon: '🏹', level: archery.level, xp: archery.xp, desc: 'Ketepatan bidikan busur & charged shot' },
            { id: 'agility', name: 'Agility', icon: '🏃', level: agility.level, xp: agility.xp, desc: 'Kecepatan lari & reduksi fall damage' },
            { id: 'farming', name: 'Farming', icon: '🌾', level: farming.level, xp: farming.xp, desc: 'Hasil panen berlipat & regenerasi stamina' },
            { id: 'fishing', name: 'Fishing', icon: '🎣', level: fishing.level, xp: fishing.xp, desc: 'Pancingan harta karun laut & ikan purba' },
            { id: 'alchemy', name: 'Alchemy', icon: '🧪', level: alchemy.level, xp: alchemy.xp, desc: 'Durasi efek ramuan & ramuan brewing kuat' },
            { id: 'enchanting', name: 'Enchanting', icon: '🔮', level: enchanting.level, xp: enchanting.xp, desc: 'Efisiensi EXP lapis & sihir level tinggi' },
            { id: 'excavation', name: 'Excavation', icon: '铲', level: excavation.level, xp: excavation.xp, desc: 'Penggalian tanah liat, pasir & fosil kuno' }
          ],
          isReal: true
        }
      } catch (err) {
        console.warn(`[Skills Parse Error for ${uuid}]:`, err.message)
      }
    }
  }

  return {
    totalLevel: 65,
    mana: 20,
    combat: 12,
    defense: 10,
    mining: 15,
    farming: 8,
    foraging: 10,
    agility: 10,
    archery: 5,
    fishing: 5,
    alchemy: 5,
    enchanting: 5,
    excavation: 5,
    skills: [
      { id: 'defense', name: 'Defense', icon: '🛡', level: 10, xp: 0, desc: 'Pertahanan armor & reduksi damage' },
      { id: 'fighting', name: 'Fighting', icon: '🗡', level: 12, xp: 0, desc: 'Kekuatan tebasan pedang' },
      { id: 'mining', name: 'Mining', icon: '⛏', level: 15, xp: 0, desc: 'Kecepatan menambang bijih' },
      { id: 'foraging', name: 'Foraging', icon: '🪓', level: 10, xp: 0, desc: 'Penebangan kayu pohon' },
      { id: 'archery', name: 'Archery', icon: '🏹', level: 5, xp: 0, desc: 'Ketepatan bidikan busur panah' },
      { id: 'agility', name: 'Agility', icon: '🏃', level: 10, xp: 0, desc: 'Kecepatan lari' },
      { id: 'farming', name: 'Farming', icon: '🌾', level: 8, xp: 0, desc: 'Hasil panen tanaman' },
      { id: 'fishing', name: 'Fishing', icon: '🎣', level: 5, xp: 0, desc: 'Pancingan ikan laut' },
      { id: 'alchemy', name: 'Alchemy', icon: '🧪', level: 5, xp: 0, desc: 'Durasi ramuan sihir' },
      { id: 'enchanting', name: 'Enchanting', icon: '🔮', level: 5, xp: 0, desc: 'Efisiensi sihir enchant' },
      { id: 'excavation', name: 'Excavation', icon: '铲', level: 5, xp: 0, desc: 'Penggalian tanah & pasir' }
    ],
    isReal: false
  }
}

/**
 * Membaca data skin riil dari plugin SkinsRestorer.
 * Bekerja untuk pemain Non-Premium / Cracked maupun Premium yang mengubah skin via /skin in-game.
 * Mengembalikan { textureHash, avatarUrl, bodyUrl, skinSource: 'skinsrestorer' | 'mojang_default' }
 */
export function getPlayerSkinInfo(candidateUuid, username) {
  const { skinsRestorerDir } = getPaths()
  const cleanName = username ? String(username).trim() : 'Steve'
  const fallbackAvatar = `https://mc-heads.net/avatar/${encodeURIComponent(cleanName)}/128`
  const fallbackBody = `https://mc-heads.net/body/${encodeURIComponent(cleanName)}/280`

  if (!skinsRestorerDir || !fs.existsSync(skinsRestorerDir)) {
    return {
      textureHash: null,
      avatarUrl: fallbackAvatar,
      bodyUrl: fallbackBody,
      skinSource: 'mojang_default'
    }
  }

  const playersDir = path.join(skinsRestorerDir, 'players')
  const skinsDir = path.join(skinsRestorerDir, 'skins')

  // Kumpulkan kandidat UUID yang mungkin digunakan SkinsRestorer:
  const uuidsToTry = new Set()
  if (candidateUuid && isValidMinecraftUUID(candidateUuid)) {
    uuidsToTry.add(String(candidateUuid).toLowerCase().trim())
  }
  if (cleanName) {
    const offUuid = getOfflineMinecraftUUID(cleanName)
    if (offUuid) uuidsToTry.add(offUuid.toLowerCase().trim())
    const cachedUuid = getPlayerUuidFromCache(cleanName)
    if (cachedUuid) uuidsToTry.add(cachedUuid.toLowerCase().trim())
  }

  let skinIdent = null

  // Cari file player di SkinsRestorer/players/<uuid>.player
  for (const uid of uuidsToTry) {
    const pFile = path.join(playersDir, `${uid}.player`)
    if (fs.existsSync(pFile)) {
      try {
        const raw = fs.readFileSync(pFile, 'utf8')
        const parsed = JSON.parse(raw)
        if (parsed) {
          if (parsed.skinIdentifier) {
            skinIdent = parsed.skinIdentifier
          } else if (Array.isArray(parsed.history) && parsed.history.length > 0) {
            skinIdent = parsed.history[parsed.history.length - 1].skinIdentifier
          }
          if (skinIdent) break
        }
      } catch (err) {
        console.warn(`[SkinsRestorer] Gagal membaca data skin ${uid}:`, err.message)
      }
    }
  }

  if (!skinIdent) {
    return {
      textureHash: null,
      avatarUrl: fallbackAvatar,
      bodyUrl: fallbackBody,
      skinSource: 'mojang_default'
    }
  }

  let textureHash = null

  try {
    // KASUS 1: Tipe URL (contoh: https://textures.minecraft.net/texture/<hash> atau https://minesk.in/...)
    if (skinIdent.type === 'URL' && skinIdent.identifier) {
      const u = String(skinIdent.identifier).trim()
      if (u.includes('textures.minecraft.net/texture/')) {
        const parts = u.split('/')
        textureHash = parts[parts.length - 1].replace(/[^a-f0-9]/gi, '')
      } else {
        const sha256 = crypto.createHash('sha256').update(u).digest('hex')
        const idxFile = path.join(skinsDir, `${sha256}.urlindex`)
        if (fs.existsSync(idxFile)) {
          const idxParsed = JSON.parse(fs.readFileSync(idxFile, 'utf8'))
          if (idxParsed.url && idxParsed.url.includes('textures.minecraft.net/texture/')) {
            const parts = idxParsed.url.split('/')
            textureHash = parts[parts.length - 1].replace(/[^a-f0-9]/gi, '')
          }
        }
        if (!textureHash) {
          for (const variant of ['CLASSIC', 'SLIM']) {
            const skinFile = path.join(skinsDir, `${sha256}_${variant}.urlskin`)
            if (fs.existsSync(skinFile)) {
              const sParsed = JSON.parse(fs.readFileSync(skinFile, 'utf8'))
              if (sParsed.value) {
                const dec = JSON.parse(Buffer.from(sParsed.value, 'base64').toString('utf8'))
                const texUrl = dec.textures?.SKIN?.url
                if (texUrl) {
                  const parts = texUrl.split('/')
                  textureHash = parts[parts.length - 1].replace(/[^a-f0-9]/gi, '')
                  break
                }
              }
            }
          }
        }
      }
    }

    // KASUS 2: Tipe PLAYER atau CUSTOM
    if ((skinIdent.type === 'PLAYER' || skinIdent.type === 'CUSTOM') && skinIdent.identifier) {
      const key = String(skinIdent.identifier).trim()
      for (const ext of ['.playerskin', '.customskin']) {
        const sFile = path.join(skinsDir, `${key}${ext}`)
        if (fs.existsSync(sFile)) {
          const sParsed = JSON.parse(fs.readFileSync(sFile, 'utf8'))
          if (sParsed.value) {
            const dec = JSON.parse(Buffer.from(sParsed.value, 'base64').toString('utf8'))
            const texUrl = dec.textures?.SKIN?.url
            if (texUrl) {
              const parts = texUrl.split('/')
              textureHash = parts[parts.length - 1].replace(/[^a-f0-9]/gi, '')
              break
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[SkinsRestorer] Gagal mengekstrak hash tekstur skin:', err.message)
  }

  // Jika hash tekstur berhasil didapatkan dari SkinsRestorer
  if (textureHash && /^[a-f0-9]{32,64}$/i.test(textureHash)) {
    return {
      textureHash,
      avatarUrl: `https://mc-heads.net/avatar/${textureHash}/128`,
      bodyUrl: `https://mc-heads.net/body/${textureHash}/280`,
      skinUrl: `https://textures.minecraft.net/texture/${textureHash}`,
      skinSource: 'skinsrestorer'
    }
  }

  return {
    textureHash: null,
    avatarUrl: fallbackAvatar,
    bodyUrl: fallbackBody,
    skinSource: 'mojang_default'
  }
}

/**
 * Mencari data akun pemain berdasarkan username (Case-Insensitive).
 * STRICTLY READ-ONLY dari live database server AuthMe & BattlePass.
 */
export async function getPlayerByUsername(username) {
  if (!username || typeof username !== 'string') return null
  const cleanUsername = username.trim().toLowerCase()

  // Validasi format: Hanya karakter sah Minecraft Java & Bedrock (maks 16 karakter)
  // Mencegah SQL Injection & ReDoS sebelum query DB
  if (!/^\.?[a-zA-Z0-9_]{1,16}$/.test(cleanUsername)) {
    return null
  }

  // 0. Coba baca dari Database MySQL live jika terhubung
  const pool = getMySQLPool()
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM authme WHERE LOWER(username) = ? LIMIT 1', [cleanUsername])
      if (rows && rows.length > 0) {
        const user = rows[0]
        const offlineUuid = getOfflineMinecraftUUID(user.realname || user.username)
        const battlePass = getPlayerBattlePass(user.username, offlineUuid)
        const realUuid = battlePass.uuid || offlineUuid || formatUuid(user.id) || null
        const race = getPlayerRPGIdentity(realUuid, user.realname || user.username)
        const stats = getPlayerAuraSkills(race.uuid || realUuid)
        const skinInfo = getPlayerSkinInfo(race.uuid || realUuid, user.realname || user.username)

        return {
          last_name: user.realname || user.username,
          unique_id: realUuid || 'live-valdora-player',
          password: user.password,
          premium: battlePass.isPremium,
          last_seen: user.lastlogin ? Number(user.lastlogin) : Date.now(),
          regdate: user.regdate ? Number(user.regdate) : null,
          ip: user.ip,
          email: user.email,
          race,
          battlePass,
          stats,
          economy: getPlayerEconomy(realUuid, user.realname || user.username),
          avatarUrl: skinInfo.avatarUrl,
          bodyUrl: skinInfo.bodyUrl,
          skinInfo,
          isRealDb: true,
          source: 'mysql'
        }
      }
    } catch (err) {
      console.warn('[DB MySQL Query Error]:', err.message)
    }
  }

  // 1. Coba baca dari Database AuthMe server live (authme.db)
  const user = withAuthMeDb(authme => {
    return authme.prepare('SELECT * FROM authme WHERE LOWER(username) = ? LIMIT 1').get(cleanUsername)
  })

  if (user) {
    const cachedUuid = getPlayerUuidFromCache(user.realname || user.username)
    const offlineUuid = getOfflineMinecraftUUID(user.realname || user.username)
    // Ambil data BattlePass live
    const battlePass = getPlayerBattlePass(user.username, cachedUuid || offlineUuid)
    const realUuid = cachedUuid || battlePass.uuid || offlineUuid || formatUuid(user.id) || null
    const race = getPlayerRPGIdentity(realUuid, user.realname || user.username)
    const stats = getPlayerAuraSkills(race.uuid || realUuid)
    const skinInfo = getPlayerSkinInfo(race.uuid || realUuid, user.realname || user.username)

    return {
      last_name: user.realname || user.username,
      unique_id: realUuid || 'live-valdora-player',
      password: user.password,
      premium: battlePass.isPremium,
      last_seen: user.lastlogin ? Number(user.lastlogin) : Date.now(),
      regdate: user.regdate ? Number(user.regdate) : null,
      ip: user.ip,
      email: user.email,
      race,
      battlePass,
      stats,
      economy: getPlayerEconomy(realUuid, user.realname || user.username),
      avatarUrl: skinInfo.avatarUrl,
      bodyUrl: skinInfo.bodyUrl,
      skinInfo,
      isRealDb: true
    }
  }

  // 2. Fallback jika masih ada nlogin.db
  const { nloginPath } = getPaths()
  if (nloginPath && fs.existsSync(nloginPath)) {
    let nloginDb = null
    try {
      nloginDb = new DatabaseSync(nloginPath, { readOnly: true })
      let user = nloginDb.prepare('SELECT * FROM nlogin WHERE LOWER(last_name) = ? LIMIT 1').get(cleanUsername)
      if (!user && !cleanUsername.startsWith('.')) {
        user = nloginDb.prepare('SELECT * FROM nlogin WHERE LOWER(last_name) = ? LIMIT 1').get('.' + cleanUsername)
      }
      if (user) {
        const uuid = formatUuid(user.unique_id) || formatUuid(user.bedrock_id)
        const battlePass = getPlayerBattlePass(user.last_name, uuid)
        const race = getPlayerRPGIdentity(uuid, user.last_name)
        const stats = getPlayerAuraSkills(uuid)
        const skinInfo = getPlayerSkinInfo(uuid, user.last_name)

        return {
          last_name: user.last_name,
          unique_id: uuid,
          password: user.password,
          premium: Boolean(user.mojang_id || battlePass.isPremium),
          last_seen: user.last_seen ? Number(user.last_seen) : Date.now(),
          email: user.email,
          discord: user.discord,
          race,
          battlePass,
          stats,
          avatarUrl: skinInfo.avatarUrl,
          bodyUrl: skinInfo.bodyUrl,
          skinInfo,
          isRealDb: true
        }
      }
    } catch (err) {
      console.warn('[DB nLogin Fallback Error]:', err.message)
    } finally {
      if (nloginDb) {
        try { nloginDb.close() } catch {}
      }
    }
  }

  return null
}

let cachedEconomyMap = null
let lastEconomyFetchTime = 0
const ECONOMY_CACHE_TTL = 15000 // 15 detik cache memori

export function formatRunish(val) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0
  return num.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' Runish'
}

export function formatRunishCompact(val) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M Runish'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K Runish'
  }
  return num.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' Runish'
}

/**
 * Membaca data ekonomi (Essentials userdata / eeco) untuk semua pemain
 */
export function getEssentialsEconomyMap() {
  const now = Date.now()
  if (cachedEconomyMap && (now - lastEconomyFetchTime) < ECONOMY_CACHE_TTL) {
    return cachedEconomyMap
  }

  const { essentialsUserdataDir } = getPaths()
  const byUuid = new Map()
  const byUsername = new Map()
  const list = []

  if (essentialsUserdataDir && fs.existsSync(essentialsUserdataDir)) {
    try {
      const files = fs.readdirSync(essentialsUserdataDir)
      for (const file of files) {
        if (!file.endsWith('.yml')) continue
        try {
          const filePath = path.join(essentialsUserdataDir, file)
          const text = fs.readFileSync(filePath, 'utf8')
          
          let money = 0
          let username = ''
          const moneyMatch = text.match(/money:\s*['"]?([0-9.]+)/)
          if (moneyMatch) {
            money = parseFloat(moneyMatch[1]) || 0
          }
          const nameMatch = text.match(/last-account-name:\s*([^\r\n]+)/)
          if (nameMatch) {
            username = nameMatch[1].trim()
          }

          const uuid = file.replace('.yml', '')
          const record = {
            uuid,
            username: username || uuid,
            money,
            formattedMoney: formatRunish(money),
            compactMoney: formatRunishCompact(money)
          }

          byUuid.set(uuid.toLowerCase(), record)
          if (username) {
            byUsername.set(username.toLowerCase(), record)
          }
          list.push(record)
        } catch {}
      }
    } catch (err) {
      console.warn('[DB getEssentialsEconomyMap error]:', err.message)
    }
  }

  // Urutkan baltop tertinggi
  list.sort((a, b) => b.money - a.money)

  const result = { byUuid, byUsername, list }
  cachedEconomyMap = result
  lastEconomyFetchTime = now
  return result
}

/**
 * Mengambil status ekonomi (Runish) satu pemain berdasarkan UUID atau username
 */
export function getPlayerEconomy(uuid, username) {
  const eco = getEssentialsEconomyMap()
  let record = null

  if (uuid) {
    record = eco.byUuid.get(uuid.toLowerCase())
  }
  if (!record && username) {
    record = eco.byUsername.get(username.toLowerCase())
  }

  if (record) {
    return {
      money: record.money,
      formatted: record.formattedMoney,
      compact: record.compactMoney,
      currency: 'Runish',
      currencySymbol: '🪙'
    }
  }

  return {
    money: 0,
    formatted: '0 Runish',
    compact: '0 Runish',
    currency: 'Runish',
    currencySymbol: '🪙'
  }
}

/**
 * Mengambil papan peringkat Baltop (Kekayaan Runish) dengan informasi Ras, Rank, & Avatar
 */
export function getBaltopLeaderboard({ limit = 100, page = 1, search = '', race = 'all' } = {}) {
  const eco = getEssentialsEconomyMap()
  let list = eco.list

  // Filter Search Nama
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    list = list.filter(p => p.username.toLowerCase().includes(q))
  }

  // Enrich data dengan Ras, Rank, BP, dan Skin
  const enrichedList = list.map((item, idx) => {
    const raceData = getPlayerRPGIdentity(item.uuid, item.username)
    const bp = getPlayerBattlePass(item.username, item.uuid)
    const skinInfo = getPlayerSkinInfo(item.uuid, item.username)

    let raceId = 'human'
    const rName = (raceData.name || '').toLowerCase()
    if (rName.includes('elf') || rName.includes("zel'vashar")) raceId = 'elf'
    else if (rName.includes('demon') || rName.includes('xurgoth')) raceId = 'demon'
    else if (rName.includes('dwarf') || rName.includes('grozmar')) raceId = 'dwarf'
    else raceId = 'human'

    const avatarUrl = skinInfo.textureHash
      ? `https://mc-heads.net/avatar/${skinInfo.textureHash}/48`
      : `https://mc-heads.net/avatar/${encodeURIComponent(item.username)}/48`

    return {
      rank: idx + 1,
      uuid: item.uuid,
      username: item.username,
      money: item.money,
      formattedMoney: item.formattedMoney,
      compactMoney: item.compactMoney,
      raceId,
      raceName: raceData.name,
      raceTitle: raceData.title,
      raceBadgeColor: raceData.badgeColor,
      raceTier: raceData.tier,
      rankRole: raceData.rank,
      roleBadge: raceData.roleBadge,
      isStaff: raceData.isStaff,
      isPremium: bp.isPremium,
      bpTier: bp.tier,
      textureHash: skinInfo.textureHash,
      skinSource: skinInfo.skinSource,
      avatarUrl
    }
  })

  // Filter Ras jika diminta
  let filtered = enrichedList
  if (race && race !== 'all') {
    const rLower = race.toLowerCase()
    filtered = filtered.filter(p => p.raceId === rLower)
  }

  // Recalculate rank jika difilter
  filtered.forEach((p, idx) => {
    p.filteredRank = idx + 1
  })

  const totalFiltered = filtered.length
  const numLimit = Math.max(1, Math.min(200, Number(limit) || 50))
  const numPage = Math.max(1, Number(page) || 1)
  const offset = (numPage - 1) * numLimit
  const paginated = filtered.slice(offset, offset + numLimit)

  return {
    currency: 'Runish',
    currencySymbol: '🪙',
    total: enrichedList.length,
    filteredCount: totalFiltered,
    page: numPage,
    totalPages: Math.ceil(totalFiltered / numLimit) || 1,
    limit: numLimit,
    baltop: paginated
  }
}

/**
 * Mencari profil publik pemain berdasarkan username atau UUID (tanpa password, aman untuk dilihat publik)
 */
export async function getPublicPlayerProfile(identifier) {
  if (!identifier || typeof identifier !== 'string') return null
  const clean = identifier.trim()

  // Validasi format: Hanya karakter sah untuk username atau UUID (maks 36 karakter)
  if (!/^\.?[a-zA-Z0-9_-]{1,36}$/.test(clean)) {
    return null
  }

  // 1. Coba cari di getPlayerByUsername
  const player = await getPlayerByUsername(clean)
  if (player) {
    return {
      username: player.last_name,
      uuid: player.unique_id,
      premium: player.premium,
      lastSeen: player.last_seen,
      race: player.race,
      battlePass: player.battlePass,
      stats: player.stats,
      economy: player.economy,
      avatarUrl: player.avatarUrl,
      bodyUrl: player.bodyUrl,
      skinInfo: player.skinInfo,
      isRealDb: player.isRealDb
    }
  }

  // 2. Coba cari di sumber data nyata server lainnya
  const { usercachePath, bpDbPath } = getPaths()
  let matchedName = null
  let matchedUuid = null
  let foundInServer = false

  // 2a. Periksa usercache.json (riwayat pemain yang pernah connect ke Minecraft server)
  if (usercachePath && fs.existsSync(usercachePath)) {
    try {
      const cache = JSON.parse(fs.readFileSync(usercachePath, 'utf8'))
      const found = cache.find(x => x.name.toLowerCase() === clean.toLowerCase() || x.uuid.toLowerCase() === clean.toLowerCase())
      if (found) {
        matchedName = found.name
        matchedUuid = found.uuid
        foundInServer = true
      }
    } catch {}
  }

  // 2b. Periksa database BattlePass (bp_players) jika belum ketemu di usercache
  if (!foundInServer && bpDbPath && fs.existsSync(bpDbPath)) {
    try {
      const bpDb = new DatabaseSync(bpDbPath, { readOnly: true })
      const row = bpDb.prepare('SELECT player_name, uuid FROM bp_players WHERE LOWER(player_name) = ? OR LOWER(uuid) = ? LIMIT 1').get(clean.toLowerCase(), clean.toLowerCase())
      bpDb.close()
      if (row) {
        matchedName = row.player_name
        matchedUuid = row.uuid
        foundInServer = true
      }
    } catch {}
  }

  // 2c. Periksa Essentials userdata
  if (!foundInServer) {
    try {
      const eco = getEssentialsEconomyMap()
      const ecoRecord = eco.byUsername.get(clean.toLowerCase()) || eco.byUuid.get(clean.toLowerCase())
      if (ecoRecord) {
        matchedName = ecoRecord.username
        matchedUuid = ecoRecord.uuid
        foundInServer = true
      }
    } catch {}
  }

  // 2d. Periksa Tim Staf Valdora (jika mencari IGN atau AltIGN staf resmi)
  if (!foundInServer) {
    try {
      const staffMembers = getStaffTeam()
      const staffMatch = staffMembers.find(s => 
        s.ign?.toLowerCase() === clean.toLowerCase() || 
        s.altIgn?.toLowerCase() === clean.toLowerCase()
      )
      if (staffMatch) {
        matchedName = staffMatch.ign
        matchedUuid = getPlayerUuidFromCache(matchedName) || getOfflineMinecraftUUID(matchedName)
        foundInServer = true
      }
    } catch {}
  }

  // JIKA TIDAK DITEMUKAN DI SERVER MANAPUN: KEMBALIKAN NULL!
  // Menghindari fallback ke pemain acak di Mojang yang belum pernah join ke server
  if (!foundInServer || !matchedName) {
    return null
  }

  const bp = getPlayerBattlePass(matchedName, matchedUuid)
  const race = getPlayerRPGIdentity(matchedUuid, matchedName)
  const stats = getPlayerAuraSkills(matchedUuid)
  const skinInfo = getPlayerSkinInfo(matchedUuid, matchedName)
  const economy = getPlayerEconomy(matchedUuid, matchedName)

  return {
    username: matchedName,
    uuid: matchedUuid,
    premium: bp.isPremium,
    lastSeen: Date.now(),
    race,
    battlePass: bp,
    stats,
    economy,
    avatarUrl: skinInfo.avatarUrl,
    bodyUrl: skinInfo.bodyUrl,
    skinInfo,
    isRealDb: true
  }
}

let cachedPlayersList = null
let lastPlayersFetchTime = 0
const PLAYERS_CACHE_TTL = 15000 // 15 detik cache memori

/**
 * Mengambil direktori semua pemain dengan dukungan filter Ras, BattlePass, Search, Sort & Paginasi.
 */
export async function getPlayersDirectory({ race = 'all', bp = 'all', search = '', sort = 'tier', page = 1, limit = 24 } = {}) {
  const now = Date.now()
  let allPlayers = []

  if (cachedPlayersList && (now - lastPlayersFetchTime) < PLAYERS_CACHE_TTL) {
    allPlayers = cachedPlayersList
  } else {
    const { bpDbPath, usercachePath } = getPaths()
    const playerMap = new Map()

    // 1. Ambil dari BattlePass database (226+ players)
    if (bpDbPath && fs.existsSync(bpDbPath)) {
      try {
        const bpDb = new DatabaseSync(bpDbPath, { readOnly: true })
        const rows = bpDb.prepare('SELECT player_name, uuid, tier, xp, premium FROM bp_players').all()
        bpDb.close()
        for (const row of rows) {
          if (!row.player_name) continue
          playerMap.set(row.player_name.toLowerCase(), {
            username: row.player_name,
            uuid: row.uuid,
            tier: row.tier || 1,
            xp: row.xp || 0,
            isPremium: Boolean(row.premium)
          })
        }
      } catch (err) {
        console.warn('[DB getPlayersDirectory bpDb error]:', err.message)
      }
    }

    // 2. Lengkapi dari usercache jika ada pemain yang belum terdaftar di bp_players
    if (usercachePath && fs.existsSync(usercachePath)) {
      try {
        const cache = JSON.parse(fs.readFileSync(usercachePath, 'utf8'))
        for (const u of cache) {
          if (!u.name) continue
          const key = u.name.toLowerCase()
          if (!playerMap.has(key)) {
            playerMap.set(key, {
              username: u.name,
              uuid: u.uuid,
              tier: 1,
              xp: 0,
              isPremium: false
            })
          }
        }
      } catch (err) {
        console.warn('[DB getPlayersDirectory usercache error]:', err.message)
      }
    }

    // 3. Enrich dengan race, auraskills, ekonomi Runish, dan Skin
    const enriched = []
    for (const p of playerMap.values()) {
      const raceData = getPlayerRPGIdentity(p.uuid, p.username)
      const auraData = getPlayerAuraSkills(p.uuid)
      const ecoData = getPlayerEconomy(p.uuid, p.username)
      const skinInfo = getPlayerSkinInfo(p.uuid, p.username)
      
      // Tentukan raceId sederhana: 'human' | 'elf' | 'demon' | 'dwarf'
      let raceId = 'human'
      const rName = (raceData.name || '').toLowerCase()
      if (rName.includes('elf') || rName.includes("zel'vashar")) raceId = 'elf'
      else if (rName.includes('demon') || rName.includes('xurgoth')) raceId = 'demon'
      else if (rName.includes('dwarf') || rName.includes('grozmar')) raceId = 'dwarf'
      else raceId = 'human'

      const avatarUrl = skinInfo.textureHash
        ? `https://mc-heads.net/avatar/${skinInfo.textureHash}/48`
        : `https://mc-heads.net/avatar/${encodeURIComponent(p.username)}/48`

      enriched.push({
        username: p.username,
        uuid: p.uuid,
        tier: p.tier,
        xp: p.xp,
        isPremium: p.isPremium,
        raceId,
        raceName: raceData.name,
        raceTitle: raceData.title,
        raceBadgeColor: raceData.badgeColor,
        raceTier: raceData.tier,
        rank: raceData.rank,
        roleBadge: raceData.roleBadge,
        isStaff: raceData.isStaff,
        totalLevel: auraData.totalLevel || 0,
        mana: auraData.mana || 20,
        money: ecoData.money || 0,
        formattedMoney: ecoData.formatted,
        compactMoney: ecoData.compact,
        textureHash: skinInfo.textureHash,
        skinSource: skinInfo.skinSource,
        avatarUrl
      })
    }

    cachedPlayersList = enriched
    lastPlayersFetchTime = now
    allPlayers = enriched
  }

  // 4. Filtering
  let filtered = allPlayers

  // Filter Search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    filtered = filtered.filter(p => p.username.toLowerCase().includes(q))
  }

  // Filter Race
  if (race && race !== 'all') {
    const rLower = race.toLowerCase()
    filtered = filtered.filter(p => p.raceId === rLower)
  }

  // Filter BP
  if (bp === 'premium') {
    filtered = filtered.filter(p => p.isPremium)
  } else if (bp === 'free') {
    filtered = filtered.filter(p => !p.isPremium)
  }

  // 5. Sorting
  if (sort === 'money' || sort === 'baltop') {
    filtered.sort((a, b) => (b.money || 0) - (a.money || 0))
  } else if (sort === 'level') {
    filtered.sort((a, b) => b.totalLevel - a.totalLevel)
  } else if (sort === 'name') {
    filtered.sort((a, b) => a.username.localeCompare(b.username))
  } else {
    // Default: tier desc, then xp desc, then totalLevel desc
    filtered.sort((a, b) => {
      if (b.tier !== a.tier) return b.tier - a.tier
      if (b.xp !== a.xp) return b.xp - a.xp
      return b.totalLevel - a.totalLevel
    })
  }

  const totalFiltered = filtered.length
  const numLimit = Math.max(1, Math.min(100, Number(limit) || 24))
  const numPage = Math.max(1, Number(page) || 1)
  const offset = (numPage - 1) * numLimit
  const paginatedPlayers = filtered.slice(offset, offset + numLimit)

  return {
    total: allPlayers.length,
    filteredCount: totalFiltered,
    page: numPage,
    totalPages: Math.ceil(totalFiltered / numLimit),
    limit: numLimit,
    players: paginatedPlayers
  }
}

/**
 * Mengambil struktur tim pengurus, founder, developer, dan staf Valdora Universe.
 * Dilengkapi integrasi identitas Discord dan hash skin Minecraft riil.
 */
export function getStaffTeam() {
  const staffMembers = [
    {
      id: 'oi_lixx',
      ign: 'OI_Lixx',
      discordUsername: 'ola.lxie',
      discordName: 'lxie',
      discordId: '1118516336767811605',
      category: 'founder',
      role: 'Founder & Project Lead',
      roleBadge: 'FOUNDER',
      roleColor: '#f59e0b',
      bio: 'Pendiri utama Valdora Universe, mengelola arsitektur server, visi roleplay, dan manajemen ekosistem petualang.',
      isMinecraftPlayer: true
    },
    {
      id: 'kylianaxell',
      ign: 'KylianAxell',
      altIgn: 'AxellDewa',
      discordUsername: 'axelldoang_',
      discordName: 'KylianAxell🪽',
      discordId: '1362650196718256168',
      category: 'founder',
      role: 'Co-Founder & System Architect',
      roleBadge: 'FOUNDER',
      roleColor: '#f59e0b',
      bio: 'Perancang sistem inti server, infrastruktur jaringan, konfigurasi engine game, dan visual modeling Valdora.',
      isMinecraftPlayer: true
    },
    {
      id: 'hamdun_ham',
      ign: 'Hamdun_ham',
      discordUsername: 'ilhamgod0053',
      discordName: 'Ilham GOD+++',
      discordId: '1311707071783370753',
      category: 'dev',
      role: 'Lead Developer',
      roleBadge: 'LEAD DEV',
      roleColor: '#06b6d4',
      bio: 'Mengembangkan plugin kustom, integrasi web realtime, database perekonomian Runish, dan mekanisme RPG.',
      isMinecraftPlayer: true
    },
    {
      id: 'x1zero',
      ign: 'X1zero_',
      altIgn: 'Tith1an',
      discordUsername: 'tith1anv1',
      discordName: 'D1TIAN',
      discordId: '1532015951971750010',
      category: 'dev',
      role: 'Lead Skripter & Gameplay',
      roleBadge: 'SKRIPTER',
      roleColor: '#38bdf8',
      bio: 'Merancang alur skrip gameplay kustom, sistem quest ras, mekanik sihir kuno, dan event interaktif in-game.',
      isMinecraftPlayer: true
    },
    {
      id: 'dimsumenak',
      ign: 'DimsumEnak',
      altIgn: 'EzraZivsz',
      discordUsername: 'razelloz',
      discordName: 'zraa',
      discordId: '1389252033084788766',
      category: 'creative',
      role: '3D Modeler & Texture Artist',
      roleBadge: 'MODELER',
      roleColor: '#d946ef',
      bio: 'Pembuat aset visual 3D, senjata pusaka, model armor kustom, dan dungeon props dunia Valdora.',
      isMinecraftPlayer: true
    }
  ]

  return staffMembers.map(staff => {
    let skinInfo = null
    if (staff.ign) {
      skinInfo = getPlayerSkinInfo(null, staff.ign)
    }
    const avatarUrl = skinInfo?.textureHash
      ? `https://mc-heads.net/avatar/${skinInfo.textureHash}/64`
      : staff.ign
        ? `https://mc-heads.net/avatar/${encodeURIComponent(staff.ign)}/64`
        : `https://mc-heads.net/avatar/MHF_Custom/64`

    return {
      ...staff,
      avatarUrl,
      textureHash: skinInfo?.textureHash || null,
      bodyUrl: skinInfo?.bodyUrl || null
    }
  })
}

