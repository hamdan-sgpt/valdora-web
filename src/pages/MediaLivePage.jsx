import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from '../context/RouterContext'
import { 
  IconBroadcast, 
  IconYouTube, 
  IconTikTok, 
  IconPlay, 
  IconExternalLink, 
  IconCopy, 
  IconCheck, 
  IconRotate,
  IconFilter
} from '../components/Icons'
import './PagesCommon.css'
import './MediaLivePage.css'

export default function MediaLivePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'live' | 'youtube' | 'tiktok'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStream, setSelectedStream] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [timeAgoText, setTimeAgoText] = useState('Menghubungkan...')
  
  const stageRef = useRef(null)
  const previousItemIdsRef = useRef(new Set())

  // Tampilkan toast notifikasi singkat
  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    const timer = setTimeout(() => {
      setToastMessage(null)
    }, 3200)
    return () => clearTimeout(timer)
  }, [])

  // Fungsi fetch data dari endpoint /api/media
  const loadMedia = useCallback(async (forceRefresh = false, isSilent = false) => {
    if (!isSilent) {
      setIsRefreshing(true)
    }

    try {
      const endpoint = forceRefresh ? '/api/media?refresh=1' : '/api/media'
      const res = await fetch(endpoint)
      if (!res.ok) {
        throw new Error('Gagal memuat feed siaran dari server.')
      }
      const data = await res.json()

      if (data.success && Array.isArray(data.items)) {
        // Deteksi apakah ada kiriman media baru
        if (previousItemIdsRef.current.size > 0) {
          const newPosts = data.items.filter((item) => !previousItemIdsRef.current.has(item.id))
          if (newPosts.length > 0) {
            showToast(`${newPosts.length} kiriman media baru masuk dari Discord!`)
          }
        }

        previousItemIdsRef.current = new Set(data.items.map((i) => i.id))
        setItems(data.items)
        setError(null)
        setLastSyncTime(Date.now())

        // Jika belum ada siaran terpilih, prioritaskan yang berstatus Live YouTube atau item pertama
        setSelectedStream((prev) => {
          if (prev) {
            const stillExists = data.items.find((i) => i.id === prev.id)
            if (stillExists) return stillExists
          }
          const firstLiveYt = data.items.find((i) => i.isLive && i.platform === 'youtube' && i.embedUrl)
          const firstLive = data.items.find((i) => i.isLive)
          return firstLiveYt || firstLive || data.items[0] || null
        })
      }
    } catch (err) {
      if (items.length === 0) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [items.length, showToast])

  // Pemuatan data perdana
  useEffect(() => {
    loadMedia(false, false)
  }, [loadMedia])

  // Polling latar belakang berkala setiap 25 detik
  useEffect(() => {
    const interval = setInterval(() => {
      loadMedia(false, true)
    }, 25000)
    return () => clearInterval(interval)
  }, [loadMedia])

  // Ticker waktu sinkronisasi relatif
  useEffect(() => {
    const updateTicker = () => {
      if (!lastSyncTime) {
        setTimeAgoText('Menghubungkan...')
        return
      }
      const diffSec = Math.floor((Date.now() - lastSyncTime) / 1000)
      if (diffSec < 5) {
        setTimeAgoText('Baru saja')
      } else if (diffSec < 60) {
        setTimeAgoText(`${diffSec} detik lalu`)
      } else {
        const diffMin = Math.floor(diffSec / 60)
        setTimeAgoText(`${diffMin} menit lalu`)
      }
    }

    updateTicker()
    const timer = setInterval(updateTicker, 5000)
    return () => clearInterval(timer)
  }, [lastSyncTime])

  // Salin tautan siaran ke clipboard dengan fallback andal
  const handleCopyLink = useCallback((url, id = 'stage') => {
    if (!url) return
    const onCopied = () => {
      setCopiedId(id)
      showToast('Tautan siaran berhasil disalin!')
      setTimeout(() => setCopiedId(null), 2500)
    }

    let copied = false
    try {
      const el = document.createElement('textarea')
      el.value = url
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      copied = document.execCommand('copy')
      document.body.removeChild(el)
    } catch {}

    if (copied) {
      onCopied()
    } else if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(onCopied).catch(() => onCopied())
    } else {
      onCopied()
    }
  }, [showToast])

  // Format tanggal pesan Discord
  const formatTimeAgo = useCallback((dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHour = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHour / 24)

      if (diffSec < 60) return 'Baru saja'
      if (diffMin < 60) return `${diffMin} menit lalu`
      if (diffHour < 24) return `${diffHour} jam lalu`
      if (diffDay < 7) return `${diffDay} hari lalu`

      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Waktu tidak diketahui'
    }
  }, [])

  // Pilih stream untuk diputar di Cinema Stage
  const handleSelectStream = useCallback((stream) => {
    setSelectedStream(stream)
    if (stageRef.current) {
      stageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Filter dan pencarian media
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter platform & status
      if (activeFilter === 'live' && !item.isLive) return false
      if (activeFilter === 'youtube' && item.platform !== 'youtube') return false
      if (activeFilter === 'tiktok' && item.platform !== 'tiktok') return false

      // Pencarian query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = (item.title || '').toLowerCase().includes(query)
        const matchAuthor = (item.author || '').toLowerCase().includes(query)
        const matchDesc = (item.description || '').toLowerCase().includes(query)
        return matchTitle || matchAuthor || matchDesc
      }

      return true
    })
  }, [items, activeFilter, searchQuery])

  // Hitungan statistik real
  const liveCount = useMemo(() => items.filter((i) => i.isLive).length, [items])
  const ytCount = useMemo(() => items.filter((i) => i.platform === 'youtube').length, [items])
  const tiktokCount = useMemo(() => items.filter((i) => i.platform === 'tiktok').length, [items])

  return (
    <div className="subpage-view media-live-page">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="media-toast" role="status" aria-live="polite">
          <span className="toast-icon"><IconCheck size={16} /></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner Breadcrumb */}
      <section className="subpage-banner">
        <div className="container">
          <nav className="subpage-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-link">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Live &amp; Media</span>
          </nav>
        </div>
      </section>

      {/* Header Halaman */}
      <header className="media-page-header">
        <div className="container">
          <div className="media-header-badge-row">
            <div className={`media-live-status-pill ${liveCount > 0 ? 'is-active' : ''}`}>
              <span className="pulse-dot" aria-hidden="true"></span>
              <span className="pill-text">
                {liveCount > 0 ? `${liveCount} Siaran Live Terdeteksi` : 'Feed Siaran Discord'}
              </span>
            </div>

            <div className="media-sync-indicator" title="Sinkronisasi otomatis dengan saluran Discord #share-media">
              <span className="sync-label">Sinkron Discord:</span>
              <strong className="sync-val">{timeAgoText}</strong>
            </div>

            <button
              type="button"
              className={`btn-media-refresh ${isRefreshing ? 'rotating' : ''}`}
              onClick={() => loadMedia(true, false)}
              disabled={isRefreshing}
              title="Perbarui feed media dari Discord sekarang"
              aria-label="Perbarui feed media dari Discord"
            >
              <IconRotate size={15} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Perbarui'}</span>
            </button>
          </div>

          <h1 className="media-page-title">
            SIARAN LIVE &amp; MEDIA
          </h1>
          <p className="media-page-subtitle">
            Kumpulan siaran langsung, cuplikan gameplay, dan konten seru petualang Valdora Universe yang dibagikan secara otomatis melalui saluran Discord #share-media.
          </p>
        </div>
      </header>

      {/* CINEMA STAGE: Sorotan Utama Siaran */}
      <section className="cinema-stage-section" ref={stageRef}>
        <div className="container">
          {loading && !selectedStream ? (
            <div className="cinema-stage-card loading-state">
              <div className="stage-skeleton-player">
                <div className="stage-loader-spinner" aria-hidden="true"></div>
                <p>Menghubungkan ke saluran Discord #share-media...</p>
              </div>
            </div>
          ) : selectedStream ? (
            <div className="cinema-stage-card">
              {/* Header Panggung */}
              <div className="stage-top-bar">
                <div className="stage-category-tag">
                  {selectedStream.isLive ? (
                    <span className="badge-live-highlight">
                      <span className="live-dot" aria-hidden="true"></span>
                      SIARAN AKTIF
                    </span>
                  ) : (
                    <span className="badge-media-highlight">
                      KONTEN MEDIA
                    </span>
                  )}
                  <span className="stage-platform-name">
                    {selectedStream.platform === 'youtube' ? 'YouTube' : selectedStream.platform === 'tiktok' ? 'TikTok' : 'Media Web'}
                  </span>
                </div>

                <div className="stage-actions-top">
                  <button
                    type="button"
                    className="stage-action-btn"
                    onClick={() => handleCopyLink(selectedStream.rawUrl, 'stage-top')}
                    title="Salin tautan siaran"
                    aria-label="Salin tautan siaran"
                  >
                    {copiedId === 'stage-top' ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    <span>{copiedId === 'stage-top' ? 'Tersalin' : 'Salin Tautan'}</span>
                  </button>

                  <a
                    href={selectedStream.rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stage-action-btn btn-highlight"
                    title={`Buka di ${selectedStream.platform === 'youtube' ? 'YouTube' : selectedStream.platform === 'tiktok' ? 'TikTok' : 'Sumber Asli'}`}
                  >
                    <span>Buka Siaran</span>
                    <IconExternalLink size={15} />
                  </a>
                </div>
              </div>

              {/* Pemutar Video atau Pratinjau Siaran */}
              <div className="stage-player-viewport">
                {selectedStream.platform === 'youtube' && selectedStream.embedUrl ? (
                  <iframe
                    src={selectedStream.embedUrl}
                    title={selectedStream.title || 'Pemutar YouTube Valdora'}
                    className="stage-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="stage-external-preview">
                    {selectedStream.thumbnail ? (
                      <img 
                        src={selectedStream.thumbnail} 
                        alt={selectedStream.title}
                        className="stage-preview-backdrop"
                      />
                    ) : (
                      <div className="stage-preview-placeholder-bg" />
                    )}
                    <div className="stage-preview-overlay">
                      <div className="stage-preview-center-box">
                        <div className="platform-icon-large">
                          {selectedStream.platform === 'tiktok' ? (
                            <IconTikTok size={44} />
                          ) : (
                            <IconBroadcast size={44} />
                          )}
                        </div>
                        <h2 className="preview-center-title">{selectedStream.title}</h2>
                        <p className="preview-center-author">Oleh {selectedStream.author}</p>
                        <a
                          href={selectedStream.rawUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-gold btn-lg btn-play-external"
                        >
                          <IconPlay size={18} />
                          <span>Tonton di {selectedStream.platform === 'tiktok' ? 'TikTok' : 'Browser'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Informasi Rinci Siaran */}
              <div className="stage-meta-footer">
                <div className="stage-author-block">
                  {selectedStream.avatar ? (
                    <img 
                      src={selectedStream.avatar} 
                      alt={selectedStream.author}
                      className="stage-author-avatar"
                      width="46"
                      height="46"
                    />
                  ) : (
                    <div className="stage-author-fallback" aria-hidden="true">
                      {selectedStream.author ? selectedStream.author.charAt(0).toUpperCase() : 'V'}
                    </div>
                  )}
                  <div className="stage-author-text">
                    <div className="stage-author-name-row">
                      <strong className="stage-author-name">{selectedStream.author}</strong>
                      <span className="stage-author-username">@{selectedStream.username}</span>
                    </div>
                    <span className="stage-post-time">
                      Dibagikan di #share-media • {formatTimeAgo(selectedStream.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="stage-stream-details">
                  <h3 className="stage-stream-title">{selectedStream.title}</h3>
                  {selectedStream.description && (
                    <p className="stage-stream-desc">{selectedStream.description}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="cinema-stage-card empty-state">
              <IconBroadcast size={40} className="empty-icon" />
              <h3>Belum ada siaran yang disematkan</h3>
              <p>Jadilah yang pertama membagikan siaran di saluran Discord #share-media.</p>
            </div>
          )}
        </div>
      </section>

      {/* FILTER & PENCARIAN FEED */}
      <section className="media-controls-section">
        <div className="container">
          <div className="media-controls-wrap">
            {/* Filter Tabs */}
            <div className="media-filter-tabs" role="tablist" aria-label="Kategori Siaran">
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'all'}
                className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                <span>Semua Media</span>
                <span className="tab-counter">{items.length}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'live'}
                className={`filter-tab-btn ${activeFilter === 'live' ? 'active' : ''}`}
                onClick={() => setActiveFilter('live')}
              >
                <span className="tab-live-dot" aria-hidden="true"></span>
                <span>Siaran Live</span>
                <span className="tab-counter">{liveCount}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'youtube'}
                className={`filter-tab-btn ${activeFilter === 'youtube' ? 'active' : ''}`}
                onClick={() => setActiveFilter('youtube')}
              >
                <span className="tab-icon-yt"><IconYouTube size={15} /></span>
                <span>YouTube</span>
                <span className="tab-counter">{ytCount}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'tiktok'}
                className={`filter-tab-btn ${activeFilter === 'tiktok' ? 'active' : ''}`}
                onClick={() => setActiveFilter('tiktok')}
              >
                <span className="tab-icon-tt"><IconTikTok size={15} /></span>
                <span>TikTok</span>
                <span className="tab-counter">{tiktokCount}</span>
              </button>
            </div>

            {/* Input Pencarian */}
            <div className="media-search-box">
              <input
                id="media-search"
                name="media-search"
                type="text"
                placeholder="Cari judul atau streamer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="media-search-input"
                aria-label="Cari judul siaran atau nama streamer"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Hapus pencarian"
                  aria-label="Hapus pencarian"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEED DAFTAR KARTU MEDIA */}
      <section className="media-grid-section">
        <div className="container">
          {loading && items.length === 0 ? (
            <div className="media-grid-loading">
              <div className="stage-loader-spinner" aria-hidden="true"></div>
              <p>Menyelaraskan siaran terbaru dari komunitas...</p>
            </div>
          ) : error && items.length === 0 ? (
            <div className="media-state-card error-card">
              <h3>Terjadi Kendala Sinkronisasi</h3>
              <p>{error}</p>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => loadMedia(true, false)}
              >
                Coba Sinkron Ulang
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="media-state-card empty-card">
              <IconFilter size={36} className="empty-icon" />
              <h3>Tidak ada konten yang sesuai</h3>
              <p>Coba sesuaikan kata kunci pencarian atau ganti filter kategori.</p>
              {(searchQuery || activeFilter !== 'all') && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearchQuery('')
                    setActiveFilter('all')
                  }}
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          ) : (
            <div className="media-cards-grid">
              {filteredItems.map((item) => {
                const isSelected = selectedStream && selectedStream.id === item.id

                return (
                  <article 
                    key={item.id} 
                    className={`media-card ${isSelected ? 'is-selected' : ''}`}
                  >
                    {/* Thumbnail & Badges */}
                    <div 
                      className="media-card-thumbnail-wrap"
                      onClick={() => handleSelectStream(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectStream(item)
                        }
                      }}
                      aria-label={`Pilih siaran: ${item.title}`}
                    >
                      {item.thumbnail ? (
                        <img 
                          src={item.thumbnail} 
                          alt={item.title}
                          className="media-card-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="media-card-thumb-fallback">
                          {item.platform === 'youtube' ? (
                            <IconYouTube size={36} />
                          ) : item.platform === 'tiktok' ? (
                            <IconTikTok size={36} />
                          ) : (
                            <IconBroadcast size={36} />
                          )}
                        </div>
                      )}

                      {/* Lencana Status Siaran */}
                      <div className="media-card-badges">
                        <span className={`badge-platform ${item.platform}`}>
                          {item.platform === 'youtube' ? (
                            <><IconYouTube size={13} /> YouTube</>
                          ) : item.platform === 'tiktok' ? (
                            <><IconTikTok size={13} /> TikTok</>
                          ) : (
                            'Media'
                          )}
                        </span>

                        {item.isLive && (
                          <span className="badge-live-card">
                            <span className="live-dot-pulse" aria-hidden="true"></span>
                            LIVE
                          </span>
                        )}
                      </div>

                      {/* Hover Overlay Play Button */}
                      <div className="media-card-hover-overlay">
                        <span className="card-play-action-icon">
                          <IconPlay size={22} />
                        </span>
                        <span className="card-play-action-text">Putar di Panggung</span>
                      </div>
                    </div>

                    {/* Informasi Konten */}
                    <div className="media-card-body">
                      {/* Pemilik Postingan Discord */}
                      <div className="media-card-author-row">
                        {item.avatar ? (
                          <img 
                            src={item.avatar} 
                            alt={item.author} 
                            className="media-card-avatar"
                            width="28"
                            height="28"
                          />
                        ) : (
                          <div className="media-card-avatar-initial" aria-hidden="true">
                            {item.author.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="media-card-author-meta">
                          <span className="card-author-name">{item.author}</span>
                          <span className="card-timestamp">{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>

                      {/* Judul Siaran */}
                      <h4 
                        className="media-card-title" 
                        title={item.title}
                        onClick={() => handleSelectStream(item)}
                      >
                        {item.title}
                      </h4>

                      {/* Baris Tombol Aksi */}
                      <div className="media-card-footer">
                        <button
                          type="button"
                          className="btn-card-select"
                          onClick={() => handleSelectStream(item)}
                        >
                          <IconPlay size={14} />
                          <span>{isSelected ? 'Sedang Diputar' : 'Tonton'}</span>
                        </button>

                        <div className="card-external-btns">
                          <button
                            type="button"
                            className="btn-icon-card"
                            onClick={() => handleCopyLink(item.rawUrl, item.id)}
                            title="Salin tautan siaran"
                            aria-label="Salin tautan siaran"
                          >
                            {copiedId === item.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
                          </button>

                          <a
                            href={item.rawUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon-card"
                            title={`Buka di ${item.platform === 'youtube' ? 'YouTube' : item.platform === 'tiktok' ? 'TikTok' : 'Browser'}`}
                            aria-label={`Buka di ${item.platform === 'youtube' ? 'YouTube' : item.platform === 'tiktok' ? 'TikTok' : 'Browser'}`}
                          >
                            <IconExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* PANDUAN PETUALANG: CARA MEMBAGIKAN SIARAN */}
      <section className="community-cta-section">
        <div className="container">
          <div className="community-cta-card">
            <div className="cta-content">
              <span className="cta-eyebrow">KREATOR VALDORA</span>
              <h2 className="cta-title">Ingin Siaranmu Tampil di Halaman Ini?</h2>
              <p className="cta-description">
                Cukup bagikan tautan live stream (YouTube atau TikTok) ke channel Discord <strong>#share-media</strong>. Sistem Valdora secara otomatis mendeteksi dan menampilkannya di situs resmi ini dalam hitungan detik.
              </p>
            </div>

            <div className="cta-buttons">
              <a
                href="https://discord.com/channels/1541267151631941784/1541267152718266517"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold btn-lg"
              >
                <span>Buka Saluran #share-media di Discord</span>
                <IconExternalLink size={16} />
              </a>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleCopyLink('https://discord.com/channels/1541267151631941784/1541267152718266517', 'discord-channel')}
              >
                {copiedId === 'discord-channel' ? <IconCheck size={16} /> : <IconCopy size={16} />}
                <span>{copiedId === 'discord-channel' ? 'Link Discord Tersalin' : 'Salin Tautan Saluran'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
