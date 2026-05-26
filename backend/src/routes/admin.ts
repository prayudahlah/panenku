import { adminController } from '../controllers';

export const adminRoutes = (app: any) =>
    app.group('/admin', (group: any) => group.use(adminController));
