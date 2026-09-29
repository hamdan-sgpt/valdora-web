import React, { useState, useEffect } from 'react'
import { Link } from '../context/RouterContext'
import { IconCrown, IconBolt, IconSpark, IconArrowRight } from '../components/Icons'
import PlayerProfileModal from '../components/PlayerProfileModal'
import { SERVER_CONFIG } from '../config/server'
import './PagesCommon.css'
import './TeamPage.css'

const INITIAL_STAFF = [
  {
    id: 'oi_lixx',
    ign: 'OI_Lixx',
    discordUsername: 'ola.lxie',
    discordName: 'lxie',
    discordId: '1118516336767811605',
    category: 'founder',
    role: 'Founder & Project Lead',
    roleBadge: 'FOUNDER',
    roleColor: '#f59e0b',
    bio: 'Pendiri utama Valdora Universe, mengelola arsitektur server, visi roleplay, dan manajemen ekosistem petualang.',
    avatarUrl: 'https://mc-heads.net/avatar/OI_Lixx/64',
    isMinecraftPlayer: true
  },
  {
    id: 'kylianaxell',
    ign: 'KylianAxell',
    altIgn: 'AxellDewa',
    discordUsername: 'axelldoang_',
    discordName: 'KylianAxell🪽',
    discordId: '1362650196718256168',
    category: 'founder',
    role: 'Co-Founder & System Architect',
    roleBadge: 'FOUNDER',
    roleColor: '#f59e0b',
    bio: 'Perancang sistem inti server, infrastruktur jaringan, konfigurasi engine game, dan visual modeling Valdora.',
    avatarUrl: 'https://mc-heads.net/avatar/KylianAxell/64',
    isMinecraftPlayer: true
  },
  {
    id: 'hamdun_ham',
    ign: 'Hamdun_ham',
    discordUsername: 'ilhamgod0053',
    discordName: 'Ilham GOD+++',
    discordId: '1311707071783370753',
    category: 'dev',
    role: 'Lead Developer',
    roleBadge: 'LEAD DEV',
    roleColor: '#06b6d4',
    bio: 'Mengembangkan plugin kustom, integrasi web realtime, database perekonomian Runish, dan mekanisme RPG.',
    avatarUrl: 'https://mc-heads.net/avatar/Hamdun_ham/64',
    isMinecraftPlayer: true
  },
  {
    id: 'x1zero',
    ign: 'X1zero_',
    altIgn: 'Tith1an',
    discordUsername: 'tith1anv1',
    discordName: 'D1TIAN',
    discordId: '1532015951971750010',
    category: 'dev',
    role: 'Lead Skripter & Gameplay',
    roleBadge: 'SKRIPTER',
    roleColor: '#38bdf8',
    bio: 'Merancang alur skrip gameplay kustom, sistem quest ras, mekanik sihir kuno, dan event interaktif in-game.',
    avatarUrl: 'https://mc-heads.net/avatar/X1zero_/64',
    isMinecraftPlayer: true
  },
  {
    id: 'dimsumenak',
    ign: 'DimsumEnak',
    altIgn: 'EzraZivsz',
    discordUsername: 'razelloz',
    discordName: 'zraa',
    discordId: '1389252033084788766',
    category: 'creative',
    role: '3D Modeler & Texture Artist',
    roleBadge: 'MODELER',
    roleColor: '#d946ef',
    bio: 'Pembuat aset visual 3D, senjata pusaka, model armor kustom, dan dungeon props dunia Valdora.',
    avatarUrl: 'https://mc-heads.net/avatar/DimsumEnak/64',
    isMinecraftPlayer: true
  }
]

