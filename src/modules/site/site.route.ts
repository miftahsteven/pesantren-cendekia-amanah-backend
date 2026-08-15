import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function siteRoutes(fastify: FastifyInstance) {
  // GET /api/v1/site
  fastify.get('/site', async () => {
    const setting = await prisma.siteSetting.findFirst();
    const socialLinks = await prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: {
        setting,
        socialLinks
      }
    };
  });

  // GET /api/v1/hero-slides
  fastify.get('/hero-slides', async () => {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: slides
    };
  });

  // GET /api/v1/statistics
  fastify.get('/statistics', async (req) => {
    const { section } = req.query as { section?: string };
    const where: { isActive: boolean; sectionCode?: string } = { isActive: true };
    if (section) {
      where.sectionCode = section;
    }

    const stats = await prisma.siteStatistic.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: stats
    };
  });

  // GET /api/v1/site-features
  fastify.get('/site-features', async () => {
    const features = await prisma.siteFeature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: features
    };
  });

  // GET /api/v1/featured-programs
  fastify.get('/featured-programs', async () => {
    const programs = await prisma.featuredProgram.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: programs
    };
  });
}
