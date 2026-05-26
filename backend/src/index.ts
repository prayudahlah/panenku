import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { betterSession, createDrizzleSessionAdapter } from 'elysia-better-session';
import { db } from './db';
import { sessions } from './db/schema/session';
import { authRoutes } from './routes/auth';
import { panenRoutes } from './routes/panen';
import { laporanRoutes } from './routes/laporan';

const app = new Elysia()
  .use(swagger({
    path: '/api/v1/docs',
    scalarConfig: {
      spec: {
        url: '/api/v1/docs/json',
      },
    },
    documentation: {
      info: { title: 'Panenku API', version: '1.0.0' },
    },
  }))
  .use(
    betterSession({
      adapter: createDrizzleSessionAdapter({
        db,
        table: sessions,
        columns: {
          id: (t) => t.id,
          expiresAt: (t) => t.expiresAt,
          data: (t) => t.data,
        },
      }),
      ttl: 1000 * 60 * 60 * 24,
      cookie: {
        name: 'panenku_session',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
      initialData: () => ({ userId: null, email: null }),
    })
  )
  .group('/api', (api) =>
    api
      .use(authRoutes)
      .use(panenRoutes)
      .use(laporanRoutes)
  )
  .listen(process.env.BACKEND_PORT || 3000);

console.log(`🚀 Panenku API running on port ${app.server?.port}`);
