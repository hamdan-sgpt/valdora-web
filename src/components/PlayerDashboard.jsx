import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { SERVER_CONFIG } from '../config/server'
import './PlayerDashboard.css'
import { 
  IconSword, 
  IconShield, 
  IconClose, 
  IconStar, 
  IconBolt, 
  IconDrop, 
  IconCheck, 
  SkillIcon 
} from './Icons'

export default function PlayerDashboard() {
  const { user, dashboardOpen, closeDashboard, logout } = useAuth()
  const [copiedIp, setCopiedIp] = useState(false)

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && dashboardOpen) {
        closeDashboard()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dashboardOpen, closeDashboard])

  if (!dashboardOpen || !user) return null

  const serverIp = SERVER_CONFIG.ip?.java || 'play.valdora.my.id'

  const handleCopyIp = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(serverIp)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = serverIp
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
    setCopiedIp(true)
    setTimeout(() => setCopiedIp(false), 2000)
  }

  const race = user.race || {
    name: 'Pemain Valdora',
    title: 'Warga Valdora',
    level: 1,
    skillpoints: 0,
    lore: 'Pemain yang sedang mengembangkan kemampuan dan statistik di Valdora.'
  }

  const bp = user.battlePass || {
    passName: 'ValdoraPass Free',
    isPremium: false,
    tier: 1,
    points: 100,
    maxPoints: 1000,
    completedDaily: 0,
    status: 'Free Tier'
  }

  const bpPercent = Math.min(100, Math.round((bp.points / (bp.maxPoints || 1000)) * 100))

  return (
    <div className="dashboard-overlay" onClick={closeDashboard}>
      <div
        className="dashboard-modal-chassis"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-player-name"
      >
        {/* Sudut Plakat Emas */}
        <div className="dash-corner corner-tl"></div>
        <div className="dash-corner corner-tr"></div>
        <div className="dash-corner corner-bl"></div>
        <div className="dash-corner corner-br"></div>

        {/* Top Bar Navigation */}
        <div className="dashboard-topbar">
          <div className="dashboard-realm-tag">
            <span className="realm-gem"><IconShield size={14} /></span> PROFIL PEMAIN VALDORA
          </div>
          <button
            type="button"
            className="dashboard-close-btn"
            onClick={closeDashboard}
            aria-label="Tutup Dashboard"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="dashboard-body">
          {/* Kolom Kiri: Render Karakter 3D Skin & Info Akun */}
          <div className="player-character-card">
            <div className="character-viewport">
              <img
                src={user.bodyUrl || `https://mc-heads.net/body/${user.username}/280`}
                alt={`Karakter 3D Minecraft ${user.username}`}
                className="player-skin-render"
                onError={(e) => {
                  const step = e.currentTarget.dataset.fallbackStep || '0'
                  if (step === '0') {
                    e.currentTarget.dataset.fallbackStep = '1'
                    e.currentTarget.src = user.avatarUrl || `/api/player/avatar/${encodeURIComponent(user.username)}?size=128`
                  } else if (step === '1') {
                    e.currentTarget.dataset.fallbackStep = '2'
                    e.currentTarget.src = `/api/player/avatar/${encodeURIComponent(user.username)}?size=128`
                  } else {
                    e.currentTarget.src = `https://mc-heads.net/avatar/Steve/100`
                  }
                }}
              />
              <div className="character-pedestal"></div>
            </div>

            <div className="player-identity">
              <h2 id="dashboard-player-name" className="player-ign">
                {user.username}
              </h2>
              <div className="player-badges">
                {race.rank && (
                  <span 
                    className="badge-pass" 
                    style={{ 
                      background: race.rank === 'Developer' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      border: `1px solid ${race.rank === 'Developer' ? '#ef4444' : '#38bdf8'}`,
                      color: race.rank === 'Developer' ? '#fca5a5' : '#7dd3fc'
                    }}
                  >
                    <IconStar size={10} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                    {race.rank.toUpperCase()}
                  </span>
                )}
                <span className={`badge-pass ${bp.isPremium ? 'premium-vip' : 'free-tier'}`}>
                  {bp.isPremium ? (
                    <>
                      <IconStar size={10} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                      BattlePass VIP
                    </>
                  ) : 'BattlePass Free'}
                </span>
                <span className="badge-status online">
                  <span className="status-dot"></span> Aktif di Server
                </span>
              </div>
              <div className="player-uuid" title={user.uuid}>
                UUID: <code>{user.uuid ? user.uuid.substring(0, 16) + '...' : 'Online-Auth'}</code>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="player-quick-actions">
              <button
                type="button"
                className="dash-action-btn copy-btn"
                onClick={handleCopyIp}
              >
                {copiedIp ? (
                  <>
                    <IconCheck size={14} style={{ marginRight: '5px', verticalAlign: '-2px' }} />
                    IP Tersalin!
                  </>
                ) : 'Salin IP Server'}
              </button>
              <button
                type="button"
                className="dash-action-btn logout-btn"
                onClick={logout}
              >
                Keluar Sesi
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Ras, BattlePass & Stats */}
          <div className="player-details-grid">
            {/* KARTU 1: RAS VALDORA */}
            <div className="rpg-card race-card" style={{ borderColor: race.badgeColor || '#38bdf8' }}>
              <div className="rpg-card-header">
                <div className="card-title-group">
                  <span className="card-icon"><IconShield size={18} /></span>
                  <div>
                    <span className="card-kicker">DATA RAS &amp; STATUS</span>
                    <h3 className="card-title" style={{ color: race.badgeColor || '#38bdf8' }}>
                      Ras: {race.name}
                    </h3>
                  </div>
                </div>
                <div 
                  className="race-level-badge"
                  style={{ 
                    border: `1px solid ${race.badgeColor || '#38bdf8'}`,
                    color: race.badgeColor || '#38bdf8'
                  }}
                >
                  {race.tier || race.profession || 'Deity'}
                </div>
              </div>
              <p className="race-lore-text">
                {race.lore || 'Ksatria tangguh Valdora dengan kemahiran tempur dan ketahanan fisik tinggi.'}
              </p>
              <div className="race-meta-pills">
                <div className="meta-pill">
                  <span className="pill-label">Gelar Ras:</span>
                  <span className="pill-value">{race.title || 'Petualang'}</span>
                </div>
                <div className="meta-pill">
                  <span className="pill-label">Profesi In-Game:</span>
                  <span className="pill-value highlight">{race.profession || 'Petualang'}</span>
                </div>
                <div className="meta-pill">
                  <span className="pill-label">No. Kartu Identitas:</span>
                  <span className="pill-value">{race.idNumber || 'ID-VALDORA'}</span>
                </div>
              </div>
            </div>

            {/* KARTU 2: BATTLEPASS (ValdoraPass 35 Tier) */}
            <div className="rpg-card bp-card">
              <div className="rpg-card-header">
                <div className="card-title-group">
                  <span className="card-icon"><IconSword size={18} /></span>
                  <div>
                    <span className="card-kicker">PROGRES VALDORAPASS</span>
                    <h3 className="card-title">{bp.passName}</h3>
                  </div>
                </div>
                <div className={`bp-tier-badge ${bp.isPremium ? 'tier-premium' : ''}`}>
                  Tier {bp.tier || 1} / {bp.maxTiers || 35}
                </div>
              </div>

              {/* Progress Bar EXP */}
              <div className="bp-progress-section">
                <div className="bp-progress-labels">
                  <span className="progress-title">Kemajuan EXP Tier Ini</span>
                  <span className="progress-numbers">
                    {bp.points} / {bp.maxPoints || 1000} EXP ({bpPercent}%)
                  </span>
                </div>
                <div className="bp-progress-track">
                  <div
                    className="bp-progress-fill"
                    style={{ width: `${bpPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="bp-meta-grid">
                <div className="bp-meta-item">
                  <span className="bp-item-label">Misi Selesai:</span>
                  <span className="bp-item-val">{bp.completedDaily || 0} Misi</span>
                </div>
                <div className="bp-meta-item">
                  <span className="bp-item-label">Status Lisensi:</span>
                  <span className={`bp-item-val ${bp.isPremium ? 'gold' : ''}`}>
                    {bp.isPremium ? (
                      <>
                        <IconStar size={10} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                        VIP Premium Pass
                      </>
                    ) : 'Standard Free Pass'}
                  </span>
                </div>
              </div>
            </div>

            {/* KARTU 3: STATISTIK KECAKAPAN (AuraSkills - 11 Skills & Mana) */}
            <div className="rpg-card skills-card">
              <div className="rpg-card-header">
                <div className="card-title-group">
                  <span className="card-icon"><IconBolt size={18} /></span>
                  <div>
                    <span className="card-kicker">STATISTIK AURASKILLS</span>
                    <h3 className="card-title">Level 11 Cabang Keahlian</h3>
                  </div>
                </div>
                <div className="skill-power-pill">
                  <span className="power-val">Total Lv. {user.stats?.totalLevel || 0}</span>
                  <span className="mana-val">
                    <IconDrop size={13} style={{ verticalAlign: '-2px', marginRight: '3px' }} />
                    Mana: {user.stats?.mana || 20}
                  </span>
                </div>
              </div>

              <div className="skills-detailed-grid">
                {(user.stats?.skills || []).map((sk) => (
                  <div key={sk.id} className="skill-box-card" title={sk.desc}>
                    <div className="skill-box-header">
                      <span className="skill-icon">
                        <SkillIcon id={sk.id} size={15} />
                      </span>
                      <div className="skill-info">
                        <span className="skill-name">{sk.name}</span>
                        <span className="skill-xp">{sk.xp ? `${sk.xp.toLocaleString()} XP` : '0 XP'}</span>
                      </div>
                      <span className="skill-level-badge">Lv. {sk.level}</span>
                    </div>
                    <div className="skill-xp-bar">
                      <div 
                        className="skill-xp-fill" 
                        style={{ width: `${Math.min(100, Math.max(5, (sk.level / 100) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="dashboard-footer-notice">
          <span>
            <IconShield size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
            Data disinkronkan langsung dari server Minecraft Valdora.
          </span>
        </div>
      </div>
    </div>
  )
}
