import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { betterSession } from 'elysia-better-session';
import { upsertSessionAdapter } from './utils/session-adapter';
import { authRoutes, cartRoutes, sellerRoutes, referenceRoutes, userRoutes, productRoutes, auditRoutes, negotiationRoutes, notificationRoutes } from './routes';

const app = new Elysia()
    .onError(({ code, error, set }) => {
        console.error(`[${code}]`, error);
        set.status = 503;
        return { success: false, message: 'Layanan tidak tersedia. Silakan coba lagi.' };
    })
    .use(cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    }))
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
    .group('/api/v1', (api) => api.use(authRoutes).use(cartRoutes).use(referenceRoutes).use(sellerRoutes).use(userRoutes).use(productRoutes).use(auditRoutes).use(negotiationRoutes).use(notificationRoutes))
    .listen(process.env.BACKEND_PORT || 3000);

console.log(`Panenku API running on port ${app.server?.port}`);
