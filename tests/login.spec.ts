import { test, expect } from '@playwright/test';

test.describe('Logged-in session', () => {
  test('opening the instance does not send us back to the login page', async ({ page }) => {
    await page.goto('/');

    await expect(page).not.toHaveURL(/login/);
  });

    test('the REST API returns incidents with basic authentication', async ({ playwright }) => {
    // API calls do not reuse the browser login. They authenticate on their own with a username and password, like a Postman request.
    const api = await playwright.request.newContext({
      baseURL: process.env.SN_INSTANCE_URL,
      httpCredentials: {
        username: process.env.SN_USERNAME!,
        password: process.env.SN_PASSWORD!,
        send: 'always',
      },
    });

    const response = await api.get('/api/now/table/incident?sysparm_limit=1');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.result)).toBe(true);

    await api.dispose();
  });
});
