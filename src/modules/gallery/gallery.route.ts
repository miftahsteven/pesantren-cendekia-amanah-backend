import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/errors/app-error.js';

export async function galleryRoutes(fastify: FastifyInstance) {
  // GET /api/v1/galleries
  fastify.get('/galleries', async (req) => {
    const { category } = req.query as { category?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (category && category !== 'Semua') {
      where.category = category;
    }

    const items = await prisma.galleryItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { album: true }
    });

    const albums = await prisma.galleryAlbum.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: {
        items,
        albums
      }
    };
  });

  // GET /api/v1/galleries/:slug
  fastify.get('/galleries/:slug', async (req) => {
    const { slug } = req.params as { slug: string };

    const album = await prisma.galleryAlbum.findUnique({
      where: { slug },
      include: {
        items: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        unit: true
      }
    });

    if (!album) {
      throw new NotFoundError(`Album galeri '${slug}' tidak ditemukan.`);
    }

    return {
      success: true,
      data: album
    };
  });
}
