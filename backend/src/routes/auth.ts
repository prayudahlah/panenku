import { Elysia } from 'elysia';
import { login, register, logout, me } from '../controllers/auth';

export const authRoutes = (app: Elysia) =>
  app.group('/auth', (group) =>
    group
      .use(register)
      .use(login)
      .use(logout)
      .use(me)
  );
