import { cartController } from '../controllers';

export const cartRoutes = (app: any) =>
    app.group('/carts', (group: any) =>
        group.guard({ detail: { tags: ['Cart'] } }, (g) => g.use(cartController))
    );
