import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and shows hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/camdiag/i);
    await expect(page.getByRole('heading', { name: /AI Diagnostics/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/AI-powered diagnostic support/i)).toBeVisible();
  });

  test('shows key landing page elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Features/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Get Started Free/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows login modal trigger', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('button', { name: /log in|login|sign in/i });
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
  });

  test('language toggle is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Login Modal', () => {
  test('opens login modal and shows form fields', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('button', { name: /log in|login|sign in/i });
    await loginBtn.click();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
  });

  test('toggles between login and register', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('button', { name: /log in|login|sign in/i });
    await loginBtn.click();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible({ timeout: 5000 });
    const toggleLink = page.getByText(/create account|register|sign up/i);
    await toggleLink.click();
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
  });

  test('continue without account navigates to app', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('button', { name: /log in|login|sign in/i });
    await loginBtn.click();
    await expect(page.getByText(/continue without|skip/i)).toBeVisible({ timeout: 5000 });
    await page.getByText(/continue without|skip/i).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
  });
});

test.describe('App Navigation', () => {
  test('navigates to diagnostic hub', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByRole('heading', { name: /Diagnostic Hub/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /New Scan/i })).toBeVisible();
  });

  test('navigates to drug database', async ({ page }) => {
    await page.goto('/drugs');
    await expect(page.getByRole('heading', { name: /Drug Database/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('searchbox', { name: /search/i }).or(page.getByPlaceholder(/search/i))).toBeVisible();
  });

  test('navigates to settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 15000 });
  });

  test('bottom nav bar is visible on app pages', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByRole('navigation', { name: /main/i })).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Accessibility', () => {
  test('landing page has visible headings', async ({ page }) => {
    await page.goto('/');
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
  });
});