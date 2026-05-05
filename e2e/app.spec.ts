import { test, expect } from '@playwright/test';

const acceptDisclaimer = async (page: import('@playwright/test').Page) => {
  const dialog = page.getByRole('dialog', { name: /medical notice|avis medical|medical/i });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole('button', { name: /i understand|j'ai compris/i }).click();
  }
};

const gotoReady = async (page: import('@playwright/test').Page, path: string, authenticated = false) => {
  if (authenticated) {
    await page.addInitScript(() => {
      window.localStorage.setItem('camdiag_e2e_auth', 'true');
    });
  }
  await page.goto(path);
  await acceptDisclaimer(page);
};

test.describe('Landing Page', () => {
  test('loads and shows hero content', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page).toHaveTitle(/camdiag/i);
    await expect(page.getByRole('heading', { name: /AI Clinical Review/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/AI-assisted clinical review/i)).toBeVisible();
  });

  test('shows key landing page elements', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.getByRole('link', { name: /Features/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Get Started Free/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows login modal trigger', async ({ page }) => {
    await gotoReady(page, '/');
    const loginBtn = page.getByRole('button', { name: /log in|login|sign in/i });
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
  });

  test('language toggle is visible', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Login Modal', () => {
  test('opens login modal and shows form fields', async ({ page }) => {
    await gotoReady(page, '/');
    const loginBtn = page.getByRole('button', { name: /log in|login|sign in/i });
    await loginBtn.click();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
  });

  test('toggles between login and register', async ({ page }) => {
    await gotoReady(page, '/');
    const loginBtn = page.getByRole('button', { name: /log in|login|sign in/i });
    await loginBtn.click();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible({ timeout: 5000 });
    const toggleLink = page.getByText(/create account|register|sign up/i);
    await toggleLink.click();
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
  });

  test('continue without account navigates to the no-AI demo', async ({ page }) => {
    await gotoReady(page, '/');
    const loginBtn = page.getByRole('button', { name: /log in|login|sign in/i });
    await loginBtn.click();
    await expect(page.getByText(/continue without|skip/i)).toBeVisible({ timeout: 5000 });
    await page.getByText(/continue without|skip/i).click();
    await expect(page).toHaveURL(/\/demo/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /CamDiag Demo/i })).toBeVisible();
  });
});

test.describe('App Navigation', () => {
  test('navigates to clinical support hub', async ({ page }) => {
    await gotoReady(page, '/app', true);
    await expect(page.getByRole('heading', { name: /Clinical Support Hub/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /New Scan/i })).toBeVisible();
  });

  test('navigates to drug database', async ({ page }) => {
    await gotoReady(page, '/drugs', true);
    await expect(page.getByRole('heading', { name: /Drug Database/i, level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('textbox', { name: /search medications/i })).toBeVisible();
  });

  test('navigates to settings', async ({ page }) => {
    await gotoReady(page, '/settings', true);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 15000 });
  });

  test('bottom nav bar is visible on app pages', async ({ page }) => {
    await gotoReady(page, '/app', true);
    await expect(page.getByRole('navigation', { name: /main/i })).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Accessibility', () => {
  test('landing page has visible headings', async ({ page }) => {
    await gotoReady(page, '/');
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
  });
});
