import { notificationService, sseService } from '../services';

export const notificationController = (app: any) =>
    app
        .get('/', async ({ session, set, query }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }

            const page = query.page ? Number(query.page) : 1;
            const limit = query.limit ? Number(query.limit) : 20;
            const result = await notificationService.list(userId, page, limit);
            return { success: true, data: result.rows, meta: { total: result.total, page, limit } };
        })

        .get('/unread', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }

            const count = await notificationService.getUnreadCount(userId);
            return { success: true, data: { count } };
        })

        .patch('/:id/read', async ({ params: { id }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }

            await notificationService.markAsRead(Number(id), userId);
            return { success: true };
        })

        .patch('/read-all', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }

            await notificationService.markAllAsRead(userId);
            return { success: true };
        })

        .get('/stream', async ({ session, request }: any) => {
            const userId = session.get('userId');
            if (!userId) return new Response('Unauthorized', { status: 401 });

            let streamController: ReadableStreamDefaultController | null = null;

            const stream = new ReadableStream({
                start(controller) {
                    streamController = controller;
                    sseService.addClient(userId, controller);
                    try {
                        controller.enqueue(new TextEncoder().encode('event: connected\ndata: {}\n\n'));
                    } catch { /* ignore */ }
                },
                cancel() {
                    if (streamController) {
                        sseService.removeClient(userId, streamController);
                    }
                },
            });

            request.signal?.addEventListener('abort', () => {
                if (streamController) {
                    sseService.removeClient(userId, streamController);
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no',
                },
            });
        });
