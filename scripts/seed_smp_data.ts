import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SMP Sambutan & Kalender Akademik...');

  // 1. Find SMP Unit
  const smpUnit = await prisma.educationUnit.findFirst({
    where: {
      OR: [
        { code: 'SMP' },
        { slug: 'smp' }
      ]
    }
  });

  if (!smpUnit) {
    console.error('Unit SMP not found!');
    return;
  }

  console.log('Found SMP Unit:', smpUnit.id, smpUnit.name);

  // 2. Update Sambutan Kepala Unit SMP
  await prisma.educationUnit.update({
    where: { id: smpUnit.id },
    data: {
      welcomeName: 'Ust. Sodik, SQ., S.Ud., ME., Gr',
      welcomeRole: 'Kepala Sekolah SMP Cendekia Amanah',
      welcomePhoto: '/uploads/gallery/kartu-unit-pendidikan-ustadz-sodik-smp-pesantren-cendekia-amanah-1790831920585.jpg',
      welcomeQuote: 'Membimbing Generasi Remaja Berkarakter Qurani, Berprestasi Akademik, dan Berwawasan Global di Era Digital.',
      welcomeMessage: `Assalamu’alaikum Warahmatullahi Wabarakatuh.

Selamat datang di Sekolah Menengah Pertama (SMP) Cendekia Amanah. Kami berkomitmen untuk menghadirkan ekosistem pendidikan yang memadukan keunggulan akademik Kurikulum Nasional Merdeka dengan kedalaman nilai-nilai Islam, Al-Qur'an, dan pembentukan adab santri.

Di SMP Cendekia Amanah, setiap siswa didampingi untuk menemukan potensi terbaiknya melalui pembelajaran interaktif berbasis digital smart classroom, pembiasaan hafalan Al-Qur'an bersanad, pembinaan karakter kemandirian santri, serta penguasaan bahasa internasional (Arab & Inggris). Kami percaya bahwa masa transisi remaja adalah fase emas untuk menanamkan pondasi aqidah yang kokoh sekaligus mengasah nalar kritis dan daya cipta inovatif.

Bersama para pendidik yang berdedikasi dan fasilitas pendukung yang memadai, kami siap membersamai putra-putri Anda menjadi pribadi yang bertaqwa, cerdas, berprestasi, dan siap memimpin masa depan peradaban Islam.

Wassalamu’alaikum Warahmatullahi Wabarakatuh.`
    }
  });
  console.log('Successfully updated SMP Sambutan Kepala Unit.');

  // 3. Delete existing agendas for SMP to avoid duplicates
  await prisma.agenda.deleteMany({
    where: { unitId: smpUnit.id }
  });

  // 4. Create 8 dummy academic calendar events for SMP
  const sampleAgendas = [
    {
      unitId: smpUnit.id,
      title: 'Penilaian Tengah Semester (PTS) Ganjil',
      category: 'Ujian',
      eventDate: '2026-10-05',
      day: '05',
      month: 'Oktober',
      year: '2026',
      time: '07:30 - 12:30 WIB',
      location: 'Ruang Kelas SMP & Lab CBT',
      description: 'Evaluasi capaian pembelajaran pertengahan semester ganjil berbasis Computer-Based Test (CBT) dan asesmen portofolio.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    },
    {
      unitId: smpUnit.id,
      title: 'Outing Class & Observasi Ekologi Lingkungan',
      category: 'Kegiatan Siswa',
      eventDate: '2026-10-12',
      day: '12',
      month: 'Oktober',
      year: '2026',
      time: '08:00 - 15:00 WIB',
      location: 'Kebun Raya & Agrowisata Sains',
      description: 'Pembelajaran kontekstual sains dan eksplorasi ekosistem alam terbuka untuk santri kelas 7 & 8.',
      status: 'Mendatang',
      isFeatured: false,
      isActive: true
    },
    {
      unitId: smpUnit.id,
      title: 'Peringatan Hari Santri Nasional & Gelar Karya P5',
      category: 'Peringatan',
      eventDate: '2026-10-22',
      day: '22',
      month: 'Oktober',
      year: '2026',
      time: '07:00 - 13:00 WIB',
      location: 'Lapangan Utama Cendekia Amanah',
      description: 'Upacara bendera Hari Santri, pameran hasil projek penguatan profil pelajar Pancasila & pentas seni santri SMP.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    },
    {
      unitId: smpUnit.id,
      title: 'Simulasi Asesmen Nasional Berbasis Komputer (ANBK)',
      category: 'Akademik',
      eventDate: '2026-10-28',
      day: '28',
      month: 'Oktober',
      year: '2026',
      time: '08:00 - 11:30 WIB',
      location: 'Lab Komputer SMP',
      description: 'Simulasi kesiapan perangkat server dan literasi-numerasi ANBK untuk siswa kelas 8 SMP Cendekia Amanah.',
      status: 'Mendatang',
      isFeatured: false,
      isActive: true
    },
    {
      unitId: smpUnit.id,
      title: 'Pekan Olahraga & Seni Santri (Class Meeting)',
      category: 'Kesiswaan',
      eventDate: '2026-11-07',
      day: '07',
      month: 'November',
      year: '2026',
      time: '08:00 - 16:00 WIB',
      location: 'Sport Hall Cendekia Amanah',
      description: 'Kompetisi antar-kelas: futsal, panahan, hadrah banjari, english speech contest, dan olimpiade sains internal.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    },
    {
      unitId: smpUnit.id,
      title: 'Parenting Day & Pembagian Laporan Perkembangan Siswa',
      category: 'Wali Murid',
      eventDate: '2026-11-14',
      day: '14',
      month: 'November',
      year: '2026',
      time: '09:00 - 12:00 WIB',
      location: 'Auditorium Al-Amanah & Hybrid Zoom',
      description: 'Sinergi dewan guru dan orang tua dalam mendampingi tumbuh kembang dan adab remaja di era keterbukaan informasi.',
      status: 'Mendatang',
      isFeatured: false,
      isActive: true
    },
    {
      unitId: smpUnit.id,
      title: 'Tasmi’ Al-Qur’an Akbar Sekali Duduk (Juz 28, 29, 30)',
      category: 'Tahfidz',
      eventDate: '2026-11-23',
      day: '23',
      month: 'November',
      year: '2026',
      time: '05:30 - 11:30 WIB',
      location: 'Masjid Utama Pesantren Cendekia Amanah',
      description: 'Ujian tasmi’ hafalan Al-Qur’an terbuka sekali duduk di hadapan dewan asatidz musyrif tahfidz dan wali santri.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    },
    {
      unitId: smpUnit.id,
      title: 'Penilaian Akhir Semester (PAS) Ganjil TP 2026/2027',
      category: 'Ujian',
      eventDate: '2026-11-30',
      day: '30',
      month: 'November',
      year: '2026',
      time: '07:30 - 13:00 WIB',
      location: 'Gedung Kelas SMP Cendekia Amanah',
      description: 'Pelaksanaan ujian akhir semester ganjil seluruh mata pelajaran kurikulum nasional dan kurikulum pesantren.',
      status: 'Mendatang',
      isFeatured: true,
      isActive: true
    }
  ];

  for (const item of sampleAgendas) {
    await prisma.agenda.create({ data: item });
  }

  console.log(`Successfully created ${sampleAgendas.length} academic calendar events for SMP.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