export default function TeamPage() {
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [loading, setLoading] = useState(false)
  const [activePlayer, setActivePlayer] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetchTeam() {
      try {
        const res = await fetch('/api/staff')
        if (!res.ok) throw new Error('Gagal memuat tim')
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.staff) && data.staff.length > 0) {
          setStaff(data.staff)
        }
      } catch (err) {
        console.warn('Note fetch team:', err.message)
      }
    }
    fetchTeam()
    return () => {
      isMounted = false
    }
  }, [])

  const handleCopyDiscord = (username, id) => {
    if (!username) return
    const textToCopy = `@${username}`
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      }).catch(() => {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      })
    } else {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const founders = staff.filter(s => s.category === 'founder')
  const developers = staff.filter(s => s.category === 'dev')
  const modelers = staff.filter(s => s.category === 'creative')

  const renderStaffCard = (s, themeClass) => (
    <div key={s.id} className={`team-card-frame ${themeClass}`}>
      <div className="frame-corner corner-tl"></div>
      <div className="frame-corner corner-br"></div>

      <div className="team-card-top">
        <div className="team-avatar-box">
          <img
            src={s.avatarUrl}
            alt={`Avatar Minecraft ${s.ign || s.discordName}`}
            className="team-avatar-head"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'https://mc-heads.net/avatar/Steve/64'
            }}
          />
          {s.category === 'founder' && (
            <div className="team-crown-badge">
              <IconCrown size={12} />
            </div>
          )}
        </div>

        <div
          className="team-role-pill"
          style={{
            backgroundColor: `${s.roleColor}20`,
            borderColor: s.roleColor,
            color: s.roleColor
          }}
        >
          {s.roleBadge}
        </div>
      </div>

      <div className="team-card-bio">
        {/* Identitas Minecraft: IGN & Alt IGN */}
        <div className="team-name-header">
          <div className="team-ign-line">
            <span className="platform-pill mc-pill">MC</span>
            <h3 className="team-member-name">{s.ign}</h3>
          </div>
          {s.altIgn && (
            <span className="team-alt-badge" title={`Akun alternatif Minecraft: ${s.altIgn}`}>
              Alt: {s.altIgn}
            </span>
          )}
        </div>

        <p className="team-member-role" style={{ color: s.roleColor }}>
          {s.role}
        </p>

        {/* Identitas Discord: Username, Display Name, dan Tombol Salin */}
        {s.discordUsername && (
          <div className="team-discord-box">
            <div className="team-discord-info">
              <div className="dc-icon-wrapper" aria-hidden="true">
                <svg className="discord-mini-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div className="dc-text-group">
                <span className="dc-username">@{s.discordUsername}</span>
                {s.discordName && <span className="dc-display">({s.discordName})</span>}
              </div>
            </div>
            <button
              type="button"
              className={`dc-copy-button ${copiedId === s.id ? 'is-copied' : ''}`}
              onClick={() => handleCopyDiscord(s.discordUsername, s.id)}
              title={`Salin tag Discord @${s.discordUsername}`}
              aria-label={`Salin tag Discord @${s.discordUsername}`}
            >
              {copiedId === s.id ? 'Tersalin!' : 'Salin DC'}
            </button>
          </div>
        )}

        <p className="team-desc-text">{s.bio}</p>
      </div>

      <div className="team-card-actions">
        {s.ign ? (
          <button
            type="button"
            className="team-inspect-btn"
            onClick={() => setActivePlayer(s.ign)}
          >
            <span>Inspeksi Profil In-Game</span>
            <IconArrowRight size={13} />
          </button>
        ) : (
          <span className="team-nonplayer-tag">Divisi Desain Visual</span>
        )}
      </div>
    </div>
  )

  return (
    <div className="subpage-view team-page-root">
      {/* Subpage Banner */}
      <div className="subpage-banner">
        <div className="container">
          <nav className="subpage-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-link">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Pengurus</span>
          </nav>

          <div className="team-page-hero">
            <span className="team-hero-pill">
              <IconCrown size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
              JAJARAN PENGURUS &amp; ARSITEK
            </span>
            <h1 className="team-hero-title">Tim Inti Valdora Universe</h1>
            <p className="team-hero-subtitle">
              Struktur kepemimpinan dan arsitek teknis di balik ekosistem dunia RPG, plugin kustom, database ekonomi Runish, dan pemodelan visual Valdora.
            </p>
          </div>
        </div>
      </div>

      <div className="container team-content-wrapper">
        {loading ? (
          <div className="team-loading-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="team-card-frame skeleton-team-card">
                <div className="skeleton-avatar-box"></div>
                <div className="skeleton-line-title"></div>
                <div className="skeleton-line-desc"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="team-tiers-container">
            {/* ========================================================
                BAGIAN 1: FOUNDER & ARSITEK DUNIA (PISAH SENDIRI)
               ======================================================== */}
            {founders.length > 0 && (
              <section className="team-tier-section tier-founders">
                <div className="tier-header-block">
                  <div className="tier-badge-label gold-badge">
                    <IconCrown size={14} />
                    <span>FOUNDER &amp; PETINGGI</span>
                  </div>
                  <h2 className="tier-headline">Founder &amp; Arsitek Server</h2>
                  <p className="tier-subtext">
                    Pemilik visi, perancang dunia, dan pengambil keputusan tertinggi ekosistem Valdora Universe.
                  </p>
                </div>

                <div className="team-tier-grid two-columns">
                  {founders.map(f => renderStaffCard(f, 'founder-theme'))}
                </div>
              </section>
            )}

            {/* Pemisah Visual Antar Bagian */}
            <div className="team-tier-divider" aria-hidden="true">
              <span className="divider-line"></span>
              <span className="divider-node">✦</span>
              <span className="divider-line"></span>
            </div>

            {/* ========================================================
                BAGIAN 2: PENGEMBANG INTI & SKRIP (PISAH SENDIRI)
               ======================================================== */}
            {developers.length > 0 && (
              <section className="team-tier-section tier-developers">
                <div className="tier-header-block">
                  <div className="tier-badge-label cyan-badge">
                    <IconBolt size={14} />
                    <span>DEVELOPMENT &amp; SKRIP</span>
                  </div>
                  <h2 className="tier-headline">Pengembang Inti &amp; Gameplay</h2>
                  <p className="tier-subtext">
                    Arsitek teknis yang merakit plugin kustom, database ekonomi Runish, logika skrip petualangan, dan integrasi web realtime.
                  </p>
                </div>

                <div className="team-tier-grid two-columns">
                  {developers.map(d => renderStaffCard(d, 'dev-theme'))}
                </div>
              </section>
            )}

            {/* Pemisah Visual Antar Bagian */}
            <div className="team-tier-divider" aria-hidden="true">
              <span className="divider-line"></span>
              <span className="divider-node">✦</span>
              <span className="divider-line"></span>
            </div>

            {/* ========================================================
                BAGIAN 3: 3D MODELER & VISUAL ASSET (PISAH SENDIRI)
               ======================================================== */}
            {modelers.length > 0 && (
              <section className="team-tier-section tier-creatives">
                <div className="tier-header-block">
                  <div className="tier-badge-label purple-badge">
                    <IconSpark size={14} />
                    <span>CREATIVE &amp; 3D MODEL</span>
                  </div>
                  <h2 className="tier-headline">3D Modeler &amp; Texture Artist</h2>
                  <p className="tier-subtext">
                    Kreator visual yang memahat model senjata pusaka, armor ras khusus, kosmetik item, dan dungeon props dunia Valdora.
                  </p>
                </div>

                <div className="team-tier-grid center-single">
                  {modelers.map(m => renderStaffCard(m, 'creative-theme'))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Action Strip at Bottom */}
        <div className="team-bottom-strip">
          <div className="bottom-strip-text">
            <strong>Ingin bergabung atau mengajukan pertanyaan langsung ke tim pengurus?</strong>
            <p>Diskusikan saran, laporan, atau kemitraan melalui server Discord resmi Valdora Universe.</p>
          </div>
          <a
            href={SERVER_CONFIG.links?.discord || 'https://discord.gg/s6TtJ38AR9'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-discord btn-sm"
          >
            <span>Buka Discord Server</span>
            <IconArrowRight size={14} />
          </a>
        </div>
      </div>

      {/* Modal Profile Player In-Game */}
      <PlayerProfileModal
        username={activePlayer}
        onClose={() => setActivePlayer(null)}
      />
    </div>
  )
}
