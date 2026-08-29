import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function facilityRoutes(fastify: FastifyInstance) {
  // GET /api/v1/facilities
  fastify.get('/facilities', async (req) => {
    const { unitSlug, q } = req.query as { unitSlug?: string; q?: string };

    const whereClause: any = {
      isActive: true
    };

    if (unitSlug && unitSlug !== 'ALL') {
      whereClause.unit = {
        slug: unitSlug
      };
    }

    if (q && q.trim()) {
      whereClause.OR = [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } }
      ];
    }

    const facilities = await prisma.unitFacility.findMany({
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
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    const data = facilities.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      imageUrl: f.imageUrl,
      sortOrder: f.sortOrder,
      isActive: f.isActive,
      unitId: f.unitId,
      unitName: f.unit?.name || 'Pesantren Cendekia Amanah',
      unitShortName: f.unit?.shortName || 'Pesantren',
      unitSlug: f.unit?.slug || 'pesantren',
      unitBadge: f.unit?.badge || 'Kampus Terpadu',
      createdAt: f.createdAt,
      updatedAt: f.updatedAt
    }));

    return {
      success: true,
      data,
      total: data.length
    };
  });
}
