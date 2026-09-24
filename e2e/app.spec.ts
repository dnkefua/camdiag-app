import { test, expect } from '@playwright/test';
import { installClinicalFixtures, openSyntheticTranscription } from './fixtures';

test('public landing is visible without clinical consent', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CamDiag/i);
  await expect(page.getByRole('button', { name: /get started free/i }).first()).toBeVisible();
  await expect(page.getByRole('dialog', { name: /clinical consent/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible();
});

test('sign-in deep link traps keyboard focus and closes with Escape', async ({ page }) => {
  await page.goto('/?login=1');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('synthetic demo completes OCR correction and review without an API', async ({ page }) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => { if (/cloudfunctions|__test_api/.test(request.url())) apiRequests.push(request.url()); });
  await page.goto('/demo');
  await page.getByRole('button', { name: /try demo scan/i }).click();
  const transcription = page.getByRole('textbox');
  await transcription.fill((await transcription.inputValue()).replace('125', '12.5'));
  await page.getByRole('checkbox', { name: /compared the transcription/i }).check();
  await page.getByRole('button', { name: /show sample findings/i }).click();
  await page.getByRole('button', { name: /continue to review/i }).click();
  await page.getByRole('checkbox', { name: /reviewed this synthetic/i }).check();
  await expect(page.getByRole('status')).toContainText('Nothing was saved to a patient record');
  expect(apiRequests).toEqual([]);
});

test('unauthenticated clinical routes open sign-in', async ({ page }) => {
  await page.goto('/scanner');
  await expect(page).toHaveURL(/\/?\?login=1$/);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('consent failure keeps clinical children unmounted', async ({ page }) => {
  const fixture = await installClinicalFixtures(page, { consentFailure: true });
  await page.goto('/patients');
  await expect(page.getByRole('alert')).toContainText('Consent could not be verified');
  await expect(page.getByRole('heading', { name: 'Patient encounters' })).toHaveCount(0);
  expect(fixture.requests.some((request) => request.includes('encounters'))).toBe(false);
});

test('clinical consent can be accepted without optional analytics', async ({ page }) => {
  await installClinicalFixtures(page, { consent: false });
  await page.goto('/scanner');
  const dialog = page.getByRole('dialog', { name: /clinical consent/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: /optional/i })).not.toBeChecked();
  for (const name of [/does not diagnose/i, /emergency warning/i, /authorized to process/i]) await dialog.getByRole('checkbox', { name }).check();
  await dialog.getByRole('button', { name: /accept.*continue/i }).click();
  await expect(page.getByRole('heading', { name: 'Patient and encounter' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('camdiag_optional_analytics_v1'))).toBeNull();
});

test('camera denial does not block document upload', async ({ page }) => {
  await installClinicalFixtures(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => { throw new DOMException('Synthetic denied camera', 'NotAllowedError'); } } });
  });
  await page.goto('/scanner');
  await page.getByRole('button', { name: /use camera/i }).click();
  await expect(page.getByText(/camera unavailable/i)).toBeVisible();
  await expect(page.getByLabel('Upload document images', { exact: true })).toBeEnabled();
  expect(await page.getByRole('option', { name: /x-ray/i }).evaluate((option) => (option as HTMLOptionElement).disabled)).toBe(true);
});

test.describe('mobile clinical workflow', () => {
  test.use({ viewport: { width: 360, height: 800 } });
  test('saves reviewed transcription, displays saved analysis, signs and reopens it', async ({ page }) => {
    const fixture = await installClinicalFixtures(page);
    await openSyntheticTranscription(page);
    await expect(page.getByRole('img', { name: /original page 1/i })).toBeVisible();
    await page.getByRole('textbox', { name: 'Verified transcription for page 1' }).fill('SYNTHETIC SAMPLE\nReported value 12.5 demo units');
    await page.getByRole('checkbox', { name: /compared the text with every source page/i }).check();
    await page.getByRole('button', { name: /save review and interpret report/i }).click();
    await expect(page).toHaveURL(/\/analysis$/);
    await expect(page.getByRole('status')).toContainText('UNREVIEWED');
    await expect(page.getByRole('heading', { name: /synthetic value requires source review/i })).toBeVisible();
    await page.getByRole('checkbox', { name: /reviewed the source, patient context/i }).check();
    await page.getByRole('button', { name: /save attributed review/i }).click();
    await expect(page.getByRole('status')).toContainText('accepted');
    await page.getByRole('button', { name: /print.*save pdf/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-print-requested', 'true');
    await page.goto('/patients');
    await page.reload();
    await page.getByRole('button', { name: /open.*resume encounter/i }).click();
    await expect(page.getByRole('status')).toContainText('accepted');
    expect(fixture.detail.transcriptions[0]?.text).toContain('12.5');
    expect(fixture.requests).toContain('POST encounters/enc-synthetic/reviews');
    expect(await page.evaluate(() => sessionStorage.getItem('camdiag_active_analysis_v1'))).toBeNull();
  });

  test('missing original evidence disables OCR confirmation', async ({ page }) => {
    await installClinicalFixtures(page);
    await openSyntheticTranscription(page, false);
    await expect(page.getByRole('alert')).toContainText('Original source is unavailable');
    await expect(page.getByRole('checkbox')).toBeDisabled();
    await expect(page.getByRole('button', { name: /save review and interpret report/i })).toBeDisabled();
  });
});
