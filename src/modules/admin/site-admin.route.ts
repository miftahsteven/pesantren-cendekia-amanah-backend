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

  // PUT /api/v1/admin/site/socials/:id
  fastify.put('/admin/site/socials/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const updated = await prisma.socialLink.update({
      where: { id },
      data: {
        name: body.name,
        url: body.url,
        handle: body.handle,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'UPDATE_SOCIAL_LINK',
      entityType: 'SocialLink',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Media sosial berhasil diperbarui.',
      data: updated
    };
  });

  // POST /api/v1/admin/site/socials
  fastify.post('/admin/site/socials', async (req) => {
    const body = req.body as any;

    const created = await prisma.socialLink.create({
      data: {
        platform: body.platform || 'OTHER',
        name: body.name || 'Media Sosial',
        url: body.url || '',
        handle: body.handle || '',
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'CREATE_SOCIAL_LINK',
      entityType: 'SocialLink',
      entityId: created.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Media sosial berhasil ditambahkan.',
      data: created
    };
  });

  // DELETE /api/v1/admin/site/socials/:id
  fastify.delete('/admin/site/socials/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.socialLink.delete({ where: { id } });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'DELETE_SOCIAL_LINK',
      entityType: 'SocialLink',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Media sosial berhasil dihapus.'
    };
  });

  // ==========================================
  // SITE STATISTICS
  // ==========================================

  // GET /api/v1/admin/site/statistics
  fastify.get('/admin/site/statistics', async (req) => {
    const { section } = req.query as { section?: string };
    const where: any = {};
    if (section) where.sectionCode = section;

    const stats = await prisma.siteStatistic.findMany({
      where,
      orderBy: [{ sectionCode: 'asc' }, { sortOrder: 'asc' }]
    });

    return {
      success: true,
      data: stats
    };
  });

  // PUT /api/v1/admin/site/statistics/:id
  fastify.put('/admin/site/statistics/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const updated = await prisma.siteStatistic.update({
      where: { id },
      data: {
        label: body.label,
        value: body.value,
        icon: body.icon,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'UPDATE_STATISTIC',
      entityType: 'SiteStatistic',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Statistik berhasil diperbarui.',
      data: updated
    };
  });

  // POST /api/v1/admin/site/statistics
  fastify.post('/admin/site/statistics', async (req) => {
    const body = req.body as any;

    const created = await prisma.siteStatistic.create({
      data: {
        sectionCode: body.sectionCode || 'HOME_HERO',
        label: body.label || '',
        value: body.value || '',
        icon: body.icon || 'Users',
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'CREATE_STATISTIC',
      entityType: 'SiteStatistic',
      entityId: created.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Statistik berhasil ditambahkan.',
      data: created
    };
  });

  // DELETE /api/v1/admin/site/statistics/:id
  fastify.delete('/admin/site/statistics/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.siteStatistic.delete({ where: { id } });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'DELETE_STATISTIC',
      entityType: 'SiteStatistic',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Statistik berhasil dihapus.'
    };
  });
}
