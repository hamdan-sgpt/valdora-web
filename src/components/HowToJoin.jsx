import { useState } from 'react'
import './HowToJoin.css'
import { SERVER_CONFIG } from '../config/server'
import { 
  IconCoffee, 
  IconLightbulb, 
  IconScroll, 
  IconKey, 
  IconCrown, 
  IconSword, 
  IconBolt,
  IconShield
} from './Icons'

export default function HowToJoin() {
  const [copiedJava, setCopiedJava] = useState(false)

  const copyToClipboard = (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    } catch (err) {
      console.warn('Clipboard fallback:', err)
    }
    setCopiedJava(true)
    setTimeout(() => setCopiedJava(false), 2000)
  }

  return (
    <section id="how-to-join" className="section join-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header text-center">
          <span className="section-tag gold">KONEKSI SERVER</span>
          <h2 className="section-title">
            Panduan Masuk ke <span className="text-gradient">Valdora Universe</span>
          </h2>
          <p className="section-desc">
            Server ini khusus untuk <strong>Minecraft Java Edition (PC)</strong>.
            Salin IP di bawah dan tambahkan ke daftar server di launchermu.
          </p>
        </div>

        {/* 1. JAVA EDITION CONNECTION CONSOLE */}
        <div className="connection-console-chassis">
          <div className="console-header-tabs" role="tablist">
            <div className="console-tab-btn active" style={{ cursor: 'default' }}>
              <span className="tab-icon"><IconCoffee size={18} /></span>
              <div className="tab-text-group">
                <span className="tab-main-label">Java Edition (PC Exclusive)</span>
                <span className="tab-sub-label">Launcher Resmi • Prism • Lunar • Badlion • Modrinth</span>
              </div>
            </div>
          </div>

          <div className="console-body-panel">
            <div className="connection-card-display" role="tabpanel">
              <div className="conn-info-row">
                <div className="conn-badge-group">
                  <span className="conn-status-pill online">ONLINE 24/7</span>
                  <span className="conn-meta-pill">Versi: {SERVER_CONFIG.ip.version}</span>
                  <span className="conn-meta-pill">Port: Default (SRV)</span>
                  <span className="conn-meta-pill">Platform: Java Edition</span>
                </div>
                <span className="conn-subtext">Domain Resmi: play.valdora.my.id (Bisa Join Tanpa Port)</span>
              </div>

              <div className="conn-address-box">
                <div className="address-meta">
                  <span className="address-label">SERVER ADDRESS (JAVA)</span>
                  <span className="address-code">{SERVER_CONFIG.ip.java}</span>
                </div>
                <button
                  type="button"
                  className={`btn conn-copy-btn ${copiedJava ? 'btn-copied' : 'btn-primary'}`}
                  onClick={() => copyToClipboard(SERVER_CONFIG.ip.java)}
                  aria-label="Salin IP Java"
                >
                  {copiedJava ? 'TERSALIN!' : 'SALIN ALAMAT'}
                </button>
              </div>

              <div className="client-tips-strip">
                <span className="tip-dot"><IconLightbulb size={16} /></span>
                <span>
                  Buka Minecraft &gt; <strong>Multiplayer</strong> &gt; <strong>Add Server</strong> &gt; Masukkan IP di atas &gt; Klik <strong>Join Server</strong>.
                </span>
              </div>

              <div className="client-tips-strip" style={{ borderColor: 'rgba(56, 189, 248, 0.25)', background: 'rgba(56, 189, 248, 0.05)' }}>
                <span className="tip-dot"><IconShield size={16} /></span>
                <span>
                  Catatan: Dikhususkan untuk Java Edition agar tekstur kustom, model 3D, dan sistem ras RPG berjalan stabil tanpa kendala kompatibilitas.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SURVIVAL FIELD MANUAL */}
        <div className="manual-section-wrapper">
          <div className="manual-banner-header">
            <span className="manual-emblem"><IconScroll size={22} /></span>
            <div className="manual-title-block">
              <h3 className="manual-heading">Langkah Awal Saat Pertama Bergabung</h3>
              <p className="manual-lead">
                Ikuti 4 langkah penting ini setelah kamu masuk ke server agar akun aman dan kamu siap menjelajah.
              </p>
            </div>
          </div>

          <div className="protocol-quad-grid">
            {/* Box 1 */}
            <div className="protocol-card">
              <div className="protocol-card-head">
                <span className="protocol-code-chip">LANGKAH 01</span>
                <span className="protocol-icon"><IconKey size={18} /></span>
              </div>
              <h4 className="protocol-title">Daftarkan Akun (Auth)</h4>
              <p className="protocol-desc">
                Saat pertama kali masuk ke lobi spawn, daftarkan password akunmu:
              </p>
              <div className="code-pill-display">
                <code>/register &lt;password&gt; &lt;ulangi&gt;</code>
              </div>
              <p className="protocol-note">
                Untuk login di waktu berikutnya, gunakan perintah <code>/login &lt;password&gt;</code>.
              </p>
            </div>

            {/* Box 2 */}
            <div className="protocol-card highlight-gold">
              <div className="protocol-card-head">
                <span className="protocol-code-chip gold">LANGKAH 02</span>
                <span className="protocol-icon"><IconCrown size={18} /></span>
              </div>
              <h4 className="protocol-title">Pilih Ras Karakter</h4>
              <p className="protocol-desc">
                Tentukan ras karaktermu untuk mendapatkan buff pasif:
              </p>
              <div className="code-pill-display">
                <code>/spinras &bull; /myras</code>
              </div>
              <p className="protocol-note">
                Ketik <code>/spinras</code> untuk mengundi ras (Human, Elf, Demon, atau Dwarf). Tiap ras memiliki efek pasif berbeda dan akses ke warp faksi masing-masing.
              </p>
            </div>

            {/* Box 3 */}
            <div className="protocol-card alert-card">
              <div className="protocol-card-head">
                <span className="protocol-code-chip red">PERHATIAN</span>
                <span className="protocol-icon"><IconSword size={18} /></span>
              </div>
              <h4 className="protocol-title">Aturan Bertahan Hidup (Anarchy)</h4>
              <p className="protocol-desc">
                Server ini tidak menggunakan proteksi klaim tanah (no land claims).
              </p>
              <div className="code-pill-display danger">
                <code>Tanpa Klaim Tanah &bull; Markas Bisa Dijarah</code>
              </div>
              <p className="protocol-note">
                Berjalanlah minimal <strong>1.000 hingga 2.000 blok dari spawn</strong> sebelum membuat markas. Simpan koordinatmu sendiri agar tidak ditemukan pemain lain.
              </p>
            </div>

            {/* Box 4 */}
            <div className="protocol-card">
              <div className="protocol-card-head">
                <span className="protocol-code-chip">LANGKAH 04</span>
                <span className="protocol-icon"><IconBolt size={18} /></span>
              </div>
              <h4 className="protocol-title">Cek ValdoraPass &amp; AuraSkills</h4>
              <p className="protocol-desc">
                Tidak ada starter kit instan. Cek perkembangan misi dan skill karaktermu dengan command:
              </p>
              <div className="code-pill-display">
                <code>/bp &bull; /sk</code>
              </div>
              <p className="protocol-note">
                Ketik <code>/bp</code> untuk membuka menu hadiah ValdoraPass, dan ketik <code>/sk</code> untuk melihat progres 11 cabang AuraSkills.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
