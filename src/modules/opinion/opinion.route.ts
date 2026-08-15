import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { ContentStatus } from '@prisma/client';
import { NotFoundError } from '../../common/errors/app-error.js';

export async function opinionRoutes(fastify: FastifyInstance) {
  // GET /api/v1/opinions
  fastify.get('/opinions', async (req) => {
    const { page = '1', limit = '10', featured } = req.query as {
      page?: string;
      limit?: string;
      featured?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: ContentStatus.PUBLISHED
    };

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const [total, items] = await Promise.all([
      prisma.opinionArticle.count({ where }),
      prisma.opinionArticle.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: true
        }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      success: true,
      data: items,
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

  // GET /api/v1/opinion-authors
  fastify.get('/opinion-authors', async () => {
    const authors = await prisma.opinionAuthor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { articles: true } }
      }
    });

    return {
      success: true,
      data: authors
    };
  });

  // GET /api/v1/opinions/:slug
  fastify.get('/opinions/:slug', async (req) => {
    const { slug } = req.params as { slug: string };

    const article = await prisma.opinionArticle.findUnique({
      where: { slug },
      include: {
        author: true
      }
    });

    if (!article || article.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundError(`Artikel opini '${slug}' tidak ditemukan.`);
    }

    return {
      success: true,
      data: article
    };
  });
}
