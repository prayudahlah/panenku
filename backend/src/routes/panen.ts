import { Elysia } from 'elysia';
import { listPanen, createPanen, getPanenById, updatePanen, deletePanen } from '../controllers/panen';

export const panenRoutes = (app: Elysia) =>
  app.group('/panen', (group) =>
    group
      .use(listPanen)
      .use(createPanen)
      .use(getPanenById)
      .use(updatePanen)
      .use(deletePanen)
  );
