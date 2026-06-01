import { notificationController } from '../controllers';

export const notificationRoutes = (app: any) =>
    app.group('/notifications', (group: any) =>
        group.guard({ detail: { tags: ['Notifications'] } }, (g) => g.use(notificationController))
    );
