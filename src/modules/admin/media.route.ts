import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { requireAdminAuth, recordAuditLog } from '../../common/utils/admin-auth.js';
import fs from 'fs';
import path from 'path';

export async function adminMediaRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdminAuth);

  // GET /api/v1/admin/media
  fastify.get('/admin/media', async (req) => {
    const { category, q } = req.query as { category?: string; q?: string };
    const uploadsDir = path.resolve(process.cwd(), 'storage/uploads');

    // Read all categories and files from physical storage
    const categories = ['news', 'gallery', 'units', 'partners', 'guru', 'common', 'logo', 'bisnis', 'brochures', 'avatars'];
    const selectedCategories = category && category !== 'ALL' ? [category] : categories;

    const filesList: any[] = [];

    for (const cat of selectedCategories) {
      const catDir = path.join(uploadsDir, cat);
      if (fs.existsSync(catDir)) {
        const files = fs.readdirSync(catDir);
        for (const file of files) {
          if (file.startsWith('.')) continue; // skip hidden
          const fullPath = path.join(catDir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            const url = `/uploads/${cat}/${file}`;
            const ext = path.extname(file).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.svg' ? 'image/svg+xml' : ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';

            if (!q || file.toLowerCase().includes(q.toLowerCase())) {
              filesList.push({
                id: `${cat}-${file}`,
                filename: file,
                category: cat,
                url,
                sizeBytes: stat.size,
                mimeType,
                createdAt: stat.birthtime || stat.mtime
              });
            }
          }
        }
      }
    }

    // Sort by recent
    filesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      data: filesList,
      total: filesList.length
    };
  });

  // DELETE /api/v1/admin/media
  fastify.delete('/admin/media', async (req) => {
    const { url } = req.query as { url: string };
    if (!url || !url.startsWith('/uploads/')) {
      return { success: false, message: 'URL tidak valid' };
    }

    const relPath = url.replace(/^\/uploads\//, '');
    const fullPath = path.resolve(process.cwd(), 'storage/uploads', relPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      await recordAuditLog({
        actorAdminId: req.adminUser?.id,
        action: 'DELETE_MEDIA_ASSET',
        entityType: 'MediaAsset',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { url }
      });
      return { success: true, message: 'File media berhasil dihapus.' };
    }

    return { success: false, message: 'File tidak ditemukan.' };
  });
}
