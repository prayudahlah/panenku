import { Elysia } from 'elysia';

export const listPanen = (app: Elysia) =>
  app.get('/panen', async ({ query }) => {
    return { message: 'List panen endpoint placeholder', data: [] };
  });

export const createPanen = (app: Elysia) =>
  app.post('/panen', async ({ body }) => {
    return { message: 'Create panen endpoint placeholder' };
  });

export const getPanenById = (app: Elysia) =>
  app.get('/panen/:id', async ({ params }) => {
    return { message: 'Get panen by id endpoint placeholder' };
  });

export const updatePanen = (app: Elysia) =>
  app.put('/panen/:id', async ({ params, body }) => {
    return { message: 'Update panen endpoint placeholder' };
  });

export const deletePanen = (app: Elysia) =>
  app.delete('/panen/:id', async ({ params }) => {
    return { message: 'Delete panen endpoint placeholder' };
  });
