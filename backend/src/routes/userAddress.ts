import { userAddressController } from '../controllers';

export const userAddressRoutes = (app: any) =>
    app.group('/user/addresses', (group: any) =>
        group.guard({ detail: { tags: ['User Addresses'] } }, (g) => g.use(userAddressController))
    );
