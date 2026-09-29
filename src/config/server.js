export const SERVER_CONFIG = {
  name: "Valdora Universe",
  season: "Fight RPG Season 2",
  tagline: "Server Minecraft 1.21.x Survival Anarchy & RPG",
  description: "Server Minecraft 1.21.x survival RPG dengan 4 pilihan ras, leveling 11 AuraSkills, 35 tier ValdoraPass, ekspedisi dungeon boss, dan dunia anarchy tanpa klaim tanah.",
  
  // Koneksi Server Riil (Domain Resmi & Raznar Node)
  ip: {
    java: "play.valdora.my.id",
    direct: "game-gnl-jh3.raznar.net:25071",
    version: "Minecraft 1.21.x",
    platform: "Java Edition (PC)"
  },
  
  // Tautan Komunitas & Dukungan Riil
  links: {
    discord: "https://discord.gg/s6TtJ38AR9",
    gitbook: "https://valdora.gitbook.io/valdora-docs",
    store: "#store",
    tiktok: "https://tiktok.com/@fightrpg",
    linktree: "https://linktr.ee/fightrpg"
  },

  // Fitur Riil yang Diambil Langsung dari Konfigurasi Server
  features: [
    {
      id: "deity-races",
      title: "4 Ras Utama & Takhta 1 Raja Tiap Ras",
      tag: "SISTEM 4 RAS & RAJA",
      desc: "Pilih salah satu dari 4 ras: Human, Elf, Demon, atau Dwarf. Masing-masing memiliki efek pasif khusus dan 1 gelar Raja bagi pemain terbaik tiap ras.",
      icon: "shield"
    },
    {
      id: "valdorapass",
      title: "ValdoraPass 35 Tier & Quest Mingguan",
      tag: "35 TIER VALDORAPASS (/bp)",
      desc: "Selesaikan quest harian dan mingguan melalui command /bp. Buka 35 tier hadiah untuk Free Pass maupun Premium Pass, mulai dari item buff, koin emas, hingga Crate Key.",
      icon: "trophy"
    },
    {
      id: "auraskills",
      title: "11 Disiplin Keahlian AuraSkills",
      tag: "11 CABANG AURASKILLS (/sk)",
      desc: "Tingkatkan level 11 cabang keahlian (Defense, Fighting, Mining, Foraging, Archery, Agility, Farming, Fishing, Alchemy, Enchanting, Excavation) untuk mendapatkan peningkatan stat permanen.",
      icon: "sword"
    },
    {
      id: "dungeon-portals",
      title: "Portal Multidimensi & Dungeon Boss",
      tag: "DUNGEON EXPEDITION",
      desc: "Akses portal dungeon menuju Goblin Dungeon, Skeleton Catacombs, dan Unstable Nether. Kalahkan boss bersama tim untuk mendapatkan drop perlengkapan dan material langka.",
      icon: "devices"
    },
    {
      id: "anarchy-survival",
      title: "Anarchy Survival Murni (Tanpa Klaim)",
      tag: "SURVIVAL BEBAS KLAIM",
      desc: "Dunia survival tidak menggunakan proteksi klaim tanah. Bangun markas tersembunyi di koordinat rahasia dan amankan resource timmu dari pemain lain.",
      icon: "pickaxe"
    },
    {
      id: "forbidden-market",
      title: "Ekonomi Bebas & Pasar Terlarang",
      tag: "EKONOMI & TOKO KHUSUS",
      desc: "Gunakan command ekonomi untuk transaksi jual-beli hasil farming antar-pemain, atau tukarkan item khusus di /shop_forbidden untuk memperoleh Totem of Undying dan item langka.",
      icon: "coins"
    }
  ],

  // Dokumen Peraturan Resmi dari GitBook (https://valdora.gitbook.io/valdora-docs)
  roleplayRules: [
    {
      no: "01",
      title: "General Rules",
      points: [
        "Hormati seluruh pemain, Staff, dan komunitas Valdora.",
        "Dilarang toxic behavior, harassment, provokasi, bullying, maupun diskriminasi.",
        "Dilarang memakai cheat, hack, exploit, macro ilegal, atau program pemberi keuntungan curang.",
        "Dilarang memanfaatkan bug/glitch untuk keuntungan pribadi.",
        "Gunakan akal sehat ketika melakukan sesuatu yang tidak secara langsung tercantum dalam rules.",
        "Staff berhak menindak tindakan yang merusak Roleplay meskipun belum tertulis spesifik."
      ]
    },
    {
      no: "02",
      title: "Roleplay Rules (IC & OOC)",
      desc: "IC (In Character) adalah segala tindakan karakter di dalam dunia. OOC (Out of Character) adalah hal pemain di luar karakter.",
      points: [
        "Pemain wajib membedakan ranah IC dan OOC secara tegas.",
        "Dilarang menggunakan informasi OOC untuk keuntungan IC (Metagaming).",
        "Dilarang memaksakan tindakan, kondisi, atau hasil kepada karakter lain (Powergaming).",
        "Setiap tindakan RP harus memiliki alasan masuk akal dan menghormati keputusan karakter lain.",
        "Konflik IC dilarang keras dijadikan alasan untuk menyerang pemain secara OOC."
      ]
    },
    {
      no: "03",
      title: "Character Rules",
      points: [
        "Karakter wajib memiliki identitas dan latar belakang yang sesuai dengan lore Valdora.",
        "Ras, class, dan kemampuan harus sesuai sistem yang berlaku.",
        "Dilarang menggunakan karakter pemain lain tanpa izin.",
        "Kemampuan karakter tidak boleh melebihi batas lore ras (dilarang membuat karakter sempurna tanpa kelemahan)."
      ]
    },
    {
      no: "04",
      title: "FearRP & Realistic RP",
      desc: "Valdora adalah dunia fantasi, tetapi karakter tetap wajib memiliki rasa takut dan mempertimbangkan keselamatan dirinya.",
      points: [
        "Karakter wajib menunjukkan rasa takut ketika menghadapi ancaman yang masuk akal.",
        "Dilarang bertindak seolah karakter kebal luka atau tidak bisa mati.",
        "Jangan menyerang pihak yang kekuatannya jauh di luar kemampuanmu tanpa alasan RP yang kuat."
      ]
    },
    {
      no: "05",
      title: "Combat & PvP",
      points: [
        "PvP wajib memiliki alasan atau konteks Roleplay yang jelas.",
        "Dilarang keras RDM (Random Deathmatch / menyerang pemain tanpa dasar IC).",
        "Dilarang Combat Logging (keluar game saat bertarung untuk kabur dari konsekuensi RP).",
        "Dilarang Revenge Kill (langsung membalas dendam hanya karena kematian karakter sebelumnya).",
        "Perang besar atau invasi harus memiliki dasar cerita dan pengawasan Staff."
      ]
    },
    {
      no: "06",
      title: "Character Death & PK",
      points: [
        "Kematian merupakan bagian dari cerita dan harus diperlakukan secara serius.",
        "Dilarang bunuh diri karakter hanya untuk menghindari konsekuensi RP.",
        "Permanent Death (PK) hanya dapat dilakukan sesuai sistem dan aturan resmi Valdora.",
        "Dilarang menggunakan karakter baru untuk langsung membalas pihak pembunuh karakter lama."
      ]
    },
    {
      no: "07",
      title: "Magic & Fantasy System",
      points: [
        "Gunakan kemampuan sesuai dengan sistem Magic Valdora dengan batasan yang jelas.",
        "Skill memiliki cooldown, kebutuhan resource, atau konsekuensi.",
        "Dilarang menggunakan sihir untuk membatalkan seluruh konsekuensi RP secara sepihak."
      ]
    },
    {
      no: "08",
      title: "Kingdom, Guild & Faction",
      points: [
        "Hormati struktur dan wilayah teritorial setiap faction.",
        "Kudeta, perang, dan perubahan kekuasaan harus ditempuh melalui alur RP yang sah.",
        "Aturan faction tidak boleh bertentangan dengan aturan utama Valdora Universe."
      ]
    },
    {
      no: "09",
      title: "Building & World",
      points: [
        "Dilarang melakukan griefing terhadap bangunan pemain lain.",
        "Bangunan harus selaras dengan tema dan setting Fantasy Valdora (hindari tema modern).",
        "Dilarang merusak struktur penting dunia tanpa izin resmi Staff."
      ]
    },
    {
      no: "10",
      title: "Economy & Trading",
      points: [
        "Dilarang keras melakukan duplikasi item atau manipulasi sistem ekonomi.",
        "Dilarang memanfaatkan bug pasar/ekonomi untuk memperkaya diri.",
        "Semua transaksi jual beli harus dilakukan secara jujur sesuai sistem server."
      ]
    },
    {
      no: "11",
      title: "OOC Rules",
      points: [
        "Masalah di dalam game (IC) dilarang dibawa menjadi pertikaian nyata (OOC).",
        "Dilarang menyerang, menghina, atau mengancam pemain secara pribadi.",
        "Dilarang keras doxxing atau menyebarkan rahasia/data pribadi orang lain."
      ]
    },
    {
      no: "12",
      title: "Lore & World Consistency",
      points: [
        "Hormati lore resmi Valdora. Jika ada pertentangan cerita, lore resmi memiliki prioritas.",
        "Jangan membuat fakta lore sendiri kemudian mengklaimnya sebagai canon.",
        "Perubahan besar pada sejarah dunia wajib melalui persetujuan Lore Team."
      ]
    },
    {
      no: "13",
      title: "Bug, Exploit & Cheating",
      points: [
        "Wajib segera melaporkan bug yang menguntungkan kepada Staff.",
        "Dilarang menyebarkan metode exploit atau duplikasi kepada pemain lain.",
        "Penyalahgunaan exploit berakibat sanksi reset akun atau ban permanen."
      ]
    },
    {
      no: "14",
      title: "Staff & Punishment",
      desc: "Tingkatan sanksi: Warning → Mute → Jail → Kick → Temporary Ban → Permanent Ban → Character PK.",
      points: [
        "Staff berhak menentukan sanksi berdasarkan konteks dan riwayat pelanggaran.",
        "Jangan mengganggu Staff yang sedang menangani kasus di lapangan.",
        "Gunakan saluran Report / Appeal resmi, hindari debat kusir di chat publik."
      ]
    },
    {
      no: "15",
      title: "Rule of Common Sense",
      desc: "Gunakan akal sehat. Filosofi Valdora: 'Your story. Your choices. Your legacy.'",
      points: [
        "Tindakan yang jelas merusak RP atau merugikan orang lain tetap ditindak meski belum tertulis spesifik.",
        "Rules dibuat untuk merawat kualitas petualangan bersama, bukan untuk dicari celahnya."
      ]
    }
  ],

  // Peraturan Komunitas Discord Resmi
  discordRules: [
    {
      no: "01",
      title: "Respect & Sopan Santun",
      points: [
        "Hormati seluruh member, Staff, dan komunitas.",
        "Dilarang menghina, merendahkan, bullying, harassment, atau menyerang pribadi.",
        "Perbedaan pendapat wajar, tetap gunakan bahasa yang santun tanpa memancing drama."
      ]
    },
    {
      no: "02",
      title: "Chat & Konten",
      points: [
        "Gunakan setiap channel Discord sesuai fungsinya.",
        "Dilarang spam, flood chat, atau mention berlebihan (@everyone / @here).",
        "Dilarang mengirim konten NSFW, gore, pornografi, kebencian, atau link mencurigakan."
      ]
    },
    {
      no: "03",
      title: "Advertisement & Promosi",
      points: [
        "Dilarang promosi server Minecraft lain atau self-promotion tanpa izin Staff.",
        "Dilarang mengirim referral link atau invite link sembarangan."
      ]
    },
    {
      no: "04",
      title: "Privasi & Keamanan",
      points: [
        "Dilarang keras doxxing atau membocorkan data pribadi orang lain.",
        "Jangan meminta password, token, atau informasi rahasia milik member lain."
      ]
    },
    {
      no: "05",
      title: "Voice Channel",
      points: [
        "Hormati pengguna Voice Channel, dilarang mic spam atau soundboard mengganggu.",
        "Jangan merekam percakapan voice tanpa izin dari semua pihak yang ada di room."
      ]
    },
    {
      no: "06",
      title: "Nickname & Profil",
      points: [
        "Dilarang meniru nama/identitas Staff untuk mengelabui member lain.",
        "Dilarang memakai foto profil atau status bernada provokatif/NSFW."
      ]
    },
    {
      no: "07",
      title: "Komunitas Roleplay",
      points: [
        "Hormati alur cerita RP pemain lain.",
        "Dilarang metagaming (membawa info chat OOC ke dalam keputusan in-game)."
      ]
    },
    {
      no: "08",
      title: "Spoiler & Informasi Rahasia",
      points: [
        "Gunakan channel spoiler untuk membahas bocoran.",
        "Jangan membocorkan event, quest, atau lore sebelum jadwal rilis resmi."
      ]
    },
    {
      no: "09",
      title: "Staff & Appeal",
      points: [
        "Hormati keputusan Staff saat bertugas.",
        "Gunakan sistem Ticket resmi jika ingin mengajukan banding atas sanksi."
      ]
    },
    {
      no: "10",
      title: "Sistem Laporan (#report)",
      points: [
        "Laporkan pelanggaran ke channel #report atau hubungi Staff langsung.",
        "Sertakan nama pelanggar, kronologi singkat, dan bukti screenshot/video."
      ]
    },
    {
      no: "11",
      title: "Tahapan Sanksi",
      desc: "Tahapan sanksi Discord: Warning → Mute → Kick → Timeout → Ban.",
      points: [
        "Untuk pelanggaran berat, Staff berhak langsung menjatuhkan Permanent Ban."
      ]
    },
    {
      no: "12",
      title: "Common Sense",
      points: [
        "Gunakan akal sehat demi kenyamanan komunitas bersama."
      ]
    }
  ]
}

// Kompatibilitas mundur untuk komponen lama yang membaca SERVER_CONFIG.rules
SERVER_CONFIG.rules = SERVER_CONFIG.roleplayRules.map(r => ({
  no: r.no,
  title: r.title,
  desc: r.desc || r.points[0]
}))
