import React from 'react'
import Features from '../components/Features'
import { Link } from '../context/RouterContext'
import { IconArrowRight } from '../components/Icons'
import './PagesCommon.css'

export default function GameplayPage() {
  return (
    <div className="subpage-view">
      <div className="subpage-banner">
        <div className="container">
          <nav className="subpage-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="breadcrumb-link">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Ras &amp; Gameplay</span>
          </nav>
        </div>
      </div>

      <Features />

      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="subpage-action-strip">
          <div className="subpage-action-text">
            <strong>Ingin melihat level skill atau ras pemain lain?</strong> Cek data 11 cabang AuraSkills dan progres ValdoraPass mereka.
          </div>
          <Link href="/players" className="btn btn-primary btn-sm">
            <span>Cari Data Pemain</span>
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
