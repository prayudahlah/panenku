import { authController } from '../controllers';

export const authRoutes = (app: any) =>
    app.group('/auth', (group: any) => group.use(authController));
