import { getPublicPlayerProfile, getStaffTeam, getPlayersDirectory } from '../server/db.js'

async function runTest() {
  console.log('=== TEST VALIDASI PENCARIAN PLAYER & STAFF TITAN/X1ZERO ===\n')

  // 1. Staff Team check
  const staff = getStaffTeam()
  const d1tian = staff.find(s => s.discordName === 'D1TIAN' || s.id === 'x1zero' || s.id === 'tith1an')
  console.log('1. Periksa data Staff D1TIAN:')
  console.log(`- IGN: ${d1tian?.ign}`)
  console.log(`- Alt IGN: ${d1tian?.altIgn}`)
  console.log(`- Avatar: ${d1tian?.avatarUrl}`)
  if (d1tian?.ign === 'X1zero_') {
    console.log('✓ SUKSES: IGN D1TIAN adalah X1zero_')
  } else {
    console.error('✕ GAGAL: IGN D1TIAN belum X1zero_')
  }

  // 2. Non-existent player "titan"
  console.log('\n2. Periksa pencarian "titan" (pemain yang tidak ada di server):')
  const titanProfile = await getPublicPlayerProfile('titan')
  console.log(`- Hasil profile "titan":`, titanProfile)
  if (titanProfile === null) {
    console.log('✓ SUKSES: "titan" mengembalikan NULL (tidak ditemukan, tidak nyasar ke Mojang dummy)')
  } else {
    console.error('✕ GAGAL: "titan" masih mengembalikan data palsu!')
  }

  // 3. Real player "X1zero_" / "x1zero"
  console.log('\n3. Periksa pencarian "X1zero_" (pemain asli yang pernah join):')
  const x1zeroProfile = await getPublicPlayerProfile('X1zero_')
  if (x1zeroProfile) {
    console.log(`✓ SUKSES: "X1zero_" ditemukan di server!`)
    console.log(`- Username: ${x1zeroProfile.username}`)
    console.log(`- UUID: ${x1zeroProfile.uuid}`)
    console.log(`- Runish: ${x1zeroProfile.economy?.compact}`)
  } else {
    console.error('✕ GAGAL: "X1zero_" tidak ditemukan!')
  }

  // 4. Random player who never joined
  console.log('\n4. Periksa pemain acak yang belum pernah join "pemain_palsu_9999":')
  const fakeProfile = await getPublicPlayerProfile('pemain_palsu_9999')
  if (fakeProfile === null) {
    console.log('✓ SUKSES: "pemain_palsu_9999" mengembalikan NULL (tidak ditemukan)')
  } else {
    console.error('✕ GAGAL: Pemain palsu malah terbuat datanya!')
  }

  console.log('\n✨ SEMUA TEST SELESAI!')
}

runTest().catch(console.error)
