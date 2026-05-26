import { Elysia } from 'elysia';

export const isAuthenticated = (app: Elysia) =>
  app.derive(({ session }) => {
    return { user: session?.userId ? { id: session.userId } : null };
  });
