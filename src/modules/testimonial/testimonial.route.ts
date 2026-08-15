import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function testimonialRoutes(fastify: FastifyInstance) {
  // GET /api/v1/testimonials
  fastify.get('/testimonials', async (req) => {
    const { unit } = req.query as { unit?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (unit) {
      where.unit = { code: unit };
    }

    const items = await prisma.testimonial.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { unit: true }
    });

    return {
      success: true,
      data: items
    };
  });
}
