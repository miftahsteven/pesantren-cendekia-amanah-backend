import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { ContentStatus } from '@prisma/client';
import { NotFoundError } from '../../common/errors/app-error.js';

export async function newsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/news
  fastify.get('/news', async (req) => {
    const {
      q,
      category,
      tag,
      page = '1',
      limit = '9',
      featured
    } = req.query as {
      q?: string;
      category?: string;
      tag?: string;
      page?: string;
      limit?: string;
      featured?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
    const skip = (pageNum - 1) * limitNum;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: ContentStatus.PUBLISHED
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'Semua') {
      where.category = {
        slug: category.toLowerCase()
      };
    }

    if (featured === 'true') {
      where.isFeatured = true;
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

    const totalPages = Math.ceil(total / limitNum);

    // Convert BigInt to number for JSON serialization
    const serializedItems = items.map((item) => ({
      ...item,
      viewsCount: Number(item.viewsCount)
    }));

    return {
      success: true,
      data: serializedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrevious: pageNum > 1
      }
    };
  });

  // GET /api/v1/news/categories
  fastify.get('/news/categories', async () => {
    const categories = await prisma.newsCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { articles: true } }
      }
    });

    return {
      success: true,
      data: categories
    };
  });

  // GET /api/v1/news/tags
  fastify.get('/news/tags', async () => {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    });

    return {
      success: true,
      data: tags
    };
  });

  // GET /api/v1/news/:slug
  fastify.get('/news/:slug', async (req) => {
    const { slug } = req.params as { slug: string };

    const article = await prisma.newsArticle.findUnique({
      where: { slug },
      include: {
        category: true,
        articleTags: { include: { tag: true } }
      }
    });

    if (!article || article.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundError(`Artikel berita '${slug}' tidak ditemukan.`);
    }

    // Atomic view increment as required by PRD Section 43
    await prisma.newsArticle.update({
      where: { id: article.id },
      data: { viewsCount: { increment: 1 } }
    });

    return {
      success: true,
      data: {
        ...article,
        viewsCount: Number(article.viewsCount) + 1
      }
    };
  });

  // POST /api/v1/news/:id/view
  fastify.post('/news/:id/view', async (req) => {
    const { id } = req.params as { id: string };

    await prisma.newsArticle.update({
      where: { id },
      data: { viewsCount: { increment: 1 } }
    });

    return {
      success: true,
      message: 'View counter incremented.'
    };
  });
}
