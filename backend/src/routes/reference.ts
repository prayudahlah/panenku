import { referenceController } from '../controllers';

export const referenceRoutes = (app: any) =>
    app.guard({ detail: { tags: ['References'] } }, (g) => g.use(referenceController));
