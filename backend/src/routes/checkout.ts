import { checkoutController } from '../controllers';

export const checkoutRoutes = (app: any) =>
    app.group('/checkouts', (group: any) =>
        group.guard({ detail: { tags: ['Checkout'] } }, (g) => g.use(checkoutController))
    );
