import { useState, useEffect, useCallback } from 'react'
import { SERVER_CONFIG } from '../config/server'

const DEFAULT_SERVER_ADDRESS = SERVER_CONFIG.ip.java || 'game-gnl-jh3.raznar.net:25071'
const POLL_INTERVAL_MS = 30000 // Polling live tiap 30 detik

/**
 * Hook kustom untuk mengambil dan memperbarui status server Minecraft secara real-time.
 * Mencoba endpoint proxy backend (/api/server/status) terlebih dahulu,
 * dengan fallback langsung ke API publik mcsrvstat.us jika backend tidak aktif.
 */
export function useServerStatus() {
  const [status, setStatus] = useState({
    online: true,
    playersOnline: 0,
    playersMax: 100,
    playerList: [],
    version: SERVER_CONFIG.ip.version || '1.21.x',
    motd: 'VALDORA [1.21.X]',
    loading: true,
    error: null,
    lastUpdated: null
  })

  const fetchStatus = useCallback(async () => {
    try {
      // 1. Coba backend internal proxy
      let res = await fetch('/api/server/status').catch(() => null)
      
      if (res && res.ok) {
        const data = await res.json()
        if (data.success && data.status) {
          setStatus({
            online: data.status.online,
            playersOnline: data.status.playersOnline,
            playersMax: data.status.playersMax,
            playerList: data.status.playerList || [],
            version: data.status.version || '1.21.x',
            motd: data.status.motd || 'VALDORA [1.21.X]',
            loading: false,
            error: null,
            lastUpdated: new Date()
          })
          return
        }
      }

      // 2. Fallback: Langsung ke API mcsrvstat.us
      const publicRes = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(DEFAULT_SERVER_ADDRESS)}`)
      if (publicRes.ok) {
        const data = await publicRes.json()
        setStatus({
          online: Boolean(data.online),
          playersOnline: data.players?.online || 0,
          playersMax: data.players?.max || 100,
          playerList: (data.players?.list || []).map(p => typeof p === 'string' ? { name: p } : p),
          version: data.version || '1.21.x',
          motd: data.motd?.clean ? data.motd.clean.join(' ') : 'VALDORA [1.21.X]',
          loading: false,
          error: null,
          lastUpdated: new Date()
        })
      } else {
        throw new Error('Gagal mengambil status server')
      }
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }))
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const timer = setInterval(fetchStatus, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetchStatus])

  return { ...status, refetch: fetchStatus }
}
