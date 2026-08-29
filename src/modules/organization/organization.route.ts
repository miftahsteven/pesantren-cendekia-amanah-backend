import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function organizationRoutes(fastify: FastifyInstance) {
  // GET /api/v1/organizations
  fastify.get('/organizations', async (req) => {
    const { unitSlug, category, q } = req.query as {
      unitSlug?: string;
      category?: string;
      q?: string;
    };

    const whereClause: any = {
      isActive: true
    };

    if (unitSlug && unitSlug !== 'ALL') {
      whereClause.unit = {
        slug: unitSlug
      };
    }

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (q && q.trim()) {
      whereClause.OR = [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { position: { contains: q.trim(), mode: 'insensitive' } },
        { education: { contains: q.trim(), mode: 'insensitive' } },
        { bio: { contains: q.trim(), mode: 'insensitive' } }
      ];
    }

    const members = await prisma.unitOrganization.findMany({
      where: whereClause,
      include: {
        unit: {
          select: {
            id: true,
            slug: true,
            name: true,
            shortName: true,
            badge: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    const data = members.map((m) => ({
      id: m.id,
      name: m.name,
      position: m.position,
      category: m.category,
      level: m.level,
      photoUrl: m.photoUrl || '/uploads/gallery/guru1.png',
      nip: m.nip,
      education: m.education,
      bio: m.bio,
      sortOrder: m.sortOrder,
      isActive: m.isActive,
      unitId: m.unitId,
      unitName: m.unit?.name || 'Pesantren Cendekia Amanah',
      unitShortName: m.unit?.shortName || 'Pesantren',
      unitSlug: m.unit?.slug || 'pesantren',
      unitBadge: m.unit?.badge || 'Pendidikan Terpadu',
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    return {
      success: true,
      data
    };
  });
}
