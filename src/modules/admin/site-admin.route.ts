import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { requireAdminAuth, recordAuditLog } from '../../common/utils/admin-auth.js';

export async function adminSiteRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdminAuth);

  // GET /api/v1/admin/site/settings
  fastify.get('/admin/site/settings', async () => {
    let settings = await prisma.siteSetting.findFirst();
    if (!settings) {
      settings = await prisma.siteSetting.create({
        data: {
          siteName: 'Pesantren Cendekia Amanah',
          siteTagline: 'LEMBAGA PENDIDIKAN TERPADU',
          subTagline: 'Mencetak Generasi Qurani, Berprestasi, Berjiwa Pemimpin',
          siteDescription: 'Pesantren Cendekia Amanah mengintegrasikan nilai-nilai kepesantrenan dengan kurikulum nasional modern.',
          motto: 'Mencetak Generasi Qurani, Berprestasi, dan Berjiwa Pemimpin',
          leaderName: 'KH. Cholil Nafis, Lc., MA., Ph.D',
          leaderRole: 'Pengasuh Pesantren Cendekia Amanah',
          leaderTitle: 'Ketua MUI Bidang Dakwah & Ukhuwah / Dosen Pascasarjana UI',
          leaderPhotoUrl: '/uploads/guru/leader.png',
          phone: '+62 857-7644-6468',
          whatsapp: '6285776446468',
          email: 'sekretariat@cendekiaamanah.sch.id',
          addressText: 'Jl. Raya Cendekia No. 1, Kalimulya, Cilodong, Kota Depok, Jawa Barat 16413',
          mapsLink: 'https://maps.google.com/?q=Pesantren+Cendekia+Amanah',
          mapsEmbedUrl: 'https://www.google.com/maps/embed?...'
        }
      });
    }

    return {
      success: true,
      data: settings
    };
  });

  // PUT /api/v1/admin/site/settings
  fastify.put('/admin/site/settings', async (req) => {
    const body = req.body as any;
    let settings = await prisma.siteSetting.findFirst();

    if (settings) {
      settings = await prisma.siteSetting.update({
        where: { id: settings.id },
        data: {
          siteName: body.siteName,
          siteTagline: body.siteTagline,
          subTagline: body.subTagline,
          siteDescription: body.siteDescription,
          motto: body.motto,
          leaderName: body.leaderName,
          leaderRole: body.leaderRole,
          leaderTitle: body.leaderTitle,
          leaderPhotoUrl: body.leaderPhotoUrl,
          leaderQuotes: body.leaderQuotes,
          phone: body.phone,
          whatsapp: body.whatsapp,
          email: body.email,
          addressText: body.addressText,
          mapsLink: body.mapsLink,
          consultationUrl: body.consultationUrl,
          virtualTourUrl: body.virtualTourUrl,
          logoUrl: body.logoUrl
        }
      });
    }

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'UPDATE_SITE_SETTINGS',
      entityType: 'SiteSetting',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Pengaturan website berhasil diperbarui.',
      data: settings
    };
  });

  // GET /api/v1/admin/site/slides
  fastify.get('/admin/site/slides', async () => {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: slides
    };
  });

  // POST /api/v1/admin/site/slides
  fastify.post('/admin/site/slides', async (req) => {
    const body = req.body as any;
    const slide = await prisma.heroSlide.create({
      data: {
        badge: body.badge || 'Unit Pendidikan',
        title: body.title,
        subtitle: body.subtitle || '',
        imageUrl: body.imageUrl || '/uploads/gallery/pesantren6.png',
        href: body.href || '/pesantren',
        sortOrder: body.sortOrder || 0,
        isActive: true
      }
    });

    return {
      success: true,
      message: 'Slide banner berhasil ditambahkan.',
      data: slide
    };
  });

  // PUT /api/v1/admin/site/slides/:id
  fastify.put('/admin/site/slides/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        badge: body.badge,
        title: body.title,
        subtitle: body.subtitle,
        imageUrl: body.imageUrl,
        href: body.href,
        isActive: body.isActive
      }
    });

    return {
      success: true,
      message: 'Slide banner berhasil diperbarui.',
      data: slide
    };
  });

  // DELETE /api/v1/admin/site/slides/:id
  fastify.delete('/admin/site/slides/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.heroSlide.delete({ where: { id } });
    return { success: true, message: 'Slide berhasil dihapus.' };
  });

  // GET /api/v1/admin/site/socials
  fastify.get('/admin/site/socials', async () => {
    const socials = await prisma.socialLink.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: socials
    };
  });
}
