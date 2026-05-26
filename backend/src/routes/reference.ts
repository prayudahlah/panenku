import { referenceController } from '../controllers';

export const referenceRoutes = (app: any) =>
    app.group('/references', (group: any) => group.use(referenceController));
