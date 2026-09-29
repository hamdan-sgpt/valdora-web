import './Footer.css'
import { SERVER_CONFIG } from '../config/server'
import { Link } from '../context/RouterContext'

export default function Footer({ onOpenRules }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer-root">
      <div className="container">
        <div className="footer-top">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img 
                src="/assets/nobackgrd.png" 
                alt="Valdora Logo" 
                width="34" 
                height="34" 
              />
              <span className="footer-brand-name">VALDORA UNIVERSE</span>
            </div>
            <p className="footer-motto">
              Server Minecraft Survival SMP &amp; RPG Indonesia. Bertahan hidup bebas klaim dengan 4 pilihan ras dan leveling AuraSkills.
            </p>
          </div>

          {/* Nav Quicklinks */}
          <div className="footer-nav-col">
            <h5 className="footer-col-title">Navigasi</h5>
            <Link href="/" className="footer-link">Beranda</Link>
            <Link href="/gameplay" className="footer-link">Ras &amp; Gameplay</Link>
            <Link href="/players" className="footer-link">Pemain</Link>
            <Link href="/galeri" className="footer-link">Galeri</Link>
            <Link href="/live" className="footer-link">Live &amp; Media</Link>
            <Link href="/panduan" className="footer-link">Panduan Join</Link>
          </div>

          {/* Server Info & Rules */}
          <div className="footer-nav-col">
            <h5 className="footer-col-title">Informasi</h5>
            <button 
              type="button" 
              className="footer-link footer-btn-link"
              onClick={onOpenRules}
            >
              Peraturan Server
            </button>
            <span className="footer-meta-item">IP: {SERVER_CONFIG.ip.java}</span>
            <span className="footer-meta-item">Platform: Java Edition (PC)</span>
            <span className="footer-meta-item">Versi: {SERVER_CONFIG.ip.version}</span>
          </div>

          {/* Social Community */}
          <div className="footer-nav-col">
            <h5 className="footer-col-title">Komunitas</h5>
            <a 
              href={SERVER_CONFIG.links.discord} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-discord btn-sm btn-full"
            >
              Discord Server
            </a>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm btn-full btn-top"
              onClick={scrollToTop}
            >
              Kembali ke Atas ↑
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-disclaimer">
            Bukan produk resmi Minecraft. Valdora Universe tidak disetujui oleh atau berafiliasi dengan Mojang AB atau Microsoft.
          </p>
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} Valdora Universe. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
