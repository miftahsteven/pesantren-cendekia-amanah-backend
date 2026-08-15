import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { generateRegistrationNo } from '../../common/utils/crypto.js';
import { ValidationError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { PpdbStatus, AttendanceMode } from '@prisma/client';

const ppdbApplicationSchema = z.object({
  academicYear: z.string().default('2027/2028'),
  fullName: z.string().min(2, 'Nama lengkap calon santri minimal 2 karakter').max(200),
  nisn: z.string().length(10, 'NISN harus terdiri dari tepat 10 digit numerik').regex(/^\d+$/, 'NISN hanya boleh berupa angka'),
  birthPlaceDate: z.string().min(3, 'Tempat & tanggal lahir wajib diisi').max(150),
  previousSchool: z.string().min(2, 'Sekolah asal wajib diisi').max(255),
  parentName: z.string().min(2, 'Nama orang tua/wali minimal 2 karakter').max(200),
  whatsapp: z.string().min(9, 'Nomor WhatsApp tidak valid').max(20),
  address: z.string().min(5, 'Alamat lengkap wajib diisi').max(2000),
  unitCode: z.enum(['pesantren', 'smp', 'sma', 'diniyah'], {
    errorMap: () => ({ message: 'Pilihan unit pendidikan tidak valid' })
  }),
  attendanceMode: z.enum(['BOARDING', 'FULLDAY', 'NON_FORMAL']).optional(),
  notes: z.string().max(1000).optional()
});

export async function ppdbRoutes(fastify: FastifyInstance) {
  // POST /api/v1/ppdb/applications
  fastify.post('/ppdb/applications', async (req, reply) => {
    const parseResult = ppdbApplicationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new ValidationError('Data pendaftaran PPDB tidak valid.', fieldErrors);
    }

    const data = parseResult.data;

    // Check duplicate application in the same academic year
    const existingApp = await prisma.ppdbApplication.findUnique({
      where: {
        academicYear_nisn: {
          academicYear: data.academicYear,
          nisn: data.nisn
        }
      }
    });

    if (existingApp) {
      throw new ConflictError(
        `Calon santri dengan NISN ${data.nisn} sudah terdaftar pada tahun ajaran ${data.academicYear} dengan nomor registrasi ${existingApp.registrationNo}.`
      );
    }

    // Resolve education unit ID
    const unit = await prisma.educationUnit.findUnique({
      where: { code: data.unitCode }
    });

    // Generate unique random registration number
    let registrationNo = generateRegistrationNo(data.academicYear);
    let attempts = 0;
    while (attempts < 5) {
      const collision = await prisma.ppdbApplication.findUnique({ where: { registrationNo } });
      if (!collision) break;
      registrationNo = generateRegistrationNo(data.academicYear);
      attempts++;
    }

    const application = await prisma.ppdbApplication.create({
      data: {
        registrationNo,
        academicYear: data.academicYear,
        fullName: data.fullName,
        nisn: data.nisn,
        birthPlaceDate: data.birthPlaceDate,
        previousSchool: data.previousSchool,
        parentName: data.parentName,
        whatsapp: data.whatsapp,
        address: data.address,
        unitCode: data.unitCode,
        unitId: unit ? unit.id : null,
        attendanceMode: (data.attendanceMode as AttendanceMode) || null,
        notes: data.notes || null,
        status: PpdbStatus.SUBMITTED,
        sourceIp: req.ip,
        userAgent: req.headers['user-agent'] || null,
        statusHistories: {
          create: {
            fromStatus: null,
            toStatus: PpdbStatus.SUBMITTED,
            note: 'Pendaftaran awal berhasil disubmit secara online.'
          }
        }
      }
    });

    reply.status(201);
    return {
      success: true,
      data: {
        registrationNo: application.registrationNo,
        academicYear: application.academicYear,
        fullName: application.fullName,
        unitCode: application.unitCode,
        status: application.status,
        submittedAt: application.submittedAt
      }
    };
  });
}
