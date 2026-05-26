const BASE = 'http://localhost:3000/api';

test('register with valid data returns 201', async () => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }),
  });
  expect(res.status).toBe(201);
});

test('login with valid credentials returns 200 and session', async () => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('session');
});
