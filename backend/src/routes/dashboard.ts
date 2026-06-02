import { dashboardController } from '../controllers';

export const dashboardRoutes = (app: any) =>
    app.group('/dashboard', (group: any) =>
        group.guard({ detail: { tags: ['Dashboard'] } }, (g) => g.use(dashboardController))
    );
