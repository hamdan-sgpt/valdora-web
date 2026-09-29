import { useState, useEffect } from 'react'
import './Navbar.css'
import { SERVER_CONFIG } from '../config/server'
import { useAuth } from '../context/AuthContext'
import { useServerStatus } from '../hooks/useServerStatus'
import { Link } from '../context/RouterContext'
import { IconKey, IconArrowRight } from './Icons'

export default function Navbar({ onOpenRules }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, isLoggedIn, openLoginModal, openDashboard } = useAuth()
  const serverStatus = useServerStatus()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link href="/" className="navbar-brand" aria-label="Valdora Universe Beranda">
          <img 
            src="/assets/nobackgrd.png" 
            alt="Valdora Emblem" 
            className="brand-emblem" 
            width="38" 
            height="38" 
          />
          <div className="brand-text">
            <span className="brand-name">VALDORA</span>
            <span className="brand-sub">UNIVERSE</span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="desktop-nav" aria-label="Navigasi Utama">
          <Link href="/" className="nav-link">Beranda</Link>
          <Link href="/gameplay" className="nav-link">Ras &amp; Gameplay</Link>
          <Link href="/players" className="nav-link">Pemain</Link>
          <Link href="/pengurus" className="nav-link">Pengurus</Link>
          <Link href="/galeri" className="nav-link">Galeri</Link>
          <Link href="/live" className="nav-link">Live &amp; Media</Link>
          <Link href="/panduan" className="nav-link">Panduan Join</Link>
          <button 
            type="button" 
            className="nav-link nav-btn-link"
            onClick={onOpenRules}
          >
            Aturan
          </button>
        </nav>

        {/* Action & Status */}
        <div className="navbar-actions">
          <div 
            className={`server-status-pill ${serverStatus.online ? 'online' : 'offline'}`} 
            title={serverStatus.online 
              ? `Server Valdora Online • ${serverStatus.playersOnline} dari ${serverStatus.playersMax} pemain sedang aktif` 
              : 'Server Valdora sedang offline'
            }
          >
            <span className="status-dot"></span>
            <span className="status-text">
              {serverStatus.loading ? 'Memeriksa...' : serverStatus.online ? `${serverStatus.playersOnline} Online` : 'Offline'}
            </span>
          </div>

          {/* Player Auth Widget */}
          {isLoggedIn && user ? (
            <button
              type="button"
              className="player-nav-chip"
              onClick={openDashboard}
              title={`Buka Dashboard ${user.username}`}
              aria-label="Buka Dashboard Petualang"
            >
              <img
                src={user.avatarUrl || `https://mc-heads.net/avatar/${user.username}/32`}
                alt=""
                className="nav-player-avatar"
                width="24"
                height="24"
              />
              <span className="nav-player-name">{user.username}</span>
              <span className="nav-player-race">{user.race?.name || 'Petualang'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-login-nav"
              onClick={openLoginModal}
              aria-label="Login Akun Pemain"
            >
              <span className="login-icon"><IconKey size={15} /></span>
              <span>Login Pemain</span>
            </button>
          )}

          <a 
            href={SERVER_CONFIG.links.discord} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-discord btn-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Discord</span>
          </a>

          {/* Mobile Hamburger Toggle */}
          <button 
            type="button" 
            className="mobile-toggle"
            aria-label="Buka navigasi mobile"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div 
        className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-nav-links">
          {/* Mobile Server Status Strip */}
          <div className={`mobile-status-strip ${serverStatus.online ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            <span className="mobile-status-text">
              {serverStatus.loading ? 'Memeriksa status...' : serverStatus.online ? `Server Online • ${serverStatus.playersOnline} / ${serverStatus.playersMax} Pemain` : 'Server Offline'}
            </span>
          </div>

          {/* Mobile Player Auth Banner */}
          {isLoggedIn && user ? (
            <button
              type="button"
              className="mobile-player-card"
              onClick={() => {
                setMobileMenuOpen(false)
                openDashboard()
              }}
            >
              <img
                src={user.avatarUrl || `https://mc-heads.net/avatar/${user.username}/40`}
                alt=""
                className="mobile-player-avatar"
                width="36"
                height="36"
              />
              <div className="mobile-player-meta">
                <span className="mobile-player-ign">{user.username}</span>
                <span className="mobile-player-race">Ras: {user.race?.name || 'Petualang'}</span>
              </div>
              <span className="mobile-player-arrow"><IconArrowRight size={14} /></span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-login-nav btn-full mb-2"
              onClick={() => {
                setMobileMenuOpen(false)
                openLoginModal()
              }}
            >
              <span className="login-icon"><IconKey size={15} /></span>
              <span>Login Pemain Valdora</span>
            </button>
          )}

          <Link 
            href="/" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Beranda
          </Link>
          <Link 
            href="/gameplay" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Ras &amp; Gameplay
          </Link>
          <Link 
            href="/players" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pemain
          </Link>
          <Link 
            href="/pengurus" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pengurus
          </Link>
          <Link 
            href="/galeri" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Galeri
          </Link>
          <Link 
            href="/live" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Live &amp; Media
          </Link>
          <Link 
            href="/panduan" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Panduan Join
          </Link>
          <button 
            type="button" 
            className="mobile-nav-link text-left"
            onClick={() => {
              setMobileMenuOpen(false)
              onOpenRules()
            }}
          >
            Aturan Server
          </button>
          
          <div className="mobile-cta-wrapper">
            <a 
              href={SERVER_CONFIG.links.discord} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-discord btn-full"
            >
              Gabung Discord Valdora
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

