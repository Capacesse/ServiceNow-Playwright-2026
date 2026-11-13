import { test as setup, expect } from '@playwright/test';
import { AUTH_FILE } from '../playwright.config';

/**
 * Logs in once through the login page and saves the browser session to a
 * file. The other tests load that file, so they start already logged in.
 */
setup('log in and save the session', async ({ page }) => {
  await page.goto('/login.do');

  await page.locator('#user_name').fill(process.env.SN_USERNAME!);
  await page.locator('#user_password').fill(process.env.SN_PASSWORD!);
  await page.locator('#sysverb_login').click();

  // Logged in means we have left the login page.
  await expect(page).not.toHaveURL(/login/);

  await page.context().storageState({ path: AUTH_FILE });
});
