import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { requireAdminAuth, recordAuditLog } from '../../common/utils/admin-auth.js';
import { ContentStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../common/errors/app-error.js';

export async function adminContentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdminAuth);

  // ==========================================
  // 1. BERITA (NEWS ARTICLES)
  // ==========================================

  // GET /api/v1/admin/news
  fastify.get('/admin/news', async (req) => {
    const {
      q,
      category,
      status,
      page = '1',
      limit = '20'
    } = req.query as {
      q?: string;
      category?: string;
      status?: string;
      page?: string;
      limit?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as ContentStatus;
    }

    if (category && category !== 'ALL') {
      where.category = { slug: category.toLowerCase() };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.newsArticle.count({ where }),
      prisma.newsArticle.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { publishedAt: 'desc' },
        include: {
          category: true,
          articleTags: { include: { tag: true } }
        }
      })
    ]);

    return {
      success: true,
      data: items.map((item) => ({
        ...item,
        viewsCount: Number(item.viewsCount)
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  });

  // GET /api/v1/admin/news/:id
  fastify.get('/admin/news/:id', async (req) => {
    const { id } = req.params as { id: string };
    const article = await prisma.newsArticle.findUnique({
      where: { id },
      include: {
        category: true,
        articleTags: { include: { tag: true } }
      }
    });

    if (!article) throw new NotFoundError('Artikel berita tidak ditemukan.');

    return {
      success: true,
      data: {
        ...article,
        viewsCount: Number(article.viewsCount)
      }
    };
  });

  // POST /api/v1/admin/news
  fastify.post('/admin/news', async (req) => {
    const body = req.body as any;
    if (!body.title || !body.categoryId) {
      throw new ValidationError('Judul dan Kategori wajib diisi.');
    }

    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const article = await prisma.newsArticle.create({
      data: {
        title: body.title,
        slug,
        categoryId: body.categoryId,
        excerpt: body.excerpt || '',
        content: Array.isArray(body.content) ? body.content : [body.content || ''],
        featuredImage: body.featuredImage || '/uploads/news/wisuda.jpg',
        author: body.author || req.adminUser?.name || 'Redaksi Cendekia Amanah',
        authorAdminId: req.adminUser?.id,
        status: body.status || ContentStatus.PUBLISHED,
        isFeatured: Boolean(body.isFeatured),
        isPopular: Boolean(body.isPopular),
        highlightQuote: body.highlightQuote || null,
        publishedAt: body.status === ContentStatus.PUBLISHED ? (body.publishedAt ? new Date(body.publishedAt) : new Date()) : null,
        publishedDateText: body.publishedDateText || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        seoTitle: body.seoTitle || body.title,
        seoDescription: body.seoDescription || body.excerpt
      },
      include: { category: true }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'CREATE_NEWS',
      entityType: 'NewsArticle',
      entityId: article.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { title: article.title, status: article.status }
    });

    return {
      success: true,
      message: 'Artikel berita berhasil disimpan.',
      data: {
        ...article,
        viewsCount: Number(article.viewsCount)
      }
    };
  });

  // PUT /api/v1/admin/news/:id
  fastify.put('/admin/news/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Artikel tidak ditemukan.');

    const article = await prisma.newsArticle.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        slug: body.slug !== undefined ? body.slug : existing.slug,
        categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
        excerpt: body.excerpt !== undefined ? body.excerpt : existing.excerpt,
        content: body.content !== undefined ? (Array.isArray(body.content) ? body.content : [body.content]) : existing.content,
        featuredImage: body.featuredImage !== undefined ? body.featuredImage : existing.featuredImage,
        author: body.author !== undefined ? body.author : existing.author,
        status: body.status !== undefined ? (body.status as ContentStatus) : existing.status,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
        isPopular: body.isPopular !== undefined ? Boolean(body.isPopular) : existing.isPopular,
        highlightQuote: body.highlightQuote !== undefined ? body.highlightQuote : existing.highlightQuote,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : existing.publishedAt,
        publishedDateText: body.publishedDateText !== undefined ? body.publishedDateText : existing.publishedDateText,
        seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
        seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription
      },
      include: { category: true }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'UPDATE_NEWS',
      entityType: 'NewsArticle',
      entityId: article.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { title: article.title, status: article.status }
    });

    return {
      success: true,
      message: 'Artikel berhasil diperbarui.',
      data: {
        ...article,
        viewsCount: Number(article.viewsCount)
      }
    };
  });

  // DELETE /api/v1/admin/news/:id
  fastify.delete('/admin/news/:id', async (req) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Artikel tidak ditemukan.');

    await prisma.newsArticleTag.deleteMany({ where: { newsArticleId: id } });
    await prisma.newsArticle.delete({ where: { id } });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'DELETE_NEWS',
      entityType: 'NewsArticle',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { title: existing.title }
    });

    return {
      success: true,
      message: 'Artikel berhasil dihapus.'
    };
  });

  // ==========================================
  // 2. OPINI & AUTHORS
  // ==========================================

  // GET /api/v1/admin/opinions
  fastify.get('/admin/opinions', async () => {
    const items = await prisma.opinionArticle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    });

    return {
      success: true,
      data: items
    };
  });

  // POST /api/v1/admin/opinions
  fastify.post('/admin/opinions', async (req) => {
    const body = req.body as any;
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const opinion = await prisma.opinionArticle.create({
      data: {
        authorId: body.authorId,
        title: body.title,
        slug,
        excerpt: body.excerpt || '',
        content: Array.isArray(body.content) ? body.content : [body.content || ''],
        readTime: body.readTime || '5 menit baca',
        highlightQuote: body.highlightQuote || null,
        tags: body.tags || [],
        status: body.status || ContentStatus.PUBLISHED,
        isFeatured: Boolean(body.isFeatured),
        publishedAt: new Date(),
        publishedDateText: body.publishedDateText || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      },
      include: { author: true }
    });

    return {
      success: true,
      message: 'Opini berhasil ditambahkan.',
      data: opinion
    };
  });

  // PUT /api/v1/admin/opinions/:id
  fastify.put('/admin/opinions/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const opinion = await prisma.opinionArticle.update({
      where: { id },
      data: {
        title: body.title,
        excerpt: body.excerpt,
        content: Array.isArray(body.content) ? body.content : [body.content],
        readTime: body.readTime,
        status: body.status,
        isFeatured: Boolean(body.isFeatured)
      },
      include: { author: true }
    });

    return {
      success: true,
      message: 'Opini berhasil diperbarui.',
      data: opinion
    };
  });

  // DELETE /api/v1/admin/opinions/:id
  fastify.delete('/admin/opinions/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.opinionArticle.delete({ where: { id } });
    return { success: true, message: 'Opini berhasil dihapus.' };
  });

  // GET /api/v1/admin/opinion-authors
  fastify.get('/admin/opinion-authors', async () => {
    const authors = await prisma.opinionAuthor.findMany({
      orderBy: { name: 'asc' }
    });
    return { success: true, data: authors };
  });

  // ==========================================
  // 3. UNIT PENDIDIKAN
  // ==========================================

  // GET /api/v1/admin/units
  fastify.get('/admin/units', async () => {
    const units = await prisma.educationUnit.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        features: { orderBy: { sortOrder: 'asc' } },
        facilities: { orderBy: { sortOrder: 'asc' } },
        activities: { orderBy: { sortOrder: 'asc' } },
        programs: { orderBy: { sortOrder: 'asc' } }
      }
    });

    return { success: true, data: units };
  });

  // PUT /api/v1/admin/units/:id
  fastify.put('/admin/units/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const unit = await prisma.educationUnit.update({
      where: { id },
      data: {
        name: body.name,
        shortName: body.shortName,
        badge: body.badge,
        tagline: body.tagline,
        heroImage: body.heroImage,
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        profileBody: body.profileBody,
        curriculumBody: body.curriculumBody
      }
    });

    return { success: true, message: 'Unit pendidikan berhasil diperbarui.', data: unit };
  });

  // ==========================================
  // 4. PROGRAM UNGGULAN
  // ==========================================

  // GET /api/v1/admin/featured-programs
  fastify.get('/admin/featured-programs', async () => {
    const items = await prisma.featuredProgram.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return { success: true, data: items };
  });

  // POST /api/v1/admin/featured-programs
  fastify.post('/admin/featured-programs', async (req) => {
    const body = req.body as any;
    const prog = await prisma.featuredProgram.create({
      data: {
        title: body.title,
        desc: body.desc || body.description || '',
        icon: body.icon || 'BookOpen',
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      }
    });
    return { success: true, message: 'Program unggulan berhasil ditambahkan.', data: prog };
  });

  // PUT /api/v1/admin/featured-programs/:id
  fastify.put('/admin/featured-programs/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const prog = await prisma.featuredProgram.update({
      where: { id },
      data: {
        title: body.title,
        desc: body.desc || body.description,
        icon: body.icon,
        isActive: body.isActive
      }
    });
    return { success: true, message: 'Program berhasil diperbarui.', data: prog };
  });

  // DELETE /api/v1/admin/featured-programs/:id
  fastify.delete('/admin/featured-programs/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.featuredProgram.delete({ where: { id } });
    return { success: true, message: 'Program berhasil dihapus.' };
  });

  // ==========================================
  // 5. AGENDA KEGIATAN
  // ==========================================

  // GET /api/v1/admin/agendas
  fastify.get('/admin/agendas', async () => {
    const items = await prisma.agenda.findMany({
      orderBy: { createdAt: 'desc' },
      include: { unit: true }
    });
    return { success: true, data: items };
  });

  // POST /api/v1/admin/agendas
  fastify.post('/admin/agendas', async (req) => {
    const body = req.body as any;
    const agenda = await prisma.agenda.create({
      data: {
        title: body.title,
        description: body.description || '',
        day: body.day || '01',
        month: body.month || 'Januari',
        year: body.year || '2026',
        time: body.time || '08:00 WIB',
        location: body.location || 'Kampus Pesantren Cendekia Amanah',
        status: body.status || 'Mendatang',
        isFeatured: Boolean(body.isFeatured),
        isActive: true,
        unitId: body.unitId || null
      }
    });
    return { success: true, message: 'Agenda berhasil ditambahkan.', data: agenda };
  });

  // PUT /api/v1/admin/agendas/:id
  fastify.put('/admin/agendas/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const agenda = await prisma.agenda.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        day: body.day,
        month: body.month,
        year: body.year,
        time: body.time,
        location: body.location,
        status: body.status,
        isFeatured: Boolean(body.isFeatured)
      }
    });
    return { success: true, message: 'Agenda berhasil diperbarui.', data: agenda };
  });

  // DELETE /api/v1/admin/agendas/:id
  fastify.delete('/admin/agendas/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.agenda.delete({ where: { id } });
    return { success: true, message: 'Agenda berhasil dihapus.' };
  });

  // ==========================================
  // 6. PRESTASI SANTRI (ACHIEVEMENTS)
  // ==========================================

  // GET /api/v1/admin/achievements
  fastify.get('/admin/achievements', async () => {
    const items = await prisma.achievement.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { unit: true }
    });
    return { success: true, data: items };
  });

  // POST /api/v1/admin/achievements
  fastify.post('/admin/achievements', async (req) => {
    const body = req.body as any;
    const ach = await prisma.achievement.create({
      data: {
        title: body.title,
        winner: body.winner || 'Santri Cendekia Amanah',
        category: body.category || 'Tingkat Nasional',
        year: body.year || '2026',
        badge: body.badge || 'Juara 1',
        imageUrl: body.imageUrl || '/uploads/units/juara1.jpg',
        isFeatured: Boolean(body.isFeatured),
        isActive: true,
        sortOrder: body.sortOrder || 0,
        unitId: body.unitId || null
      }
    });
    return { success: true, message: 'Prestasi berhasil ditambahkan.', data: ach };
  });

  // PUT /api/v1/admin/achievements/:id
  fastify.put('/admin/achievements/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const ach = await prisma.achievement.update({
      where: { id },
      data: {
        title: body.title,
        winner: body.winner,
        category: body.category,
        year: body.year,
        badge: body.badge,
        imageUrl: body.imageUrl,
        isFeatured: Boolean(body.isFeatured)
      }
    });
    return { success: true, message: 'Prestasi berhasil diperbarui.', data: ach };
  });

  // DELETE /api/v1/admin/achievements/:id
  fastify.delete('/admin/achievements/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.achievement.delete({ where: { id } });
    return { success: true, message: 'Prestasi berhasil dihapus.' };
  });

  // ==========================================
  // 7. GALERI DOKUMENTASI (GALLERIES)
  // ==========================================

  // GET /api/v1/admin/galleries
  fastify.get('/admin/galleries', async () => {
    const [items, albums] = await Promise.all([
      prisma.galleryItem.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { album: true }
      }),
      prisma.galleryAlbum.findMany({
        orderBy: { createdAt: 'desc' }
      })
    ]);
    return { success: true, data: { items, albums } };
  });

  // POST /api/v1/admin/galleries
  fastify.post('/admin/galleries', async (req) => {
    const body = req.body as any;
    const item = await prisma.galleryItem.create({
      data: {
        title: body.title,
        category: body.category || 'Pesantren',
        imageUrl: body.imageUrl || '/uploads/gallery/pesantren1.png',
        caption: body.caption || '',
        sortOrder: body.sortOrder || 0,
        isActive: true,
        albumId: body.albumId || null
      }
    });
    return { success: true, message: 'Foto galeri berhasil ditambahkan.', data: item };
  });

  // DELETE /api/v1/admin/galleries/:id
  fastify.delete('/admin/galleries/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.galleryItem.delete({ where: { id } });
    return { success: true, message: 'Foto galeri berhasil dihapus.' };
  });

  // ==========================================
  // 8. TESTIMONI (TESTIMONIALS)
  // ==========================================

  // GET /api/v1/admin/testimonials
  fastify.get('/admin/testimonials', async () => {
    const items = await prisma.testimonial.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { unit: true }
    });
    return { success: true, data: items };
  });

  // POST /api/v1/admin/testimonials
  fastify.post('/admin/testimonials', async (req) => {
    const body = req.body as any;
    const item = await prisma.testimonial.create({
      data: {
        author: body.author,
        role: body.role,
        category: body.category || 'Orang Tua Santri',
        content: body.content,
        avatar: body.avatar || '/uploads/guru/guru5.png',
        sortOrder: body.sortOrder || 0,
        isActive: true
      }
    });
    return { success: true, message: 'Testimoni berhasil ditambahkan.', data: item };
  });

  // PUT /api/v1/admin/testimonials/:id
  fastify.put('/admin/testimonials/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const item = await prisma.testimonial.update({
      where: { id },
      data: {
        author: body.author,
        role: body.role,
        category: body.category,
        content: body.content,
        avatar: body.avatar
      }
    });
    return { success: true, message: 'Testimoni berhasil diperbarui.', data: item };
  });

  // DELETE /api/v1/admin/testimonials/:id
  fastify.delete('/admin/testimonials/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.testimonial.delete({ where: { id } });
    return { success: true, message: 'Testimoni berhasil dihapus.' };
  });

  // ==========================================
  // 9. MITRA KERJA SAMA (PARTNERS)
  // ==========================================

  // GET /api/v1/admin/partners
  fastify.get('/admin/partners', async () => {
    const items = await prisma.partner.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return { success: true, data: items };
  });

  // POST /api/v1/admin/partners
  fastify.post('/admin/partners', async (req) => {
    const body = req.body as any;
    const item = await prisma.partner.create({
      data: {
        name: body.name,
        logo: body.logo || '/uploads/partners/kemenag.png',
        websiteUrl: body.websiteUrl || null,
        sortOrder: body.sortOrder || 0,
        isActive: true
      }
    });
    return { success: true, message: 'Mitra kerja sama berhasil ditambahkan.', data: item };
  });

  // PUT /api/v1/admin/partners/:id
  fastify.put('/admin/partners/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const item = await prisma.partner.update({
      where: { id },
      data: {
        name: body.name,
        logo: body.logo,
        websiteUrl: body.websiteUrl
      }
    });
    return { success: true, message: 'Mitra berhasil diperbarui.', data: item };
  });

  // DELETE /api/v1/admin/partners/:id
  fastify.delete('/admin/partners/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.partner.delete({ where: { id } });
    return { success: true, message: 'Mitra berhasil dihapus.' };
  });

  // ==========================================
  // 10. FAQ & BROSUR
  // ==========================================

  // GET /api/v1/admin/faqs
  fastify.get('/admin/faqs', async () => {
    const items = await prisma.faq.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return { success: true, data: items };
  });

  // POST /api/v1/admin/faqs
  fastify.post('/admin/faqs', async (req) => {
    const body = req.body as any;
    const item = await prisma.faq.create({
      data: {
        category: body.category || 'Umum',
        question: body.question,
        answer: body.answer,
        sortOrder: body.sortOrder || 0,
        isActive: true
      }
    });
    return { success: true, message: 'FAQ berhasil ditambahkan.', data: item };
  });

  // DELETE /api/v1/admin/faqs/:id
  fastify.delete('/admin/faqs/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.faq.delete({ where: { id } });
    return { success: true, message: 'FAQ berhasil dihapus.' };
  });

  // GET /api/v1/admin/brochures
  fastify.get('/admin/brochures', async () => {
    const items = await prisma.brochure.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { unit: true }
    });
    return { success: true, data: items };
  });

  // POST /api/v1/admin/brochures
  fastify.post('/admin/brochures', async (req) => {
    const body = req.body as any;
    const item = await prisma.brochure.create({
      data: {
        unitName: body.unitName || 'Pesantren',
        title: body.title,
        fileSize: body.fileSize || '2.5 MB',
        fileUrl: body.fileUrl || '/uploads/brochures/brosur-pesantren.pdf',
        academicYear: body.academicYear || '2027/2028',
        sortOrder: body.sortOrder || 0,
        unitId: body.unitId || null
      }
    });
    return { success: true, message: 'Brosur berhasil ditambahkan.', data: item };
  });

  // DELETE /api/v1/admin/brochures/:id
  fastify.delete('/admin/brochures/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.brochure.delete({ where: { id } });
    return { success: true, message: 'Brosur berhasil dihapus.' };
  });
}
