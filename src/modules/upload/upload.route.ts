import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { AppError } from '../../common/errors/app-error.js';

const UPLOADS_ROOT = path.resolve(process.cwd(), 'storage/uploads');

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_DOCUMENT_MIME = ['application/pdf'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB

function sanitizeFileName(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return `${base}-${Date.now()}${ext}`;
}

async function saveUploadedFile(
  request: FastifyRequest,
  category: string,
  allowedMimes: string[],
  maxBytes: number
): Promise<{ url: string; fileName: string; size: number; mimeType: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const req = request as any;
  if (typeof req.isMultipart === 'function' && !req.isMultipart()) {
    throw new AppError('Request harus berformat multipart/form-data', 400, 'INVALID_REQUEST');
  }

  const data = typeof req.file === 'function' ? await req.file() : null;
  if (!data) {
    throw new AppError('Tidak ada file yang diunggah', 400, 'NO_FILE');
  }

  if (!allowedMimes.includes(data.mimetype)) {
    throw new AppError(
      `Tipe file tidak diizinkan. Gunakan: ${allowedMimes.join(', ')}`,
      422,
      'INVALID_MIME'
    );
  }

  const categoryDir = path.join(UPLOADS_ROOT, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const fileName = sanitizeFileName(data.filename);
  const filePath = path.join(categoryDir, fileName);

  let bytesWritten = 0;
  const writeStream = fs.createWriteStream(filePath);

  data.file.on('data', (chunk: Buffer) => {
    bytesWritten += chunk.length;
    if (bytesWritten > maxBytes) {
      writeStream.destroy(new Error('FILE_TOO_LARGE'));
    }
  });

  try {
    await pipeline(data.file, writeStream);
  } catch (err: unknown) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'FILE_TOO_LARGE') {
      throw new AppError(
        `Ukuran file melebihi batas maksimum (${Math.round(maxBytes / 1024 / 1024)} MB)`,
        413,
        'FILE_TOO_LARGE'
      );
    }
    throw err;
  }

  const url = `/uploads/${category}/${fileName}`;

  return {
    url,
    fileName,
    size: bytesWritten,
    mimeType: data.mimetype
  };
}

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/upload/image',
    async (request: FastifyRequest<{ Querystring: { category?: string } }>, reply: FastifyReply) => {
      const category = request.query.category ?? 'common';
      const result = await saveUploadedFile(request, category, ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES);
      return reply.code(200).send({ success: true, data: result });
    }
  );

  app.post(
    '/upload/document',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = await saveUploadedFile(request, 'brochures', ALLOWED_DOCUMENT_MIME, MAX_DOCUMENT_BYTES);
      return reply.code(200).send({ success: true, data: result });
    }
  );

  app.delete(
    '/upload',
    async (request: FastifyRequest<{ Querystring: { filePath: string } }>, reply: FastifyReply) => {
      const { filePath } = request.query;

      if (!filePath || !filePath.startsWith('/uploads/')) {
        throw new AppError('Path tidak valid', 400, 'INVALID_PATH');
      }

      const relative = filePath.replace(/^\/uploads\//, '');
      if (relative.includes('..')) {
        throw new AppError('Path tidak valid', 400, 'INVALID_PATH');
      }

      const absolutePath = path.join(UPLOADS_ROOT, relative);

      if (!fs.existsSync(absolutePath)) {
        throw new AppError('File tidak ditemukan', 404, 'FILE_NOT_FOUND');
      }

      fs.unlinkSync(absolutePath);

      return reply.code(200).send({ success: true, message: 'File berhasil dihapus' });
    }
  );
}
