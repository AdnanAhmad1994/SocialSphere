import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!';
const SEED_TOKEN = process.env.SEED_TOKEN || 'dev-seed';

async function seedAdmin(request: any, baseURL: string) {
  const res = await request.post(`${baseURL}/api/admin/seed`, {
    headers: {
      'content-type': 'application/json',
      'x-seed-token': SEED_TOKEN,
    },
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      firstName: 'Admin',
      lastName: 'User',
    },
  });
  // 200 OK or 409 Conflict (already exists) are acceptable
  if (!(res.ok() || res.status() === 409)) {
    throw new Error(`Failed to seed admin: ${res.status()} ${await res.text()}`);
  }
}

test.describe('Admin login and basic operations', () => {
  test.beforeAll(async ({ request, baseURL }) => {
    await seedAdmin(request, baseURL!);
  });

  test('login as admin and manage whitelist', async ({ page }) => {
    // Go to login
    await page.goto('/login');

    // Fill email
    await page.getByTestId('input-admin-email').fill(ADMIN_EMAIL);

    // Toggle visibility optional (if present), then fill password
    const toggle = page.getByTestId('toggle-admin-password-visibility');
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
    }
    await page.getByTestId('input-admin-password').fill(ADMIN_PASSWORD);

    // Submit admin login
    await page.getByTestId('button-admin-login').click();

    // Expect navigation to dashboard (root path) and header present
    await page.waitForURL('**/');
    await expect(page.getByText('Admin Dashboard')).toBeVisible();

    // Navigate to Email Whitelist tab
    await page.getByTestId('tab-emails').click();

    // Add a whitelist email
    const testEmail = `tester_${Date.now()}@example.com`;
    await page.getByTestId('input-email-address').fill(testEmail);
    await page.getByTestId('button-add-email').click();

    // Verify list refreshes and shows the email (optimistic toast may show)
    await expect(page.getByText(testEmail)).toBeVisible({ timeout: 15000 });
  });
});
