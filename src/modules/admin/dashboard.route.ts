import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { requireAdminAuth } from '../../common/utils/admin-auth.js';
import { ContentStatus, PpdbStatus, ContactStatus } from '@prisma/client';

export async function adminDashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdminAuth);

  // GET /api/v1/admin/dashboard/stats
  fastify.get('/admin/dashboard/stats', async () => {
    const [
      totalArticles,
      draftArticles,
      publishedArticles,
      totalPpdb,
      submittedPpdb,
      verifiedPpdb,
      newContacts,
      totalMedia,
      totalAchievements,
      totalAgendas,
      totalTestimonials,
      totalPartners
    ] = await Promise.all([
      prisma.newsArticle.count(),
      prisma.newsArticle.count({ where: { status: ContentStatus.DRAFT } }),
      prisma.newsArticle.count({ where: { status: ContentStatus.PUBLISHED } }),
      prisma.ppdbApplication.count(),
      prisma.ppdbApplication.count({ where: { status: PpdbStatus.SUBMITTED } }),
      prisma.ppdbApplication.count({ where: { status: PpdbStatus.VERIFIED } }),
      prisma.contactMessage.count({ where: { status: ContactStatus.NEW } }),
      prisma.mediaAsset.count(),
      prisma.achievement.count({ where: { isActive: true } }),
      prisma.agenda.count({ where: { isActive: true } }),
      prisma.testimonial.count({ where: { isActive: true } }),
      prisma.partner.count({ where: { isActive: true } })
    ]);

    // Query popular news articles
    const popularNews = await prisma.newsArticle.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { viewsCount: 'desc' },
      take: 5,
      include: { category: true }
    });

    // Query recent PPDB applicants
    const recentPpdb = await prisma.ppdbApplication.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { unit: true }
    });

    // Query recent audit logs
    const recentActivities = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { actor: { select: { id: true, name: true, email: true } } }
    });

    return {
      success: true,
      data: {
        counters: {
          articles: {
            total: totalArticles,
            draft: draftArticles,
            published: publishedArticles
          },
          ppdb: {
            total: totalPpdb,
            submitted: submittedPpdb,
            verified: verifiedPpdb
          },
          contacts: {
            new: newContacts
          },
          media: {
            total: totalMedia
          },
          content: {
            achievements: totalAchievements,
            agendas: totalAgendas,
            testimonials: totalTestimonials,
            partners: totalPartners
          }
        },
        popularNews: popularNews.map((n) => ({
          ...n,
          viewsCount: Number(n.viewsCount)
        })),
        recentPpdb,
        recentActivities
      }
    };
  });

  // GET /api/v1/admin/dashboard/ppdb-distribution
  fastify.get('/admin/dashboard/ppdb-distribution', async () => {
    const units = await prisma.educationUnit.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        _count: {
          select: { ppdbApplications: true }
        }
      }
    });

    const statusCounts = await prisma.ppdbApplication.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    return {
      success: true,
      data: {
        byUnit: units.map((u) => ({
          unitCode: u.code,
          unitName: u.name,
          count: u._count.ppdbApplications
        })),
        byStatus: statusCounts.map((s) => ({
          status: s.status,
          count: s._count.id
        }))
      }
    };
  });
}
