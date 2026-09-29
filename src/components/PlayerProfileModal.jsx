import React, { useState, useEffect } from 'react'
import './PlayerDashboard.css'
import { 
  IconSword, 
  IconShield, 
  IconClose, 
  IconStar, 
  IconBolt, 
  IconDrop, 
  IconCoin,
  SkillIcon 
} from './Icons'

export default function PlayerProfileModal({ username, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setError(null)

    fetch(`/api/player/profile?username=${encodeURIComponent(username)}`)
      .then(async res => {
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || `Karakter "${username}" tidak ditemukan di server Valdora.`)
        }
        return data
      })
      .then(data => {
        if (data.success && data.profile) {
          setProfile(data.profile)
        } else {
          throw new Error(`Karakter "${username}" tidak ditemukan di server Valdora.`)
        }
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [username])

  if (!username) return null

  const race = profile?.race || {
    name: 'Pemain Valdora',
    title: 'Warga Valdora',
    tier: 'Mortal',
    badgeColor: '#38bdf8',
    lore: 'Pemain yang sedang mengembangkan kemampuan dan statistik di Valdora.'
  }

  const bp = profile?.battlePass || {
    passName: 'BattlePass Free',
    isPremium: false,
    tier: 1,
    points: 0,
    maxPoints: 1000,
    status: 'Free Tier'
  }

  const bpPercent = Math.min(100, Math.round(((bp.points || 0) / (bp.maxPoints || 1000)) * 100))

  return (
    <div className="dashboard-overlay" onClick={onClose}>
      <div 
        className="dashboard-modal-chassis" 
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        {/* Sudut Plakat Emas */}
        <div className="dash-corner corner-tl"></div>
        <div className="dash-corner corner-tr"></div>
        <div className="dash-corner corner-bl"></div>
        <div className="dash-corner corner-br"></div>

        {/* Top Bar Navigation */}
        <div className="dashboard-topbar">
          <div className="dashboard-realm-tag">
            <span className="realm-gem"><IconSword size={14} /></span> PROFIL PEMAIN VALDORA
          </div>
          <button 
            type="button" 
            className="dashboard-close-btn"
            onClick={onClose}
            aria-label="Tutup Kartu Profil"
          >
            <IconClose size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div className="auth-spinner" style={{ margin: '0 auto 16px' }}></div>
            <p>Menghubungkan ke database server Minecraft...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171'
            }}>
              <IconClose size={30} />
            </div>
            <h3 style={{ color: '#f1f5f9', fontSize: '1.25rem', marginBottom: '8px', fontWeight: 600 }}>
              Pemain Tidak Ditemukan
            </h3>
            <p style={{ color: '#94a3b8', maxWidth: '380px', margin: '0 auto 24px', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {error}
            </p>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ padding: '10px 24px', fontSize: '0.9rem' }}
            >
              Tutup
            </button>
          </div>
        ) : profile ? (
          <div className="dashboard-body">
            {/* Kolom Kiri: 3D Karakter Skin & Info Akun */}
            <div className="player-character-card">
              <div className="character-viewport">
                <img
                  src={profile.bodyUrl || `https://mc-heads.net/body/${profile.username}/280`}
                  alt={`Karakter 3D Minecraft ${profile.username}`}
                  className="player-skin-render"
                  onError={(e) => {
                    const step = e.currentTarget.dataset.fallbackStep || '0'
                    if (step === '0') {
                      e.currentTarget.dataset.fallbackStep = '1'
                      e.currentTarget.src = profile.avatarUrl || `/api/player/avatar/${encodeURIComponent(profile.username)}?size=128`
                    } else if (step === '1') {
                      e.currentTarget.dataset.fallbackStep = '2'
                      e.currentTarget.src = `/api/player/avatar/${encodeURIComponent(profile.username)}?size=128`
                    } else {
                      e.currentTarget.src = `https://mc-heads.net/avatar/Steve/100`
                    }
                  }}
                />
                <div className="character-pedestal"></div>
              </div>

              <div className="player-identity">
                <h2 className="player-ign">
                  {profile.username}
                </h2>
                <div className="player-badges">
                  {(race.roleBadge || (race.isStaff && race.rank)) && (
                    <span 
                      className={`badge-pass ${race.roleBadge ? race.roleBadge.toLowerCase() : 'staff'}`}
                      style={{ 
                        background: race.roleBadge === 'FOUNDER' ? 'rgba(234, 179, 8, 0.15)' :
                                   race.roleBadge === 'DEV' || race.roleBadge === 'LEAD DEV' ? 'rgba(6, 182, 212, 0.15)' :
                                   race.roleBadge === 'SKRIPTER' ? 'rgba(56, 189, 248, 0.15)' :
                                   race.roleBadge === 'MODELER' ? 'rgba(236, 72, 153, 0.15)' :
                                   race.roleBadge === 'RAJA' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        border: `1px solid ${
                                   race.roleBadge === 'FOUNDER' ? '#eab308' :
                                   race.roleBadge === 'DEV' || race.roleBadge === 'LEAD DEV' ? '#06b6d4' :
                                   race.roleBadge === 'SKRIPTER' ? '#38bdf8' :
                                   race.roleBadge === 'MODELER' ? '#ec4899' :
                                   race.roleBadge === 'RAJA' ? '#f59e0b' : '#38bdf8'}`,
                        color: race.roleBadge === 'FOUNDER' ? '#fde047' :
                               race.roleBadge === 'DEV' || race.roleBadge === 'LEAD DEV' ? '#67e8f9' :
                               race.roleBadge === 'SKRIPTER' ? '#7dd3fc' :
                               race.roleBadge === 'MODELER' ? '#f472b6' :
                               race.roleBadge === 'RAJA' ? '#fcd34d' : '#7dd3fc'
                      }}
                    >
                      <IconStar size={10} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                      {race.roleBadge || race.rank.toUpperCase()}
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
                    <span className="status-dot"></span> Pemain Terdaftar
                  </span>
                </div>
                <div className="player-uuid">
                  UUID: <code>{profile.uuid ? profile.uuid.substring(0, 16) + '...' : 'Valdora-Player'}</code>
                </div>
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
                      background: 'rgba(0,0,0,0.4)', 
                      border: `1px solid ${race.badgeColor || '#38bdf8'}`,
                      color: race.badgeColor || '#38bdf8' 
                    }}
                  >
                    {race.tier || 'Deity'}
                  </div>
                </div>
                <p className="race-lore-text">
                  {race.lore}
                </p>
                <div className="race-meta-pills">
                  <div className="meta-pill">
                    <span className="pill-label">Gelar Ras:</span>
                    <span className="pill-value">{race.title}</span>
                  </div>
                  <div className="meta-pill">
                    <span className="pill-label">Profesi In-Game:</span>
                    <span className="pill-value highlight">{race.profession || 'Petualang'}</span>
                  </div>
                  <div className="meta-pill">
                    <span className="pill-label">No. Kartu:</span>
                    <span className="pill-value">{race.idNumber || 'ID-VALDORA'}</span>
                  </div>
                </div>
              </div>

              {/* KARTU 2: BATTLEPASS */}
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

                <div className="bp-progress-section">
                  <div className="bp-progress-labels">
                    <span className="progress-title">EXP Tier</span>
                    <span className="progress-numbers">
                      {bp.points} / {bp.maxPoints || 1000} EXP ({bpPercent}%)
                    </span>
                  </div>
                  <div className="bp-progress-track">
                    <div className="bp-progress-fill" style={{ width: `${bpPercent}%` }}></div>
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
                          VIP Premium
                        </>
                      ) : 'Free Standard'}
                    </span>
                  </div>
                </div>
              </div>

              {/* KARTU 3: EKONOMI & KEKAYAAN RUNISH (/eeco) */}
              <div className="rpg-card economy-card" style={{ borderColor: 'rgba(234, 179, 8, 0.4)' }}>
                <div className="rpg-card-header">
                  <div className="card-title-group">
                    <span className="card-icon" style={{ color: '#eab308' }}><IconCoin size={18} /></span>
                    <div>
                      <span className="card-kicker">KAS &amp; KEKAYAAN RUNISH</span>
                      <h3 className="card-title">Dompet Petualang</h3>
                    </div>
                  </div>
                  <div className="eco-balance-pill" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: 'rgba(234, 179, 8, 0.12)',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    color: '#fde047',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}>
                    <IconCoin size={15} style={{ color: '#eab308' }} />
                    <span>{profile.economy?.formatted || '0 Runish'}</span>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.08)'
                }}>
                  <span>Sistem Ekonomi Server (/eeco)</span>
                  <span style={{ color: '#facc15' }}>Kekayaan: <strong>{profile.economy?.compact || '0 Runish'}</strong></span>
                </div>
              </div>

              {/* KARTU 4: STATISTIK KECAKAPAN (AuraSkills - 11 Skills & Mana) */}
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
                    <span className="power-val">Total Lv. {profile.stats?.totalLevel || 0}</span>
                    <span className="mana-val">
                      <IconDrop size={13} style={{ verticalAlign: '-2px', marginRight: '3px' }} />
                      Mana: {profile.stats?.mana || 20}
                    </span>
                  </div>
                </div>

                <div className="skills-detailed-grid">
                  {(profile.stats?.skills || []).map((sk) => (
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
        ) : null}

        <div className="dashboard-footer-notice">
          <span>
            <IconShield size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
            Data disinkronkan langsung dari server internal Minecraft Valdora.
          </span>
        </div>
      </div>
    </div>
  )
}
