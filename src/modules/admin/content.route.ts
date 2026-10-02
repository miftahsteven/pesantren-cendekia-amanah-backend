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
        curriculumBody: body.curriculumBody,
        welcomeName: body.welcomeName !== undefined ? body.welcomeName : undefined,
        welcomeRole: body.welcomeRole !== undefined ? body.welcomeRole : undefined,
        welcomePhoto: body.welcomePhoto !== undefined ? body.welcomePhoto : undefined,
        welcomeQuote: body.welcomeQuote !== undefined ? body.welcomeQuote : undefined,
        welcomeMessage: body.welcomeMessage !== undefined ? body.welcomeMessage : undefined
      }
    });

    return { success: true, message: 'Unit pendidikan berhasil diperbarui.', data: unit };
  });

  // ==========================================
  // 4. PROGRAM UNGGULAN
  // ==========================================

  // GET /api/v1/admin/unit-programs
  fastify.get('/admin/unit-programs', async (req) => {
    const { unitId } = req.query as { unitId?: string };
    const where: any = {};
    if (unitId && unitId !== 'all') {
      where.unitId = unitId;
    }

    const items = await prisma.unitProgram.findMany({
      where,
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      },
      orderBy: [
        { unit: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    return { success: true, data: items };
  });

  // POST /api/v1/admin/unit-programs
  fastify.post('/admin/unit-programs', async (req) => {
    const body = req.body as any;
    if (!body.unitId) {
      throw new ValidationError('Unit pendidikan wajib dipilih.');
    }
    if (!body.title) {
      throw new ValidationError('Judul program wajib diisi.');
    }

    const prog = await prisma.unitProgram.create({
      data: {
        unitId: body.unitId,
        title: body.title,
        description: body.description || body.desc || '',
        badge: body.badge || null,
        icon: body.icon || body.iconName || 'BookOpen',
        imageUrl: body.imageUrl || null,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      },
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'CREATE_UNIT_PROGRAM',
      entityType: 'UnitProgram',
      entityId: prog.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { title: prog.title, unitId: prog.unitId }
    });

    return { success: true, message: 'Program unggulan unit berhasil ditambahkan.', data: prog };
  });

  // PUT /api/v1/admin/unit-programs/:id
  fastify.put('/admin/unit-programs/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const prog = await prisma.unitProgram.update({
      where: { id },
      data: {
        unitId: body.unitId !== undefined ? body.unitId : undefined,
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : (body.desc !== undefined ? body.desc : undefined),
        badge: body.badge !== undefined ? body.badge : undefined,
        icon: body.icon !== undefined ? body.icon : (body.iconName !== undefined ? body.iconName : undefined),
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined
      },
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'UPDATE_UNIT_PROGRAM',
      entityType: 'UnitProgram',
      entityId: prog.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { title: prog.title, unitId: prog.unitId }
    });

    return { success: true, message: 'Program unggulan unit berhasil diperbarui.', data: prog };
  });

  // DELETE /api/v1/admin/unit-programs/:id
  fastify.delete('/admin/unit-programs/:id', async (req) => {
    const { id } = req.params as { id: string };
    const prog = await prisma.unitProgram.findUnique({ where: { id } });
    await prisma.unitProgram.delete({ where: { id } });

    if (prog) {
      await recordAuditLog({
        actorAdminId: req.adminUser?.id,
        action: 'DELETE_UNIT_PROGRAM',
        entityType: 'UnitProgram',
        entityId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { title: prog.title, unitId: prog.unitId }
      });
    }

    return { success: true, message: 'Program unggulan unit berhasil dihapus.' };
  });

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
  fastify.get('/admin/agendas', async (req) => {
    const { unitId } = req.query as { unitId?: string };
    const where: any = {};
    if (unitId && unitId !== 'all') {
      where.unitId = unitId;
    }

    const items = await prisma.agenda.findMany({
      where,
      orderBy: [
        { eventDate: 'asc' },
        { createdAt: 'desc' }
      ],
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
        unitId: body.unitId || null,
        eventDate: body.eventDate || null,
        category: body.category || 'Akademik'
      },
      include: { unit: true }
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
        isFeatured: Boolean(body.isFeatured),
        unitId: body.unitId !== undefined ? (body.unitId || null) : undefined,
        eventDate: body.eventDate !== undefined ? (body.eventDate || null) : undefined,
        category: body.category !== undefined ? body.category : undefined
      },
      include: { unit: true }
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
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        unitId: body.unitId !== undefined ? (body.unitId || null) : undefined
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

  // ==========================================
  // 12. FASILITAS PESANTREN TERPADU
  // ==========================================

  // GET /api/v1/admin/facilities
  fastify.get('/admin/facilities', async (req) => {
    const { unitSlug, q } = req.query as { unitSlug?: string; q?: string };

    const whereClause: any = {};
    if (unitSlug && unitSlug !== 'ALL') {
      whereClause.unit = { slug: unitSlug };
    }
    if (q && q.trim()) {
      whereClause.OR = [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } }
      ];
    }

    const items = await prisma.unitFacility.findMany({
      where: whereClause,
      include: {
        unit: {
          select: {
            id: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const data = items.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      imageUrl: f.imageUrl,
      sortOrder: f.sortOrder,
      isActive: f.isActive,
      unitId: f.unitId,
      unitName: f.unit?.name || 'Pesantren Cendekia Amanah',
      unitShortName: f.unit?.shortName || 'Pesantren',
      unitSlug: f.unit?.slug || 'pesantren',
      unitBadge: f.unit?.badge || 'Kampus Terpadu',
      createdAt: f.createdAt,
      updatedAt: f.updatedAt
    }));

    return { success: true, data, total: data.length };
  });

  // POST /api/v1/admin/facilities
  fastify.post('/admin/facilities', async (req) => {
    const body = req.body as any;

    let targetUnitId = body.unitId;
    if (!targetUnitId) {
      const defaultUnit = await prisma.educationUnit.findFirst({
        where: { slug: 'pesantren' }
      }) || await prisma.educationUnit.findFirst();
      targetUnitId = defaultUnit?.id;
    }

    const item = await prisma.unitFacility.create({
      data: {
        name: body.name,
        description: body.description || '',
        imageUrl: body.imageUrl || '/uploads/gallery/pesantren1.png',
        unitId: targetUnitId,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      },
      include: {
        unit: true
      }
    });

    return { success: true, message: 'Fasilitas berhasil ditambahkan.', data: item };
  });

  // GET /api/v1/admin/facilities/:id
  fastify.get('/admin/facilities/:id', async (req) => {
    const { id } = req.params as { id: string };
    const item = await prisma.unitFacility.findUnique({
      where: { id },
      include: { unit: true }
    });
    if (!item) {
      return { success: false, message: 'Fasilitas tidak ditemukan.' };
    }
    return { success: true, data: item };
  });

  // PUT /api/v1/admin/facilities/:id
  fastify.put('/admin/facilities/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.imageUrl !== undefined) dataToUpdate.imageUrl = body.imageUrl;
    if (body.unitId !== undefined && body.unitId) dataToUpdate.unitId = body.unitId;
    if (body.sortOrder !== undefined) dataToUpdate.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);

    const item = await prisma.unitFacility.update({
      where: { id },
      data: dataToUpdate,
      include: { unit: true }
    });

    return { success: true, message: 'Fasilitas berhasil diperbarui.', data: item };
  });

  // DELETE /api/v1/admin/facilities/:id
  fastify.delete('/admin/facilities/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.unitFacility.delete({ where: { id } });
    return { success: true, message: 'Fasilitas berhasil dihapus.' };
  });

  // PATCH /api/v1/admin/facilities/:id/toggle
  fastify.patch('/admin/facilities/:id/toggle', async (req) => {
    const { id } = req.params as { id: string };
    const current = await prisma.unitFacility.findUnique({ where: { id } });
    if (!current) {
      return { success: false, message: 'Fasilitas tidak ditemukan.' };
    }
    const item = await prisma.unitFacility.update({
      where: { id },
      data: { isActive: !current.isActive }
    });
    return { success: true, message: 'Status fasilitas berhasil diubah.', data: item };
  });

  // ==================================================
  // UNIT ORGANIZATIONS (STRUKTUR ORGANISASI)
  // ==================================================

  // GET /api/v1/admin/organizations
  fastify.get('/admin/organizations', async (req) => {
    const { unitId, unitSlug, category, q } = req.query as {
      unitId?: string;
      unitSlug?: string;
      category?: string;
      q?: string;
    };

    const whereClause: any = {};
    if (unitId && unitId !== 'ALL') {
      whereClause.unitId = unitId;
    } else if (unitSlug && unitSlug !== 'ALL') {
      whereClause.unit = { slug: unitSlug };
    }

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (q && q.trim()) {
      whereClause.OR = [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { position: { contains: q.trim(), mode: 'insensitive' } },
        { education: { contains: q.trim(), mode: 'insensitive' } },
        { nip: { contains: q.trim(), mode: 'insensitive' } }
      ];
    }

    const items = await prisma.unitOrganization.findMany({
      where: whereClause,
      include: {
        unit: {
          select: {
            id: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    const data = items.map((m) => ({
      id: m.id,
      name: m.name,
      position: m.position,
      category: m.category,
      level: m.level,
      photoUrl: m.photoUrl || '/uploads/gallery/guru1.png',
      nip: m.nip,
      education: m.education,
      bio: m.bio,
      sortOrder: m.sortOrder,
      isActive: m.isActive,
      unitId: m.unitId,
      unitName: m.unit?.name || 'Pesantren Cendekia Amanah',
      unitShortName: m.unit?.shortName || 'Pesantren',
      unitSlug: m.unit?.slug || 'pesantren',
      unitBadge: m.unit?.badge || 'Pendidikan Terpadu',
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    return { success: true, data };
  });

  // POST /api/v1/admin/organizations
  fastify.post('/admin/organizations', async (req) => {
    const body = req.body as {
      unitId: string;
      name: string;
      position: string;
      category?: string;
      level?: number;
      photoUrl?: string;
      nip?: string;
      education?: string;
      bio?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    if (!body.name || !body.position || !body.unitId) {
      return { success: false, message: 'Nama, Jabatan, dan Unit Pendidikan wajib diisi.' };
    }

    const item = await prisma.unitOrganization.create({
      data: {
        unitId: body.unitId,
        name: body.name,
        position: body.position,
        category: body.category || 'Pimpinan & Manajemen',
        level: body.level ? Number(body.level) : 1,
        photoUrl: body.photoUrl || '/uploads/gallery/guru1.png',
        nip: body.nip || null,
        education: body.education || null,
        bio: body.bio || null,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      },
      include: {
        unit: true
      }
    });

    return { success: true, message: 'Anggota organisasi berhasil ditambahkan.', data: item };
  });

  // GET /api/v1/admin/organizations/:id
  fastify.get('/admin/organizations/:id', async (req) => {
    const { id } = req.params as { id: string };
    const item = await prisma.unitOrganization.findUnique({
      where: { id },
      include: { unit: true }
    });

    if (!item) {
      return { success: false, message: 'Data organisasi tidak ditemukan.' };
    }

    return { success: true, data: item };
  });

  // PUT /api/v1/admin/organizations/:id
  fastify.put('/admin/organizations/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.position !== undefined) dataToUpdate.position = body.position;
    if (body.category !== undefined) dataToUpdate.category = body.category;
    if (body.level !== undefined) dataToUpdate.level = Number(body.level);
    if (body.photoUrl !== undefined) dataToUpdate.photoUrl = body.photoUrl;
    if (body.nip !== undefined) dataToUpdate.nip = body.nip;
    if (body.education !== undefined) dataToUpdate.education = body.education;
    if (body.bio !== undefined) dataToUpdate.bio = body.bio;
    if (body.unitId !== undefined && body.unitId) dataToUpdate.unitId = body.unitId;
    if (body.sortOrder !== undefined) dataToUpdate.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);

    const item = await prisma.unitOrganization.update({
      where: { id },
      data: dataToUpdate,
      include: { unit: true }
    });

    return { success: true, message: 'Data struktur organisasi berhasil diperbarui.', data: item };
  });

  // DELETE /api/v1/admin/organizations/:id
  fastify.delete('/admin/organizations/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.unitOrganization.delete({ where: { id } });
    return { success: true, message: 'Anggota struktur organisasi berhasil dihapus.' };
  });

  // PATCH /api/v1/admin/organizations/:id/toggle
  fastify.patch('/admin/organizations/:id/toggle', async (req) => {
    const { id } = req.params as { id: string };
    const current = await prisma.unitOrganization.findUnique({ where: { id } });
    if (!current) {
      return { success: false, message: 'Data tidak ditemukan.' };
    }
    const item = await prisma.unitOrganization.update({
      where: { id },
      data: { isActive: !current.isActive }
    });
    return { success: true, message: 'Status aktif berhasil diubah.', data: item };
  });

  // ==========================================
  // 12. KURIKULUM UNIT (UNIT CURRICULUM)
  // ==========================================

  // GET /api/v1/admin/curriculums
  fastify.get('/admin/curriculums', async (req) => {
    const { unitId, search } = req.query as { unitId?: string; search?: string };
    const where: any = {};
    if (unitId && unitId !== 'all') {
      where.unitId = unitId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { badge: { contains: search, mode: 'insensitive' } }
      ];
    }

    const items = await prisma.unitCurriculum.findMany({
      where,
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      },
      orderBy: [
        { unit: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    return { success: true, data: items };
  });

  // GET /api/v1/admin/curriculums/:id
  fastify.get('/admin/curriculums/:id', async (req) => {
    const { id } = req.params as { id: string };
    const item = await prisma.unitCurriculum.findUnique({
      where: { id },
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      }
    });

    if (!item) {
      throw new NotFoundError('Data kurikulum tidak ditemukan.');
    }

    return { success: true, data: item };
  });

  // POST /api/v1/admin/curriculums
  fastify.post('/admin/curriculums', async (req) => {
    const body = req.body as any;
    if (!body.unitId) {
      throw new ValidationError('Unit pendidikan wajib dipilih.');
    }
    if (!body.title) {
      throw new ValidationError('Judul kurikulum wajib diisi.');
    }

    let parsedHighlights: string[] = [];
    if (Array.isArray(body.highlights)) {
      parsedHighlights = body.highlights.map((h: any) => String(h).trim()).filter(Boolean);
    } else if (typeof body.highlights === 'string') {
      parsedHighlights = body.highlights.split('\n').map((h: string) => h.trim()).filter(Boolean);
    }

    const item = await prisma.unitCurriculum.create({
      data: {
        unitId: body.unitId,
        title: body.title,
        badge: body.badge || null,
        icon: body.icon || 'BookOpen',
        color: body.color || 'blue',
        description: body.description || '',
        highlights: parsedHighlights,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      },
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'CREATE_UNIT_CURRICULUM',
      entityType: 'UnitCurriculum',
      entityId: item.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { title: item.title, unitId: item.unitId }
    });

    return { success: true, message: 'Kurikulum berhasil ditambahkan.', data: item };
  });

  // PUT /api/v1/admin/curriculums/:id
  fastify.put('/admin/curriculums/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const existing = await prisma.unitCurriculum.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Data kurikulum tidak ditemukan.');
    }

    const dataToUpdate: any = {};
    if (body.unitId !== undefined && body.unitId) dataToUpdate.unitId = body.unitId;
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.badge !== undefined) dataToUpdate.badge = body.badge;
    if (body.icon !== undefined) dataToUpdate.icon = body.icon;
    if (body.color !== undefined) dataToUpdate.color = body.color;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.sortOrder !== undefined) dataToUpdate.sortOrder = Number(body.sortOrder);
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);

    if (body.highlights !== undefined) {
      if (Array.isArray(body.highlights)) {
        dataToUpdate.highlights = body.highlights.map((h: any) => String(h).trim()).filter(Boolean);
      } else if (typeof body.highlights === 'string') {
        dataToUpdate.highlights = body.highlights.split('\n').map((h: string) => h.trim()).filter(Boolean);
      }
    }

    const item = await prisma.unitCurriculum.update({
      where: { id },
      data: dataToUpdate,
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'UPDATE_UNIT_CURRICULUM',
      entityType: 'UnitCurriculum',
      entityId: item.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { title: item.title, unitId: item.unitId }
    });

    return { success: true, message: 'Kurikulum berhasil diperbarui.', data: item };
  });

  // DELETE /api/v1/admin/curriculums/:id
  fastify.delete('/admin/curriculums/:id', async (req) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.unitCurriculum.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Data kurikulum tidak ditemukan.');
    }

    await prisma.unitCurriculum.delete({ where: { id } });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'DELETE_UNIT_CURRICULUM',
      entityType: 'UnitCurriculum',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { title: existing.title, unitId: existing.unitId }
    });

    return { success: true, message: 'Kurikulum berhasil dihapus.' };
  });

  // PATCH /api/v1/admin/curriculums/:id/toggle
  fastify.patch('/admin/curriculums/:id/toggle', async (req) => {
    const { id } = req.params as { id: string };
    const current = await prisma.unitCurriculum.findUnique({ where: { id } });
    if (!current) {
      return { success: false, message: 'Data tidak ditemukan.' };
    }
    const item = await prisma.unitCurriculum.update({
      where: { id },
      data: { isActive: !current.isActive }
    });
    return { success: true, message: 'Status aktif berhasil diubah.', data: item };
  });
}
