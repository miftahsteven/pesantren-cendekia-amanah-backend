import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function agendaRoutes(fastify: FastifyInstance) {
  // GET /api/v1/agendas
  fastify.get('/agendas', async (req) => {
    const { unit } = req.query as { unit?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (unit) {
      where.unit = { code: unit };
    }

    const agendas = await prisma.agenda.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { unit: true }
    });

    return {
      success: true,
      data: agendas
    };
  });
}
