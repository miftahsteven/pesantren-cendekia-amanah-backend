const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedOrganizations() {
  const units = await prisma.educationUnit.findMany({ select: { id: true, slug: true, name: true } });
  console.log('Available units:', units);

  const smp = units.find(u => u.slug === 'smp');
  const sma = units.find(u => u.slug === 'sma');

  if (!smp || !sma) {
    console.error('SMP or SMA not found');
    return;
  }

  const count = await prisma.unitOrganization.count();
  console.log('Existing organization members:', count);

  if (count === 0) {
    const smpMembers = [
      {
        unitId: smp.id,
        name: 'Ust. H. Nurul Huda, S.Pd.I., M.Pd.',
        position: 'Kepala Sekolah SMP Cendekia',
        category: 'Pimpinan & Manajemen',
        level: 1,
        photoUrl: '/uploads/gallery/guru1.png',
        nip: 'NIY. 20180901001',
        education: 'S2 Manajemen Pendidikan Islam - UIN Syarif Hidayatullah',
        bio: 'Berpengalaman lebih dari 15 tahun dalam manajemen pendidikan terpadu dan pembinaan akhlak santri usia remaja.',
        sortOrder: 1,
        isActive: true
      },
      {
        unitId: smp.id,
        name: 'Ustz. Siti Rahmah, S.Pd., Gr.',
        position: 'Wakil Kepala Bidang Kurikulum',
        category: 'Pimpinan & Manajemen',
        level: 2,
        photoUrl: '/uploads/gallery/guru2.png',
        nip: 'NIY. 20190701015',
        education: 'S1 Pendidikan Matematika - Universitas Negeri Jakarta (UNJ)',
        bio: 'Pengembang kurikulum integrasi Sains & Tahfidz serta koordinator program Olimpiade Sains Nasional (OSN).',
        sortOrder: 2,
        isActive: true
      },
      {
        unitId: smp.id,
        name: 'Ust. Muhammad Rizki, S.Kom., M.T.',
        position: 'Wakil Kepala Bidang Kesiswaan & IT',
        category: 'Pimpinan & Manajemen',
        level: 2,
        photoUrl: '/uploads/gallery/guru3.png',
        nip: 'NIY. 20200801024',
        education: 'S2 Informatika - Institut Teknologi Bandung (ITB)',
        bio: 'Pembina kegiatan ekstrakurikuler robotik, coding santri, dan kedisiplinan asrama putra.',
        sortOrder: 3,
        isActive: true
      },
      {
        unitId: smp.id,
        name: 'Ust. Ahmad Fauzan, Lc., M.Ag.',
        position: 'Koordinator Tahfidz & Bahasa Arab',
        category: 'Dewan Guru & Pengajar',
        level: 3,
        photoUrl: '/uploads/gallery/guru4.png',
        nip: 'NIY. 20190101008',
        education: 'S1 Al-Azhar University Kairo, S2 Ilmu Al-Qur\'an',
        bio: 'Pengampu Tahsin bersanad Jazariyah, pembimbing mutqin 30 juz santri SMP.',
        sortOrder: 4,
        isActive: true
      },
      {
        unitId: smp.id,
        name: 'Ustz. Dewi Lestari, S.Si., M.Pd.',
        position: 'Guru IPA & Pembina Riset Junior',
        category: 'Dewan Guru & Pengajar',
        level: 3,
        photoUrl: '/uploads/gallery/guru5.png',
        nip: 'NIY. 20210701032',
        education: 'S1 Biologi - Universitas Indonesia',
        bio: 'Membimbing riset sains lingkungan santri dan praktikum laboratorium terpadu.',
        sortOrder: 5,
        isActive: true
      },
      {
        unitId: smp.id,
        name: 'Ust. Farhan Pratama, S.Pd.',
        position: 'Wali Kelas VII & Guru Bahasa Inggris',
        category: 'Wali Kelas & Kesiswaan',
        level: 3,
        photoUrl: '/uploads/gallery/guru6.png',
        nip: 'NIY. 20220801041',
        education: 'S1 Pendidikan Bahasa Inggris - UPI Bandung',
        bio: 'Mentor program English Camp & Native Speaking Practice santri baru.',
        sortOrder: 6,
        isActive: true
      }
    ];

    const smaMembers = [
      {
        unitId: sma.id,
        name: 'Dr. H. Muhammad Ilyas, M.Ag.',
        position: 'Kepala Sekolah SMA Cendekia',
        category: 'Pimpinan & Manajemen',
        level: 1,
        photoUrl: '/uploads/gallery/guru1.png',
        nip: 'NIY. 20170801002',
        education: 'Doktor Manajemen Pendidikan Islam - Pascasarjana UIN',
        bio: 'Fokus pada kepemimpinan transformasional, keunggulan riset, dan kelulusan santri ke PTN Favorit serta Luar Negeri.',
        sortOrder: 1,
        isActive: true
      },
      {
        unitId: sma.id,
        name: 'Ust. Bambang Kurniawan, M.Si.',
        position: 'Wakil Kepala Bidang Kurikulum & PTN',
        category: 'Pimpinan & Manajemen',
        level: 2,
        photoUrl: '/uploads/gallery/guru2.png',
        nip: 'NIY. 20180701011',
        education: 'Magister Fisika Terapan - Institut Teknologi Sepuluh Nopember (ITS)',
        bio: 'Koordinator bimbingan intensif UTBK-SNBT dan seleksi beasiswa internasional (Timur Tengah, Turki, Eropa).',
        sortOrder: 2,
        isActive: true
      },
      {
        unitId: sma.id,
        name: 'Ustz. Dra. Hj. Nurul Inayah, M.Pd.',
        position: 'Wakil Kepala Bidang Kesiswaan & Kedisiplinan',
        category: 'Pimpinan & Manajemen',
        level: 2,
        photoUrl: '/uploads/gallery/guru3.png',
        nip: 'NIY. 20180901019',
        education: 'S2 Bimbingan & Konseling Remaja - UNJ',
        bio: 'Pendamping psikologis, pembina organisasi santri (OSIS/IPNU/IPPNU), dan keputrian.',
        sortOrder: 3,
        isActive: true
      },
      {
        unitId: sma.id,
        name: 'Ust. Dr. Arif Rahman Hakim, Lc., M.H.I.',
        position: 'Koordinator Kajian Turats & Bahtsul Masail',
        category: 'Dewan Guru & Pengajar',
        level: 3,
        photoUrl: '/uploads/gallery/guru4.png',
        nip: 'NIY. 20190101007',
        education: 'Doktor Syariah & Hukum Islam - UIN Sunan Kalijaga',
        bio: 'Pengampu kitab Fathul Qorib, Fathul Mu\'in, dan metodologi istinbath hukum Islam modern.',
        sortOrder: 4,
        isActive: true
      },
      {
        unitId: sma.id,
        name: 'Ustz. Ratna Sari, S.Kom., M.Cs.',
        position: 'Guru Sains Komputer & AI Literacy',
        category: 'Dewan Guru & Pengajar',
        level: 3,
        photoUrl: '/uploads/gallery/guru5.png',
        nip: 'NIY. 20210801037',
        education: 'S2 Ilmu Komputer - Universitas Gadjah Mada (UGM)',
        bio: 'Pengajar Web Development, Python Data Science, dan pembimbing Lomba Karya Ilmiah Remaja (LKIR).',
        sortOrder: 5,
        isActive: true
      },
      {
        unitId: sma.id,
        name: 'Ust. Hendra Wijaya, S.Pd.',
        position: 'Wali Kelas XII & Guru Sosiologi',
        category: 'Wali Kelas & Kesiswaan',
        level: 3,
        photoUrl: '/uploads/gallery/guru6.png',
        nip: 'NIY. 20200801028',
        education: 'S1 Pendidikan Sosiologi - Universitas Negeri Malang',
        bio: 'Wali kelas sukses mengantarkan santri angkatan kelulusan ke berbagai universitas negeri favorit.',
        sortOrder: 6,
        isActive: true
      }
    ];

    for (const m of smpMembers) {
      await prisma.unitOrganization.create({ data: m });
    }
    for (const m of smaMembers) {
      await prisma.unitOrganization.create({ data: m });
    }
    console.log('✅ Seeded 12 organization members for SMP & SMA successfully!');
  }
}

seedOrganizations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
