import { t } from 'elysia';

export const loginSchema = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6 }),
});

export const registerSchema = t.Object({
  name: t.String({ minLength: 2 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6 }),
});
