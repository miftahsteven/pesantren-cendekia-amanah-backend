import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import staticFiles from '@fastify/static';
import multipart from '@fastify/multipart';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { AppError } from './common/errors/app-error.js';


// Domain Route imports
import { siteRoutes } from './modules/site/site.route.js';
import { navigationRoutes } from './modules/navigation/navigation.route.js';
import { educationUnitRoutes } from './modules/education-unit/education-unit.route.js';
import { newsRoutes } from './modules/news/news.route.js';
import { opinionRoutes } from './modules/opinion/opinion.route.js';
import { agendaRoutes } from './modules/agenda/agenda.route.js';
import { achievementRoutes } from './modules/achievement/achievement.route.js';
import { galleryRoutes } from './modules/gallery/gallery.route.js';
import { testimonialRoutes } from './modules/testimonial/testimonial.route.js';
import { partnerRoutes } from './modules/partner/partner.route.js';
import { brochureRoutes } from './modules/brochure/brochure.route.js';
import { faqRoutes } from './modules/faq/faq.route.js';
import { ppdbRoutes } from './modules/ppdb/ppdb.route.js';
import { contactRoutes } from './modules/contact/contact.route.js';
import { newsletterRoutes } from './modules/newsletter/newsletter.route.js';
import { authRoutes } from './modules/auth/auth.route.js';
import { uploadRoutes } from './modules/upload/upload.route.js';
import { adminDashboardRoutes } from './modules/admin/dashboard.route.js';
import { adminContentRoutes } from './modules/admin/content.route.js';
import { adminPpdbRoutes } from './modules/admin/ppdb-admin.route.js';
import { adminCommunicationRoutes } from './modules/admin/communication.route.js';
import { adminSiteRoutes } from './modules/admin/site-admin.route.js';
import { adminSystemRoutes } from './modules/admin/system.route.js';
import { adminMediaRoutes } from './modules/admin/media.route.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
              }
            }
          }
        : true,
    trustProxy: true
  });

  // 0. Static File Serving for uploads
  const uploadsDir = path.resolve(process.cwd(), 'storage/uploads');
  await app.register(staticFiles, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false
  });

  // 0.1 Multipart Support
  await app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024 // 20 MB max
    }
  });

  // 1. Security Headers
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // Allows Swagger UI
  });

  // 2. CORS Allowlist
  const origins = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  await app.register(cors, {
    origin: (origin, cb) => {
      // allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || origins.includes(origin) || origin.startsWith('http://localhost:')) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // 3. Cookie Parser
  await app.register(cookie, {
    secret: env.SESSION_SECRET
  });

  // 4. Rate Limiting
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_GLOBAL_MAX,
    timeWindow: env.RATE_LIMIT_GLOBAL_WINDOW * 1000,
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak permintaan. Silakan coba kembali beberapa saat lagi.'
      }
    })
  });

  // 5. Swagger OpenAPI Documentation
  if (env.ENABLE_SWAGGER) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Pesantren Cendekia Amanah REST API',
          description: 'Dokumentasi resmi API Backend Pesantren Cendekia Amanah (Tahap 2)',
          version: env.APP_VERSION
        },
        servers: [
          { url: `http://localhost:${env.PORT}`, description: 'Local Development Server' }
        ]
      }
    });

    await app.register(swaggerUi, {
      routePrefix: `${env.API_PREFIX}/docs`,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true
      }
    });
  }

  // 6. Global Error Handler
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          fields: error.fields
        }
      });
      return;
    }

    req.log.error(error);

    const err = error as { statusCode?: number; code?: string; message?: string };

    reply.status(err.statusCode || 500).send({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message:
          env.NODE_ENV === 'production'
            ? 'Terjadi kesalahan pada sistem backend.'
            : err.message || 'Internal Server Error'
      }
    });
  });

  // 7. Register API Routes with Prefix
  await app.register(
    async (apiRouter) => {
      // Health check endpoint
      apiRouter.get('/health', async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return {
            success: true,
            status: 'HEALTHY',
            timestamp: new Date().toISOString(),
            database: 'CONNECTED',
            uptime: process.uptime()
          };
        } catch {
          return {
            success: false,
            status: 'UNHEALTHY',
            timestamp: new Date().toISOString(),
            database: 'DISCONNECTED'
          };
        }
      });

      // Domain modules
      await apiRouter.register(siteRoutes);
      await apiRouter.register(navigationRoutes);
      await apiRouter.register(educationUnitRoutes);
      await apiRouter.register(newsRoutes);
      await apiRouter.register(opinionRoutes);
      await apiRouter.register(agendaRoutes);
      await apiRouter.register(achievementRoutes);
      await apiRouter.register(galleryRoutes);
      await apiRouter.register(testimonialRoutes);
      await apiRouter.register(partnerRoutes);
      await apiRouter.register(brochureRoutes);
      await apiRouter.register(faqRoutes);
      await apiRouter.register(ppdbRoutes);
      await apiRouter.register(contactRoutes);
      await apiRouter.register(newsletterRoutes);
      await apiRouter.register(authRoutes);
      await apiRouter.register(uploadRoutes);

      // Admin Management Modules
      await apiRouter.register(adminDashboardRoutes);
      await apiRouter.register(adminContentRoutes);
      await apiRouter.register(adminPpdbRoutes);
      await apiRouter.register(adminCommunicationRoutes);
      await apiRouter.register(adminSiteRoutes);
      await apiRouter.register(adminSystemRoutes);
      await apiRouter.register(adminMediaRoutes);
    },
    { prefix: env.API_PREFIX }
  );

  return app;
}
