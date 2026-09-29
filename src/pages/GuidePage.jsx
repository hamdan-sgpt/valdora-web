import React from 'react'
import HowToJoin from '../components/HowToJoin'
import { Link } from '../context/RouterContext'
import { IconArrowRight, IconShield } from '../components/Icons'
import './PagesCommon.css'

export default function GuidePage({ onOpenRules }) {
  return (
    <div className="subpage-view">
      <div className="subpage-banner">
        <div className="container">
          <nav className="subpage-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-link">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Panduan Join</span>
          </nav>
        </div>
      </div>

      <HowToJoin />

      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="subpage-action-strip">
          <div className="subpage-action-text">
            <strong>Patuhi peraturan server</strong> agar suasana bermain tetap adil dan tertib bagi semua orang.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={onOpenRules}
            >
              <IconShield size={14} />
              <span>Baca Peraturan Server</span>
            </button>
            <Link href="/gameplay" className="btn btn-primary btn-sm">
              <span>Lihat Ras &amp; Gameplay</span>
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
