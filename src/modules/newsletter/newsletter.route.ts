import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { ValidationError } from '../../common/errors/app-error.js';
import { NewsletterStatus } from '@prisma/client';

const newsletterSchema = z.object({
  email: z.string().email('Format email tidak valid').max(255)
});

export async function newsletterRoutes(fastify: FastifyInstance) {
  // POST /api/v1/newsletter/subscribe
  fastify.post('/newsletter/subscribe', async (req, reply) => {
    const parseResult = newsletterSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Email tidak valid.');
    }

    const { email } = parseResult.data;

    await prisma.newsletterSubscription.upsert({
      where: { email },
      update: { status: NewsletterStatus.ACTIVE },
      create: {
        email,
        status: NewsletterStatus.ACTIVE
      }
    });

    reply.status(200);
    return {
      success: true,
      message: 'Terima kasih telah berlangganan buletin & kabar Pesantren Cendekia Amanah.'
    };
  });
}
