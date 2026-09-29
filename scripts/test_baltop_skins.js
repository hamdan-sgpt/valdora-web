import { getBaltopLeaderboard, getPlayerSkinInfo } from '../server/db.js'

const baltop = getBaltopLeaderboard({ limit: 10 })
console.log('Baltop Top 5:')
baltop.baltop.slice(0, 5).forEach(p => {
  const skin = getPlayerSkinInfo(p.uuid, p.username)
  console.log(`${p.rank}. ${p.username} (${p.raceName}):`)
  console.log('   Skin avatarUrl:', skin.avatarUrl)
  console.log('   Skin Source:', skin.skinSource)
})
