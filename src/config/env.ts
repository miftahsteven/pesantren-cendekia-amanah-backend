import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('Pesantren Cendekia Amanah API'),
  APP_VERSION: z.string().default('1.0.0'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(3001),
  API_PREFIX: z.string().default('/api/v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  PUBLIC_WEB_URL: z.string().default('http://localhost:3000'),
  ADMIN_WEB_URL: z.string().default('http://localhost:5173'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),

  SESSION_COOKIE_NAME: z.string().default('ca_admin_session'),
  SESSION_SECRET: z.string().default('default_session_secret_min_64_characters_long_for_security_testing_purposes'),
  SESSION_EXPIRES_IN_HOURS: z.coerce.number().default(12),

  COOKIE_HTTP_ONLY: z.coerce.boolean().default(true),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  CSRF_SECRET: z.string().default('default_csrf_secret_min_32_chars'),

  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().default(300),
  RATE_LIMIT_GLOBAL_WINDOW: z.coerce.number().default(60),

  LOG_LEVEL: z.string().default('info'),
  ENABLE_SWAGGER: z.coerce.boolean().default(true)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
