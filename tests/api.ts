import { request, type APIRequestContext } from '@playwright/test';

/**
 * A REST API client for the instance, authenticated with the username and
 * password from .env (basic authentication, like a Postman request).
 *
 * Tests use it to set up data, check results and clean up, which is faster
 * and more reliable than doing those steps through the browser.
 */
export async function newApiClient(): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: process.env.SN_INSTANCE_URL,
    httpCredentials: {
      username: process.env.SN_USERNAME!,
      password: process.env.SN_PASSWORD!,
      send: 'always',
    },
    extraHTTPHeaders: { Accept: 'application/json' },
  });
}

export interface Incident {
  sys_id: string;
  number: string;
  short_description: string;
}

/** All incidents whose short description is exactly the given text. */
export async function findIncidents(api: APIRequestContext, shortDescription: string): Promise<Incident[]> {
  const query = encodeURIComponent(`short_description=${shortDescription}`);
  const response = await api.get(
    `/api/now/table/incident?sysparm_query=${query}&sysparm_fields=sys_id,number,short_description`,
  );
  if (!response.ok()) {
    throw new Error(`Incident query failed with HTTP ${response.status()}`);
  }
  return (await response.json()).result;
}

/** Delete every incident with the given short description. Used for clean-up. */
export async function deleteIncidents(api: APIRequestContext, shortDescription: string): Promise<void> {
  for (const incident of await findIncidents(api, shortDescription)) {
    await api.delete(`/api/now/table/incident/${incident.sys_id}`);
  }
}

/** The sys_id of the user in .env, needed to fill the mandatory Caller field. */
export async function currentUserSysId(api: APIRequestContext): Promise<string> {
  const query = encodeURIComponent(`user_name=${process.env.SN_USERNAME}`);
  const response = await api.get(`/api/now/table/sys_user?sysparm_query=${query}&sysparm_fields=sys_id`);
  const users = (await response.json()).result;
  if (users.length !== 1) {
    throw new Error(`Expected one user named ${process.env.SN_USERNAME}, found ${users.length}`);
  }
  return users[0].sys_id;
}
