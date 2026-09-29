import { useRef, useState } from 'react'
import './VideoShowcase.css'

export default function VideoShowcase() {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(videoRef.current.muted)
  }

  const handleRestart = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    videoRef.current.play()
    setIsPlaying(true)
  }

  return (
    <section id="showcase" className="section showcase-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag amethyst">SINEMATIK &amp; LORE REALM</span>
          <h2>Dunia Anarchy Tanpa Klaim, Medan Tempur Sejati</h2>
          <p className="section-desc">
            Saksikan atmosfer semesta Valdora Universe secara langsung. Dari hutan mistis Grimholt Forest
            hingga kedalaman Goblin Dungeon dan ancaman bencana alam meteorit liar.
          </p>
        </div>

        <div className="showcase-content">
          {/* Video Player Card */}
          <div className="video-card">
            <div className="video-viewport">
              <video
                ref={videoRef}
                src="/assets/video-valdora.mp4"
                className="video-element"
                playsInline
                loop
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Browser Anda tidak mendukung pemutar video HTML5.
              </video>

              {/* Overlay Play Hint when Paused */}
              {!isPlaying && (
                <button 
                  type="button" 
                  className="video-center-play" 
                  onClick={togglePlay}
                  aria-label="Putar cuplikan gameplay Valdora"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="video-controls-bar">
              <div className="video-meta">
                <span className="video-title">Cuplikan Sinematik Valdora Universe</span>
                <span className="video-subtitle">Fight RPG Season 2 • Anarchy &amp; Economy Realm</span>
              </div>

              <div className="video-button-group">
                <button 
                  type="button" 
                  className="video-ctrl-btn"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Jeda video" : "Putar video"}
                >
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                  <span>{isPlaying ? "Jeda" : "Putar"}</span>
                </button>

                <button 
                  type="button" 
                  className="video-ctrl-btn"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Nyalakan suara" : "Senyapkan suara"}
                >
                  {isMuted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                  )}
                </button>

                <button 
                  type="button" 
                  className="video-ctrl-btn"
                  onClick={handleRestart}
                  aria-label="Ulangi video dari awal"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Lore / Story Pillar Card */}
          <div className="showcase-pillars">
            <div className="pillar-item">
              <div className="pillar-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <h4>Sistem Anarchy &amp; Rahasia Base</h4>
                <p>Tanah tidak bisa diklaim! Lindungi koordinat markas timmu dari kebocoran dan perkuat benteng pertahanan dari serbuan faksi lawan.</p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
                  <line x1="13" y1="19" x2="19" y2="13"></line>
                </svg>
              </div>
              <div>
                <h4>Portal Multidimensi &amp; Dungeon</h4>
                <p>Jelajahi Goblin Dungeon, Skeleton Dungeon, dan petualangan berbahaya ke Unstable Nether melalui sistem portal mistis.</p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="6"></circle>
                  <path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path>
                  <path d="M7 6h2v4H7z"></path>
                </svg>
              </div>
              <div>
                <h4>Pasar Gelap &amp; Senjata Kuno</h4>
                <p>Temukan Forbidden Shop rahasia (/shop_forbidden) untuk menukar Totem of Undying, Demon Pet, dan senjata sakti Phantom Scythe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
