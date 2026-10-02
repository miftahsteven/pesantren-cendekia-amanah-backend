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

  // ==========================================
  // PPDB UNIT FORM LINKS MANAGEMENT
  // ==========================================

  // GET /api/v1/admin/ppdb/links
  fastify.get('/admin/ppdb/links', async () => {
    const links = await prisma.ppdbLink.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return {
      success: true,
      data: links
    };
  });

  // PUT /api/v1/admin/ppdb/links/:id
  fastify.put('/admin/ppdb/links/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const updated = await prisma.ppdbLink.update({
      where: { id },
      data: {
        unitName: body.unitName,
        title: body.title,
        description: body.description,
        formUrl: body.formUrl,
        academicYear: body.academicYear,
        badge: body.badge,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'UPDATE_PPDB_LINK',
      entityType: 'PpdbLink',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Tautan form PPDB berhasil diperbarui.',
      data: updated
    };
  });

  // POST /api/v1/admin/ppdb/links
  fastify.post('/admin/ppdb/links', async (req) => {
    const body = req.body as any;

    const created = await prisma.ppdbLink.create({
      data: {
        unitCode: body.unitCode,
        unitName: body.unitName,
        title: body.title,
        description: body.description || '',
        formUrl: body.formUrl,
        academicYear: body.academicYear || '2027/2028',
        badge: body.badge || '',
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      }
    });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'CREATE_PPDB_LINK',
      entityType: 'PpdbLink',
      entityId: created.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Tautan form PPDB berhasil ditambahkan.',
      data: created
    };
  });

  // DELETE /api/v1/admin/ppdb/links/:id
  fastify.delete('/admin/ppdb/links/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.ppdbLink.delete({ where: { id } });

    await recordAuditLog({
      actorAdminId: req.adminUser?.id,
      action: 'DELETE_PPDB_LINK',
      entityType: 'PpdbLink',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return {
      success: true,
      message: 'Tautan form PPDB berhasil dihapus.'
    };
  });
}
