import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function faqRoutes(fastify: FastifyInstance) {
  // GET /api/v1/faqs
  fastify.get('/faqs', async (req) => {
    const { category } = req.query as { category?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (category) {
      where.category = category;
    }

    const faqs = await prisma.faq.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: faqs
    };
  });
}
