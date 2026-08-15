import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function partnerRoutes(fastify: FastifyInstance) {
  // GET /api/v1/partners
  fastify.get('/partners', async () => {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: partners
    };
  });
}
