import { Elysia } from 'elysia';

export const register = (app: Elysia) =>
  app.post('/register', async ({ body, session }) => {
    return { message: 'Register endpoint placeholder' };
  });

export const login = (app: Elysia) =>
  app.post('/login', async ({ body, session }) => {
    return { message: 'Login endpoint placeholder' };
  });

export const logout = (app: Elysia) =>
  app.post('/logout', async ({ session }) => {
    return { message: 'Logout endpoint placeholder' };
  });

export const me = (app: Elysia) =>
  app.get('/me', async ({ session }) => {
    return { message: 'Me endpoint placeholder' };
  });
