import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';

export async function navigationRoutes(fastify: FastifyInstance) {
  // GET /api/v1/navigation
  fastify.get('/navigation', async () => {
    const menus = await prisma.menu.findMany({
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    // Default primary navigation structure if menus table is not yet customized
    const defaultNav = [
      { label: 'Beranda', href: '/' },
      { label: 'Tentang Kami', href: '/tentang-kami' },
      { label: 'Pesantren', href: '/pesantren' },
      { label: 'SMP', href: '/smp' },
      { label: 'SMA', href: '/sma' },
      { label: 'Madrasah Diniyah', href: '/diniyah' },
      { label: 'Berita', href: '/berita' },
      { label: 'Opini', href: '/opini' },
      { label: 'Kontak', href: '/kontak' },
      { label: 'PPDB Online', href: '/ppdb', isHighlighted: true }
    ];

    return {
      success: true,
      data: {
        menus,
        primary: defaultNav
      }
    };
  });
}
