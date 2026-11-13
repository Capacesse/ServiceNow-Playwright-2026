# ServiceNow Playwright Tests

Browser and API tests for a ServiceNow Personal Developer Instance, written in Playwright with TypeScript.

This is a practice project for automating ServiceNow, which is harder to test than a typical web app: most of the interface sits inside frames and shadow DOM, and developer instances go to sleep when idle.

## What is covered

| Test | What it checks |
| ---- | -------------- |
| `auth.setup.ts` | Logs in once and saves the session for the other tests |
| `login.spec.ts` | The saved session stays logged in, and the REST API returns incidents with basic authentication |
| `incident.spec.ts` | Creates an incident through the REST API and finds it in the incident list; creates an incident through the form and confirms it through the API |
| `api.ts` | Helper for REST API calls: find, delete, and look up records |

## Setup

You need Node.js 20 or newer and your own ServiceNow developer instance (free at developer.servicenow.com).

```bash
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and fill in your instance URL, username and password. `.env` is ignored by git and must never be committed.

## Instance setup

New developer instances block basic authentication for the REST API by default.
Add the `snc_basic_auth_api_access` role to the ServiceNow user whose login is in your `.env` file, or the API test returns 401.

## Running

```bash
npx playwright test            # headless
npx playwright test --headed   # watch the browser
npx playwright test --ui       # step through interactively
```

If every test fails at once, check that the instance is awake by opening it in a normal browser first.