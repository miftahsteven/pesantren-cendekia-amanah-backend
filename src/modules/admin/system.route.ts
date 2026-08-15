import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { requireAdminAuth, recordAuditLog } from '../../common/utils/admin-auth.js';
import { hashPassword } from '../../common/utils/crypto.js';
import { ValidationError, NotFoundError } from '../../common/errors/app-error.js';

export async function adminSystemRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdminAuth);

  // GET /api/v1/admin/system/users
  fastify.get('/admin/system/users', async () => {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        status: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    return {
      success: true,
      data: users.map((u) => ({
        ...u,
        roles: u.userRoles.map((ur) => ur.role.name)
      }))
    };
  });

  // POST /api/v1/admin/system/users
  fastify.post('/admin/system/users', async (req) => {
    const body = req.body as any;
    if (!body.name || !body.email || !body.password) {
      throw new ValidationError('Nama, email, dan password wajib diisi.');
    }

    const existing = await prisma.adminUser.findUnique({ where: { email: body.email } });
    if (existing) throw new ValidationError('Email admin sudah terdaftar.');

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.adminUser.create({
      data: {
        name: body.name,
        email: body.email,
        username: body.username || body.email.split('@')[0],
        passwordHash,
        status: 'ACTIVE'
      }
    });

    // Assign role if specified
    const defaultRole = await prisma.role.findFirst({ where: { code: body.roleCode || 'EDITOR' } });
    if (defaultRole) {
      await prisma.adminUserRole.create({
        data: {
          adminUserId: user.id,
          roleId: defaultRole.id
        }
      });
    }

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'CREATE_ADMIN_USER',
      entityType: 'AdminUser',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { name: user.name, email: user.email }
    });

    return {
      success: true,
      message: 'Admin baru berhasil dibuat.',
      data: { id: user.id, name: user.name, email: user.email }
    };
  });

  // GET /api/v1/admin/system/audit-logs
  fastify.get('/admin/system/audit-logs', async (req) => {
    const { page = '1', limit = '30' } = req.query as { page?: string; limit?: string };
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  });

  // GET /api/v1/admin/system/sessions
  fastify.get('/admin/system/sessions', async () => {
    const sessions = await prisma.adminSession.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: {
        adminUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return {
      success: true,
      data: sessions
    };
  });

  // DELETE /api/v1/admin/system/sessions/:id
  fastify.delete('/admin/system/sessions/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.adminSession.delete({ where: { id } });
    return { success: true, message: 'Sesi berhasil dihentikan.' };
  });
}
