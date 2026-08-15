import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/errors/app-error.js';

export async function educationUnitRoutes(fastify: FastifyInstance) {
  // GET /api/v1/units
  fastify.get('/units', async () => {
    const units = await prisma.educationUnit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        features: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        programs: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        facilities: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        activities: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        achievements: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
      }
    });

    return {
      success: true,
      data: units
    };
  });

  // GET /api/v1/units/:slug
  fastify.get('/units/:slug', async (req) => {
    const { slug } = req.params as { slug: string };

    const unit = await prisma.educationUnit.findUnique({
      where: { slug },
      include: {
        features: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        programs: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        facilities: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        activities: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        achievements: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        testimonials: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        brochures: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!unit) {
      throw new NotFoundError(`Unit pendidikan dengan slug '${slug}' tidak ditemukan.`);
    }

    return {
      success: true,
      data: unit
    };
  });
}
