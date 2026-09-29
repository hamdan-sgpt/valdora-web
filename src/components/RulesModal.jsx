import { useState, useEffect } from 'react'
import './RulesModal.css'
import { SERVER_CONFIG } from '../config/server'
import { IconSpark } from './Icons'

export default function RulesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('roleplay') // 'roleplay' | 'discord'

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const activeRules = activeTab === 'roleplay' 
    ? SERVER_CONFIG.roleplayRules 
    : SERVER_CONFIG.discordRules

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      role="presentation"
    >
      <div 
        className="modal-container rules-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-badge">
              <span className="badge-spark"><IconSpark size={11} /></span>
              VALDORA UNIVERSE OFFICIAL DOCS
            </span>
            <h3 id="rules-modal-title">Peraturan Server &amp; Komunitas</h3>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Tutup jendela aturan"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="rules-tabs-bar">
          <button
            type="button"
            className={`rules-tab-btn ${activeTab === 'roleplay' ? 'active' : ''}`}
            onClick={() => setActiveTab('roleplay')}
          >
            ⚔️ Aturan Roleplay Server ({SERVER_CONFIG.roleplayRules?.length || 15} Poin)
          </button>
          <button
            type="button"
            className={`rules-tab-btn ${activeTab === 'discord' ? 'active' : ''}`}
            onClick={() => setActiveTab('discord')}
          >
            💬 Aturan Komunitas Discord ({SERVER_CONFIG.discordRules?.length || 12} Poin)
          </button>
        </div>

        {/* Body */}
        <div className="modal-body rules-modal-body">
          <div className="rules-intro-box">
            <p className="modal-intro">
              {activeTab === 'roleplay' ? (
                <>
                  Selamat datang di <strong>Valdora Universe</strong>. Valdora bukan sekadar tempat bermain, ia adalah dunia tempat setiap keputusan memiliki konsekuensi, setiap konflik memiliki cerita, dan setiap karakter memiliki kesempatan untuk meninggalkan sebuah <em>legacy</em>.
                </>
              ) : (
                <>
                  Selamat datang di <strong>Official Discord Valdora Universe</strong>. Discord ini merupakan tempat berkumpulnya komunitas. Jaga sikap, hormati sesama, dan bantu menciptakan komunitas yang nyaman bagi semua.
                </>
              )}
            </p>
            <div className="gitbook-banner-link">
              <span>Sumber resmi GitBook:</span>
              <a 
                href={activeTab === 'roleplay' ? 'https://valdora.gitbook.io/valdora-docs/roleplay-rules' : 'https://valdora.gitbook.io/valdora-docs/valdora-discord-rules'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="gitbook-link-btn"
              >
                Lihat di valdora.gitbook.io ↗
              </a>
            </div>
          </div>

          <div className="rules-list">
            {activeRules.map((rule) => (
              <div key={rule.no} className="rule-card">
                <span className="rule-number">{rule.no}</span>
                <div className="rule-content">
                  <h4 className="rule-title">{rule.title}</h4>
                  {rule.desc && <p className="rule-desc">{rule.desc}</p>}
                  {rule.points && rule.points.length > 0 && (
                    <ul className="rule-points-list">
                      {rule.points.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rules-philosophy-banner">
            <span className="philosophy-quote">"Your story. Your choices. Your legacy."</span>
            <span className="philosophy-sub">Rules dibuat untuk merawat kualitas petualangan bersama, bukan untuk dicari celahnya.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer rules-modal-footer">
          <a
            href={SERVER_CONFIG.links.gitbook}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary gitbook-external-btn"
          >
            Buka Dokumen Lengkap di GitBook ↗
          </a>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Saya Paham &amp; Siap Bermain
          </button>
        </div>
      </div>
    </div>
  )
}
