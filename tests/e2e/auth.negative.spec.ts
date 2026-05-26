import { test, expect } from '@playwright/test';

test('shows error on empty login form submit', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error-msg')).toBeVisible();
});

test('shows error on wrong credentials', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'wrongpass');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error-toast')).toBeVisible();
});

test('shows error on duplicate email registration', async ({ page }) => {
  await page.goto('http://localhost:5173/register');
  await page.fill('[name="name"]', 'Test User');
  await page.fill('[name="email"]', 'existing@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error-msg')).toBeVisible();
});
