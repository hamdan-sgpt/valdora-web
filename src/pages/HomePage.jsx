import React from 'react'
import Hero from '../components/Hero'
import { Link } from '../context/RouterContext'
import { IconCrown, IconSearch, IconCompass, IconArrowRight, IconSpark, IconBroadcast } from '../components/Icons'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page-view">
      {/* 1. Hero Section (video strictly fitted before Jelajahi Dunia) */}
      <Hero />

      {/* 2. Realm Navigation Hub (Jelajahi Dunia & Fitur Unggulan) on its own clean section */}
      <section id="jelajahi" className="home-pages-preview">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag gold">PANDUAN &amp; FITUR</span>
            <h2 className="section-title">
              Jelajahi <span className="text-gradient">Fitur Server</span>
            </h2>
            <p className="section-desc">
              Pelajari sistem ras, pantau statistik pemain, atau cek panduan koneksi server.
            </p>
          </div>

          <div className="home-pages-grid">
            {/* Card 1: Ras & Gameplay */}
            <div className="page-preview-card" style={{ '--card-accent': '#e5a93c' }}>
              <div>
                <div className="page-card-icon-box">
                  <IconCrown size={24} />
                </div>
                <span className="page-card-kicker">SISTEM RAS &amp; FACTION</span>
                <h3 className="page-card-title">4 Ras &amp; Takhta Raja</h3>
                <p className="page-card-desc">
                  Pelajari efek pasif ras Human, Elf, Demon, dan Dwarf serta cari tahu pemain yang sedang memegang gelar Raja saat ini.
                </p>
              </div>
              <Link href="/gameplay" className="page-card-btn">
                <span>Lihat Ras &amp; Gameplay</span>
                <IconArrowRight size={15} />
              </Link>
            </div>

            {/* Card 2: Live Player Inspector */}
            <div className="page-preview-card" style={{ '--card-accent': '#38bdf8' }}>
              <div>
                <div className="page-card-icon-box">
                  <IconSearch size={24} />
                </div>
                <span className="page-card-kicker">STATISTIK &amp; SKILL</span>
                <h3 className="page-card-title">Pencarian Pemain</h3>
                <p className="page-card-desc">
                  Cari username pemain untuk melihat level 11 cabang AuraSkills, progres ValdoraPass, dan ras yang mereka pilih langsung dari database server.
                </p>
              </div>
              <Link href="/players" className="page-card-btn">
                <span>Cari Pemain</span>
                <IconArrowRight size={15} />
              </Link>
            </div>

            {/* Card 3: Panduan Join */}
            <div className="page-preview-card" style={{ '--card-accent': '#9f75ff' }}>
              <div>
                <div className="page-card-icon-box">
                  <IconCompass size={24} />
                </div>
                <span className="page-card-kicker">MINECRAFT JAVA (PC)</span>
                <h3 className="page-card-title">Panduan Join &amp; Aturan</h3>
                <p className="page-card-desc">
                  Informasi alamat IP server, port, launcher yang didukung, dan panduan bertahan hidup di dunia anarchy tanpa proteksi klaim.
                </p>
              </div>
              <Link href="/panduan" className="page-card-btn">
                <span>Buka Panduan Join</span>
                <IconArrowRight size={15} />
              </Link>
            </div>

            {/* Card 4: Galeri Petualang */}
            <div className="page-preview-card" style={{ '--card-accent': '#10b981' }}>
              <div>
                <div className="page-card-icon-box">
                  <IconSpark size={24} />
                </div>
                <span className="page-card-kicker">DOKUMENTASI KOMUNITAS</span>
                <h3 className="page-card-title">Galeri Petualang</h3>
                <p className="page-card-desc">
                  Lihat kumpulan tangkapan layar perang faksi, arsitektur megah, dan keseruan roleplay yang disinkronkan langsung dari Discord.
                </p>
              </div>
              <Link href="/galeri" className="page-card-btn">
                <span>Buka Galeri Foto</span>
                <IconArrowRight size={15} />
              </Link>
            </div>

            {/* Card 5: Live Stream & Media */}
            <div className="page-preview-card" style={{ '--card-accent': '#ef4444' }}>
              <div>
                <div className="page-card-icon-box">
                  <IconBroadcast size={24} />
                </div>
                <span className="page-card-kicker">LIVE FEED &amp; STREAM</span>
                <h3 className="page-card-title">Live &amp; Media Komunitas</h3>
                <p className="page-card-desc">
                  Pantau siaran langsung petualang dan konten seru komunitas Valdora Universe yang disinkronkan langsung dari saluran Discord #share-media.
                </p>
              </div>
              <Link href="/live" className="page-card-btn">
                <span>Tonton Siaran Live</span>
                <IconArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
