import { usersController } from '../controllers';

export const userRoutes = (app: any) =>
    app.group('/users', (group: any) => group.use(usersController));
