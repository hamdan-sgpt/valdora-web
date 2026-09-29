import React from 'react'
import SkillInspector from '../components/SkillInspector'
import { Link } from '../context/RouterContext'
import { IconArrowRight } from '../components/Icons'
import './PagesCommon.css'

export default function PlayersPage() {
  return (
    <div className="subpage-view">
      <div className="subpage-banner">
        <div className="container">
          <nav className="subpage-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-link">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Pemain</span>
          </nav>
        </div>
      </div>

      <SkillInspector />

      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="subpage-action-strip" style={{ marginBottom: '1.25rem', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
          <div className="subpage-action-text">
            <strong>Mencari Jajaran Pengurus &amp; Arsitek Server?</strong> Lihat struktur kepemimpinan Founder, Developer, dan Modeler Valdora.
          </div>
          <Link href="/pengurus" className="btn btn-secondary btn-sm">
            <span>Buka Tim Pengurus</span>
            <IconArrowRight size={14} />
          </Link>
        </div>

        <div className="subpage-action-strip">
          <div className="subpage-action-text">
            <strong>Siap memulai petualangan di Valdora?</strong> Simak panduan IP server dan langkah awal bermain.
          </div>
          <Link href="/panduan" className="btn btn-primary btn-sm">
            <span>Buka Panduan Join</span>
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
