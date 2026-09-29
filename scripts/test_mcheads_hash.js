async function testMcHeadsTextureHash() {
  const hash = 'ab84962525dafd12a7508caca95e9862ddb3f0f29c845f9798e17c7459dce724'
  const url = `https://mc-heads.net/avatar/${hash}/48`
  console.log('Testing mc-heads with hash:', url)

  try {
    const res = await fetch(url)
    console.log('Status:', res.status, res.headers.get('content-type'), res.headers.get('content-length'))
    if (res.ok) {
      console.log('✓ mc-heads successfully returned avatar for texture hash!')
    }
  } catch (err) {
    console.error('Fetch error:', err.message)
  }
}

testMcHeadsTextureHash()
