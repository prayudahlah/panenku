import { contractController } from '../controllers';

export const contractRoutes = (app: any) =>
    app.group('/contracts', (group: any) =>
        group.guard({ detail: { tags: ['Contracts'] } }, (g) => g.use(contractController))
    );
