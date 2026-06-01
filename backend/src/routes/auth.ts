import { authController } from '../controllers';

export const authRoutes = (app: any) =>
    app.group('/auth', (group: any) =>
        group.guard({ detail: { tags: ['Auth'] } }, (g) => g.use(authController))
    );
