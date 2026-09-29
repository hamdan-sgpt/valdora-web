import React, { useState, useEffect } from 'react'
import './SkillInspector.css'
import PlayerProfileModal from './PlayerProfileModal'
import {
  IconSearch,
  IconBolt,
  IconShield,
  IconSword,
  IconPickaxe,
  IconAxe,
  IconBow,
  IconRun,
  IconWheat,
  IconFish,
  IconFlask,
  IconBook,
  IconShovel,
  IconCrown,
  IconStar,
  IconFilter,
  IconClose,
  IconArrowRight,
  IconDrop,
  IconCoin,
  IconTrophy
} from './Icons'

/**
 * Resolves avatar image URL for both Mojang Java premium and SkinsRestorer cracked skins.
 */
function getPlayerAvatar(p, size = 48) {
  if (!p) return `https://mc-heads.net/avatar/Steve/${size}`
  if (p.textureHash) {
    return `https://mc-heads.net/avatar/${p.textureHash}/${size}`
  }
  if (p.avatarUrl) {
    if (size === 48) return p.avatarUrl
    return p.avatarUrl.replace(/\/\d+$/, `/${size}`)
  }
  return `https://mc-heads.net/avatar/${encodeURIComponent(p.username || 'Steve')}/${size}`
}

export default function SkillInspector() {
  const [activeTab, setActiveTab] = useState('directory') // 'directory' | 'baltop'

  // --- STATE DIREKTORI PEMAIN ---
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [raceFilter, setRaceFilter] = useState('all')
  const [bpFilter, setBpFilter] = useState('all')
  const [sortBy, setSortBy] = useState('tier')
  const [page, setPage] = useState(1)

  const [players, setPlayers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // --- STATE BALTOP (LEADERBOARD RUNISH) ---
  const [baltopSearchInput, setBaltopSearchInput] = useState('')
  const [baltopDebouncedSearch, setBaltopDebouncedSearch] = useState('')
  const [baltopRace, setBaltopRace] = useState('all')
  const [baltopPage, setBaltopPage] = useState(1)

  const [baltopList, setBaltopList] = useState([])
  const [baltopTotal, setBaltopTotal] = useState(0)
  const [baltopFilteredCount, setBaltopFilteredCount] = useState(0)
  const [baltopTotalPages, setBaltopTotalPages] = useState(1)
  const [baltopLoading, setBaltopLoading] = useState(false)

  // Modal profil pemain aktif
  const [activePlayer, setActivePlayer] = useState(null)

  // Debounce search input Direktori
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Debounce search input Baltop
  useEffect(() => {
    const timer = setTimeout(() => {
      setBaltopDebouncedSearch(baltopSearchInput)
      setBaltopPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [baltopSearchInput])

  // Fetch Direktori Pemain
  useEffect(() => {
    if (activeTab !== 'directory') return
    let isCancelled = false
    setLoading(true)

    const params = new URLSearchParams()
    if (raceFilter !== 'all') params.set('race', raceFilter)
    if (bpFilter !== 'all') params.set('bp', bpFilter)
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
    params.set('sort', sortBy)
    params.set('page', String(page))
    params.set('limit', '18')

    fetch(`/api/players?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (!isCancelled && data.success) {
          setPlayers(data.players || [])
          setTotalCount(data.total || 0)
          setFilteredCount(data.filteredCount || 0)
          setTotalPages(data.totalPages || 1)
        }
      })
      .catch(err => {
        console.error('Gagal mengambil direktori pemain:', err)
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [activeTab, raceFilter, bpFilter, debouncedSearch, sortBy, page])

  // Fetch Baltop Runish
  useEffect(() => {
    if (activeTab !== 'baltop') return
    let isCancelled = false
    setBaltopLoading(true)

    const params = new URLSearchParams()
    if (baltopRace !== 'all') params.set('race', baltopRace)
    if (baltopDebouncedSearch.trim()) params.set('search', baltopDebouncedSearch.trim())
    params.set('page', String(baltopPage))
    params.set('limit', '30')

    fetch(`/api/baltop?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (!isCancelled && data.success) {
          setBaltopList(data.baltop || [])
          setBaltopTotal(data.total || 0)
          setBaltopFilteredCount(data.filteredCount || 0)
          setBaltopTotalPages(data.totalPages || 1)
        }
      })
      .catch(err => {
        console.error('Gagal mengambil data Baltop:', err)
      })
      .finally(() => {
        if (!isCancelled) setBaltopLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [activeTab, baltopRace, baltopDebouncedSearch, baltopPage])


  const handleRaceChange = (race) => {
    setRaceFilter(race)
    setPage(1)
  }

  const handleBpChange = (bp) => {
    setBpFilter(bp)
    setPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setPage(1)
  }

  const resetAllFilters = () => {
    setRaceFilter('all')
    setBpFilter('all')
    setSearchInput('')
    setDebouncedSearch('')
    setSortBy('tier')
    setPage(1)
  }

  const resetBaltopFilters = () => {
    setBaltopRace('all')
    setBaltopSearchInput('')
    setBaltopDebouncedSearch('')
    setBaltopPage(1)
  }

  const isFiltered = raceFilter !== 'all' || bpFilter !== 'all' || debouncedSearch.trim() !== ''
  const isBaltopFiltered = baltopRace !== 'all' || baltopDebouncedSearch.trim() !== ''

  const raceButtons = [
    { id: 'all', label: 'Semua Ras', color: '#94a3b8' },
    { id: 'human', label: "Human (Xyl'vos)", color: '#38bdf8' },
    { id: 'elf', label: "Elf (Zel'vashar)", color: '#22c55e' },
    { id: 'demon', label: 'Demon (Xurgoth)', color: '#a855f7' },
    { id: 'dwarf', label: 'Dwarf (Grozmar)', color: '#f59e0b' }
  ]

  const bpButtons = [
    { id: 'all', label: 'Semua Status BP' },
    { id: 'premium', label: 'VIP Pass (Premium)', isGold: true },
    { id: 'free', label: 'Free Pass' }
  ]

  // Top 3 Podium untuk Baltop
  const topPodium = baltopPage === 1 ? baltopList.slice(0, 3) : []
  const remainingBaltop = baltopPage === 1 ? baltopList.slice(3) : baltopList

  return (
    <section id="skill-inspector" className="skill-inspector-section">
      <div className="skill-inspector-container">
        {/* Section Header */}
        <div className="section-header text-center">
          <span className="section-kicker">DATA STATISTIK &amp; DIREKTORI PEMAIN</span>
          <h2 className="section-title">
            Direktori Pemain &amp; <span className="text-gradient">Kekayaan Baltop</span>
          </h2>
          <p className="section-subtitle">
            Jelajahi petualang Valdora berdasarkan Ras, kepemilikan BattlePass, level keahlian AuraSkills, serta peringkat kas kekayaan Runish live (/eeco).
          </p>
        </div>

        {/* Tab Switcher: Direktori vs Baltop vs Staff */}
        <div className="inspector-tab-switcher" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'directory'}
            className={`inspector-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <IconShield size={16} />
            <span>Direktori &amp; Filter Pemain</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'baltop'}
            className={`inspector-tab-btn ${activeTab === 'baltop' ? 'active gold-tab' : ''}`}
            onClick={() => setActiveTab('baltop')}
          >
            <IconTrophy size={16} />
            <span>Peringkat Baltop (Kas Runish)</span>
            <span className="tab-pill-badge">Live /eeco</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: DIREKTORI & FILTER PEMAIN
           ======================================================== */}
        {activeTab === 'directory' && (
          <>
            {/* Filter Control Deck */}
            <div className="directory-control-deck">
              {/* Baris 1: Pencarian & Sorting */}
              <div className="deck-search-row">
                <div className="search-input-wrapper">
                  <span className="search-icon"><IconSearch size={18} /></span>
                  <input
                    type="text"
                    className="skill-search-input"
                    placeholder="Cari nama pemain (contoh: KoarKoar, Hamdun_ham)..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchInput('')}
                      aria-label="Hapus pencarian"
                    >
                      <IconClose size={14} />
                    </button>
                  )}
                </div>

                <div className="deck-sort-wrapper">
                  <label htmlFor="sort-select" className="sort-label">Urutkan:</label>
                  <select
                    id="sort-select"
                    className="deck-sort-select"
                    value={sortBy}
                    onChange={handleSortChange}
                  >
                    <option value="tier">Tier ValdoraPass (Tertinggi)</option>
                    <option value="money">Kekayaan Runish (Tertinggi)</option>
                    <option value="level">Level AuraSkills (Tertinggi)</option>
                    <option value="name">Nama Pemain (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Baris 2: Filter Ras */}
              <div className="deck-filter-row">
                <span className="filter-group-label">
                  <IconShield size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
                  Pilih Ras:
                </span>
                <div className="filter-chips-group" role="tablist">
                  {raceButtons.map(rb => (
                    <button
                      key={rb.id}
                      type="button"
                      role="tab"
                      aria-selected={raceFilter === rb.id}
                      className={`filter-chip-btn ${raceFilter === rb.id ? 'active' : ''}`}
                      style={{
                        '--chip-color': rb.color,
                        borderColor: raceFilter === rb.id ? rb.color : 'rgba(255, 255, 255, 0.1)'
                      }}
                      onClick={() => handleRaceChange(rb.id)}
                    >
                      <span className="chip-dot" style={{ backgroundColor: rb.color }}></span>
                      <span>{rb.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Baris 3: Filter BattlePass */}
              <div className="deck-filter-row">
                <span className="filter-group-label">
                  <IconStar size={13} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
                  ValdoraPass:
                </span>
                <div className="filter-chips-group" role="tablist">
                  {bpButtons.map(bp => (
                    <button
                      key={bp.id}
                      type="button"
                      role="tab"
                      aria-selected={bpFilter === bp.id}
                      className={`filter-chip-btn ${bpFilter === bp.id ? 'active' : ''} ${bp.isGold ? 'gold-chip' : ''}`}
                      onClick={() => handleBpChange(bp.id)}
                    >
                      {bp.isGold && <IconCrown size={12} style={{ marginRight: '4px' }} />}
                      <span>{bp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Baris 4: Status Filter Aktif & Reset */}
              <div className="deck-status-bar">
                <div className="deck-count-text">
                  Menampilkan <strong>{filteredCount}</strong> pemain
                  {isFiltered ? ` (dari total ${totalCount} pemain)` : ` terdaftar`}
                </div>

                {isFiltered && (
                  <button
                    type="button"
                    className="deck-reset-btn"
                    onClick={resetAllFilters}
                  >
                    <IconClose size={13} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Players Grid Display */}
            <div className="directory-players-grid">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="player-card-chassis skeleton-card">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-lines">
                      <div className="skeleton-line title"></div>
                      <div className="skeleton-line tag"></div>
                      <div className="skeleton-line bar"></div>
                    </div>
                  </div>
                ))
              ) : players.length > 0 ? (
                players.map((p) => (
                  <div
                    key={p.uuid || p.username}
                    className="player-card-chassis"
                    onClick={() => setActivePlayer(p.username)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActivePlayer(p.username)
                      }
                    }}
                  >
                    <div className="card-corner corner-tl"></div>
                    <div className="card-corner corner-br"></div>

                    <div className="card-top-row">
                      <div className="card-avatar-wrap">
                        <img
                          src={getPlayerAvatar(p, 48)}
                          alt={p.username}
                          className="card-avatar-img"
                          loading="lazy"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.tried) {
                              e.currentTarget.dataset.tried = '1'
                              e.currentTarget.src = `/api/player/avatar/${encodeURIComponent(p.username)}?size=48`
                            }
                          }}
                        />
                      </div>

                      <div className="card-identity-col">
                        <h3 className="card-player-name">{p.username}</h3>
                        <div className="card-badge-row">
                          {p.roleBadge === 'RAJA' || p.rank === 'Raja Ras' || p.raceTier === 'Raja Ras' ? (
                            <span className="card-role-badge raja">
                              <IconCrown size={11} style={{ marginRight: '3px' }} />
                              RAJA
                            </span>
                          ) : p.roleBadge === 'FOUNDER' || (p.isStaff && p.rank === 'Founder') ? (
                            <span className="card-role-badge founder">
                              <IconCrown size={11} style={{ marginRight: '3px' }} />
                              FOUNDER
                            </span>
                          ) : p.roleBadge === 'LEAD DEV' || p.roleBadge === 'DEV' || (p.isStaff && p.rank === 'Developer') ? (
                            <span className="card-role-badge dev">
                              <IconStar size={10} style={{ marginRight: '3px' }} />
                              DEV
                            </span>
                          ) : p.roleBadge === 'SKRIPTER' || (p.isStaff && p.rank === 'Lead Skripter') ? (
                            <span className="card-role-badge staff">
                              <IconStar size={10} style={{ marginRight: '3px' }} />
                              SKRIPTER
                            </span>
                          ) : p.roleBadge === 'MODELER' || (p.isStaff && p.rank === 'Modeler') ? (
                            <span className="card-role-badge modeler">
                              <IconStar size={10} style={{ marginRight: '3px' }} />
                              MODELER
                            </span>
                          ) : p.isStaff ? (
                            <span className="card-role-badge staff">
                              <IconStar size={10} style={{ marginRight: '3px' }} />
                              STAFF
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="card-badges-container">
                      <span
                        className="card-race-tag"
                        style={{
                          borderColor: p.raceBadgeColor || '#38bdf8',
                          color: p.raceBadgeColor || '#38bdf8'
                        }}
                      >
                        <span className="race-dot" style={{ backgroundColor: p.raceBadgeColor || '#38bdf8' }}></span>
                        {p.raceName}
                      </span>

                      <span className={`card-bp-tag ${p.isPremium ? 'premium' : 'free'}`}>
                        {p.isPremium ? (
                          <>
                            <IconCrown size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                            VIP Tier {p.tier}
                          </>
                        ) : (
                          `Free Tier ${p.tier}`
                        )}
                      </span>
                    </div>

                    <div className="card-stats-row">
                      <div className="card-stat-pill" title="Total Level AuraSkills">
                        <IconBolt size={13} style={{ color: '#fbbf24', marginRight: '4px' }} />
                        <span>Total Lv. <strong>{p.totalLevel}</strong></span>
                      </div>
                      <div className="card-stat-pill" title="Kapasitas Mana">
                        <IconDrop size={13} style={{ color: '#38bdf8', marginRight: '3px' }} />
                        <span><strong>{p.mana}</strong> Mana</span>
                      </div>
                      <div className="card-stat-pill money-pill" title="Kekayaan Kas Runish (/eeco)">
                        <IconCoin size={13} style={{ color: '#eab308', marginRight: '3px' }} />
                        <span><strong>{p.compactMoney || `${(p.money || 0).toLocaleString()} Runish`}</strong></span>
                      </div>
                    </div>

                    <div className="card-action-row">
                      <span className="card-open-link">
                        <span>Lihat Profil Lengkap</span>
                        <IconArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="directory-empty-state">
                  <span className="empty-icon"><IconFilter size={36} /></span>
                  <h4>Tidak ada pemain yang cocok</h4>
                  <p>Tidak ditemukan pemain yang sesuai dengan kombinasi filter yang kamu pilih.</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={resetAllFilters}
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}
            </div>

            {/* Paginasi Kontrol Direktori */}
            {!loading && totalPages > 1 && (
              <div className="directory-pagination">
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  aria-label="Halaman Sebelumnya"
                >
                  &larr; Sebelumnya
                </button>

                <span className="page-indicator">
                  Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
                </span>

                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  aria-label="Halaman Selanjutnya"
                >
                  Selanjutnya &rarr;
                </button>
              </div>
            )}
          </>
        )}

        {/* ========================================================
            TAB 2: PAPAN PERINGKAT BALTOP (RUNISH /EECO)
           ======================================================== */}
        {activeTab === 'baltop' && (
          <div className="baltop-container">
            {/* Baltop Control Bar */}
            <div className="directory-control-deck baltop-deck">
              <div className="deck-search-row">
                <div className="search-input-wrapper">
                  <span className="search-icon"><IconSearch size={18} /></span>
                  <input
                    type="text"
                    className="skill-search-input"
                    placeholder="Cari petualang di papan kekayaan..."
                    value={baltopSearchInput}
                    onChange={(e) => setBaltopSearchInput(e.target.value)}
                  />
                  {baltopSearchInput && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setBaltopSearchInput('')}
                      aria-label="Hapus pencarian"
                    >
                      <IconClose size={14} />
                    </button>
                  )}
                </div>

                <div className="baltop-currency-badge">
                  <IconCoin size={15} style={{ color: '#eab308', marginRight: '5px' }} />
                  <span>Mata Uang Server: <strong>Runish (/eeco)</strong></span>
                </div>
              </div>

              {/* Filter Ras di Baltop */}
              <div className="deck-filter-row">
                <span className="filter-group-label">
                  <IconShield size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
                  Filter Ras:
                </span>
                <div className="filter-chips-group" role="tablist">
                  {raceButtons.map(rb => (
                    <button
                      key={rb.id}
                      type="button"
                      role="tab"
                      aria-selected={baltopRace === rb.id}
                      className={`filter-chip-btn ${baltopRace === rb.id ? 'active' : ''}`}
                      style={{
                        '--chip-color': rb.color,
                        borderColor: baltopRace === rb.id ? rb.color : 'rgba(255, 255, 255, 0.1)'
                      }}
                      onClick={() => {
                        setBaltopRace(rb.id)
                        setBaltopPage(1)
                      }}
                    >
                      <span className="chip-dot" style={{ backgroundColor: rb.color }}></span>
                      <span>{rb.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Bar Baltop */}
              <div className="deck-status-bar">
                <div className="deck-count-text">
                  Menampilkan <strong>{baltopFilteredCount}</strong> konglomerat
                  {isBaltopFiltered ? ` (dari total ${baltopTotal} petualang)` : ` terdaftar di kas Runish`}
                </div>

                {isBaltopFiltered && (
                  <button
                    type="button"
                    className="deck-reset-btn"
                    onClick={resetBaltopFilters}
                  >
                    <IconClose size={13} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {baltopLoading ? (
              <div className="directory-players-grid">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="player-card-chassis skeleton-card">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-lines">
                      <div className="skeleton-line title"></div>
                      <div className="skeleton-line tag"></div>
                      <div className="skeleton-line bar"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* TOP 3 PODIUM (HALL OF FAME BALTOP) - Hanya di Halaman 1 jika ada minimal 3 hasil */}
                {topPodium.length >= 3 && !baltopDebouncedSearch && (
                  <div className="baltop-podium-section">
                    <h3 className="podium-title">
                      <IconTrophy size={18} style={{ color: '#facc15', marginRight: '6px', verticalAlign: '-2px' }} />
                      Hall of Fame | Tiga Penguasa Kas Valdora
                    </h3>

                    <div className="baltop-podium-grid">
                      {/* Juara 2: Perak */}
                      <div
                        className="podium-card podium-rank-2"
                        onClick={() => setActivePlayer(topPodium[1].username)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="podium-rank-ribbon silver">#2 Perak</div>
                        <div className="podium-avatar-wrap">
                          <img
                            src={getPlayerAvatar(topPodium[1], 64)}
                            alt={topPodium[1].username}
                            className="podium-avatar"
                            onError={(e) => {
                              if (!e.currentTarget.dataset.tried) {
                                e.currentTarget.dataset.tried = '1'
                                e.currentTarget.src = `/api/player/avatar/${encodeURIComponent(topPodium[1].username)}?size=64`
                              }
                            }}
                          />
                        </div>
                        <h4 className="podium-name">{topPodium[1].username}</h4>
                        <span className="podium-race-tag" style={{ color: topPodium[1].raceBadgeColor }}>
                          {topPodium[1].raceName}
                        </span>
                        <div className="podium-money-badge silver-money">
                          <IconCoin size={14} />
                          <span>{topPodium[1].formattedMoney}</span>
                        </div>
                      </div>

                      {/* Juara 1: Emas (Podium Tengah Tertinggi) */}
                      <div
                        className="podium-card podium-rank-1"
                        onClick={() => setActivePlayer(topPodium[0].username)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="podium-crown-icon">
                          <IconCrown size={28} />
                        </div>
                        <div className="podium-rank-ribbon gold">#1 Penguasa Terkaya</div>
                        <div className="podium-avatar-wrap gold-glow">
                          <img
                            src={getPlayerAvatar(topPodium[0], 72)}
                            alt={topPodium[0].username}
                            className="podium-avatar"
                            onError={(e) => {
                              if (!e.currentTarget.dataset.tried) {
                                e.currentTarget.dataset.tried = '1'
                                e.currentTarget.src = `/api/player/avatar/${encodeURIComponent(topPodium[0].username)}?size=72`
                              }
                            }}
                          />
                        </div>
                        <h4 className="podium-name gold-name">{topPodium[0].username}</h4>
                        <span className="podium-race-tag" style={{ color: topPodium[0].raceBadgeColor }}>
                          {topPodium[0].raceName}
                        </span>
                        <div className="podium-money-badge gold-money">
                          <IconCoin size={16} />
                          <span>{topPodium[0].formattedMoney}</span>
                        </div>
                      </div>

                      {/* Juara 3: Perunggu */}
                      <div
                        className="podium-card podium-rank-3"
                        onClick={() => setActivePlayer(topPodium[2].username)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="podium-rank-ribbon bronze">#3 Perunggu</div>
                        <div className="podium-avatar-wrap">
                          <img
                            src={getPlayerAvatar(topPodium[2], 64)}
                            alt={topPodium[2].username}
                            className="podium-avatar"
                            onError={(e) => {
                              if (!e.currentTarget.dataset.tried) {
                                e.currentTarget.dataset.tried = '1'
                                e.currentTarget.src = `/api/player/avatar/${encodeURIComponent(topPodium[2].username)}?size=64`
                              }
                            }}
                          />
                        </div>
                        <h4 className="podium-name">{topPodium[2].username}</h4>
                        <span className="podium-race-tag" style={{ color: topPodium[2].raceBadgeColor }}>
                          {topPodium[2].raceName}
                        </span>
                        <div className="podium-money-badge bronze-money">
                          <IconCoin size={14} />
                          <span>{topPodium[2].formattedMoney}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TABEL PERINGKAT BALTOP LENGKAP */}
                <div className="baltop-table-card">
                  <div className="baltop-table-header">
                    <span className="col-rank">#</span>
                    <span className="col-player">Petualang</span>
                    <span className="col-race">Ras Valdora</span>
                    <span className="col-bp">Status Pass</span>
                    <span className="col-money">Kekayaan Kas (Runish)</span>
                    <span className="col-action">Aksi</span>
                  </div>

                  <div className="baltop-table-body">
                    {baltopList.length > 0 ? (
                      baltopList.map((p) => (
                        <div
                          key={p.uuid || p.username}
                          className={`baltop-table-row ${p.rank <= 3 ? `top-tier-${p.rank}` : ''}`}
                          onClick={() => setActivePlayer(p.username)}
                        >
                          <div className="col-rank">
                            <span className={`rank-number-pill ${p.rank === 1 ? 'rank-gold' : p.rank === 2 ? 'rank-silver' : p.rank === 3 ? 'rank-bronze' : ''}`}>
                              {p.rank === 1 ? '👑 1' : p.rank === 2 ? '🥈 2' : p.rank === 3 ? '🥉 3' : `#${p.rank}`}
                            </span>
                          </div>

                          <div className="col-player">
                            <div className="table-player-info">
                              <img
                                src={getPlayerAvatar(p, 36)}
                                alt={p.username}
                                className="table-player-avatar"
                                loading="lazy"
                                onError={(e) => {
                                  if (!e.currentTarget.dataset.tried) {
                                    e.currentTarget.dataset.tried = '1'
                                    e.currentTarget.src = `/api/player/avatar/${encodeURIComponent(p.username)}?size=36`
                                  }
                                }}
                              />
                              <div className="table-player-names">
                                <span className="table-player-ign">{p.username}</span>
                                {p.roleBadge === 'RAJA' || p.rankRole === 'Raja Ras' ? (
                                  <span className="card-role-badge raja">RAJA</span>
                                ) : p.roleBadge === 'FOUNDER' || (p.isStaff && p.rankRole === 'Founder') ? (
                                  <span className="card-role-badge founder">FOUNDER</span>
                                ) : p.roleBadge === 'LEAD DEV' || p.roleBadge === 'DEV' || (p.isStaff && p.rankRole === 'Developer') ? (
                                  <span className="card-role-badge dev">DEV</span>
                                ) : p.roleBadge === 'SKRIPTER' || (p.isStaff && p.rankRole === 'Lead Skripter') ? (
                                  <span className="card-role-badge staff">SKRIPTER</span>
                                ) : p.roleBadge === 'MODELER' || (p.isStaff && p.rankRole === 'Modeler') ? (
                                  <span className="card-role-badge modeler">MODELER</span>
                                ) : p.isStaff ? (
                                  <span className="card-role-badge staff">STAFF</span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="col-race">
                            <span
                              className="card-race-tag table-race-tag"
                              style={{
                                borderColor: p.raceBadgeColor || '#38bdf8',
                                color: p.raceBadgeColor || '#38bdf8'
                              }}
                            >
                              <span className="race-dot" style={{ backgroundColor: p.raceBadgeColor || '#38bdf8' }}></span>
                              {p.raceName}
                            </span>
                          </div>

                          <div className="col-bp">
                            <span className={`card-bp-tag ${p.isPremium ? 'premium' : 'free'}`}>
                              {p.isPremium ? 'VIP' : 'Free'} Tier {p.bpTier || 1}
                            </span>
                          </div>

                          <div className="col-money">
                            <div className="baltop-money-display">
                              <IconCoin size={15} style={{ color: '#eab308' }} />
                              <span className="money-amount-text">{p.formattedMoney}</span>
                            </div>
                          </div>

                          <div className="col-action">
                            <button
                              type="button"
                              className="table-profile-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActivePlayer(p.username)
                              }}
                            >
                              <span>Profil</span>
                              <IconArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="directory-empty-state" style={{ margin: '2rem 0' }}>
                        <span className="empty-icon"><IconFilter size={36} /></span>
                        <h4>Tidak ada konglomerat yang cocok</h4>
                        <p>Tidak ditemukan data akun pada kriteria filter pencarian Baltop ini.</p>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={resetBaltopFilters}
                        >
                          Reset Filter Baltop
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Paginasi Baltop */}
                {!baltopLoading && baltopTotalPages > 1 && (
                  <div className="directory-pagination">
                    <button
                      type="button"
                      className="page-nav-btn"
                      disabled={baltopPage <= 1}
                      onClick={() => setBaltopPage(prev => Math.max(1, prev - 1))}
                      aria-label="Halaman Sebelumnya"
                    >
                      &larr; Sebelumnya
                    </button>

                    <span className="page-indicator">
                      Halaman <strong>{baltopPage}</strong> dari <strong>{baltopTotalPages}</strong>
                    </span>

                    <button
                      type="button"
                      className="page-nav-btn"
                      disabled={baltopPage >= baltopTotalPages}
                      onClick={() => setBaltopPage(prev => Math.min(baltopTotalPages, prev + 1))}
                      aria-label="Halaman Selanjutnya"
                    >
                      Selanjutnya &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: TIM PENGURUS & STAFF VALDORA


        {/* 11 Skills Highlight Grid Preview */}
        <div className="skills-overview-chassis">
          <div className="overview-headline">
            <span className="overview-icon"><IconBolt size={16} /></span>
            <span>11 Cabang Keahlian AuraSkills di Server:</span>
          </div>
          <div className="skills-pills-row">
            <span className="skill-pill"><IconShield size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Defense (Lv. 1-100)</span>
            <span className="skill-pill"><IconSword size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Fighting (Critical Strike)</span>
            <span className="skill-pill"><IconPickaxe size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Mining (Double Ores)</span>
            <span className="skill-pill"><IconAxe size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Foraging (Tree Feller)</span>
            <span className="skill-pill"><IconBow size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Archery (Charged Shot)</span>
            <span className="skill-pill"><IconRun size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Agility (Speed &amp; Parkour)</span>
            <span className="skill-pill"><IconWheat size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Farming (Double Crops)</span>
            <span className="skill-pill"><IconFish size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Fishing (Treasure Hunter)</span>
            <span className="skill-pill"><IconFlask size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Alchemy (Brewing Boost)</span>
            <span className="skill-pill"><IconBook size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Enchanting (Mana Flow)</span>
            <span className="skill-pill"><IconShovel size={13} style={{ verticalAlign: '-1px', marginRight: '5px' }} />Excavation (Ancient Relics)</span>
          </div>
        </div>
      </div>

      {/* Modal Profile Player */}
      <PlayerProfileModal
        username={activePlayer}
        onClose={() => setActivePlayer(null)}
      />
    </section>
  )
}
