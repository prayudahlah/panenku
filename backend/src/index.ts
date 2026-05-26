import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { betterSession } from 'elysia-better-session';
import { upsertSessionAdapter } from './utils/session-adapter';
import { authRoutes, sellerRoutes, referenceRoutes } from './routes';

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
            adapter: upsertSessionAdapter,
            ttl: 1000 * 60 * 60 * 24,
            cookie: {
                name: 'panenku_session',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            },
            initialData: () => ({ userId: null, email: null, role: null }),
        })
    )
    .group('/api/v1', (api) => api.use(authRoutes).use(referenceRoutes).use(sellerRoutes))
    .listen(process.env.BACKEND_PORT || 3000);

console.log(`Panenku API running on port ${app.server?.port}`);
