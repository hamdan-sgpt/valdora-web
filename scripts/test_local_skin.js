import { getPlayerSkinInfo, getPaths } from '../server/db.js'

console.log('Paths:', getPaths().skinsRestorerDir)

const testPlayers = [
  { name: 'Hamdun_ham', uuid: '71bb7dd9-07b4-3224-a662-e96475a04fa8' },
  { name: 'KoarKoar', uuid: '6bae1b13-fbdc-3f7f-8b79-3e0001bc67fc' },
  { name: 'shortsite', uuid: '9e9eee68-1690-3e8b-a6b2-3edbef843fe2' },
  { name: 'RaokRaok', uuid: '5330eab2-ae84-35f0-94b1-ca240ab0da90' },
  { name: 'yorici_', uuid: 'fc7260a9-0cfc-3217-8324-aecbb479e39b' }
]

for (const p of testPlayers) {
  const info = getPlayerSkinInfo(p.uuid, p.name)
  console.log(`\nPlayer ${p.name} (${p.uuid}):`)
  console.log('  avatarUrl:', info.avatarUrl)
  console.log('  textureHash:', info.textureHash)
  console.log('  skinSource:', info.skinSource)
}
