import { usersController, userAddressController } from '../controllers';

export const userRoutes = (app: any) =>
    app.group('/users', (group: any) =>
        group.guard({ detail: { tags: ['Users'] } }, (g) =>
            g.use(usersController).group('/addresses', (g2: any) => g2.use(userAddressController))
        )
    );
