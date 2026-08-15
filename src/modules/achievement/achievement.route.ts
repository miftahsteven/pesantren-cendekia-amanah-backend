import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function achievementRoutes(fastify: FastifyInstance) {
  // GET /api/v1/achievements
  fastify.get('/achievements', async (req) => {
    const { unit, featured } = req.query as { unit?: string; featured?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (unit) {
      where.unit = { code: unit };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { unit: true }
    });

    return {
      success: true,
      data: achievements
    };
  });
}
