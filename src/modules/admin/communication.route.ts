import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { requireAdminAuth, recordAuditLog } from '../../common/utils/admin-auth.js';
import { ContactStatus } from '@prisma/client';
import { NotFoundError } from '../../common/errors/app-error.js';

export async function adminCommunicationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdminAuth);

  // GET /api/v1/admin/contacts
  fastify.get('/admin/contacts', async (req) => {
    const { status, page = '1', limit = '20' } = req.query as {
      status?: string;
      page?: string;
      limit?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as ContactStatus;
    }

    const [total, items] = await Promise.all([
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  });

  // PATCH /api/v1/admin/contacts/:id/status
  fastify.patch('/admin/contacts/:id/status', async (req) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: ContactStatus };

    const contact = await prisma.contactMessage.update({
      where: { id },
      data: {
        status
      }
    });

    return {
      success: true,
      message: 'Status pesan berhasil diperbarui.',
      data: contact
    };
  });

  // GET /api/v1/admin/newsletters
  fastify.get('/admin/newsletters', async () => {
    const subscribers = await prisma.newsletterSubscription.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: subscribers
    };
  });
}
