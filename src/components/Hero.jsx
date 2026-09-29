import { useState, useRef, useEffect } from 'react'
import './Hero.css'
import { SERVER_CONFIG } from '../config/server'
import { useServerStatus } from '../hooks/useServerStatus'
import PlayerProfileModal from './PlayerProfileModal'
import { IconSword } from './Icons'
import { Link } from '../context/RouterContext'

export default function Hero() {
  const [copied, setCopied] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [inspectedPlayer, setInspectedPlayer] = useState(null)
  const bgVideoRef = useRef(null)
  const serverStatus = useServerStatus()

  // Solusi kompatibilitas autoplay untuk Opera GX, Chrome, dan Safari
  useEffect(() => {
    const video = bgVideoRef.current
    if (!video) return

    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.defaultMuted = true
    video.muted = true

    // Wajib panggil load() agar resource selection algorithm Chromium/Opera GX langsung aktif
    try {
      video.load()
    } catch {}

    const startPlayback = () => {
      video.muted = true
      const p = video.play()
      if (p !== undefined) {
        p.then(() => {
          setIsVideoPlaying(true)
        }).catch(() => {
          setIsVideoPlaying(false)
        })
      }
    }

    startPlayback()

    // Jika Opera GX menahan autoplay karena baterai / background, picu saat interaksi user
    const onUserGesture = () => {
      if (video.paused || video.currentTime === 0) {
        video.muted = true
        video.play().then(() => {
          setIsVideoPlaying(true)
        }).catch(() => {})
      }
    }

    window.addEventListener('click', onUserGesture, { passive: true })
    window.addEventListener('keydown', onUserGesture, { passive: true })
    window.addEventListener('touchstart', onUserGesture, { passive: true })
    window.addEventListener('wheel', onUserGesture, { passive: true })
    window.addEventListener('scroll', onUserGesture, { passive: true })

    return () => {
      window.removeEventListener('click', onUserGesture)
      window.removeEventListener('keydown', onUserGesture)
      window.removeEventListener('touchstart', onUserGesture)
      window.removeEventListener('wheel', onUserGesture)
      window.removeEventListener('scroll', onUserGesture)
    }
  }, [])

  const handleCopyIp = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_CONFIG.ip.java)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  const toggleBgVideo = () => {
    const video = bgVideoRef.current
    if (!video) return
    if (video.paused) {
      video.muted = isMuted
      video.play()
        .then(() => {
          setIsVideoPlaying(true)
        })
        .catch(() => {})
    } else {
      video.pause()
      setIsVideoPlaying(false)
    }
  }

  const toggleMute = () => {
    if (!bgVideoRef.current) return
    bgVideoRef.current.muted = !bgVideoRef.current.muted
    setIsMuted(bgVideoRef.current.muted)
  }

  return (
    <section id="hero" className="hero-section">
      {/* Background Video with Cinematic Overlay (strictly contained within Hero) */}
      <div className="hero-video-container" aria-hidden="true">
        <video
          ref={bgVideoRef}
          src="/assets/video-valdora-fast.webm"
          className="hero-video-element"
          autoPlay
          loop
          muted
          defaultMuted
          playsInline
          preload="auto"
          onPlaying={() => {
            setIsVideoPlaying(true)
          }}
          onPause={() => setIsVideoPlaying(false)}
        >
          <source src="/assets/video-valdora-fast.webm" type="video/webm" />
          <source src="/assets/video-valdora-compat.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-overlay"></div>
      </div>

      <div className="hero-backdrop"></div>
      
      <div className="container hero-container">
        {/* Server Emblem & Title */}
        <div className="hero-branding">
          <div className="emblem-wrapper">
            <img 
              src="/assets/nobackgrd.png" 
              alt="Valdora Logo" 
              className="hero-emblem"
              width="90"
              height="90" 
            />
          </div>
          <img 
            src="/assets/untukdc.png" 
            alt="Valdora Universe - Create Your Story" 
            className="hero-title-img"
            width="460"
            height="180" 
          />
        </div>

        {/* Hero Narrative */}
        <p className="hero-lead">
          Server Minecraft 1.21.x Survival RPG &amp; Anarchy. Pilih rasmu, naikkan level AuraSkills, taklukkan dungeon boss, dan bangun base tanpa proteksi klaim.
        </p>

        {/* Minecraft Server Join Station */}
        <div className="server-station">
          <div className="station-header">
            <div className="station-live-status">
              <span className={`live-radar-dot ${serverStatus.online ? 'radar-online' : 'radar-offline'}`}></span>
              <span className={`live-status-text ${serverStatus.online ? 'online' : 'offline'}`}>
                {serverStatus.loading 
                  ? 'MEMERIKSA JARINGAN...' 
                  : serverStatus.online 
                    ? 'SERVER ONLINE' 
                    : 'SERVER OFFLINE'}
              </span>
            </div>
            <div className="station-badge">
              {serverStatus.online ? (
                <span className="station-badge-inner">
                  <span className="live-counter-accent">{serverStatus.playersOnline}</span>
                  <span className="live-counter-max">/{serverStatus.playersMax} PEMAIN</span>
                  <span className="spec-divider">•</span>
                  <span>{serverStatus.version || SERVER_CONFIG.ip.version}</span>
                </span>
              ) : (
                <span>SERVER OFFLINE</span>
              )}
            </div>
          </div>

          {/* Interactive Server IP Plaque */}
          <div 
            className={`ip-plaque ${copied ? 'copied' : ''}`}
            onClick={handleCopyIp}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopyIp() }}
            aria-label="Klik untuk menyalin IP Server"
            title="Klik untuk menyalin IP Server"
          >
            <div className="ip-plaque-main">
              <span className="ip-sublabel">{copied ? "IP TERSALIN KE CLIPBOARD!" : "KLIK UNTUK MENYALIN ALAMAT IP"}</span>
              <div className="ip-address-display">
                <span className="ip-text">{SERVER_CONFIG.ip.java}</span>
              </div>
            </div>

            <button 
              type="button" 
              className={`btn ${copied ? 'btn-copied' : 'btn-primary'} btn-plaque-copy`}
              onClick={(e) => { e.stopPropagation(); handleCopyIp() }}
              aria-label={copied ? "IP Tersalin ke Clipboard" : "Salin IP Server"}
            >
              {copied ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>TERSALIN!</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>SALIN IP</span>
                </>
              )}
            </button>
          </div>

          {/* Live Online Adventurers Preview */}
          {serverStatus.online && serverStatus.playerList && serverStatus.playerList.length > 0 && (
            <div className="station-live-players" title="Klik salah satu petualang untuk melihat kartu profil & ras RPG!">
              <div className="live-players-header">
                <span className="live-players-icon"><IconSword size={13} /></span>
                <span className="live-players-label">
                  Pemain Online ({serverStatus.playerList.length || serverStatus.playersOnline}):
                </span>
              </div>
              <div className="live-players-tags">
                {serverStatus.playerList.slice(0, 6).map((player, idx) => (
                  <span 
                    key={player.uuid || idx} 
                    className="player-tag" 
                    title={`Klik untuk melihat profil: ${player.name}`}
                    onClick={() => setInspectedPlayer(player.name)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    <img 
                      src={player.avatarUrl || `/api/player/avatar/${encodeURIComponent(player.name)}?size=24`} 
                      alt="" 
                      className="player-tag-avatar" 
                      width="14" 
                      height="14" 
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/24`
                      }}
                    />
                    <span className="player-tag-name">{player.name}</span>
                  </span>
                ))}
                {serverStatus.playerList.length > 6 && (
                  <span className="player-tag-more">+{serverStatus.playerList.length - 6} lainnya</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="hero-cta-group">
          <Link href="/panduan" className="btn btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <span>Panduan Bermain</span>
          </Link>
          <a 
            href={SERVER_CONFIG.links.discord} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-discord"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Komunitas Discord</span>
          </a>
        </div>

        {/* Background Video Ambient Control (WCAG 2.2.2 Pause/Play & Mute/Unmute) */}
        <div className="hero-video-ctrl-wrapper">
          <button
            type="button"
            className="hero-bg-ctrl-btn"
            onClick={toggleBgVideo}
            aria-pressed={isVideoPlaying}
            aria-label={isVideoPlaying ? "Jeda video" : "Putar video"}
          >
            {isVideoPlaying ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                <span>Jeda Video</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Putar Video</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="hero-bg-ctrl-btn"
            onClick={toggleMute}
            aria-pressed={!isMuted}
            aria-label={isMuted ? "Nyalakan audio video" : "Senyapkan audio video"}
          >
            {isMuted ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                </svg>
                <span>Suara On</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>Mute</span>
              </>
            )}
          </button>
        </div>

        {/* Scroll Indicator ke Panduan Realm */}
        <a 
          href="#jelajahi" 
          className="hero-scroll-cue" 
          onClick={(e) => {
            e.preventDefault()
            const target = document.getElementById('jelajahi')
            if (target) target.scrollIntoView({ behavior: 'smooth' })
          }}
          aria-label="Scroll ke panduan dan fitur"
        >
          <span>Lihat Panduan &amp; Fitur</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </a>
      </div>

      {/* Modal Kartu Profil Petualang Online */}
      <PlayerProfileModal 
        username={inspectedPlayer} 
        onClose={() => setInspectedPlayer(null)} 
      />
    </section>
  )
}
