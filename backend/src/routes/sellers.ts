import { sellerController } from '../controllers';

export const sellerRoutes = (app: any) =>
    app.group('/sellers', (group: any) => group.use(sellerController));
