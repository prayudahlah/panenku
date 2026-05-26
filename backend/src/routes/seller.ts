import { sellerController } from '../controllers';

export const sellerRoutes = (app: any) =>
    app.group('/seller', (group: any) => group.use(sellerController));
