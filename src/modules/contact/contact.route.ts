import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { ValidationError, NotFoundError } from '../../common/errors/app-error.js';
import { ContactStatus } from '@prisma/client';

const contactMessageSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(150),
  email: z.string().email('Format email tidak valid').max(255),
  message: z.string().min(5, 'Pesan minimal 5 karakter').max(5000)
});

export async function contactRoutes(fastify: FastifyInstance) {
  // POST /api/v1/contact
  fastify.post('/contact', async (req, reply) => {
    const parseResult = contactMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new ValidationError('Pesan kontak tidak valid.', fieldErrors);
    }

    const data = parseResult.data;

    const contact = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        message: data.message,
        status: ContactStatus.NEW,
        sourceIp: req.ip,
        userAgent: req.headers['user-agent'] || null
      }
    });

    reply.status(201);
    return {
      success: true,
      message: 'Pesan Anda telah berhasil dikirim. Tim kami akan segera merespons.',
      data: {
        id: contact.id,
        createdAt: contact.createdAt
      }
    };
  });

  // GET /api/v1/admin/contact
  fastify.get('/admin/contact', async (req) => {
    const { status, page = '1', limit = '20' } = req.query as {
      status?: string;
      page?: string;
      limit?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) {
      where.status = status as ContactStatus;
    }

    const [total, messages] = await Promise.all([
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      success: true,
      data: messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrevious: pageNum > 1
      }
    };
  });

  // PATCH /api/v1/admin/contact/:id/status
  fastify.patch('/admin/contact/:id/status', async (req) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: ContactStatus };

    const message = await prisma.contactMessage.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundError('Pesan kontak tidak ditemukan.');
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status }
    });

    return {
      success: true,
      data: updated
    };
  });
}
