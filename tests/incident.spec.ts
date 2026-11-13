import { test, expect, type APIRequestContext, type FrameLocator, type Page } from '@playwright/test';
import { currentUserSysId, deleteIncidents, findIncidents, newApiClient } from './api';

// Each run uses its own short descriptions, so reruns never collide with
// incidents left by an earlier run or with the instance's demo data.
const RUN_ID = Date.now();
const API_INCIDENT = `Playwright API incident ${RUN_ID}`;
const UI_INCIDENT = `Playwright UI incident ${RUN_ID}`;

let api: APIRequestContext;

/**
 * ServiceNow sometimes shows a classic page on its own, and sometimes inside
 * a frame called gsft_main within the newer shell. This returns whichever one
 * actually holds the page content, so the tests work in both cases.
 */
async function classicContent(page: Page): Promise<Page | FrameLocator> {
  await page.waitForLoadState('domcontentloaded');
  const frame = page.locator('iframe#gsft_main');
  return (await frame.count()) > 0 ? page.frameLocator('iframe#gsft_main') : page;
}

test.describe('Incidents', () => {
  // The tests share one instance and build on each other, so run them in order.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    api = await newApiClient();
  });

  test.afterAll(async () => {
    // Leave the instance as we found it.
    await deleteIncidents(api, API_INCIDENT);
    await deleteIncidents(api, UI_INCIDENT);
    await api.dispose();
  });

  test('an incident can be created through the REST API', async () => {
    const response = await api.post('/api/now/table/incident', {
      data: { short_description: API_INCIDENT, urgency: '3', impact: '3' },
    });

    expect(response.status()).toBe(201);
    const created = (await response.json()).result;
    expect(created.number).toMatch(/^INC\d+$/);
    expect(created.short_description).toBe(API_INCIDENT);
  });

  test('an incident created through the API appears in the incident list', async ({ page }) => {
    const query = encodeURIComponent(`short_description=${API_INCIDENT}`);
    await page.goto(`/incident_list.do?sysparm_query=${query}`);

    const content = await classicContent(page);
    const rows = content.locator('tr.list_row');

    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(API_INCIDENT);
  });

  test('an incident can be created through the form', async ({ page }) => {
    // Open a new incident form with the two mandatory fields pre-filled:
    // short description, and caller (set to the logged-in user).
    const caller = await currentUserSysId(api);
    const prefill = encodeURIComponent(`short_description=${UI_INCIDENT}^caller_id=${caller}`);
    await page.goto(`/incident.do?sys_id=-1&sysparm_query=${prefill}`);

    const content = await classicContent(page);
    await expect(content.locator('[id="incident.short_description"]')).toHaveValue(UI_INCIDENT);
    await content.locator('#sysverb_insert').first().click();

    // Prove it through the API: the record exists in the database, exactly once.
    await expect
      .poll(async () => (await findIncidents(api, UI_INCIDENT)).length, { timeout: 30_000 })
      .toBe(1);
  });
});
