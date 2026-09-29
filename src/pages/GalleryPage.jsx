import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from '../context/RouterContext'
import { IconSpark, IconClose, IconArrowRight, IconRotate } from '../components/Icons'
import { SERVER_CONFIG } from '../config/server'
import './PagesCommon.css'
import './GalleryPage.css'

/**
 * Komponen kolase media pratinjau untuk satu postingan Discord
 */
function PostMediaCollage({ post, onPhotoClick }) {
  const count = post.photos.length

  if (count === 1) {
    const p = post.photos[0]
    return (
      <div 
        className="post-media-single"
        onClick={() => onPhotoClick(0)}
        role="button"
        tabIndex="0"
        aria-label={`Buka foto penuh: ${post.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onPhotoClick(0)
          }
        }}
      >
        <img 
          src={p.proxyUrl || p.url} 
          alt={post.title} 
          loading="lazy" 
          className="post-media-img" 
        />
        <div className="post-media-hover-overlay">
          <span className="overlay-pill">Klik untuk Memperbesar</span>
        </div>
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="post-media-grid two-items">
        {post.photos.slice(0, 2).map((p, idx) => (
          <div 
            key={p.id || idx} 
            className="post-media-cell"
            onClick={() => onPhotoClick(idx)}
            role="button"
            tabIndex="0"
            aria-label={`Buka foto ${idx + 1} dari ${count}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPhotoClick(idx)
              }
            }}
          >
            <img 
              src={p.proxyUrl || p.url} 
              alt={`${post.title} (${idx + 1})`} 
              loading="lazy" 
              className="post-media-img" 
            />
            <div className="post-media-hover-overlay">
              <span className="overlay-pill">Foto {idx + 1}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="post-media-grid three-items">
        <div 
          className="post-media-cell main-cell"
          onClick={() => onPhotoClick(0)}
          role="button"
          tabIndex="0"
          aria-label={`Buka foto 1 dari ${count}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onPhotoClick(0)
            }
          }}
        >
          <img 
            src={post.photos[0].proxyUrl || post.photos[0].url} 
            alt={`${post.title} (1)`} 
            loading="lazy" 
            className="post-media-img" 
          />
          <div className="post-media-hover-overlay">
            <span className="overlay-pill">Foto 1</span>
          </div>
        </div>
        <div className="post-media-subcol">
          {post.photos.slice(1, 3).map((p, idx) => (
            <div 
              key={p.id || idx + 1} 
              className="post-media-cell sub-cell"
              onClick={() => onPhotoClick(idx + 1)}
              role="button"
              tabIndex="0"
              aria-label={`Buka foto ${idx + 2} dari ${count}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPhotoClick(idx + 1)
                }
              }}
            >
              <img 
                src={p.proxyUrl || p.url} 
                alt={`${post.title} (${idx + 2})`} 
                loading="lazy" 
                className="post-media-img" 
              />
              <div className="post-media-hover-overlay">
                <span className="overlay-pill">Foto {idx + 2}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 4 foto atau lebih (2x2 collage dengan label sisa foto)
  const visible = post.photos.slice(0, 4)
  const remaining = count - 4

  return (
    <div className="post-media-grid four-items">
      {visible.map((p, idx) => {
        const isLastWithMore = idx === 3 && remaining > 0
        return (
          <div 
            key={p.id || idx} 
            className={`post-media-cell ${isLastWithMore ? 'has-more' : ''}`}
            onClick={() => onPhotoClick(idx)}
            role="button"
            tabIndex="0"
            aria-label={`Buka foto ${idx + 1} dari ${count}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPhotoClick(idx)
              }
            }}
          >
            <img 
              src={p.proxyUrl || p.url} 
              alt={`${post.title} (${idx + 1})`} 
              loading="lazy" 
              className="post-media-img" 
            />
            {isLastWithMore ? (
              <div className="post-media-more-overlay">
                <span className="more-count">+{remaining} Foto</span>
                <span className="more-subtext">Lihat Semua</span>
              </div>
            ) : (
              <div className="post-media-hover-overlay">
                <span className="overlay-pill">Foto {idx + 1}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState('posts') // 'posts' (dikelompokkan) atau 'grid' (semua foto)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [timeAgoText, setTimeAgoText] = useState('Menyambungkan...')
  const [newPhotosToast, setNewPhotosToast] = useState(null)
  const previousPhotoIdsRef = useRef(new Set())

  // Lightbox State
  const [activeLightboxPost, setActiveLightboxPost] = useState(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  // Fungsi sinkronisasi galeri Discord
  const loadGallery = useCallback(async (forceRefresh = false, isSilent = false) => {
    if (!isSilent) {
      setIsRefreshing(true)
    }

    try {
      const endpoint = forceRefresh ? '/api/gallery?refresh=1' : '/api/gallery'
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Gagal menyinkronkan foto dari server.')
      const data = await res.json()

      if (data.success && Array.isArray(data.photos)) {
        if (previousPhotoIdsRef.current.size > 0) {
          const newItems = data.photos.filter((p) => !previousPhotoIdsRef.current.has(p.id))
          if (newItems.length > 0) {
            setNewPhotosToast(`${newItems.length} foto petualang baru telah masuk dari Discord!`)
          }
        }

        previousPhotoIdsRef.current = new Set(data.photos.map((p) => p.id))
        setPhotos(data.photos)
        setError(null)
        setLastSyncTime(Date.now())
      }
    } catch (err) {
      if (photos.length === 0) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [photos.length])

  // Pemuatan data pertama kali
  useEffect(() => {
    loadGallery(false, false)
  }, [loadGallery])

  // Realtime background polling setiap 25 detik
  useEffect(() => {
    const interval = setInterval(() => {
      loadGallery(false, true)
    }, 25000)

    return () => clearInterval(interval)
  }, [loadGallery])

  // Indikator waktu relatif sinkronisasi (update tiap 5 detik)
  useEffect(() => {
    const updateTicker = () => {
      if (!lastSyncTime) {
        setTimeAgoText('Menyambungkan...')
        return
      }
      const elapsedSec = Math.floor((Date.now() - lastSyncTime) / 1000)
      if (elapsedSec < 10) {
        setTimeAgoText('Baru saja')
      } else if (elapsedSec < 60) {
        setTimeAgoText(`${elapsedSec} dtk lalu`)
      } else {
        const mins = Math.floor(elapsedSec / 60)
        setTimeAgoText(`${mins} mnt lalu`)
      }
    }

    updateTicker()
    const ticker = setInterval(updateTicker, 5000)
    return () => clearInterval(ticker)
  }, [lastSyncTime])

  // Auto-hide toast setelah 5 detik
  useEffect(() => {
    if (!newPhotosToast) return
    const timer = setTimeout(() => {
      setNewPhotosToast(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [newPhotosToast])

  // Format tanggal relatif Indonesia
  const formatTime = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return ''
    }
  }

  // Kelompokkan foto berdasarkan postingan / thread Discord
  const posts = useMemo(() => {
    const postMap = new Map()

    for (const photo of photos) {
      const key = photo.threadId || photo.id
      if (!postMap.has(key)) {
        postMap.set(key, {
          id: key,
          threadId: photo.threadId,
          title: photo.title || 'Momen Petualangan',
          author: photo.author || 'Petualang Valdora',
          username: photo.username || 'member',
          avatar: photo.avatar,
          caption: photo.caption,
          createdAt: photo.createdAt,
          photos: []
        })
      }
      postMap.get(key).photos.push(photo)
    }

    const list = Array.from(postMap.values())
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return list
  }, [photos])

  // Filter postingan berdasarkan kategori
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeFilter === 'all') return true
      const text = `${post.title} ${post.caption || ''} ${post.author}`.toLowerCase()
      if (activeFilter === 'rp') {
        return text.includes('rp') || text.includes('roleplay') || text.includes('event')
      }
      if (activeFilter === 'family') {
        return text.includes('family') || text.includes('keluarga') || text.includes('xurgorth') || text.includes('iblis') || text.includes('ras')
      }
      return true
    })
  }, [posts, activeFilter])

  // Filter foto satuan (jika dalam mode grid individual)
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      if (activeFilter === 'all') return true
      const content = `${photo.title || ''} ${photo.caption || ''}`.toLowerCase()
      if (activeFilter === 'rp') {
        return content.includes('rp') || content.includes('roleplay') || content.includes('event')
      }
      if (activeFilter === 'family') {
        return content.includes('family') || content.includes('keluarga') || content.includes('xurgorth') || content.includes('iblis') || content.includes('ras')
      }
      return true
    })
  }, [photos, activeFilter])

  // Buka Lightbox
  const openLightbox = (post, photoIndex = 0) => {
    setActiveLightboxPost(post)
    setActivePhotoIndex(photoIndex)
  }

  // Tutup Lightbox
  const closeLightbox = () => {
    setActiveLightboxPost(null)
    setActivePhotoIndex(0)
  }

  // Keyboard navigation untuk lightbox
  useEffect(() => {
    if (!activeLightboxPost) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowRight' && activeLightboxPost.photos.length > 0) {
        setActivePhotoIndex((prev) => (prev + 1) % activeLightboxPost.photos.length)
      } else if (e.key === 'ArrowLeft' && activeLightboxPost.photos.length > 0) {
        setActivePhotoIndex((prev) => (prev - 1 + activeLightboxPost.photos.length) % activeLightboxPost.photos.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeLightboxPost])

  const activePhoto = activeLightboxPost ? activeLightboxPost.photos[activePhotoIndex] : null

  return (
    <div className="subpage-view gallery-page">
      {/* Subpage Banner & Breadcrumb */}
      <div className="subpage-banner">
        <div className="container">
          <nav className="subpage-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-link">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Galeri Petualang</span>
          </nav>
        </div>
      </div>

      {/* Header Banner */}
      <section className="gallery-header-section text-center">
        <div className="container">
          <div className="section-tag gold">
            <IconSpark size={13} />
            <span>REKAM JEJAK DUNIA VALDORA</span>
          </div>
          <h1 className="gallery-header-title">
            Galeri <span className="text-gradient">Petualang</span>
          </h1>
          <p className="gallery-header-desc">
            Dokumentasi momen seru, perang faksi, dan kehidupan roleplay yang dikirimkan langsung oleh pemain melalui forum Discord #gallery.
          </p>

          <div className="gallery-header-meta">
            <div className="discord-sync-badge live" title="Otomatis memperbarui unggahan dari Discord setiap 25 detik">
              <span className="pulse-dot" aria-hidden="true"></span>
              <span className="sync-badge-text">
                Sinkron Langsung Discord: <strong className="sync-time-indicator">{timeAgoText}</strong>
              </span>
            </div>
            <a
              href="https://discord.com/channels/1541267151631941784/1541372010192437302"
              target="_blank"
              rel="noopener noreferrer"
              className="gallery-discord-btn"
            >
              <span>+ Kirim Fotomu di Discord</span>
              <IconArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="section gallery-content-section">
        <div className="container">
          {/* Realtime Toast Notification */}
          {newPhotosToast && (
            <div className="gallery-live-toast" role="status" aria-live="polite">
              <div className="toast-content">
                <span className="toast-spark" aria-hidden="true">✨</span>
                <span>{newPhotosToast}</span>
              </div>
              <button 
                type="button" 
                className="toast-dismiss-btn" 
                onClick={() => setNewPhotosToast(null)}
                aria-label="Tutup notifikasi foto baru"
              >
                ×
              </button>
            </div>
          )}

          {/* Filter Bar & Controls */}
          <div className="gallery-filter-bar">
            {/* Kategori */}
            <div className="filter-group">
              <button
                type="button"
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Semua Postingan ({posts.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${activeFilter === 'rp' ? 'active' : ''}`}
                onClick={() => setActiveFilter('rp')}
              >
                Roleplay &amp; Event
              </button>
              <button
                type="button"
                className={`filter-btn ${activeFilter === 'family' ? 'active' : ''}`}
                onClick={() => setActiveFilter('family')}
              >
                Keluarga &amp; Faksi
              </button>
            </div>

            {/* View Mode Toggle & Refresh Action */}
            <div className="gallery-actions-group">
              <div className="view-mode-toggle" role="group" aria-label="Pilihan tampilan galeri">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'posts' ? 'active' : ''}`}
                  onClick={() => setViewMode('posts')}
                  title="Tampilan per postingan pemain (rapi dan terkelompok seperti Discord)"
                >
                  Per Postingan
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Tampilkan semua foto satu per satu"
                >
                  Semua Foto ({photos.length})
                </button>
              </div>

              <button
                type="button"
                className={`gallery-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                onClick={() => loadGallery(true, false)}
                disabled={isRefreshing}
                title="Segarkan data foto dari Discord sekarang"
                aria-label="Segarkan data foto dari Discord"
              >
                <IconRotate size={14} className={isRefreshing ? 'spin-icon' : ''} />
                <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan'}</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="gallery-loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gallery-skeleton-card">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-meta">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="gallery-empty-card">
              <h3>Kendala Memuat Foto</h3>
              <p>{error}</p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => loadGallery(true, false)}
              >
                Coba Sinkron Ulang
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="gallery-empty-card">
              <h3>Belum Ada Postingan di Kategori Ini</h3>
              <p>Jadilah yang pertama membagikan foto petualanganmu di channel #gallery Discord!</p>
              <a 
                href="https://discord.com/channels/1541267151631941784/1541372010192437302"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Kirim Foto di Discord
              </a>
            </div>
          )}

          {/* TAMPILAN 1: PER POSTINGAN PEMAIN (GROUPED VIEW DISCORD STYLE) */}
          {!loading && !error && viewMode === 'posts' && filteredPosts.length > 0 && (
            <div className="gallery-posts-feed">
              {filteredPosts.map((post) => (
                <article key={post.id} className="gallery-post-card">
                  {/* Header Postingan */}
                  <header className="post-card-header">
                    <div className="post-author-box">
                      {post.avatar ? (
                        <img 
                          src={post.avatar} 
                          alt={post.author} 
                          className="post-author-avatar"
                          width="42"
                          height="42"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <div className="post-author-fallback">
                          {post.author ? post.author.charAt(0).toUpperCase() : 'V'}
                        </div>
                      )}
                      <div className="post-author-meta">
                        <div className="post-author-title-row">
                          <span className="post-author-name">{post.author}</span>
                          <span className="post-author-handle">@{post.username}</span>
                        </div>
                        <div className="post-time-row">
                          <time className="post-date">{formatTime(post.createdAt)}</time>
                          <span className="post-dot-divider">•</span>
                          <span className="post-channel-tag">Discord #gallery</span>
                        </div>
                      </div>
                    </div>

                    <div className="post-count-badge" title={`${post.photos.length} foto dalam album ini`}>
                      <span className="post-count-num">{post.photos.length}</span>
                      <span className="post-count-lbl">Foto</span>
                    </div>
                  </header>

                  {/* Judul & Deskripsi Postingan */}
                  <div className="post-card-body">
                    <h2 className="post-title">{post.title}</h2>
                    {post.caption && post.caption !== post.title && (
                      <p className="post-caption">{post.caption}</p>
                    )}
                  </div>

                  {/* Kolase Media */}
                  <div className="post-card-media-wrapper">
                    <PostMediaCollage post={post} onPhotoClick={(idx) => openLightbox(post, idx)} />
                  </div>

                  {/* Footer Postingan */}
                  <footer className="post-card-footer">
                    <button 
                      type="button" 
                      className="post-open-album-btn"
                      onClick={() => openLightbox(post, 0)}
                      aria-label={`Buka seluruh ${post.photos.length} foto pada ${post.title}`}
                    >
                      <span>Lihat Album ({post.photos.length} Foto)</span>
                    </button>
                    <a 
                      href={`https://discord.com/channels/1541267151631941784/${post.threadId || '1541372010192437302'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="post-discord-link"
                      title="Buka thread asli di Discord"
                    >
                      <span>Buka di Discord</span>
                      <IconArrowRight size={13} />
                    </a>
                  </footer>
                </article>
              ))}
            </div>
          )}

          {/* TAMPILAN 2: GRID SEMUA FOTO SATU PER SATU */}
          {!loading && !error && viewMode === 'grid' && filteredPhotos.length > 0 && (
            <div className="gallery-grid">
              {filteredPhotos.map((photo, index) => {
                // Bungkus menjadi objek post dummy untuk lightbox
                const dummyPost = {
                  id: photo.threadId || photo.id,
                  threadId: photo.threadId,
                  title: photo.title || 'Momen Petualangan',
                  author: photo.author,
                  username: photo.username,
                  avatar: photo.avatar,
                  caption: photo.caption,
                  createdAt: photo.createdAt,
                  photos: [photo]
                }
                return (
                  <div
                    key={photo.id || index}
                    className="gallery-card"
                    onClick={() => openLightbox(dummyPost, 0)}
                    tabIndex="0"
                    role="button"
                    aria-label={`Lihat foto: ${photo.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openLightbox(dummyPost, 0)
                      }
                    }}
                  >
                    <div className="gallery-image-wrap">
                      <img
                        src={photo.proxyUrl || photo.url}
                        alt={photo.title || 'Screenshot Valdora'}
                        loading="lazy"
                        className="gallery-thumb"
                      />
                      <div className="gallery-hover-overlay">
                        <span className="overlay-zoom-hint">Klik untuk Memperbesar</span>
                      </div>
                    </div>

                    <div className="gallery-card-footer">
                      <div className="gallery-author-info">
                        {photo.avatar ? (
                          <img
                            src={photo.avatar}
                            alt={photo.author}
                            className="author-avatar"
                            width="24"
                            height="24"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="author-avatar-fallback">
                            {photo.author ? photo.author.charAt(0).toUpperCase() : 'V'}
                          </div>
                        )}
                        <div className="author-text">
                          <span className="author-name">{photo.author}</span>
                          <span className="photo-date">{formatTime(photo.createdAt)}</span>
                        </div>
                      </div>

                      <h3 className="gallery-item-title" title={photo.title}>
                        {photo.title}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Action Strip */}
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <div className="subpage-action-strip">
          <div className="subpage-action-text">
            <strong>Punya tangkapan layar seru atau momen roleplay faksi?</strong> Kirimkan langsung ke forum Discord #gallery agar otomatis tampil di halaman ini.
          </div>
          <a
            href="https://discord.com/channels/1541267151631941784/1541372010192437302"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-discord btn-sm"
          >
            <span>Kirim Foto di Discord</span>
            <IconArrowRight size={14} />
          </a>
        </div>
      </div>

      {/* Lightbox Modal (Album & Fullscreen Viewer) */}
      {activeLightboxPost && activePhoto && (
        <div 
          className="gallery-lightbox-overlay" 
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="gallery-lightbox-chassis" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Lightbox */}
            <div className="lightbox-top-header">
              <div className="lightbox-author-identity">
                {activeLightboxPost.avatar ? (
                  <img
                    src={activeLightboxPost.avatar}
                    alt={activeLightboxPost.author}
                    className="lightbox-avatar"
                    width="36"
                    height="36"
                  />
                ) : (
                  <div className="author-avatar-fallback large">
                    {activeLightboxPost.author ? activeLightboxPost.author.charAt(0).toUpperCase() : 'V'}
                  </div>
                )}
                <div>
                  <div className="lightbox-author-name">
                    {activeLightboxPost.author}
                    <span className="lightbox-author-sub">@{activeLightboxPost.username}</span>
                  </div>
                  <div className="lightbox-date">{formatTime(activeLightboxPost.createdAt)}</div>
                </div>
              </div>

              <div className="lightbox-top-actions">
                <div className="lightbox-counter-pill">
                  Foto {activePhotoIndex + 1} dari {activeLightboxPost.photos.length}
                </div>
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={closeLightbox}
                  aria-label="Tutup pratinjau"
                >
                  <IconClose size={20} />
                </button>
              </div>
            </div>

            {/* Navigation buttons */}
            {activeLightboxPost.photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="lightbox-nav-btn prev"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePhotoIndex((prev) => (prev - 1 + activeLightboxPost.photos.length) % activeLightboxPost.photos.length)
                  }}
                  aria-label="Foto sebelumnya"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="lightbox-nav-btn next"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePhotoIndex((prev) => (prev + 1) % activeLightboxPost.photos.length)
                  }}
                  aria-label="Foto berikutnya"
                >
                  ›
                </button>
              </>
            )}

            {/* Display Foto Utama */}
            <div className="lightbox-image-box">
              <img
                src={activePhoto.url || activePhoto.proxyUrl}
                alt={activePhoto.title || activeLightboxPost.title}
                className="lightbox-full-img"
              />
            </div>

            {/* Strip Thumbnail Jika Foto Lebih Dari 1 */}
            {activeLightboxPost.photos.length > 1 && (
              <div className="lightbox-thumbnail-strip" role="tablist" aria-label="Daftar foto album">
                {activeLightboxPost.photos.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    className={`lightbox-strip-item ${idx === activePhotoIndex ? 'active' : ''}`}
                    onClick={() => setActivePhotoIndex(idx)}
                    aria-label={`Pilih foto ${idx + 1}`}
                    aria-selected={idx === activePhotoIndex}
                  >
                    <img 
                      src={item.proxyUrl || item.url} 
                      alt="" 
                      loading="lazy" 
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Panel Detail & Tindakan */}
            <div className="lightbox-details-panel">
              <div className="lightbox-meta-row">
                <div className="lightbox-title-wrap">
                  <h2 className="lightbox-title">{activeLightboxPost.title}</h2>
                  {activeLightboxPost.caption && activeLightboxPost.caption !== activeLightboxPost.title && (
                    <p className="lightbox-caption">{activeLightboxPost.caption}</p>
                  )}
                </div>

                <div className="lightbox-actions">
                  <a
                    href={activePhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lightbox-btn"
                    download
                  >
                    Buka Ukuran Asli
                  </a>
                  <a
                    href={`https://discord.com/channels/1541267151631941784/${activeLightboxPost.threadId || '1541372010192437302'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lightbox-btn primary"
                  >
                    Buka di Discord
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
