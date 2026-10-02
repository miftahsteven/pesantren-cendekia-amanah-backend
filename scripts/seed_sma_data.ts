import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SMA Sambutan & Kalender Akademik...');

  // 1. Find SMA Unit
  const smaUnit = await prisma.educationUnit.findFirst({
    where: {
      OR: [
        { code: 'SMA' },
        { slug: 'sma' }
      ]
    }
  });

  if (!smaUnit) {
    console.error('Unit SMA not found!');
    return;
  }

  console.log('Found SMA Unit:', smaUnit.id, smaUnit.name);

  // 2. Update Sambutan Kepala Unit SMA
  await prisma.educationUnit.update({
    where: { id: smaUnit.id },
    data: {
      welcomeName: 'Dr. H. Muhammad Ilyas, M.Ag.',
      welcomeRole: 'Kepala Sekolah SMA Cendekia Amanah',
      welcomePhoto: '/uploads/gallery/guru1.png',
      welcomeQuote: 'Mempersiapkan Generasi Pemimpin Muslim yang Unggul Akademik, Berkarakter Qurani, dan Siap Bersaing di Perguruan Tinggi Terbaik Dunia.',
      welcomeMessage: `Assalamu’alaikum Warahmatullahi Wabarakatuh.

Selamat datang di Sekolah Menengah Atas (SMA) Cendekia Amanah. Pendidikan tingkat menengah atas adalah fase krusial dalam menempa kematangan berpikir, kedalaman spiritual, dan kesiapan para santri menuju gerbang perguruan tinggi bergengsi serta kepemimpinan global.

Di SMA Cendekia Amanah, kami memadukan keunggulan Kurikulum Nasional Merdeka dengan program bimbingan intensif tembus PTN Favorit (SNBP, SNBT/UTBK, Kedokteran/Teknik), persiapan beasiswa internasional (Timur Tengah, Eropa, Asia), pendalaman riset ilmiah remaja (KIR), dan pemantapan hafalan Al-Qur'an bersanad.

Didukung oleh dewan asatidz dan pendidik lulusan universitas ternama serta fasilitas laboratorium dan digital learning modern, kami senantiasa mendampingi setiap santri untuk meraih potensi tertingginya menjadi pribadi yang berilmu, beradab, dan siap memimpin masa depan.

Wassalamu’alaikum Warahmatullahi Wabarakatuh.`
    }
  });
  console.log('Successfully updated SMA Sambutan Kepala Unit.');

  // 3. Delete existing agendas for SMA to avoid duplicates
  await prisma.agenda.deleteMany({
    where: { unitId: smaUnit.id }
  });

  // 4. Create 8 dummy academic calendar events for SMA
  const sampleAgendas = [
    {
      unitId: smaUnit.id,
      title: 'Workshop Strategi Tembus SNBP & Pemetaan Jurusan PTN',
      category: 'Persiapan PTN',
      eventDate: '2026-10-03',
      day: '03',
      month: 'Oktober',
      year: '2026',
      time: '08:30 - 12:00 WIB',
      location: 'Auditorium Utama & Ruang Konseling Karir',
      description: 'Analisis nilai rapor berkala, strategi pemilihan prodi unggulan (UI, ITB, UGM, Unair, ITS), dan konsultasi peminatan karir siswa kelas XII.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    },
    {
      unitId: smaUnit.id,
      title: 'Penilaian Tengah Semester (PTS) Ganjil TP 2026/2027',
      category: 'Ujian',
      eventDate: '2026-10-06',
      day: '06',
      month: 'Oktober',
      year: '2026',
      time: '07:30 - 13:00 WIB',
      location: 'Ruang Ujian CBT Lantai 2 & 3',
      description: 'Evaluasi formatif tengah semester mata pelajaran peminatan sains, humaniora, dan dirasah kepesantrenan berbasis Computer-Based Test.',
      status: 'Mendatang',
      isFeatured: false,
      isActive: true
    },
    {
      unitId: smaUnit.id,
      title: 'Expo Riset Ilmiah Remaja & Presentasi Karya Tulis (KTI)',
      category: 'Riset & Sains',
      eventDate: '2026-10-17',
      day: '17',
      month: 'Oktober',
      year: '2026',
      time: '08:00 - 15:30 WIB',
      location: 'Science Center & Exhibition Hall',
      description: 'Pameran hasil penelitian karya ilmiah remaja (KIR) bidang bioteknologi, energi terbarukan, sosial humaniora, dan teknologi tepat guna.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    },
    {
      unitId: smaUnit.id,
      title: 'Peringatan Hari Santri Nasional: Orasi Ilmiah & Bedah Buku',
      category: 'Peringatan',
      eventDate: '2026-10-22',
      day: '22',
      month: 'Oktober',
      year: '2026',
      time: '08:00 - 12:30 WIB',
      location: 'Masjid Jami’ Cendekia Amanah',
      description: 'Upacara peringatan Hari Santri Nasional, orasi kebangsaan santri milenial, dan bedah karya literasi keislaman bersama narasumber nasional.',
      status: 'Mendatang',
      isFeatured: false,
      isActive: true
    },
    {
      unitId: smaUnit.id,
      title: 'Try Out Akbar UTBK-SNBT Nasional Sesi 1',
      category: 'Try Out UTBK',
      eventDate: '2026-11-04',
      day: '04',
      month: 'November',
      year: '2026',
      time: '07:30 - 12:00 WIB',
      location: 'Laboratorium Komputer CBT & Aula SMA',
      description: 'Simulasi ujian seleksi nasional berbasis tes (SNBT) bekerjasama dengan lembaga bimbel nasional dengan analisis skor IRT (Item Response Theory).',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    },
    {
      unitId: smaUnit.id,
      title: 'Campus Fair & Sharing Beasiswa Luar Negeri',
      category: 'Bimbingan Karir',
      eventDate: '2026-11-12',
      day: '12',
      month: 'November',
      year: '2026',
      time: '09:00 - 15:00 WIB',
      location: 'Hall Pertemuan & Virtual Hybrid',
      description: 'Sosialisasi beasiswa Al-Azhar Mesir, Turki Burslari, Monbukagakusho Jepang, serta beasiswa kedinasan bersama para alumni SMA.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    },
    {
      unitId: smaUnit.id,
      title: 'Tasmi’ Akbar Al-Qur’an & Ujian Hafalan Mutqin Tingkat SMA',
      category: 'Tahfidz',
      eventDate: '2026-11-21',
      day: '21',
      month: 'November',
      year: '2026',
      time: '05:30 - 12:00 WIB',
      location: 'Masjid Utama Cendekia Amanah',
      description: 'Ujian tasmi’ sekali duduk 5 s.d. 10 Juz santri SMA di hadapan tim penguji lajnah tahfidz dan orang tua santri.',
      status: 'Mendatang',
      isFeatured: false,
      isActive: true
    },
    {
      unitId: smaUnit.id,
      title: 'Penilaian Akhir Semester (PAS) Ganjil TP 2026/2027',
      category: 'Ujian',
      eventDate: '2026-11-28',
      day: '28',
      month: 'November',
      year: '2026',
      time: '07:30 - 13:30 WIB',
      location: 'Gedung Kelas SMA Cendekia Amanah',
      description: 'Pelaksanaan ujian akhir semester ganjil seluruh mata pelajaran kurikulum merdeka, peminatan rumpun ilmu, dan kurikulum diniyah.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    }
  ];

  for (const item of sampleAgendas) {
    await prisma.agenda.create({ data: item });
  }

  console.log(`Successfully created ${sampleAgendas.length} academic calendar events for SMA.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
