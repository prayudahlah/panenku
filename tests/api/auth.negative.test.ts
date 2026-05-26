const BASE = 'http://localhost:3000/api';

test('login with wrong password returns 401', async () => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'wrongpass' }),
  });
  expect(res.status).toBe(401);
});

test('login with empty email returns 422', async () => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '', password: 'password123' }),
  });
  expect(res.status).toBe(422);
});

test('register with existing email returns 409', async () => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }),
  });
  expect(res.status).toBe(409);
});
