import {
  PrismaClient,
  AdminStatus,
  ContentStatus,
  BrochureStatus,
  SocialPlatform,
  SlideTargetType
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed matching 100% of frontend mock data...');

  // ----------------------------------------------------
  // 1. ROLES & PERMISSIONS & SUPER ADMIN
  // ----------------------------------------------------
  console.log('➡️ Seeding Roles & Permissions...');
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full access to all system features and settings' },
    { code: 'CONTENT_ADMIN', name: 'Content Administrator', description: 'Manage news, opinions, articles, and media' },
    { code: 'EDITOR', name: 'Editor', description: 'Draft and edit content' },
    { code: 'PPDB_ADMIN', name: 'PPDB Administrator', description: 'Manage student registrations and contact inquiries' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role
    });
  }

  const permissions = [
    { code: 'news.manage', name: 'Manage News', description: 'Create, update, delete news articles' },
    { code: 'opinion.manage', name: 'Manage Opinions', description: 'Create, update, delete opinions' },
    { code: 'unit.manage', name: 'Manage Education Units', description: 'Edit unit profiles, programs, facilities' },
    { code: 'ppdb.manage', name: 'Manage PPDB', description: 'View, verify, and update PPDB applications' },
    { code: 'contact.manage', name: 'Manage Contacts', description: 'View and reply to messages' },
    { code: 'site.manage', name: 'Manage Site Settings', description: 'Global configuration and menus' },
    { code: 'media.manage', name: 'Manage Media', description: 'Upload and delete media assets' }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm
    });
  }

  // Seed default Super Admin user
  const adminPasswordHash = await argon2.hash('B47054ii!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1
  });

  const superRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'admin@cendekiaamanah.sch.id' },
    update: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      status: AdminStatus.ACTIVE,
      failedLoginCount: 0
    },
    create: {
      name: 'Administrator Cendekia Amanah',
      email: 'admin@cendekiaamanah.sch.id',
      username: 'admin',
      passwordHash: adminPasswordHash,
      status: AdminStatus.ACTIVE,
      failedLoginCount: 0
    }
  });

  if (superRole) {
    await prisma.adminUserRole.upsert({
      where: { adminUserId_roleId: { adminUserId: adminUser.id, roleId: superRole.id } },
      update: {},
      create: { adminUserId: adminUser.id, roleId: superRole.id }
    });
  }

  // ----------------------------------------------------
  // 2. SITE SETTINGS & SOCIAL LINKS (Exact from site.ts & contact.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding Site Settings...');
  const existingSetting = await prisma.siteSetting.findFirst();
  const siteSettingData = {
    siteName: 'Pesantren Cendekia Amanah',
    siteTagline: 'LEMBAGA PENDIDIKAN TERPADU',
    subTagline: 'Mencetak Generasi Qurani, Berprestasi, Berjiwa Pemimpin',
    siteDescription:
      'Lembaga pendidikan Islam terpadu dengan unit Pesantren, SMP, SMA, dan Madrasah Diniyah yang berkomitmen melahirkan generasi unggul, berakhlak mulia, dan berwawasan global.',
    foundingYear: 2017,
    motto: 'Mencetak Generasi Qurani, Berprestasi, Berjiwa Pemimpin untuk Masa Depan Gemilang',
    leaderName: 'KH. Cholil Nafis, Lc., MA., Ph.D',
    leaderRole: 'Pengasuh Pesantren Cendekia Amanah',
    leaderTitle: 'Ketua MUI Bidang Dakwah & Ukhuwah / Dosen Pascasarjana UI',
    leaderPhotoUrl: '/uploads/guru/leader.png',
    leaderQuotes: [
      'Alhamdulillah, segala puji bagi Allah SWT atas limpahan rahmat dan karunia-Nya sehingga Lembaga Pendidikan Terpadu Cendekia Amanah terus berkomitmen mencetak generasi Qurani, berilmu, berakhlak mulia, dan berjiwa pemimpin.',
      'Dengan perpaduan kurikulum nasional dan nilai-nilai luhur kepesantrenan, kami mendidik santri dan siswa untuk siap bersaing di kancah global tanpa kehilangan jati diri keislamannya.',
      'Semoga Allah SWT senantiasa memberikan keberkahan dan kemudahan dalam setiap langkah kita mendidik dan membimbing putra-putri terbaik bangsa.'
    ],
    phone: '+62-857-7644-6468',
    whatsapp: '6285776446468',
    email: 'info@cendekiaamanah.sch.id',
    addressText: 'Jl. Raya Kalimulya No. 86B, Kalimulya, Kec. Cilodong, Kota Depok, Jawa Barat 16413',
    city: 'Kota Depok',
    province: 'Jawa Barat',
    postalCode: '16413',
    mapsLink: 'https://maps.google.com/?q=Pesantren+Cendekia+Amanah+Depok',
    mapsEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.8872504260275!2d106.82914197475225!3d-6.408544993582181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69eb96ef6a15e9%3A0xe7448880629ec816!2sPesantren%20Cendekia%20Amanah!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid',
    serviceHours: 'Senin – Sabtu, 07.30 – 15.30 WIB',
    websiteUrl: 'https://cendekiaamanah.sch.id',
    consultationUrl: 'https://cholilnafis.id/#konsultasi',
    virtualTourUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    seoTitle: 'Pesantren Cendekia Amanah — Lembaga Pendidikan Terpadu',
    seoDescription: 'Lembaga Pendidikan Terpadu dengan unit Pesantren, SMP, SMA, dan Madrasah Diniyah di Depok.',
    logoUrl: '/logo/main-logo.png',
    faviconUrl: '/favicon.ico'
  };

  if (existingSetting) {
    await prisma.siteSetting.update({
      where: { id: existingSetting.id },
      data: siteSettingData
    });
  } else {
    await prisma.siteSetting.create({ data: siteSettingData });
  }

  const socialPlatforms = [
    { platform: SocialPlatform.FACEBOOK, name: 'Facebook', url: 'https://web.facebook.com/pesantren.cendekiaamanah.7', handle: 'pesantren.cendekiaamanah.7', sortOrder: 1 },
    { platform: SocialPlatform.INSTAGRAM, name: 'Instagram', url: 'https://instagram.com/pesantren.cendikia.amanah', handle: '@pesantren.cendikia.amanah', sortOrder: 2 },
    { platform: SocialPlatform.YOUTUBE, name: 'YouTube', url: 'https://youtube.com/@amanahtv1035', handle: '@amanahtv1035', sortOrder: 3 },
    { platform: SocialPlatform.TIKTOK, name: 'TikTok', url: 'https://tiktok.com/@p.cendekia.amanah', handle: '@p.cendekia.amanah', sortOrder: 4 }
  ];

  for (const item of socialPlatforms) {
    const existing = await prisma.socialLink.findFirst({ where: { platform: item.platform } });
    if (existing) {
      await prisma.socialLink.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.socialLink.create({ data: item });
    }
  }

  // ----------------------------------------------------
  // 3. HERO SLIDES & STATISTICS (Exact from site.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding Hero Slides & Statistics...');
  const slides = [
    {
      unitCode: 'pesantren',
      badge: 'Pondok Pesantren Tahfidz & Dirasah',
      title: 'Pondok Pesantren Cendekia Amanah',
      subtitle: 'Membina Generasi Qurani Berkarakter Pemimpin, Hafal 30 Juz Bersanad & Berakhlak Mulia',
      imageUrl: '/uploads/gallery/pesantren6.png',
      href: '/pesantren',
      targetType: SlideTargetType.INTERNAL,
      sortOrder: 1
    },
    {
      unitCode: 'smp',
      badge: 'SMP Islam Terpadu',
      title: 'SMP Cendekia Amanah',
      subtitle: 'Perpaduan Kurikulum Nasional, Nilai-Nilai Islam, dan Pembelajaran Berbasis Digital',
      imageUrl: '/uploads/gallery/smp1.png',
      href: '/smp',
      targetType: SlideTargetType.INTERNAL,
      sortOrder: 2
    },
    {
      unitCode: 'sma',
      badge: 'SMA Islam Unggulan',
      title: 'SMA Cendekia Amanah',
      subtitle: 'Mempersiapkan Generasi Pemimpin, Saintis Riset, dan Sukses Menembus PTN Favorit',
      imageUrl: '/uploads/gallery/sma1.png',
      href: '/sma',
      targetType: SlideTargetType.INTERNAL,
      sortOrder: 3
    }
  ];

  for (const slide of slides) {
    const existing = await prisma.heroSlide.findFirst({ where: { title: slide.title } });
    if (existing) {
      await prisma.heroSlide.update({ where: { id: existing.id }, data: slide });
    } else {
      await prisma.heroSlide.create({ data: slide });
    }
  }

  const statistics = [
    { sectionCode: 'HOME_HERO', label: 'Santri & Siswa Aktif', value: '1.200+', icon: 'GraduationCap', sortOrder: 1 },
    { sectionCode: 'HOME_HERO', label: 'Hafidz 30 Juz', value: '150+', icon: 'BookOpen', sortOrder: 2 },
    { sectionCode: 'HOME_HERO', label: 'Prestasi Akademik', value: '85+', icon: 'Trophy', sortOrder: 3 },
    { sectionCode: 'HOME_HERO', label: 'Mitra PTN & Global', value: '100%', icon: 'Award', sortOrder: 4 },
    { sectionCode: 'HOME_INSTITUTION', label: 'Santri & Siswa Aktif', value: '1.200+', icon: 'Users', sortOrder: 1 },
    { sectionCode: 'HOME_INSTITUTION', label: 'Guru & Asatidz Berkompeten', value: '85+', icon: 'Award', sortOrder: 2 },
    { sectionCode: 'HOME_INSTITUTION', label: 'Hafidz & Hafidzah 30 Juz', value: '150+', icon: 'BookOpen', sortOrder: 3 },
    { sectionCode: 'HOME_INSTITUTION', label: 'Lulusan di PTN & Luar Negeri', value: '98%', icon: 'GraduationCap', sortOrder: 4 }
  ];

  for (const stat of statistics) {
    const existing = await prisma.siteStatistic.findFirst({
      where: { sectionCode: stat.sectionCode, label: stat.label }
    });
    if (existing) {
      await prisma.siteStatistic.update({ where: { id: existing.id }, data: stat });
    } else {
      await prisma.siteStatistic.create({ data: stat });
    }
  }

  // ----------------------------------------------------
  // 4. SITE FEATURES (7 Keunggulan Kami) & 5 PROGRAM UNGGULAN
  // ----------------------------------------------------
  console.log('➡️ Seeding Site Features & Programs...');
  const siteFeatures = [
    { title: "Tahfidz Al-Qur’an", icon: 'BookOpen', sortOrder: 1 },
    { title: 'Boarding System', icon: 'Home', sortOrder: 2 },
    { title: 'Digital Learning', icon: 'Monitor', sortOrder: 3 },
    { title: 'Bahasa Arab & Inggris', icon: 'Languages', sortOrder: 4 },
    { title: 'Character Building', icon: 'ScanFace', sortOrder: 5 },
    { title: 'Leadership', icon: 'Crown', sortOrder: 6 },
    { title: 'STEAM Education', icon: 'FlaskConical', sortOrder: 7 }
  ];

  for (const feat of siteFeatures) {
    const existing = await prisma.siteFeature.findFirst({ where: { title: feat.title } });
    if (existing) {
      await prisma.siteFeature.update({ where: { id: existing.id }, data: feat });
    } else {
      await prisma.siteFeature.create({ data: feat });
    }
  }

  const featuredPrograms = [
    { title: 'Tahfidz Al-Qur’an 30 Juz', desc: 'Metode mutqin bersanad dengan target hafalan bertahap dan penguatan tajwid tartil.', icon: 'BookOpen', sortOrder: 1 },
    { title: 'Bilingual Environment', desc: 'Penguasaan percakapan aktif bahasa Arab dan Inggris dalam aktivitas asrama harian.', icon: 'Globe', sortOrder: 2 },
    { title: 'Digital Smart Class', desc: 'Pembelajaran modern dengan smart board, LMS terpadu, dan coding & robotic club.', icon: 'Laptop', sortOrder: 3 },
    { title: 'Dirasah Islamiyah & Kitab Kuning', desc: 'Kajian kitab fiqih, tafsir, hadits, akhlak, dan tata bahasa Arab klasik.', icon: 'GraduationCap', sortOrder: 4 },
    { title: 'Leadership & Karakter', desc: 'Pelatihan kepemimpinan santri, public speaking, organisasi, dan wirausaha mandiri.', icon: 'Sparkles', sortOrder: 5 }
  ];

  for (const prog of featuredPrograms) {
    const existing = await prisma.featuredProgram.findFirst({ where: { title: prog.title } });
    if (existing) {
      await prisma.featuredProgram.update({ where: { id: existing.id }, data: prog });
    } else {
      await prisma.featuredProgram.create({ data: prog });
    }
  }

  // ----------------------------------------------------
  // 5. 4 EDUCATION UNITS (100% Exact from units.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding 4 Education Units with all nested programs, facilities, activities, features...');
  const unitsData = [
    {
      code: 'pesantren',
      slug: 'pesantren',
      name: 'Pesantren Cendekia Amanah',
      shortName: 'Pesantren',
      badge: 'Boarding Pesantren',
      tagline: 'Mencetak Santri Hafidz, Berkarakter, dan Berakhlakul Karimah',
      heroImage: '/uploads/gallery/pesantren6.png',
      bulletPoints: [
        'Tahfidz Al-Qur’an Bersanad & Mutqin',
        'Penguasaan Bahasa Arab & Kitab Kuning',
        'Pembinaan Karakter & Kepemimpinan Islami',
        'Lingkungan Asrama yang Nyaman & Terpadu'
      ],
      description: [
        'Pesantren Cendekia Amanah merupakan unit pendidikan berbasis pondok pesantren yang berfokus pada pembinaan Al-Qur’an, pendalaman ilmu-ilmu agama Islam, penguatan akademik, serta pengembangan karakter dan kepemimpinan santri.',
        'Dengan lingkungan yang asri, kondusif, dan sistem pembinaan terpadu di bawah asuhan langsung para ustadz dan ustadzah kompeten, kami berkomitmen melahirkan generasi muslim yang berilmu amaliyah, beramal ilmiah, berakhlak mulia, dan bermanfaat luas bagi umat.'
      ],
      features: [
        { title: 'Tahfidz Al-Qur’an', description: 'Bimbingan intensif hafalan 30 juz dengan metode mutqin dan tartil bersama asatidz berpengalaman.', icon: 'BookOpen', sortOrder: 1 },
        { title: 'Bahasa Arab Aktif', description: 'Penerapan lingkungan berbahasa (Biah Lughawiyyah) sehari-hari dan kajian literatur kitab klasik.', icon: 'Languages', sortOrder: 2 },
        { title: 'Leadership & Character', description: 'Pembinaan kedisiplinan, kemandirian, kepemimpinan organisasi, serta kepekaan sosial santri.', icon: 'ShieldCheck', sortOrder: 3 },
        { title: 'Pembinaan Karakter', description: 'Penanaman adab, akhlak mulia, dan keteladanan ibadah harian berkesinambungan 24 jam.', icon: 'HeartHandshake', sortOrder: 4 }
      ],
      programs: [
        { title: 'Tahfidz Al-Qur’an Intensif', description: 'Program hafalan Al-Qur’an terarah dengan target juz berjenjang, tasmi’, dan sertifikasi kelulusan.', sortOrder: 1 },
        { title: 'Bahasa Arab & Inggris', description: 'Pengembangan kemampuan berbicara, mendengar, membaca, dan menulis dua bahasa internasional.', sortOrder: 2 },
        { title: 'Kurikulum Dirasah Islamiyah', description: 'Pendalaman kitab-kitab dasar Aqidah, Fiqih Syafi’i, Akhlak, Tarikh Islam, dan Nahwu Sharaf.', sortOrder: 3 },
        { title: 'Pembinaan Adab & Karakter', description: 'Pendidikan akhlak praktis dalam kehidupan berasrama, shalat berjamaah, dan dzikir harian.', sortOrder: 4 },
        { title: 'Leadership & Life Skills', description: 'Pelatihan kepemimpinan santri (OSIS/IPNU), public speaking, manajemen organisasi, dan kemandirian.', sortOrder: 5 },
        { title: 'Kajian Tematik & Halaqah', description: 'Kajian interaktif bersama pengasuh dan narasumber tamu membahas isu keislaman kontemporer.', sortOrder: 6 }
      ],
      facilities: [
        { name: 'Masjid Jami & Aula Ibadah', description: 'Masjid utama tempat shalat berjamaah dan halaqah tahfidz', imageUrl: '/uploads/gallery/pesantren1.png', sortOrder: 1 },
        { name: 'Asrama Santri yang Nyaman & Bersih', description: 'Kamar asrama berfasilitas lengkap dengan pengawasan musyrif 24 jam', imageUrl: '/uploads/gallery/pesantren2.png', sortOrder: 2 },
        { name: 'Perpustakaan & Ruang Baca Kitab', description: 'Koleksi ribuan judul kitab kuning, buku sains, dan literatur umum', imageUrl: '/uploads/gallery/pesantren3.png', sortOrder: 3 },
        { name: 'Laboratorium Komputer & Digital', description: 'Perangkat komputer modern berakses internet cepat untuk pembelajaran digital', imageUrl: '/uploads/gallery/pesantren4.png', sortOrder: 4 },
        { name: 'Sarana Olahraga & Lapangan Terpadu', description: 'Lapangan futsal, basket, memanah, dan area senam kebugaran santri', imageUrl: '/uploads/gallery/pesantren5.png', sortOrder: 5 },
        { name: 'Ruang Makan & Dapur Higienis', description: 'Menu sehat bergizi seimbang 3 kali sehari dengan standar kebersihan tinggi', imageUrl: '/uploads/gallery/pesantren6.png', sortOrder: 6 }
      ],
      activities: [
        { title: 'Halaqah Tahfidz & Tasmi’ Pagi & Sore', description: 'Setoran hafalan baru dan muraja’ah terjadwal setiap hari.', sortOrder: 1 },
        { title: 'Sorogan & Bandongan Kitab Kuning', description: 'Kajian interaktif mendalami literatur Islam klasik bersama asatidz.', sortOrder: 2 },
        { title: 'Muhadhoroh 3 Bahasa', description: 'Latihan pidato santri dalam Bahasa Arab, Inggris, dan Indonesia.', sortOrder: 3 },
        { title: 'Shalat Berjamaah & Dzikir Bersama', description: 'Pembiasaan shalat 5 waktu tepat waktu dan qiyamul lail berjamaah.', sortOrder: 4 },
        { title: 'Ekstrakurikuler Memanah & Hadrah', description: 'Pengembangan minat bakat seni islami, olahraga sunnah, dan bela diri.', sortOrder: 5 }
      ],
      sortOrder: 1
    },
    {
      code: 'smp',
      slug: 'smp',
      name: 'SMP Cendekia Amanah',
      shortName: 'SMP',
      badge: 'Boarding / Fullday School',
      tagline: 'Integrasi Kurikulum Nasional, Nilai Islami, dan Pembelajaran Digital',
      heroImage: '/uploads/gallery/smp1.png',
      bulletPoints: [
        'Kurikulum Nasional Terpadu Nilai Islam',
        'Target Tahfidz Al-Qur’an Juz 29 & 30 + Pilihan',
        'Smart Classroom & Digital Learning System',
        'Pengembangan Bahasa Asing & Ekstrakurikuler Juara'
      ],
      description: [
        'SMP Cendekia Amanah adalah lembaga pendidikan formal tingkat menengah pertama yang memadukan keunggulan kurikulum nasional dengan nilai-nilai Islam, tahfidz Al-Qur’an, penguasaan dwibahasa, serta pembelajaran berbasis teknologi.',
        'Kami berkomitmen mendampingi setiap siswa di masa transisi remajanya agar tumbuh menjadi pribadi yang cerdas intelektual, kokoh spiritual, santun dalam bersikap, dan siap menghadapi tantangan pendidikan lanjutan dengan percaya diri.'
      ],
      features: [
        { title: 'Kurikulum Nasional Plus', description: 'Penguatan fondasi sains, matematika, dan literasi yang terpadu dengan adab dan nilai keislaman.', icon: 'BookOpen', sortOrder: 1 },
        { title: 'Tahfidz Al-Qur’an', description: 'Target capaian hafalan Al-Qur’an dengan bimbingan metode tartil dan tajwid yang terstandarisasi.', icon: 'Award', sortOrder: 2 },
        { title: 'Digital Learning', description: 'Pemanfaatan media pembelajaran modern, blended learning, dan pengenalan literasi komputasional.', icon: 'Laptop', sortOrder: 3 },
        { title: 'Bahasa Arab & Inggris', description: 'Program akselerasi kemampuan berkomunikasi aktif dalam percakapan sehari-hari.', icon: 'Languages', sortOrder: 4 }
      ],
      programs: [
        { title: 'Tahfidz & Tahsin Al-Qur’an', description: 'Program pembimbingan tilawah dan hafalan Al-Qur’an bertahap dengan evaluasi berkala.', sortOrder: 1 },
        { title: 'Digital Smart Learning', description: 'Penggunaan perangkat digital interaktif untuk eksplorasi sains, matematika, dan proyek belajar.', sortOrder: 2 },
        { title: 'Bilingual Classroom Experience', description: 'Pembiasaan kosakata dan frasa komunikasi Bahasa Inggris dan Bahasa Arab di kelas.', sortOrder: 3 },
        { title: 'Pembinaan Karakter & Akhlak', description: 'Penanaman budaya 5S (Senyum, Salam, Sapa, Sopan, Santun) dan shalat dhuha/dzuhur berjamaah.', sortOrder: 4 },
        { title: 'Science & Robotics Club', description: 'Wadah eksplorasi praktikum IPA, eksperimen sains, dan pembuatan proyek robotika sederhana.', sortOrder: 5 },
        { title: 'Ekstrakurikuler Pilihan Beragam', description: 'Pramuka, Futsal, Basket, Memanah, Hadrah, English Club, dan Seni Kaligrafi.', sortOrder: 6 }
      ],
      facilities: [
        { name: 'Ruang Kelas Modern Ber-AC', description: 'Dilengkapi proyektor interaktif dan pencahayaan ergonomis', imageUrl: '/uploads/gallery/smp1.png', sortOrder: 1 },
        { name: 'Laboratorium IPA & Komputer', description: 'Peralatan praktikum lengkap untuk fisika, biologi, kimia, dan komputasi', imageUrl: '/uploads/gallery/smp2.png', sortOrder: 2 },
        { name: 'Perpustakaan & Media Center', description: 'Akses ribuan buku pelajaran, ensiklopedia, dan e-book digital', imageUrl: '/uploads/gallery/smp3.png', sortOrder: 3 },
        { name: 'Lapangan Olahraga Multifungsi', description: 'Fasilitas futsal, basket, voli, dan bulutangkis', imageUrl: '/uploads/gallery/smp4.png', sortOrder: 4 },
        { name: 'Masjid Sekolah & Ruang Ibadah', description: 'Pusat ibadah harian dan kegiatan pembinaan karakter siswa', imageUrl: '/uploads/gallery/smp5.png', sortOrder: 5 }
      ],
      activities: [
        { title: 'Praktikum IPA & Riset Sains Sederhana', description: 'Pengamatan nyata di laboratorium untuk memperkuat pemahaman materi.', sortOrder: 1 },
        { title: 'Kajian Keislaman & Mentoring Santri', description: 'Bimbingan kelompok kecil penguatan aqidah dan motivasi belajar.', sortOrder: 2 },
        { title: 'Perkemahan Pramuka & Leadership', description: 'Pelatihan kemandirian, kepanduan, dan kerjasama tim di alam terbuka.', sortOrder: 3 },
        { title: 'Parenting & Class Meeting', description: 'Kolaborasi sinergis antara sekolah, siswa, dan orang tua santri.', sortOrder: 4 },
        { title: 'Latihan Kompetisi Sains & MTQ', description: 'Pembinaan intensif menuju ajang kompetisi tingkat kota, provinsi, dan nasional.', sortOrder: 5 }
      ],
      sortOrder: 2
    },
    {
      code: 'sma',
      slug: 'sma',
      name: 'SMA Cendekia Amanah',
      shortName: 'SMA',
      badge: 'Boarding / Fullday School',
      tagline: 'Mempersiapkan Generasi Pemimpin, Saintis, dan Peneliti Menuju PTN & Global',
      heroImage: '/uploads/gallery/sma1.png',
      bulletPoints: [
        'Kurikulum Nasional & Penguatan Minat Bakat Riset',
        'Program Persiapan Sukses Masuk PTN Favorit & Luar Negeri',
        'Bimbingan Riset Ilmiah Remaja & Inovasi Teknologi',
        'Tahfidz Al-Qur’an Lanjutan & Pembinaan Karakter Pemimpin'
      ],
      description: [
        'SMA Cendekia Amanah hadir sebagai lembaga pendidikan menengah atas yang memadukan kurikulum nasional bermutu tinggi dengan pendidikan karakter Islam yang kokoh, mengantarkan siswa menjadi pribadi yang berilmu tinggi, berdaya saing, dan berakhlak mulia.',
        'Dengan dukungan tenaga pengajar profesional, program pembinaan riset ilmiah, bimbingan intensif persiapan perguruan tinggi negeri (PTN) dan luar negeri, kami siap membekali generasi muda menyongsong masa depan gemilang.'
      ],
      features: [
        { title: 'Kurikulum & Keislaman', description: 'Sinergi kurikulum nasional berbasis kompetensi dengan penguatan wawasan keislaman komprehensif.', icon: 'BookOpen', sortOrder: 1 },
        { title: 'Tahfidz Al-Qur’an Lanjutan', description: 'Program pemeliharaan hafalan dan penambahan juz bagi calon hafiz-hafizah generasi bangsa.', icon: 'Award', sortOrder: 2 },
        { title: 'Research & Innovation', description: 'Budaya karya tulis ilmiah, eksperimen laboratorium, dan keikutsertaan kompetisi riset nasional.', icon: 'Microscope', sortOrder: 3 },
        { title: 'Persiapan PTN & Karir Global', description: 'Bimbingan intensif UTBK-SNBT, seleksi jalur prestasi (SNBP), dan pemetaan minat studi lanjut.', icon: 'GraduationCap', sortOrder: 4 }
      ],
      programs: [
        { title: 'Academic Excellence & PTN Pathway', description: 'Pendampingan khusus persiapan seleksi masuk perguruan tinggi negeri terkemuka (UI, ITB, UGM, Unair, ITS, dll).', sortOrder: 1 },
        { title: 'Karya Tulis Ilmiah & Riset Remaja', description: 'Pembimbingan pembuatan paper riset ilmiah, inovasi terapan, dan kompetisi LKTI nasional.', sortOrder: 2 },
        { title: 'Tahfidz Al-Qur’an & Ulumul Syar’i', description: 'Pemantapan hafalan Al-Qur’an dan penguasaan kajian hukum serta pemikiran Islam kontemporer.', sortOrder: 3 },
        { title: 'Leadership & Diplomatic Skills', description: 'Pelatihan public speaking, debat parlemen, kepemimpinan organisasi, dan kepemudaan.', sortOrder: 4 },
        { title: 'Language Proficiency (IELTS/TOAFL)', description: 'Persiapan sertifikasi kecakapan bahasa internasional untuk menunjang studi lanjut ke luar negeri.', sortOrder: 5 },
        { title: 'Career & University Mentoring', description: 'Konseling minat dan bakat karir, try out berkala, serta kunjungan kampus (Campus Tour).', sortOrder: 6 }
      ],
      facilities: [
        { name: 'Ruang Kelas Representatif & Multimedia', description: 'Ruang belajar berfasilitas smart board dan AC', imageUrl: '/uploads/gallery/sma1.png', sortOrder: 1 },
        { name: 'Laboratorium Biologi, Fisika, & Kimia', description: 'Fasilitas riset sains berstandar laboratorium perguruan tinggi', imageUrl: '/uploads/gallery/sma2.png', sortOrder: 2 },
        { name: 'Laboratorium Komputer & Bahasa', description: 'Sarana tes CBT, coding studio, dan latihan bahasa asing interaktif', imageUrl: '/uploads/gallery/sma3.png', sortOrder: 3 },
        { name: 'Perpustakaan Digital & Corner Diskusi', description: 'Akses jurnal ilmiah nasional dan internasional serta ruang diskusi riset', imageUrl: '/uploads/gallery/sma4.png', sortOrder: 4 },
        { name: 'Lapangan Olahraga & Gym Area', description: 'Sarana olahraga lengkap untuk menjaga kebugaran jasmani santri', imageUrl: '/uploads/gallery/sma5.png', sortOrder: 5 },
        { name: 'Masjid Kampus & Studio Audio Visual', description: 'Fasilitas podcast, studio rekaman dakwah, dan pusat peribadatan', imageUrl: '/uploads/gallery/sma6.png', sortOrder: 6 }
      ],
      activities: [
        { title: 'Kegiatan Riset Ilmiah & Presentasi Paper', description: 'Siswa mempresentasikan hasil eksperimen dan penelitian terapan.', sortOrder: 1 },
        { title: 'Try Out Intensif & Bimbingan UTBK', description: 'Pelatihan soal berstandar nasional dan bedah materi secara terstruktur.', sortOrder: 2 },
        { title: 'Studi Kampus & Kuliah Pakar', description: 'Kunjungan ke berbagai perguruan tinggi favorit dan sharing session alumni.', sortOrder: 3 },
        { title: 'Ekstrakurikuler Pilihan & OSIS', description: 'Organisasi siswa, debat ilmiah, jurnalistik, bela diri, dan paduan suara islami.', sortOrder: 4 },
        { title: 'Bakti Sosial & Dakwah Masyarakat', description: 'Pengabdian santri di tengah masyarakat sebagai wujud kepedulian sosial.', sortOrder: 5 }
      ],
      sortOrder: 3
    },
    {
      code: 'diniyah',
      slug: 'diniyah',
      name: 'Madrasah Diniyah Takmiliyah Awaliyah',
      shortName: 'Diniyah',
      badge: 'Non Formal Sore',
      tagline: 'Fondasi Kokoh Aqidah, Akhlak, dan Baca Tulis Al-Qur’an Sejak Dini',
      heroImage: '/uploads/gallery/madrasah1.png',
      bulletPoints: [
        'Pendidikan Agama Islam Terstruktur Non-Formal Sore',
        'Metode Tartil & Tahsin Baca Tulis Al-Qur’an',
        'Pengajaran Fiqih Ibadah Praktis Sehari-Hari',
        'Penanaman Adab, Doa, dan Akhlak Mulia'
      ],
      description: [
        'Madrasah Diniyah Takmiliyah Awaliyah (MDTA) Cendekia Amanah merupakan lembaga pendidikan non formal yang memberikan pendidikan agama Islam dasar komprehensif bagi anak-anak dan santri di waktu sore hari.',
        'Pembelajaran menekankan pada pemahaman aqidah yang benar, keterampilan membaca dan menulis Al-Qur’an dengan makhraj yang fasih, pengamalan ibadah praktis, serta penanaman budi pekerti luhur sejak usia dini.'
      ],
      features: [
        { title: 'Aqidah yang Lurus', description: 'Penanaman dasar-dasar keimanan yang kokoh sesuai tuntunan Ahlussunnah wal Jama’ah.', icon: 'HeartHandshake', sortOrder: 1 },
        { title: 'Fiqih Sehari-hari', description: 'Pembelajaran tata cara thaharah, wudhu, shalat, dan ibadah praktis yang benar.', icon: 'BookOpen', sortOrder: 2 },
        { title: 'Akhlak Mulia', description: 'Pembiasaan adab kepada orang tua, guru, teman, serta penghayatan nilai sopan santun.', icon: 'ShieldCheck', sortOrder: 3 },
        { title: 'Kitab Kuning Dasar', description: 'Pengenalan makna dan terjemahan dasar kitab akhlak (Taisirul Khalaq/Safinatun Najah).', icon: 'Scroll', sortOrder: 4 }
      ],
      programs: [
        { title: 'Tahsin & Baca Tulis Al-Qur’an (BTQ)', description: 'Pembelajaran membaca Al-Qur’an dengan kaidah tajwid yang benar dan menulis huruf hijaiyah.', sortOrder: 1 },
        { title: 'Dasar Aqidah & Rukun Iman', description: 'Pemahaman tauhid dan keimanan dengan pendekatan yang mudah dipahami anak-anak.', sortOrder: 2 },
        { title: 'Praktik Fiqih Ibadah & Doa Harian', description: 'Bimbingan wudhu, shalat fardhu/sunnah, hafalan doa sehari-hari, dan surat-surat pendek.', sortOrder: 3 },
        { title: 'Pendidikan Akhlak & Adab Islami', description: 'Penanaman rasa hormat kepada orang tua, guru, sesama teman, serta adab makan dan tidur.', sortOrder: 4 },
        { title: 'Kisah Para Nabi & Sahabat (Tarikh)', description: 'Keteladanan sejarah perjuangan Rasulullah SAW dan para sahabat untuk inspirasi kebaikan.', sortOrder: 5 },
        { title: 'Bahasa Arab Dasar Anak', description: 'Pengenalan kosa kata sehari-hari, nama benda, angka, dan percakapan sederhana.', sortOrder: 6 }
      ],
      facilities: [
        { name: 'Ruang Kelas Diniyah yang Nyaman', description: 'Ruang belajar berkarpet bersih dan berpendingin udara', imageUrl: '/uploads/gallery/madrasah1.png', sortOrder: 1 },
        { name: 'Perpustakaan Kitab & Cerita Islami', description: 'Buku cerita bergambar islami, juz amma warna-warni, dan buku akhlak anak', imageUrl: '/uploads/gallery/madrasah2.png', sortOrder: 2 },
        { name: 'Masjid & Area Praktik Wudhu Terbuka', description: 'Sarana pelatihan tata cara thaharah dan shalat berjamaah', imageUrl: '/uploads/gallery/madrasah4.png', sortOrder: 3 }
      ],
      activities: [
        { title: 'Halaqah Sorogan Iqro & Juz ‘Amma', description: 'Bimbingan membaca Al-Qur’an satu per satu dengan teliti.', sortOrder: 1 },
        { title: 'Praktik Shalat Ashar Berjamaah', description: 'Pelatihan langsung tata cara shalat, adzan, dan iqamah bagi santri.', sortOrder: 2 },
        { title: 'Hafalan Doa & Hadits Pilihan', description: 'Penyetoran hafalan doa harian dan adab islami.', sortOrder: 3 },
        { title: 'Peringatan Hari Besar Islam (PHBI)', description: 'Pentas seni santri dan perlombaan islami di momen keagamaan.', sortOrder: 4 },
        { title: 'Pesantren Kilat Ramadhan', description: 'Kegiatan intensif pembelajaran agama dan buka puasa bersama di bulan suci.', sortOrder: 5 }
      ],
      sortOrder: 4
    }
  ];

  for (const unit of unitsData) {
    const createdUnit = await prisma.educationUnit.upsert({
      where: { code: unit.code },
      update: {
        slug: unit.slug,
        name: unit.name,
        shortName: unit.shortName,
        badge: unit.badge,
        tagline: unit.tagline,
        heroImage: unit.heroImage,
        profileBody: unit.description,
        curriculumBody: unit.bulletPoints,
        sortOrder: unit.sortOrder
      },
      create: {
        code: unit.code,
        slug: unit.slug,
        name: unit.name,
        shortName: unit.shortName,
        badge: unit.badge,
        tagline: unit.tagline,
        heroImage: unit.heroImage,
        profileBody: unit.description,
        curriculumBody: unit.bulletPoints,
        sortOrder: unit.sortOrder
      }
    });

    // Seed features
    await prisma.unitFeature.deleteMany({ where: { unitId: createdUnit.id } });
    for (const f of unit.features) {
      await prisma.unitFeature.create({
        data: {
          unitId: createdUnit.id,
          title: f.title,
          description: f.description,
          icon: f.icon,
          sortOrder: f.sortOrder
        }
      });
    }

    // Seed programs
    await prisma.unitProgram.deleteMany({ where: { unitId: createdUnit.id } });
    for (const p of unit.programs) {
      await prisma.unitProgram.create({
        data: {
          unitId: createdUnit.id,
          title: p.title,
          description: p.description,
          sortOrder: p.sortOrder
        }
      });
    }

    // Seed facilities
    await prisma.unitFacility.deleteMany({ where: { unitId: createdUnit.id } });
    for (const fac of unit.facilities) {
      await prisma.unitFacility.create({
        data: {
          unitId: createdUnit.id,
          name: fac.name,
          description: fac.description,
          imageUrl: fac.imageUrl,
          sortOrder: fac.sortOrder
        }
      });
    }

    // Seed activities
    await prisma.unitActivity.deleteMany({ where: { unitId: createdUnit.id } });
    for (const act of unit.activities) {
      await prisma.unitActivity.create({
        data: {
          unitId: createdUnit.id,
          title: act.title,
          description: act.description,
          imageUrl: unit.heroImage,
          sortOrder: act.sortOrder
        }
      });
    }
  }

  // ----------------------------------------------------
  // 6. NEWS CATEGORIES & ALL 12 NEWS ARTICLES (100% Exact from news.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding News Categories & ALL 12 News Articles...');
  const newsCats = [
    { name: 'Pesantren', slug: 'pesantren', description: 'Kabar dan kegiatan pondok pesantren', sortOrder: 1 },
    { name: 'SMP', slug: 'smp', description: 'Informasi dan kegiatan SMP Cendekia Amanah', sortOrder: 2 },
    { name: 'SMA', slug: 'sma', description: 'Kabar akademik dan riset SMA Cendekia Amanah', sortOrder: 3 },
    { name: 'Diniyah', slug: 'diniyah', description: 'Kegiatan Madrasah Diniyah', sortOrder: 4 },
    { name: 'Prestasi', slug: 'prestasi', description: 'Pencapaian dan kejuaraan santri', sortOrder: 5 },
    { name: 'Kegiatan', slug: 'kegiatan', description: 'Agenda dakwah, sosial, dan akademik', sortOrder: 6 }
  ];

  const catMap = new Map<string, string>();
  for (const cat of newsCats) {
    const created = await prisma.newsCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
    catMap.set(cat.slug, created.id);
  }

  const all12NewsArticles = [
    {
      id: 'news-1',
      slug: 'wisuda-tahfidz-ke-xviii-pesantren-cendekia-amanah',
      title: 'Wisuda Tahfidz ke-XVIII Pesantren Cendekia Amanah: Cetak Puluhan Hafidz Berprestasi',
      excerpt: 'Sebanyak 45 santri berhasil mengkhatamkan hafalan Al-Qur’an 30 juz dan juz pilihan dalam perhelatan akbar Wisuda Tahfidz ke-XVIII di Aula Utama Pesantren.',
      content: [
        'Depok — Pesantren Cendekia Amanah kembali menggelar agenda akbar tahunan Wisuda Tahfidz ke-XVIII pada Ahad (10/05/2026). Sebanyak 45 santriwan dan santriwati dari berbagai jenjang berhasil menuntaskan hafalan Al-Qur’an dengan predikat mutqin setelah melalui proses tasmi’ sekali duduk.',
        'Acara wisuda yang dihadiri langsung oleh Pengasuh Pesantren Cendekia Amanah, KH. Cholil Nafis, Lc., MA., Ph.D, berlangsung penuh haru dan kekhidmatan. Turut hadir para wali santri, tokoh ulama, serta perwakilan dari Kementerian Agama.',
        'Dalam sambutan arahannya, KH. Cholil Nafis menegaskan bahwa menghafal Al-Qur’an bukan semata mengingat baris-baris ayat, melainkan fondasi kokoh pembentukan karakter, kejujuran, dan integritas kepemimpinan santri di masa depan.',
        '“Menghafal Al-Qur’an adalah awal dari perjalanan panjang mengamalkan ilmu. Jadilah lentera kebaikan di tengah masyarakat yang senantiasa menebarkan kesejukan dan rahmat bagi semesta alam,” pesan beliau di hadapan ratusan hadirin.',
        'Para wisudawan juga mendapatkan penghargaan khusus berupa beasiswa pendidikan lanjutan serta sertifikat syahadah tahfidz resmi yang telah terverifikasi oleh lajnah tahfidz pesantren.'
      ],
      categorySlug: 'pesantren',
      author: 'Tim Media Cendekia',
      publishedAt: '10 Mei 2026',
      readTime: '4 menit',
      viewsCount: BigInt(1248),
      featuredImage: '/uploads/news/wisuda.jpg',
      tags: ['Tahfidz', 'Pesantren', 'Wisuda', 'Prestasi'],
      isPopular: true,
      isFeatured: true,
      highlightQuote: '“Menghafal Al-Qur’an bukan sekadar mengingat baris ayat, tapi pembentukan karakter dan integritas kepemimpinan.”'
    },
    {
      id: 'news-2',
      slug: 'siswa-sma-raih-medali-emas-olimpiade-fisika-nasional-2026',
      title: 'Membanggakan! Siswa SMA Raih Medali Emas Olimpiade Fisika Nasional 2026',
      excerpt: 'Prestasi gemilang diraih siswa SMA Cendekia Amanah pada ajang Olimpiade Fisika Nasional 2026 setelah berhasil mengungguli ratusan peserta dari seluruh Indonesia.',
      content: [
        'Jakarta — Siswa SMA Cendekia Amanah, Muhammad Farhan (Kelas XI IPA), berhasil menorehkan prestasi membanggakan di tingkat nasional dengan meraih Medali Emas pada Olimpiade Fisika Tingkat Nasional yang diselenggarakan oleh asosiasi pendidik sains Indonesia.',
        'Kompetisi bergengsi ini diikuti oleh lebih dari 500 peserta terpilih dari berbagai SMA/MA unggulan se-Indonesia. Farhan berhasil meraih nilai tertinggi pada babak praktikum analisis eksperimen termodinamika dan gelombang.',
        'Kepala SMA Cendekia Amanah, Dr. Muhammad Ridwan, menyampaikan rasa syukur dan apresiasi yang tinggi atas capaian ini. Beliau menekankan bahwa program bimbingan riset dan sains di SMA Cendekia Amanah terbukti mampu memfasilitasi potensi siswa hingga level tertinggi.',
        '“Prestasi ini membuktikan bahwa anak-anak yang belajar di lingkungan pesantren dan sekolah Islam mampu bersaing unggul dalam ranah sains eksakta modern,” ujar Dr. Muhammad Ridwan.'
      ],
      categorySlug: 'sma',
      author: 'Redaksi Sains CA',
      publishedAt: '09 Mei 2026',
      readTime: '3 menit',
      viewsCount: BigInt(980),
      featuredImage: '/uploads/news/piala.jpg',
      tags: ['Prestasi', 'SMAIslam', 'OSN', 'Fisika'],
      isPopular: true,
      isFeatured: true
    },
    {
      id: 'news-3',
      slug: 'smp-cendekia-amanah-juara-umum-lomba-sains-provinsi',
      title: 'SMP Cendekia Amanah Raih Juara Umum Lomba Sains Tingkat Jawa Barat',
      excerpt: 'Kontingen siswa SMP Cendekia Amanah mendominasi perolehan trofi dalam ajang Olimpiade Sains dan Robotika Antar Pelajar se-Jawa Barat.',
      content: [
        'Bandung — Kontingen SMP Cendekia Amanah berhasil membawa pulang predikat Juara Umum pada ajang Lomba Sains dan Matematika Terpadu Tingkat Provinsi Jawa Barat. Tiga tim yang diutus berhasil mengamankan juara 1 kategori IPA Terpadu dan juara 2 kategori Robotika.',
        'Para pembina dan dewan guru menyambut kedatangan para kontingen dengan sukacita di aula sekolah. Capaian ini merupakan buah dari pembinaan intensif ekstrakurikuler Science & Robotics Club.',
        'Keberhasilan ini semakin memantapkan reputasi SMP Cendekia Amanah sebagai sekolah yang tidak hanya fokus pada penguatan karakter islami, tetapi juga unggul dalam prestasi akademik sains.'
      ],
      categorySlug: 'smp',
      author: 'Tim Humas SMP',
      publishedAt: '08 Mei 2026',
      readTime: '3 menit',
      viewsCount: BigInt(840),
      featuredImage: '/uploads/news/robotik.jpg',
      tags: ['SMPIslam', 'Prestasi', 'Robotik', 'Sains'],
      isPopular: true,
      isFeatured: true
    },
    {
      id: 'news-4',
      slug: 'implementasi-digital-learning-di-smp-cendekia-amanah',
      title: 'Implementasi Digital Learning di SMP Cendekia Amanah: Belajar Lebih Interaktif dan Terukur',
      excerpt: 'Guna menyongsong era kecerdasan buatan dan literasi digital, SMP Cendekia Amanah meluncurkan platform smart classroom terintegrasi untuk seluruh mata pelajaran.',
      content: [
        'Depok — SMP Cendekia Amanah secara resmi menerapkan platform Smart Classroom terintegrasi pada semester genap tahun ajaran 2026. Langkah ini diambil untuk memberikan pengalaman belajar yang lebih menarik, adaptif, dan terukur bagi para siswa.',
        'Melalui platform digital ini, siswa dapat mengakses modul praktikum virtual, kuis interaktif, serta dashboard perkembangan belajar secara real-time. Guru juga dapat memberikan umpan balik langsung pada setiap proyek siswa.'
      ],
      categorySlug: 'smp',
      author: 'Divisi Kurikulum',
      publishedAt: '06 Mei 2026',
      readTime: '4 menit',
      viewsCount: BigInt(650),
      featuredImage: '/uploads/gallery/smp2.png',
      tags: ['SMPIslam', 'DigitalLearning', 'Inovasi'],
      isPopular: false,
      isFeatured: false
    },
    {
      id: 'news-5',
      slug: 'kegiatan-sorogan-kitab-kuning-di-madrasah-diniyah',
      title: 'Semarak Sorogan Kitab Kuning di Madrasah Diniyah: Melestarikan Tradisi Keilmuan Klasik',
      excerpt: 'Santri Madrasah Diniyah antusias mengikuti program sorogan kitab Safinatun Najah dan Taisirul Khalaq sebagai fondasi pemahaman fiqih dan akhlak harian.',
      content: [
        'Depok — Suasana sore di Pesantren Cendekia Amanah selalu semarak dengan lantunan bait-bait matan kitab kuning dari para santri Madrasah Diniyah Takmiliyah Awaliyah. Metode sorogan (membaca langsung di depan guru) diterapkan untuk memastikan kefasihan pelafalan dan pemahaman makna.',
        'Pengajar Diniyah, Ustadz Abdul Malik, menyatakan bahwa metode klasik ini sangat efektif melatih ketelitian nalar dan adab santri dalam menimba ilmu agama dari para ulama mu’tabar.'
      ],
      categorySlug: 'diniyah',
      author: 'Pengelola Diniyah',
      publishedAt: '04 Mei 2026',
      readTime: '3 menit',
      viewsCount: BigInt(520),
      featuredImage: '/uploads/gallery/madrasah1.png',
      tags: ['Diniyah', 'KitabKuning', 'Tradisi'],
      isPopular: false,
      isFeatured: false
    },
    {
      id: 'news-6',
      slug: 'perkemahan-pramuka-penegak-cendekia-amanah',
      title: 'Perkemahan Pramuka Penegak Cendekia Amanah: Membangun Jiwa Tangguh dan Kepedulian Sosial',
      excerpt: 'Ratusan pramuka penegak mengikuti kegiatan kemah sabtu-minggu (Persami) di kawasan perkemahan alam dengan fokus pelatihan survival dan bakti masyarakat.',
      content: [
        'Bogor — Gugus Depan Cendekia Amanah sukses menyelenggarakan Perkemahan Pramuka Penegak di Bumi Perkemahan Gunung Pancar. Kegiatan diisi dengan pelatihan pionering, navigasi darat, uji ketangkasan survival, dan aksi bersih lingkungan.',
        'Kegiatan ini bertujuan melatih kedisiplinan, kerjasama kelompok, kepemimpinan lapangan, dan kepekaan sosial para siswa di alam terbuka.'
      ],
      categorySlug: 'kegiatan',
      author: 'Pembina Pramuka',
      publishedAt: '02 Mei 2026',
      readTime: '3 menit',
      viewsCount: BigInt(470),
      featuredImage: '/uploads/gallery/sma5.png',
      tags: ['Kegiatan', 'Pramuka', 'Leadership'],
      isPopular: false,
      isFeatured: false
    },
    {
      id: 'news-7',
      slug: 'santri-cendekia-amanah-raih-juara-mtq-tingkat-provinsi',
      title: 'Santri Cendekia Amanah Raih Juara MTQ Cabang Tilawah Tingkat Provinsi',
      excerpt: 'Ahmad Raihan, santri Pesantren Cendekia Amanah, berhasil memukau dewan hakim dan menyabet Juara 1 Cabang Tilawah Golongan Remaja.',
      content: [
        'Depok — Kebanggaan kembali menghampiri Pesantren Cendekia Amanah setelah salah satu santrinya, Ahmad Raihan, berhasil meraih Juara 1 pada Musabaqah Tilawatil Qur’an (MTQ) Tingkat Provinsi.',
        'Lantunan ayat suci dengan irama bayyati dan nahawand yang dibawakan Raihan mendapat apresiasi tinggi dari para dewan juri. Ia kini dipersiapkan mewakili kafilah provinsi ke tingkat nasional.'
      ],
      categorySlug: 'prestasi',
      author: 'Lembaga Tahfidz',
      publishedAt: '30 April 2026',
      readTime: '3 menit',
      viewsCount: BigInt(910),
      featuredImage: '/uploads/news/wisuda.jpg',
      tags: ['Prestasi', 'MTQ', 'Tahfidz'],
      isPopular: true,
      isFeatured: false
    },
    {
      id: 'news-8',
      slug: 'seminar-parenting-bersama-orang-tua-santri',
      title: 'Seminar Parenting: Kunci Sinergi Orang Tua dan Pesantren dalam Mendidik Remaja di Era Digital',
      excerpt: 'Menghadirkan pakar psikologi keluarga islami, seminar ini membedah pola asuh efektif mendampingi anak santri agar berprestasi dan berkarakter kuat.',
      content: [
        'Depok — Lembaga Pendidikan Terpadu Cendekia Amanah mengadakan Seminar Parenting Akbar bertajuk “Membangun Resiliensi dan Karakter Anak Santri di Era Keterbukaan Informasi”.',
        'Ratusan orang tua dan wali santri hadir memadati aula dan mengikuti sesi tanya jawab interaktif seputar komunikasi empatik dan dukungan emosional kepada anak selama di pondok pesantren.'
      ],
      categorySlug: 'kegiatan',
      author: 'Komite Sekolah',
      publishedAt: '28 April 2026',
      readTime: '4 menit',
      viewsCount: BigInt(680),
      featuredImage: '/uploads/gallery/smp4.png',
      tags: ['Parenting', 'Kegiatan', 'Keluarga'],
      isPopular: false,
      isFeatured: false
    },
    {
      id: 'news-9',
      slug: 'praktikum-ipa-kelas-8-belajar-sains-secara-nyata',
      title: 'Praktikum IPA Kelas 8: Siswa Eksplorasi Ekosistem Hidroponik dan Mikrobiologi',
      excerpt: 'Memanfaatkan green house pesantren, para siswa SMP Cendekia Amanah belajar konsep nutrisi tanaman dan bioteknologi secara langsung.',
      content: [
        'Depok — Pembelajaran IPA tidak hanya terbatas pada teori di dalam kelas. Siswa kelas 8 SMP Cendekia Amanah melakukan praktikum lapangan di unit Green House Hidroponik Cendekia Amanah.',
        'Siswa mengukur pH air nutrisi, mengamati stomata daun menggunakan mikroskop cahaya, dan menganalisis siklus tumbuh tanaman selada dan kailan.'
      ],
      categorySlug: 'smp',
      author: 'Guru IPA',
      publishedAt: '26 April 2026',
      readTime: '3 menit',
      viewsCount: BigInt(420),
      featuredImage: '/uploads/news/hidroponik.jpg',
      tags: ['SMPIslam', 'Sains', 'Praktikum'],
      isPopular: false,
      isFeatured: false
    },
    {
      id: 'news-10',
      slug: 'daurah-bahasa-arab-intensif-santri-putra-putri',
      title: 'Daurah Bahasa Arab Intensif: Tingkatkan Kefasihan Muhadatsah dan Penguasaan Mufradat',
      excerpt: 'Program karantina bahasa selama satu pekan menghadirkan native speaker untuk mengasah kepercayaan diri santri berbicara Bahasa Arab aktif.',
      content: [
        'Depok — Daurah Bahasa Arab yang berlangsung selama sepekan di Pesantren Cendekia Amanah memberikan dampak signifikan terhadap kemampuan muhadatsah para santri.',
        'Dengan sistem immersi total, santri diwajibkan berkomunikasi penuh dalam Bahasa Arab di asrama, kelas, dan area makan dengan pendampingan musyrif bahasa.'
      ],
      categorySlug: 'pesantren',
      author: 'Lembaga Bahasa CA',
      publishedAt: '22 April 2026',
      readTime: '3 menit',
      viewsCount: BigInt(590),
      featuredImage: '/uploads/gallery/pesantren4.png',
      tags: ['Pesantren', 'BahasaArab', 'Daurah'],
      isPopular: false,
      isFeatured: false
    },
    {
      id: 'news-11',
      slug: 'studi-kampus-sma-ke-universitas-negeri-surabaya',
      title: 'Studi Kampus Siswa SMA: Kunjungi Kampus Ternama dan Buka Wawasan Studi Lanjutan',
      excerpt: 'Siswa kelas XII SMA Cendekia Amanah mengunjungi laboratorium dan fakultas favorit di berbagai perguruan tinggi negeri untuk pemantapan jurusan.',
      content: [
        'Surabaya — Rombongan studi kampus SMA Cendekia Amanah mengunjungi sejumlah kampus terkemuka di Jawa Timur, termasuk ITS dan Unair. Para siswa mendapatkan penjelasan langsung mengenai jalur penerimaan mahasiswa baru (SNBP/SNBT) serta fasilitas riset.',
        'Kegiatan ini diharapkan semakin membakar motivasi siswa untuk belajar giat menembus program studi impian masing-masing.'
      ],
      categorySlug: 'sma',
      author: 'Bimbingan Konseling SMA',
      publishedAt: '18 April 2026',
      readTime: '3 menit',
      viewsCount: BigInt(530),
      featuredImage: '/uploads/gallery/sma3.png',
      tags: ['SMAIslam', 'StudiKampus', 'PTN'],
      isPopular: false,
      isFeatured: false
    },
    {
      id: 'news-12',
      slug: 'khataman-juz-amma-santri-diniyah-kelas-4',
      title: 'Khataman Juz ‘Amma Santri Madrasah Diniyah: Langkah Awal Mencintai Al-Qur’an',
      excerpt: 'Sebanyak 30 santri cilik Madrasah Diniyah sukses menyelesaikan tasmi’ hafalan Juz 30 di hadapan para pengajar dan orang tua.',
      content: [
        'Depok — Kebahagiaan terpancar dari wajah santri cilik Madrasah Diniyah saat menerima syahadah kelulusan Juz ‘Amma pada acara Khataman Al-Qur’an sore kemarin.',
        'Para guru berharap pencapaian ini menjadi pemantik semangat untuk terus menambah hafalan ke juz-juz selanjutnya dengan bacaan yang fasih dan tartil.'
      ],
      categorySlug: 'diniyah',
      author: 'Humas Diniyah',
      publishedAt: '14 April 2026',
      readTime: '2 menit',
      viewsCount: BigInt(390),
      featuredImage: '/uploads/gallery/madrasah2.png',
      tags: ['Diniyah', 'Khataman', 'Tahfidz'],
      isPopular: false,
      isFeatured: false
    }
  ];

  for (const art of all12NewsArticles) {
    const categoryId = catMap.get(art.categorySlug) || catMap.get('pesantren')!;
    const createdArt = await prisma.newsArticle.upsert({
      where: { slug: art.slug },
      update: {
        title: art.title,
        categoryId,
        excerpt: art.excerpt,
        content: art.content,
        author: art.author,
        featuredImage: art.featuredImage,
        highlightQuote: art.highlightQuote || null,
        publishedDateText: art.publishedAt,
        isFeatured: art.isFeatured || false,
        isPopular: art.isPopular || false,
        viewsCount: art.viewsCount,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date()
      },
      create: {
        slug: art.slug,
        title: art.title,
        categoryId,
        excerpt: art.excerpt,
        content: art.content,
        author: art.author,
        featuredImage: art.featuredImage,
        highlightQuote: art.highlightQuote || null,
        publishedDateText: art.publishedAt,
        isFeatured: art.isFeatured || false,
        isPopular: art.isPopular || false,
        viewsCount: art.viewsCount,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });

    // Create / link tags
    for (const tagName of art.tags) {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: { name: tagName },
        create: { slug: tagSlug, name: tagName }
      });

      await prisma.newsArticleTag.upsert({
        where: {
          newsArticleId_tagId: {
            newsArticleId: createdArt.id,
            tagId: tag.id
          }
        },
        update: {},
        create: {
          newsArticleId: createdArt.id,
          tagId: tag.id
        }
      });
    }
  }

  // ----------------------------------------------------
  // 7. OPINION AUTHORS & ALL 5 OPINION ARTICLES (100% Exact from opinions.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding ALL 5 Opinion Articles & Authors...');
  const authorsData = [
    {
      name: 'KH. Cholil Nafis, Lc., MA., Ph.D',
      role: 'Pengasuh Pesantren Cendekia Amanah',
      avatar: '/uploads/guru/leader.png',
      bio: 'Pengasuh Pesantren Cendekia Amanah, Ketua MUI Bidang Dakwah & Ukhuwah, Dosen Pascasarjana Universitas Indonesia.'
    },
    {
      name: 'Ustadz Ahmad Fauzi, M.Pd',
      role: 'Kepala Pesantren Cendekia Amanah',
      avatar: '/uploads/guru/guru1.png',
      bio: 'Kepala Pondok Pesantren Cendekia Amanah, Pembina Tahfidz Al-Qur’an.'
    },
    {
      name: 'Ustadzah Nur Hidayah, S.Pd',
      role: 'Guru SMP Cendekia Amanah',
      avatar: '/uploads/guru/guru2.png',
      bio: 'Pendidik SMP Cendekia Amanah dan Konselor Psikologi Pendidikan Remaja.'
    },
    {
      name: 'Dr. Muhammad Ridwan',
      role: 'Kepala SMA Cendekia Amanah',
      avatar: '/uploads/guru/guru3.png',
      bio: 'Kepala SMA Cendekia Amanah, Peneliti Pendidikan Sains dan Pembimbing Riset Nasional.'
    },
    {
      name: 'Ustadz Abdul Malik',
      role: 'Pengajar Diniyah Cendekia Amanah',
      avatar: '/uploads/guru/guru4.png',
      bio: 'Pengajar Senior Madrasah Diniyah Takmiliyah Awaliyah Cendekia Amanah.'
    }
  ];

  const authorMap = new Map<string, string>();
  for (const auth of authorsData) {
    const existing = await prisma.opinionAuthor.findFirst({ where: { name: auth.name } });
    if (existing) {
      const updated = await prisma.opinionAuthor.update({ where: { id: existing.id }, data: auth });
      authorMap.set(auth.name, updated.id);
    } else {
      const created = await prisma.opinionAuthor.create({ data: auth });
      authorMap.set(auth.name, created.id);
    }
  }

  const all5Opinions = [
    {
      id: 'opini-1',
      slug: 'mendidik-generasi-qurani-di-tengah-arus-digital',
      title: 'Mendidik Generasi Qurani di Tengah Arus Digital',
      excerpt: 'Tantangan era kecerdasan buatan dan arus informasi menuntut pendekatan pendidikan yang mengakar pada nilai-nilai wahyu Ilahi serta adaptif terhadap kemajuan zaman.',
      content: [
        'Perkembangan teknologi informasi saat ini telah mengubah lanskap peradaban manusia secara dramatis. Anak-anak dan remaja kita hari ini lahir sebagai digital natives yang setiap detik terpapar arus informasi global tanpa sekat.',
        'Dalam situasi seperti ini, tugas lembaga pendidikan Islam dan pesantren bukan lagi sekadar mentransfer pengetahuan kognitif (transfer of knowledge), melainkan menanamkan nilai-nilai luhur dan hikmah (transfer of values & wisdom). Fondasi Al-Qur’an menjadi filter terkuat yang membentengi akal dan nurani generasi muda.',
        'Ketika seorang santri memiliki interaksi yang intens dengan Al-Qur’an — menghafalnya, mentadabburinya, dan mengamalkannya — ia sedang membangun kompas moral internal. Kompas inilah yang akan membimbingnya saat kelak ia menjadi saintis, pemimpin birokrasi, teknokrat, maupun entrepreneur yang amanah.',
        'Pesantren Cendekia Amanah memandang teknologi bukan sebagai ancaman, melainkan sebagai instrumen dakwah dan kebaikan yang harus dikuasai santri dengan tetap berpijak teguh pada akhlakul karimah.'
      ],
      authorName: 'KH. Cholil Nafis, Lc., MA., Ph.D',
      publishedAt: '05 Mei 2026',
      readTime: '5 menit',
      isFeatured: true,
      tags: ['PendidikanIslam', 'GenerasiQurani', 'EraDigital', 'Karakter'],
      highlightQuote: '“Kompas moral Al-Qur’an adalah benteng terkuat yang menjaga kecerdasan intelektual agar senantiasa bermuara pada kemaslahatan umat.”'
    },
    {
      id: 'opini-2',
      slug: 'tahfidz-bukan-sekadar-hafalan-tapi-pembentukan-karakter',
      title: 'Tahfidz Bukan Sekadar Hafalan, Tapi Pembentukan Karakter',
      excerpt: 'Proses menghafal ayat suci melatih kesabaran, kedisiplinan tingkat tinggi, kejujuran diri, dan ketahanan mental yang menjadi modal utama kesuksesan hidup.',
      content: [
        'Banyak orang mengira bahwa program tahfidz Al-Qur’an hanya melatih memori otak untuk merekam ribuan kata. Padahal, jika kita telusuri secara mendalam, proses menghafal Al-Qur’an adalah sebuah kawah candradimuka pembentukan karakter (character building) yang sangat paripurna.',
        'Setiap santri yang duduk bersimpuh menyetorkan hafalan di hadapan ustadznya sedang mempraktikkan kejujuran akademis paling hakiki. Tidak ada jalan pintas dalam tahfidz selain ketekunan mengulang (muraja’ah) ribuan kali dan kerendahan hati untuk dikoreksi makhrajnya.',
        'Ketangguhan mental (grit) yang terlatih dari rutinitas tahfidz inilah yang membuat para santri memiliki daya juang tinggi saat menghadapi tantangan studi lanjutan di universitas maupun dunia profesional.'
      ],
      authorName: 'Ustadz Ahmad Fauzi, M.Pd',
      publishedAt: '01 Mei 2026',
      readTime: '4 menit',
      isFeatured: false,
      tags: ['Tahfidz', 'Karakter', 'Disiplin', 'Pendidikan']
    },
    {
      id: 'opini-3',
      slug: 'peran-orang-tua-dalam-pendidikan-boarding-school',
      title: 'Peran Orang Tua dalam Pendidikan Boarding School',
      excerpt: 'Menitipkan anak di pesantren bukan berarti melepaskan tanggung jawab pengasuhan. Sinergi dan doa orang tua adalah separuh ruh keberhasilan santri.',
      content: [
        'Keputusan orang tua menyekolahkan putra-putrinya di asrama/boarding school seringkali diiringi rasa rindu dan kekhawatiran. Namun yang terpenting untuk dipahami, pesantren bukanlah tempat "mendelegasikan" pengasuhan secara mutlak, melainkan mitra sinergis keluarga.',
        'Dukungan moral, komunikasi yang memberdayakan saat kunjungan, serta keridhaan dan untaian doa tulus dari orang tua di rumah merupakan energi tak terlihat yang melapangkan jalan anak dalam menyerap ilmu dan menghadapi ujian kemandirian di pondok.'
      ],
      authorName: 'Ustadzah Nur Hidayah, S.Pd',
      publishedAt: '25 April 2026',
      readTime: '3 menit',
      isFeatured: false,
      tags: ['BoardingSchool', 'Parenting', 'Keluarga']
    },
    {
      id: 'opini-4',
      slug: 'menyiapkan-santri-menembus-perguruan-tinggi-favorit',
      title: 'Menyiapkan Santri Menembus Perguruan Tinggi Favorit',
      excerpt: 'Strategi komprehensif memadukan ketahanan spiritual santri dengan bimbingan akademik terukur untuk menembus kampus impian dalam dan luar negeri.',
      content: [
        'Stereotip bahwa lulusan pesantren hanya bisa melanjutkan ke jurusan keagamaan telah usang. Saat ini, santri memiliki peluang yang sama bahkan lebih luas untuk menembus fakultas kedokteran, teknik, informatika, ekonomi, dan hubungan internasional di kampus-kampus terbaik.',
        'Di SMA Cendekia Amanah, kami merancang peta jalan (roadmap) pembinaan akademik sejak kelas X melalui pemetaan bakat, tryout berkala, bimbingan penalaran matematika dan literasi sains, serta pendampingan pembuatan portofolio prestasi.'
      ],
      authorName: 'Dr. Muhammad Ridwan',
      publishedAt: '20 April 2026',
      readTime: '4 menit',
      isFeatured: false,
      tags: ['SMAIslam', 'PTNFavorit', 'StudiLanjut', 'Prestasi']
    },
    {
      id: 'opini-5',
      slug: 'kitab-kuning-dan-relevansinya-untuk-santri-hari-ini',
      title: 'Kitab Kuning dan Relevansinya untuk Santri Hari Ini',
      excerpt: 'Khazanah turats karya ulama klasik bukan sekadar peninggalan masa lalu, melainkan metodologi berpikir kritis dan pemahaman agama yang moderat.',
      content: [
        'Mempelajari kitab kuning melatih nalar santri untuk memahami konteks dalil, perbedaan pandangan (ikhtilaf) para imam mazhab dengan lapang dada, dan merumuskan solusi fiqih yang ramah dan bijak.',
        'Di tengah maraknya pemahaman keagamaan instan di media sosial, tradisi membaca kitab kuning dengan sanad keilmuan yang bersambung menjadi penawar yang sangat berharga untuk menjaga keberagamaan yang rahmatan lil ‘alamin.'
      ],
      authorName: 'Ustadz Abdul Malik',
      publishedAt: '15 April 2026',
      readTime: '4 menit',
      isFeatured: false,
      tags: ['KitabKuning', 'Diniyah', 'Turats', 'Moderat']
    }
  ];

  for (const op of all5Opinions) {
    const authorId = authorMap.get(op.authorName) || Array.from(authorMap.values())[0];
    await prisma.opinionArticle.upsert({
      where: { slug: op.slug },
      update: {
        title: op.title,
        authorId,
        excerpt: op.excerpt,
        content: op.content,
        highlightQuote: op.highlightQuote || null,
        publishedDateText: op.publishedAt,
        readTime: op.readTime,
        isFeatured: op.isFeatured,
        tags: op.tags,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date()
      },
      create: {
        slug: op.slug,
        title: op.title,
        authorId,
        excerpt: op.excerpt,
        content: op.content,
        highlightQuote: op.highlightQuote || null,
        publishedDateText: op.publishedAt,
        readTime: op.readTime,
        isFeatured: op.isFeatured,
        tags: op.tags,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });
  }

  // ----------------------------------------------------
  // 8. AGENDAS (Exact from agenda.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding Agendas...');
  const agendasData = [
    { day: '12', month: 'AUG', year: '2026', title: 'Seminar Parenting Untuk Orang Tua Santri & Calon Wali Murid', time: '08.00 – 11.30 WIB', location: 'Aula Utama Pesantren Cendekia Amanah', status: 'Dibuka' },
    { day: '15', month: 'AUG', year: '2026', title: 'Lomba Tahfidz & Tartil Al-Qur’an Antar Sekolah Se-Jawa Barat', time: '08.00 – 16.00 WIB', location: 'Masjid Jami Cendekia Amanah', status: 'Pendaftaran Peserta' },
    { day: '20', month: 'AUG', year: '2026', title: 'PPDB Gelombang II Tahun Ajaran 2027/2028 (Pesantren, SMP, SMA, Diniyah)', time: 'Pendaftaran Online Dibuka 24 Jam', location: 'Website Resmi & Sekretariat PPDB', status: 'Segera Dibuka' }
  ];

  await prisma.agenda.deleteMany({});
  for (const ag of agendasData) {
    await prisma.agenda.create({ data: ag });
  }

  // ----------------------------------------------------
  // 9. ACHIEVEMENTS (Seeded per unit: SMA, Pesantren, SMP, Diniyah)
  // ----------------------------------------------------
  console.log('➡️ Seeding Achievements for all 4 units...');
  const unitPesantren = await prisma.educationUnit.findUnique({ where: { code: 'pesantren' } });
  const unitSMP = await prisma.educationUnit.findUnique({ where: { code: 'smp' } });
  const unitSMA = await prisma.educationUnit.findUnique({ where: { code: 'sma' } });
  const unitDiniyah = await prisma.educationUnit.findUnique({ where: { code: 'diniyah' } });

  const achievementsData = [
    // SMA
    { badge: 'Juara 1', category: 'Olimpiade Sains Nasional Bidang Kimia', title: 'Medali Emas Olimpiade Sains Nasional 2026', year: '2026', winner: 'Siswa SMA Cendekia Amanah', imageUrl: '/uploads/units/juara1.jpg', unitId: unitSMA?.id ?? null, sortOrder: 1 },
    { badge: 'Juara 1', category: 'Lomba Pramuka Tingkat Nasional', title: 'Regu Terbaik Pionering & Navigasi', year: '2026', winner: 'Regu Pramuka SMA Cendekia', imageUrl: '/uploads/units/juara4.jpg', unitId: unitSMA?.id ?? null, sortOrder: 2 },
    { badge: 'Juara Harapan 1', category: 'Lomba Karya Tulis Ilmiah Islami (LKTI)', title: 'Riset Bioplastik Ramah Lingkungan', year: '2026', winner: 'Tim Riset SMA Cendekia', imageUrl: '/uploads/units/juara6.jpg', unitId: unitSMA?.id ?? null, sortOrder: 3 },
    { badge: 'Juara 2', category: 'Kompetisi Inovasi STEAM & Coding Nasional', title: 'Aplikasi IoT Pertanian Cerdas Mandiri', year: '2025', winner: 'Tim STEAM SMA Cendekia', imageUrl: '/uploads/units/juara1.jpg', unitId: unitSMA?.id ?? null, sortOrder: 4 },

    // Pesantren
    { badge: 'Juara 1', category: 'MTQ Tingkat Provinsi Jawa Barat', title: 'Juara 1 Cabang Tilawah Remaja', year: '2026', winner: 'Santri Pesantren Cendekia Amanah', imageUrl: '/uploads/units/juara2.jpg', unitId: unitPesantren?.id ?? null, sortOrder: 5 },
    { badge: 'Juara 2', category: 'Olimpiade Bahasa Arab Tingkat Nasional', title: 'Pidato & Debat Bahasa Arab Fushah', year: '2026', winner: 'Santri Pesantren Cendekia Amanah', imageUrl: '/uploads/units/juara7.jpeg', unitId: unitPesantren?.id ?? null, sortOrder: 6 },
    { badge: 'Juara 1', category: 'Musabaqah Hifdzil Qur’an (MHQ) 30 Juz', title: 'Hafalan Al-Qur’an Mutqin Bersanad', year: '2025', winner: 'Santri Tahfidz Pesantren', imageUrl: '/uploads/units/juara2.jpg', unitId: unitPesantren?.id ?? null, sortOrder: 7 },
    { badge: 'Juara 2', category: 'Musabaqah Qira’atil Kutub (MQK) Provinsi', title: 'Baca & Terjemah Kitab Fathul Qorib', year: '2025', winner: 'Santri Dirasah Islamiyah', imageUrl: '/uploads/units/juara7.jpeg', unitId: unitPesantren?.id ?? null, sortOrder: 8 },

    // SMP
    { badge: 'Juara 2', category: 'Lomba Robotik Nasional Tingkat Madya', title: 'Inovasi Robotik Pemilah Sampah Otomatis', year: '2026', winner: 'Tim Robotik SMP Cendekia', imageUrl: '/uploads/units/juara3.jpg', unitId: unitSMP?.id ?? null, sortOrder: 9 },
    { badge: 'Juara 3', category: 'National Robotic Championship', title: 'Line Follower Autonomous Microcontroller', year: '2026', winner: 'Siswa SMP Cendekia Amanah', imageUrl: '/uploads/units/juara5.jpeg', unitId: unitSMP?.id ?? null, sortOrder: 10 },
    { badge: 'Juara 1', category: 'Olimpiade Matematika & Sains Islam Terpadu', title: 'Medali Emas Bidang Matematika Tingkat Nasional', year: '2025', winner: 'Siswa SMP Cendekia', imageUrl: '/uploads/units/juara3.jpg', unitId: unitSMP?.id ?? null, sortOrder: 11 },
    { badge: 'Juara 2', category: 'English Speech & Story Telling Contest', title: 'Lomba Pidato Bahasa Inggris se-Jabodetabek', year: '2025', winner: 'Siswa Bilingual SMP', imageUrl: '/uploads/units/juara5.jpeg', unitId: unitSMP?.id ?? null, sortOrder: 12 },

    // Madrasah Diniyah
    { badge: 'Juara 1', category: 'Lomba Tahfidz Juz ‘Amma & Tartil Al-Qur’an', title: 'Festival Santri Cilik Se-Kota Depok', year: '2026', winner: 'Santri Cilik Madrasah Diniyah', imageUrl: '/uploads/units/juara2.jpg', unitId: unitDiniyah?.id ?? null, sortOrder: 13 },
    { badge: 'Juara 2', category: 'Pildacil & Da’i Cilik Islami Tingkat Kota', title: 'Pidato Dai Cilik Bertema Akhlak Mulia', year: '2026', winner: 'Santri Madrasah Diniyah', imageUrl: '/uploads/units/juara7.jpeg', unitId: unitDiniyah?.id ?? null, sortOrder: 14 },
    { badge: 'Juara 1', category: 'Lomba Cerdas Cermat Diniyah Takmiliyah', title: 'Fiqih Ibadah & Sejarah Kebudayaan Islam', year: '2025', winner: 'Regu Cerdas Cermat Diniyah', imageUrl: '/uploads/units/juara4.jpg', unitId: unitDiniyah?.id ?? null, sortOrder: 15 },
    { badge: 'Juara 3', category: 'Festival Seni Kaligrafi Islam Tingkat Dasar', title: 'Penulisan Khath Naskhi Santri Diniyah', year: '2025', winner: 'Santri Diniyah Cendekia', imageUrl: '/uploads/units/juara6.jpg', unitId: unitDiniyah?.id ?? null, sortOrder: 16 }
  ];

  await prisma.achievement.deleteMany({});
  for (const ach of achievementsData) {
    await prisma.achievement.create({ data: ach });
  }

  // ----------------------------------------------------
  // 10. GALLERY (ALL 6 items exact from gallery.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding ALL 6 Gallery Items...');
  const galleryItemsData = [
    { title: 'Suasana Belajar dan Mengaji Santri di Masjid', category: 'pesantren', imageUrl: '/uploads/gallery/pesantren1.png', sortOrder: 1 },
    { title: 'Praktikum Sains & Eksperimen Siswa SMP', category: 'smp', imageUrl: '/uploads/gallery/smp2.png', sortOrder: 2 },
    { title: 'Diskusi Kelompok & Riset Siswa SMA', category: 'sma', imageUrl: '/uploads/gallery/sma1.png', sortOrder: 3 },
    { title: 'Halaqah Al-Qur’an Santri Madrasah Diniyah', category: 'diniyah', imageUrl: '/uploads/gallery/madrasah1.png', sortOrder: 4 },
    { title: 'Kegiatan Perkemahan Pramuka & Kepanduan', category: 'sma', imageUrl: '/uploads/gallery/sma5.png', sortOrder: 5 },
    { title: 'Kebersamaan Santri di Asrama Pesantren', category: 'pesantren', imageUrl: '/uploads/gallery/pesantren5.png', sortOrder: 6 }
  ];

  await prisma.galleryItem.deleteMany({});
  for (const item of galleryItemsData) {
    await prisma.galleryItem.create({ data: item });
  }

  // ----------------------------------------------------
  // 11. TESTIMONIALS (ALL 3 items exact from testimonials.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding ALL 3 Testimonials...');
  const testimonialsData = [
    {
      author: 'Bapak Andi Pratama',
      role: 'Wali Santri SMP & Pesantren',
      category: 'Orang Tua Santri',
      content:
        'Sekolah ini sangat amanah dan mampu mendidik anak-anak kami menjadi pribadi yang berakhlak mulia, disiplin, dan berprestasi. Perkembangan hafalan Al-Qur’an dan kemandirian ananda sangat membahagiakan kami.',
      avatar: '/uploads/guru/guru5.png',
      sortOrder: 1
    },
    {
      author: 'Ahmad Fauzan, S.T.',
      role: 'Alumni SMA Cendekia Amanah 2021 (Kini Software Engineer)',
      category: 'Alumni',
      content:
        'Ilmu, adab, dan tempaan kepemimpinan yang saya dapatkan selama berasrama di Cendekia Amanah menjadi bekal utama saya menembus PTN impian dan berkarir profesional dengan percaya diri.',
      avatar: '/uploads/guru/guru6.png',
      sortOrder: 2
    },
    {
      author: 'Prof. Dr. H. Nasaruddin Umar, MA',
      role: 'Imam Besar Masjid Istiqlal / Menteri Agama RI',
      category: 'Tokoh Pendidikan',
      content:
        'Cendekia Amanah adalah lembaga pendidikan Islam terpadu yang memadukan kedalaman spiritualitas kepesantrenan dengan kecerdasan sains modern. Sangat layak menjadi teladan dan rujukan umat.',
      avatar: '/uploads/guru/guru7.png',
      sortOrder: 3
    }
  ];

  await prisma.testimonial.deleteMany({});
  for (const t of testimonialsData) {
    await prisma.testimonial.create({ data: t });
  }

  // ----------------------------------------------------
  // 12. PARTNERS (ALL 8 items exact from partners.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding ALL 8 Partners...');
  const partnersData = [
    { name: 'Kementerian Agama RI', logo: '/uploads/partners/kemenag.png', sortOrder: 1 },
    { name: 'Majelis Ulama Indonesia (MUI)', logo: '/uploads/partners/mui.png', sortOrder: 2 },
    { name: 'Badan Amil Zakat Nasional (BAZNAS)', logo: '/uploads/partners/baznas.png', sortOrder: 3 },
    { name: 'Forum Zakat (FOZ)', logo: '/uploads/partners/foz.png', sortOrder: 4 },
    { name: 'ESQ Leadership Center', logo: '/uploads/partners/esq.svg', sortOrder: 5 },
    { name: 'Rumah Zakat', logo: '/uploads/partners/rumah-zakat.png', sortOrder: 6 },
    { name: 'Bank Indonesia', logo: '/uploads/partners/bi.png', sortOrder: 7 },
    { name: 'Askrindo Syariah', logo: '/uploads/partners/askrindo.png', sortOrder: 8 }
  ];

  await prisma.partner.deleteMany({});
  for (const p of partnersData) {
    await prisma.partner.create({ data: p });
  }

  // ----------------------------------------------------
  // 13. BROCHURES (ALL 4 items exact from brochures.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding ALL 4 Brochures...');
  const brochuresData = [
    { unitName: 'SMA Cendekia Amanah', title: 'SMA Cendekia Amanah', fileSize: '3.4 MB', fileUrl: '#', academicYear: '2027/2028', status: BrochureStatus.AVAILABLE, sortOrder: 1 },
    { unitName: 'Madrasah Diniyah (MDTA)', title: 'Madrasah Diniyah (MDTA)', fileSize: '2.1 MB', fileUrl: '#', academicYear: '2026/2027', status: BrochureStatus.AVAILABLE, sortOrder: 2 },
    { unitName: 'SMP Cendekia Amanah', title: 'SMP Cendekia Amanah', fileSize: 'Segera', fileUrl: '#', academicYear: '2027/2028', status: BrochureStatus.COMING_SOON, sortOrder: 3 },
    { unitName: 'Pesantren Cendekia Amanah', title: 'Pesantren Cendekia Amanah', fileSize: 'Sedang Disiapkan', fileUrl: '#', academicYear: '2027/2028', status: BrochureStatus.COMING_SOON, sortOrder: 4 }
  ];

  await prisma.brochure.deleteMany({});
  for (const b of brochuresData) {
    await prisma.brochure.create({ data: b });
  }

  // ----------------------------------------------------
  // 14. FAQS (ALL 4 items exact from faq.ts)
  // ----------------------------------------------------
  console.log('➡️ Seeding ALL 4 FAQs...');
  const faqsData = [
    {
      question: 'Kapan pendaftaran PPDB dibuka?',
      answer:
        'Penerimaan Peserta Didik Baru (PPDB) Gelombang I dibuka periode Januari – Maret, Gelombang II dibuka April – Juni (atau hingga kuota per kelas terpenuhi). Pendaftaran dapat dilakukan secara online melalui website ini atau langsung di sekretariat panitia.',
      sortOrder: 1
    },
    {
      question: 'Apakah santri wajib mondok / berasrama?',
      answer:
        'Untuk unit Pesantren wajib mengikuti sistem asrama (boarding penuh 24 jam). Sedangkan untuk unit SMP Cendekia Amanah dan SMA Cendekia Amanah, orang tua dapat memilih antara program Boarding (asrama) maupun Fullday School (pulang sore).',
      sortOrder: 2
    },
    {
      question: 'Berapa rincian biaya pendidikan dan infaq masuk?',
      answer:
        'Rincian uang pangkal, infaq gedung, seragam, dan SPP bulanan bervariasi sesuai unit yang dipilih. Informasi lengkap dapat diunduh pada menu "Unduh Brosur" atau dengan menghubungi layanan WhatsApp Customer Care panitia SPMB.',
      sortOrder: 3
    },
    {
      question: 'Apakah tersedia program beasiswa santri berprestasi?',
      answer:
        'Ya, Pesantren Cendekia Amanah menyediakan beberapa skema beasiswa: Beasiswa Tahfidz Al-Qur’an (minimal 5 juz mutqin), Beasiswa Juara Olimpiade Sains/MTQ, serta Beasiswa Afirmasi Yatim/Dhuafa berprestasi melalui seleksi administrasi dan tes kelayakan.',
      sortOrder: 4
    }
  ];

  await prisma.faq.deleteMany({});
  for (const f of faqsData) {
    await prisma.faq.create({ data: f });
  }

  console.log('✅ 100% Comprehensive database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
