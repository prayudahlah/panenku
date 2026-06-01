import { negotiationController } from '../controllers';

export const negotiationRoutes = (app: any) =>
    app.group('/negotiations', (group: any) =>
        group.guard({ detail: { tags: ['Negotiations'] } }, (g) => g.use(negotiationController))
    );
