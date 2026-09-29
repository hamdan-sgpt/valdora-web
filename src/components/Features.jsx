import { useState } from 'react'
import './Features.css'
import { SERVER_CONFIG } from '../config/server'
import { 
  IconSpark, 
  IconBolt, 
  IconSword, 
  IconCrown, 
  IconGate, 
  IconSkull, 
  IconFlame, 
  IconShield, 
  IconCoins 
} from './Icons'

export default function Features() {
  const [selectedRace, setSelectedRace] = useState('zelvashar')

  const deityRaces = [
    {
      id: 'xylvos',
      name: "Human (Xyl'vos)",
      title: 'Faksi Kecepatan & Serangan Kilat',
      color: '#38bdf8',
      aura: 'rgba(56, 189, 248, 0.15)',
      passive: 'Bonus Movement Speed & Efek Sambaran Kilat',
      desc: "Pilihan seimbang dengan mobilitas tinggi. Cocok untuk pemain yang mengandalkan kecepatan gerak, kelincahan menghindar, dan tebasan cepat saat PvP maupun menjelajahi dungeon.",
      affinity: 'Pedang, Panah, Mobilitas Cepat',
      kingTitle: "Raja Xyl'vos",
      kingRole: 'Raja Bangsa Human',
      currentMonarch: 'veillusioned',
      monarchSkinHash: '99c9677063d759c0f32493fc8207ebbb14b2a9463281d692318082e2655bc029'
    },
    {
      id: 'zelvashar',
      name: "Elf (Zel'vashar)",
      title: 'Faksi Pemulihan & Serangan Jarak Jauh',
      color: '#22c55e',
      aura: 'rgba(34, 197, 94, 0.15)',
      passive: 'Regenerasi HP Pasif & Resistensi Racun',
      desc: "Fokus pada sustain dan pertarungan jarak jauh. Elf memulihkan darah secara berkala dan memiliki ketahanan alami terhadap racun, sangat berguna dalam pertempuran jangka panjang.",
      affinity: 'Panah Jarak Jauh, Trident, Efek Potion',
      kingTitle: "Raja Zel'vashar",
      kingRole: 'Raja Bangsa Elf',
      currentMonarch: 'efekrumahkaca',
      monarchSkinHash: '844299bacc9a1dc98f3ed79ec9f6a797734b0c0788cdc3be425de7d8f637bd89'
    },
    {
      id: 'xurgoth',
      name: 'Demon (Xurgoth)',
      title: 'Faksi Serangan Agresif & Kutukan',
      color: '#a855f7',
      aura: 'rgba(168, 85, 247, 0.15)',
      passive: 'Serangan Lifesteal & Debuff Kutukan Lawan',
      desc: 'Spesialis duel agresif garis depan. Serangan Demon berpeluang menyerap sebagian damage menjadi darah serta memberikan efek kutukan yang memperlambat pemulihan musuh.',
      affinity: 'Serangan Melee Jarak Dekat, Senjata Berat',
      kingTitle: 'Raja Xurgoth',
      kingRole: 'Raja Bangsa Demon',
      currentMonarch: 'Smileqy',
      monarchSkinHash: null
    },
    {
      id: 'grozmar',
      name: 'Dwarf (Grozmar)',
      title: 'Faksi Pertahanan Tebal & Efisiensi Tambang',
      color: '#f59e0b',
      aura: 'rgba(245, 158, 11, 0.15)',
      passive: 'Buff Resistance Alami & Bonus Drop Hasil Tambang',
      desc: 'Pilihan utama bagi penambang dan builder. Dwarf memiliki ketahanan alami terhadap damage fisik serta peluang mendapatkan drop bijih ganda saat menambang di kedalaman bumi.',
      affinity: 'Kapak, Beliung Tambang, Armor Tebal',
      kingTitle: 'Raja Grozmar',
      kingRole: 'Raja Bangsa Dwarf',
      currentMonarch: 'disillusioneds',
      monarchSkinHash: '353c3f7513550c7d650ea44ee8ccf98899cb7f2a139327741babd0ec593db495'
    }
  ]

  const activeDeity = deityRaces.find(r => r.id === selectedRace) || deityRaces[0]

  return (
    <section id="features" className="section features-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header text-center">
          <span className="section-tag amethyst">MEKANIK SERVER</span>
          <h2 className="section-title">
            Survival Anarchy &amp; <span className="text-gradient">Sistem RPG Valdora</span>
          </h2>
          <p className="section-desc">
            Bertahan hidup di dunia bebas klaim yang dipadukan dengan 4 pilihan ras, 
            35 tier misi ValdoraPass, 11 keahlian AuraSkills, dan tantangan dungeon boss.
          </p>
        </div>

        {/* 1. INTERACTIVE DEITY RACES SHOWCASE (LuckPerms System) */}
        <div className="deity-showcase-chassis">
          <div className="deity-header-bar">
            <div className="deity-badge-title">
              <span className="deity-gem"><IconSpark size={14} /></span> SISTEM 4 RAS &amp; TAKHTA RAJA
            </div>
            <span className="deity-subinfo">Pilih ras untuk melihat efek pasif, gaya bermain, dan pemegang takhta</span>
          </div>

          <div className="deity-tabs-row" role="tablist">
            {deityRaces.map((race) => (
              <button
                key={race.id}
                type="button"
                role="tab"
                aria-selected={selectedRace === race.id}
                className={`deity-tab-btn ${selectedRace === race.id ? 'active' : ''}`}
                style={{
                  '--race-color': race.color,
                  borderColor: selectedRace === race.id ? race.color : 'rgba(255, 255, 255, 0.08)'
                }}
                onClick={() => setSelectedRace(race.id)}
              >
                <span className="tab-dot" style={{ backgroundColor: race.color }}></span>
                <span className="tab-name">{race.name}</span>
              </button>
            ))}
          </div>

          {/* Active Deity Detail Display */}
          <div className="deity-content-panel" style={{ '--active-aura': activeDeity.aura }}>
            <div className="deity-meta-col">
              <span className="deity-tier-label" style={{ color: activeDeity.color }}>
                {activeDeity.title}
              </span>
              <h3 className="deity-name-display" style={{ color: activeDeity.color }}>
                {activeDeity.name}
              </h3>
              <p className="deity-lore-body">
                {activeDeity.desc}
              </p>
            </div>

            <div className="deity-stats-col">
              <div className="deity-perk-card">
                <span className="perk-label">
                  <IconBolt size={15} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                  Kemampuan Pasif Ras:
                </span>
                <span className="perk-value">{activeDeity.passive}</span>
              </div>
              <div className="deity-perk-card">
                <span className="perk-label">
                  <IconSword size={15} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                  Afinitas Senjata &amp; Gaya Tempur:
                </span>
                <span className="perk-value">{activeDeity.affinity}</span>
              </div>
              <div className="deity-perk-card king-monarch-card" style={{ borderColor: `${activeDeity.color}70` }}>
                <div className="king-info-row">
                  <img
                    src={activeDeity.monarchSkinHash
                      ? `https://mc-heads.net/avatar/${activeDeity.monarchSkinHash}/44`
                      : `https://mc-heads.net/avatar/${encodeURIComponent(activeDeity.currentMonarch)}/44`}
                    alt={activeDeity.currentMonarch}
                    className="king-avatar-head"
                    onError={(e) => {
                      e.currentTarget.src = `https://minotar.net/helm/${encodeURIComponent(activeDeity.currentMonarch)}/44.png`
                    }}
                  />
                  <div className="king-text-col">
                    <span className="perk-label" style={{ color: activeDeity.color }}>
                      <IconCrown size={16} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                      Takhta Tertinggi: {activeDeity.kingTitle}
                    </span>
                    <div className="king-monarch-name">
                      Pemegang Takhta: <strong style={{ color: '#ffffff' }}>{activeDeity.currentMonarch}</strong>
                      <span className="king-live-pill">RAJA AKTIF</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="deity-notice">
                <span>Status Gelar: <strong>{activeDeity.currentMonarch}</strong> memegang takhta <strong>{activeDeity.kingTitle}</strong> periode ini.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ASYMMETRIC GAMEPLAY HIGHLIGHTS */}
        <div className="gameplay-asymmetric-grid">
          {/* Flagship Card 1: ValdoraPass Progression */}
          <div className="gameplay-hero-card bp-feature-card">
            <div className="gameplay-card-header">
              <span className="feature-pill gold">35 TIER VALDORAPASS (/bp)</span>
              <h3 className="gameplay-card-title">ValdoraPass Musim Aktif</h3>
            </div>
            <p className="gameplay-card-text">
              Selesaikan misi harian dan mingguan seperti menambang, berburu mob, dan bertani untuk membuka 35 tier hadiah Free maupun Premium, termasuk food buff, ramuan, koin emas, dan Crate Key.
            </p>
            <div className="bp-tier-preview-strip">
              <div className="tier-node active">Tier 1<br/><span>Food Buff</span></div>
              <div className="tier-line active"></div>
              <div className="tier-node active">Tier 5<br/><span>Mining Potion</span></div>
              <div className="tier-line active"></div>
              <div className="tier-node">Tier 15<br/><span>Gold Coins</span></div>
              <div className="tier-line"></div>
              <div className="tier-node gold">Tier 35<br/><span>Mythic Key</span></div>
            </div>
          </div>

          {/* Flagship Card 2: Custom Dungeons & Expeditions */}
          <div className="gameplay-hero-card dungeon-feature-card">
            <div className="gameplay-card-header">
              <span className="feature-pill amethyst">DUNGEON EXPEDITIONS</span>
              <h3 className="gameplay-card-title">Portal Dungeon &amp; Boss Raid</h3>
            </div>
            <p className="gameplay-card-text">
              Masuki portal dungeon bersama tim untuk menghadapi gelombang monster dan boss dengan pola serangan khusus. Kalahkan boss untuk mendapatkan material langka dan perlengkapan tingkat tinggi.
            </p>
            <div className="dungeon-tags-row">
              <span className="dungeon-tag">
                <IconGate size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                Goblin Dungeon (Tingkat Menengah)
              </span>
              <span className="dungeon-tag">
                <IconSkull size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                Skeleton Catacombs (Tingkat Sulit)
              </span>
              <span className="dungeon-tag red">
                <IconFlame size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                Unstable Nether (Tingkat Ekstrem)
              </span>
            </div>
          </div>
        </div>

        {/* Supporting Triad Features */}
        <div className="supporting-triad-grid">
          <div className="triad-card">
            <div className="triad-icon-box"><IconShield size={22} /></div>
            <h4>Survival Tanpa Klaim</h4>
            <p>Server tidak menggunakan proteksi klaim tanah. Bangun markas tersembunyi di koordinat rahasia dan amankan barang berhargamu dari pemain lain.</p>
          </div>

          <div className="triad-card">
            <div className="triad-icon-box"><IconBolt size={22} /></div>
            <h4>11 Cabang AuraSkills</h4>
            <p>Setiap aktivitas menambang, bertarung, dan berladang meningkatkan level skill karaktermu secara bertahap untuk membuka bonus stat permanen.</p>
          </div>

          <div className="triad-card">
            <div className="triad-icon-box"><IconCoins size={22} /></div>
            <h4>Ekonomi &amp; Toko Khusus</h4>
            <p>Gunakan command ekonomi untuk jual-beli hasil farming antar-pemain, atau temukan NPC khusus /shop_forbidden untuk menukar item langka.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
