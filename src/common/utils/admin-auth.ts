import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { hashToken } from './crypto.js';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: AuthenticatedAdmin;
  }
}

export async function requireAdminAuth(req: FastifyRequest, _reply: FastifyReply) {
  let rawToken = req.cookies[env.SESSION_COOKIE_NAME];
  
  if (!rawToken && req.headers.authorization?.startsWith('Bearer ')) {
    rawToken = req.headers.authorization.slice(7);
  }

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
  if (user.status !== 'ACTIVE') {
    throw new ForbiddenError('Akun Anda sedang dinonaktifkan.');
  }

  const permissionsSet = new Set<string>();
  const rolesList = user.userRoles.map((ur) => {
    ur.role.rolePermissions.forEach((rp) => permissionsSet.add(rp.permission.code));
    return ur.role.code;
  });

  req.adminUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: rolesList,
    permissions: Array.from(permissionsSet)
  };
}

export async function recordAuditLog(params: {
  actorAdminId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorAdminId: params.actorAdminId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        metadata: params.metadata ? params.metadata : undefined
      }
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
