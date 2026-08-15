import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function brochureRoutes(fastify: FastifyInstance) {
  // GET /api/v1/brochures
  fastify.get('/brochures', async (req) => {
    const { unit } = req.query as { unit?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (unit) {
      where.unit = { code: unit };
    }

    const brochures = await prisma.brochure.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { unit: true }
    });

    return {
      success: true,
      data: brochures
    };
  });
}
