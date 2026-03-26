# projectx-mcp

MCP server that lets Claude create time entries in [ProjectX](https://projectx.dualbootpartners.com) via Playwright browser automation.

## Architecture

```
Claude → MCP Server (stdio) → Playwright (Chromium) → ProjectX UI
```

## Prerequisites

- Node.js 18+
- npm

## Install

```bash
npm install
npx playwright install chromium
```

## Step 1 — Generate auth.json

You need to log in once so Playwright can save your Google OAuth session:

```bash
npm run save-session
```

1. A visible Chromium window opens at ProjectX.
2. Log in using your Google account.
3. Once the dashboard is visible, go back to the terminal and press **Enter**.
4. Your session is saved to `auth/auth.json`.

> `auth/auth.json` is git-ignored. Never commit it.

## Step 2 — Build

```bash
npm run build
```

## Step 3 — Configure Claude Desktop

Add the server to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "projectx": {
      "command": "node",
      "args": ["/absolute/path/to/projectx-mcp/dist/server.js"],
      "env": {
        "HEADLESS": "true"
      }
    }
  }
}
```

Or with `ts-node` (no build needed):

```json
{
  "mcpServers": {
    "projectx": {
      "command": "npx",
      "args": ["ts-node", "/absolute/path/to/projectx-mcp/src/server.ts"]
    }
  }
}
```

Restart Claude Desktop after editing the config.

## Step 4 — Test without MCP

Run the automation directly to verify selectors work:

```bash
npm run test:entry
```

With a visible browser (for debugging):

```bash
HEADLESS=false npm run test:entry
```

Edit `scripts/test-entry.ts` to change the test project/date/hours.

## Tool Reference

### `create_time_entry`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `date` | string | ✅ | Date in `YYYY-MM-DD` format |
| `hours` | number | ✅ | Hours to log (0.25 increments, max 24) |
| `project` | string | ✅ | Project name (partial match supported) |
| `description` | string | ❌ | Notes or description for the entry |

**Returns:**

```json
{
  "success": true,
  "message": "Time entry created: 2h on 2024-03-15 for \"ProjectX\" — Fixed bug",
  "entry": {
    "date": "2024-03-15",
    "hours": 2,
    "project": "ProjectX",
    "description": "Fixed bug"
  }
}
```

## Example Claude Prompts

```
Log 3 hours to the "Acme" project for today with description "Sprint planning"
```

```
Add a time entry for 2024-03-15, 1.5 hours, project "Internal", description "Code review"
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `HEADLESS` | `true` | Set to `false` to see the browser |

## Troubleshooting

**`Auth file not found`** — Run `npm run save-session` to generate `auth/auth.json`.

**`Session expired`** — Re-run `npm run save-session` to refresh the session.

**`Could not find "Add entry" button`** — The ProjectX UI may have changed. Run `HEADLESS=false npm run test:entry` to inspect the page and update selectors in `src/automation/projectx.ts`.

**Selector not matching project** — ProjectX project names must match the text in the dropdown. Update `TEST_ENTRY.project` in `scripts/test-entry.ts` to an exact or partial project name you have access to.
