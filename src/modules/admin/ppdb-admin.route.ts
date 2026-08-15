import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { requireAdminAuth, recordAuditLog } from '../../common/utils/admin-auth.js';
import { PpdbStatus } from '@prisma/client';
import { NotFoundError } from '../../common/errors/app-error.js';

export async function adminPpdbRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdminAuth);

  // GET /api/v1/admin/ppdb
  fastify.get('/admin/ppdb', async (req) => {
    const {
      q,
      status,
      unit,
      page = '1',
      limit = '20'
    } = req.query as {
      q?: string;
      status?: string;
      unit?: string;
      page?: string;
      limit?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as PpdbStatus;
    }

    if (unit && unit !== 'ALL') {
      where.unit = { code: unit.toLowerCase() };
    }

    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { registrationNo: { contains: q, mode: 'insensitive' } },
        { nisn: { contains: q, mode: 'insensitive' } },
        { whatsapp: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.ppdbApplication.count({ where }),
      prisma.ppdbApplication.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { unit: true }
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

  // GET /api/v1/admin/ppdb/:id
  fastify.get('/admin/ppdb/:id', async (req) => {
    const { id } = req.params as { id: string };
    const applicant = await prisma.ppdbApplication.findUnique({
      where: { id },
      include: { unit: true }
    });

    if (!applicant) throw new NotFoundError('Data pendaftar PPDB tidak ditemukan.');

    return {
      success: true,
      data: applicant
    };
  });

  // PATCH /api/v1/admin/ppdb/:id/status
  fastify.patch('/admin/ppdb/:id/status', async (req) => {
    const { id } = req.params as { id: string };
    const { status, notes } = req.body as { status: PpdbStatus; notes?: string };

    const applicant = await prisma.ppdbApplication.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined
      },
      include: { unit: true }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'UPDATE_PPDB_STATUS',
      entityType: 'PpdbApplication',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { registrationNo: applicant.registrationNo, status }
    });

    return {
      success: true,
      message: `Status pendaftar berhasil diperbarui menjadi ${status}.`,
      data: applicant
    };
  });

  // GET /api/v1/admin/ppdb/export
  fastify.get('/admin/ppdb/export', async (req) => {
    const { status, unit } = req.query as { status?: string; unit?: string };
    const where: any = {};
    if (status && status !== 'ALL') where.status = status as PpdbStatus;
    if (unit && unit !== 'ALL') where.unit = { code: unit.toLowerCase() };

    const items = await prisma.ppdbApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { unit: true }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'EXPORT_PPDB_DATA',
      entityType: 'PpdbApplication',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { count: items.length }
    });

    return {
      success: true,
      data: items
    };
  });
}
