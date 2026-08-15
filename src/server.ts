import { buildApp } from './app.js';
import { env } from './config/env.js';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      host: env.HOST,
      port: env.PORT
    });

    console.log(`
============================================================
  🏛️  Pesantren Cendekia Amanah — Backend REST API
============================================================
  🚀  Environment  : ${env.NODE_ENV}
  🌐  Server Base  : http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}
  📡  API Base     : http://localhost:${env.PORT}${env.API_PREFIX}
  📖  Swagger Docs : http://localhost:${env.PORT}${env.API_PREFIX}/docs
  🩺  Health Check : http://localhost:${env.PORT}${env.API_PREFIX}/health
============================================================
    `);

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
        await app.close();
        process.exit(0);
      });
    }
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
