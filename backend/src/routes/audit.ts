import { auditController } from '../controllers';

export const auditRoutes = (app: any) =>
    app.group('/audit-logs', (group: any) => group.use(auditController));
