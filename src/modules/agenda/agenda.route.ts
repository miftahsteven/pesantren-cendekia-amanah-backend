import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function agendaRoutes(fastify: FastifyInstance) {
  // GET /api/v1/agendas
  fastify.get('/agendas', async (req) => {
    const { unit } = req.query as { unit?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (unit) {
      where.OR = [
        { unit: { code: { equals: unit, mode: 'insensitive' } } },
        { unit: { slug: { equals: unit, mode: 'insensitive' } } }
      ];
    }

    const agendas = await prisma.agenda.findMany({
      where,
      orderBy: [
        { eventDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: { unit: true }
    });

    return {
      success: true,
      data: agendas
    };
  });
}
