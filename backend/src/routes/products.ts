import { productsController } from '../controllers';

export const productRoutes = (app: any) =>
    app.group('/products', (group: any) => group.use(productsController));
