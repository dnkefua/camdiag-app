import { test, expect } from '@playwright/test';

const acceptDisclaimer = async (page: import('@playwright/test').Page) => {
  const dialog = page.getByRole('dialog', { name: /clinical consent|medical notice|avis medical|medical|confidentialite/i });
  if (await dialog.isVisible().catch(() => false)) {
    const checkboxes = dialog.getByRole('checkbox');
    for (let i = 0; i < await checkboxes.count(); i += 1) {
      await checkboxes.nth(i).check();
    }
    await dialog.getByRole('button', { name: /accept|continue|compris|continue/i }).click();
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

test.describe('Mobile clinical interpretation', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('keeps long-report interpretation controls visible and preserves the result on reload', async ({ page }) => {
    await gotoReady(page, '/app', true);
    await page.evaluate(async () => {
      const moduleUrl = '/src/store/useAppStore.ts';
      const { useAppStore } = await import(moduleUrl);
      useAppStore.setState({
        transcription: {
          documentId: 'mobile-long-report',
          processorVersion: 'ocr-v2.1',
          requiresReview: true,
          pages: [{
            pageNumber: 1,
            text: 'Haemoglobin 8.2 g/dL\n'.repeat(300),
            confidence: 0.82,
            qualityReasons: ['low confidence text'],
            tokens: [{ pageNumber: 1, text: '8.2', confidence: 0.72, handwritten: false }],
          }],
        },
        pendingPages: [{
          id: 'page-1',
          fileName: 'lab-report.pdf',
          mimeType: 'application/pdf',
          contentBase64: 'data:application/pdf;base64,AA==',
        }],
        pendingDocumentType: 'lab_result',
      });
      window.history.pushState({}, '', '/transcription-review');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    const interpretButton = page.getByRole('button', { name: /interpret report now/i });
    await expect(interpretButton).toBeVisible();
    const layout = await page.locator('main, footer').evaluateAll((elements) => {
      const [main, footer] = elements;
      const footerBox = footer.getBoundingClientRect();
      return {
        mainScrolls: main.scrollHeight > main.clientHeight,
        footerTop: footerBox.top,
        footerBottom: footerBox.bottom,
        viewportHeight: window.innerHeight,
      };
    });
    expect(layout.mainScrolls).toBe(true);
    expect(layout.footerTop).toBeGreaterThan(0);
    expect(layout.footerBottom).toBeLessThanOrEqual(layout.viewportHeight);
    await page.getByRole('checkbox', { name: /I reviewed the transcription/i }).check();
    await expect(interpretButton).toBeEnabled();

    await page.evaluate(async () => {
      const moduleUrl = '/src/store/useAppStore.ts';
      const { useAppStore } = await import(moduleUrl);
      useAppStore.getState().setAnalysisResult({
        urgency: 'same_day',
        possibleFindings: [{
          name: 'Anaemia pattern',
          likelihood: 'moderate',
          observedEvidence: ['Haemoglobin 8.2 g/dL'],
          markers: ['haemoglobin'],
          medicationSafetyNotes: ['Treatment depends on confirmation of the cause.'],
          traditionalRemedyWarnings: [],
          reasoning: 'The haemoglobin result is below the stated reference range.',
          recommendedNextSteps: ['Arrange clinician review.'],
          clinicianReviewRequired: true,
        }],
        markers: [{
          id: 'haemoglobin',
          label: 'Haemoglobin',
          value: '8.2 g/dL',
          status: 'abnormal',
          color: 'orange',
        }],
        contraindications: [],
        limitations: ['Symptoms were not provided.'],
        disclaimer: 'This is not a diagnosis or prescription.',
      });
    });
    await page.goto('/analysis');
    await expect(page.getByText('Anaemia pattern').first()).toBeVisible();

    await page.goto('/app');
    const recentResult = page.getByRole('button', { name: /Anaemia pattern/i });
    await expect(recentResult).toBeVisible();
    await recentResult.click();
    await expect(page).toHaveURL(/\/analysis$/);
    await expect(page.getByText('Anaemia pattern').first()).toBeVisible();
  });
});
