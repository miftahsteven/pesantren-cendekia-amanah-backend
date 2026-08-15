import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { verifyPassword, generateSecureToken, hashToken } from '../../common/utils/crypto.js';
import { ValidationError, UnauthorizedError } from '../../common/errors/app-error.js';
import { AdminStatus } from '@prisma/client';

const loginSchema = z.object({
  email: z.string().min(2, 'Username atau email wajib diisi').optional(),
  username: z.string().min(2, 'Username wajib diisi').optional(),
  identifier: z.string().min(2, 'Identifier wajib diisi').optional(),
  password: z.string().min(6, 'Password minimal 6 karakter')
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/v1/admin/auth/login
  fastify.post('/admin/auth/login', async (req, reply) => {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Username/Email atau password tidak valid.');
    }

    const { email, username, identifier, password } = parseResult.data;
    const loginIdentifier = (username || email || identifier || '').trim();

    const user = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { username: loginIdentifier }
        ]
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || user.status !== AdminStatus.ACTIVE) {
      throw new UnauthorizedError('Username/Email atau password salah.');
    }

    const isMatch = await verifyPassword(user.passwordHash, password);
    if (!isMatch) {
      // Increment failed login count
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } }
      });
      throw new UnauthorizedError('Email atau password salah.');
    }

    // Reset failed login count and update last login
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip
      }
    });

    // Generate secure opaque session token
    const rawToken = generateSecureToken(32);
    const tokenHashed = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.SESSION_EXPIRES_IN_HOURS * 3600 * 1000);

    await prisma.adminSession.create({
      data: {
        adminUserId: user.id,
        tokenHash: tokenHashed,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        expiresAt
      }
    });

    // Set secure HttpOnly cookie
    reply.setCookie(env.SESSION_COOKIE_NAME, rawToken, {
      path: '/',
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      expires: expiresAt
    });

    // Collect permissions
    const permissionsSet = new Set<string>();
    const rolesList = user.userRoles.map((ur) => {
      ur.role.rolePermissions.forEach((rp) => permissionsSet.add(rp.permission.code));
      return ur.role.code;
    });

    return {
      success: true,
      message: 'Login berhasil.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: rolesList,
        permissions: Array.from(permissionsSet)
      }
    };
  });

  // POST /api/v1/admin/auth/logout
  fastify.post('/admin/auth/logout', async (req, reply) => {
    const rawToken = req.cookies[env.SESSION_COOKIE_NAME];
    if (rawToken) {
      const tokenHashed = hashToken(rawToken);
      await prisma.adminSession.deleteMany({
        where: { tokenHash: tokenHashed }
      });
    }

    reply.clearCookie(env.SESSION_COOKIE_NAME, {
      path: '/'
    });

    return {
      success: true,
      message: 'Logout berhasil.'
    };
  });

  // GET /api/v1/admin/auth/me
  fastify.get('/admin/auth/me', async (req) => {
    const rawToken = req.cookies[env.SESSION_COOKIE_NAME];
    if (!rawToken) {
      throw new UnauthorizedError('Sesi login tidak ditemukan.');
    }

    const tokenHashed = hashToken(rawToken);
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash: tokenHashed },
      include: {
        adminUser: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Sesi telah berakhir. Silakan login kembali.');
    }

    const user = session.adminUser;
    const permissionsSet = new Set<string>();
    const rolesList = user.userRoles.map((ur) => {
      ur.role.rolePermissions.forEach((rp) => permissionsSet.add(rp.permission.code));
      return ur.role.code;
    });

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: rolesList,
        permissions: Array.from(permissionsSet)
      }
    };
  });
}
