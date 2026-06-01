import { auditController } from '../controllers';

export const auditRoutes = (app: any) =>
    app.group('/audit-logs', (group: any) =>
        group.guard({ detail: { tags: ['Audit'] } }, (g) => g.use(auditController))
    );
