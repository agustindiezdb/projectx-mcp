# projectx-mcp — Context for Claude

## What this project is

MCP server that lets Claude create and read time entries in ProjectX (Dualboot Partners internal time tracker) by calling the ProjectX REST API directly using a persisted Google OAuth session cookie.

Distributed to employees as a macOS `.pkg` installer — no technical knowledge required.

## Architecture

```
Claude Desktop → MCP Server (stdio) → fetch() + _interslice_session cookie → ProjectX API
```

On first run (or when session expires), the MCP server automatically opens Chrome for the user to log in with Google. No terminal interaction needed.

## Project structure

```
src/
  server.ts                  — MCP server, registers all tools. Calls ensureValidSession() on startup.
  types.ts                   — TypeScript interfaces
  auth/
    session.ts               — Session management: AUTH_FILE path, hasValidSession(), runLoginFlow(), ensureValidSession()
  api/
    client.ts                — Base HTTP client, reads cookie from AUTH_FILE
    projectx.ts              — API methods: getCurrentUser, getProjects, getTimeEntries, createTimeEntry, deleteTimeEntry
  tools/
    getTimeEntries.ts        — Tool: get_time_entries
    getProjects.ts           — Tool: get_projects
    createTimeEntry.ts       — Tool: create_time_entry
    deleteTimeEntry.ts       — Tool: delete_time_entry
scripts/
  save-session.ts            — Calls runLoginFlow() directly (for dev use)
  test-entry.ts              — Direct API test (no MCP): user, projects, create, delete
  build-pkg.sh               — Builds the macOS .pkg installer
  installer/
    post-install.sh          — Runs after .pkg install: writes Claude Desktop config for the logged-in user
```

## Auth flow

Session cookie is stored at: `~/Library/Application Support/projectx-mcp/auth.json`

On MCP server startup:
1. Calls `hasValidSession()` — hits `/current_user` to verify cookie is valid
2. If invalid or missing → calls `runLoginFlow()`:
   - Opens system Chrome (via `playwright channel: 'chrome'` — no Chromium download needed)
   - Navigates to `https://projectx.dualbootpartners.com`
   - Polls until `_interslice_session` cookie appears (user logged in)
   - Saves storageState to `AUTH_FILE`, closes Chrome automatically
3. MCP server starts normally

## API details

**Base URL:** `https://projectx.dualbootpartners.com/api/v1`

**Auth:** Cookie `_interslice_session` extracted from `~/Library/Application Support/projectx-mcp/auth.json`

**User (Agustin Diez):**
- `user_id`: 633
- `resource_id`: 631

**Key endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/current_user` | Get user + resource_id |
| GET | `/time_tracker/trackables?paginated=false&q[name_cont]=&q[s]=name asc` | List projects |
| GET | `/resources/631/tracked_time_entries?number_of_days=N&q[s]=date desc` | List entries |
| POST | `/resources/631/tracked_time_entries` | Create entry |
| DELETE | `/resources/631/tracked_time_entries/:id` | Delete entry |

**POST body for create:**
```json
{
  "description": "string",
  "billable": true,
  "date": "25-03-2026",       // DD-MM-YYYY — NOT ISO format
  "duration": 480,             // minutes (8h = 480)
  "trackable_id": 313,
  "trackable_type": "Project",
  "tag_ids": []
}
```

**Important:** The API accepts date as `DD-MM-YYYY` in POST but returns it as `YYYY-MM-DD` in responses.
Duration is always in **minutes** in both directions.

## Available projects (as of 2026-03-25)

| ID | Name | Billable |
|----|------|----------|
| 313 | Ontrac | true |
| 196 | Suzy | true |
| 289 | Internal — Administrative | false |
| 290 | Internal — Paid Time Off | false |
| 292 | Internal — Moved / Shifted Time | false |
| 293 | Internal — Marketing | false |
| 294 | Internal — HR operations | false |
| 295 | Internal — Project work | false |
| 296 | Internal — Design Work | false |
| 297 | Internal — Teaching, Training | false |
| 298 | Internal — Idle / Bench | false |
| 299 | Internal — Unpaid Time Off | false |
| 301 | Internal — Onboarding | false |
| 302 | Internal — Legal Ops - Nita | false |
| 304 | Internal — Feedback Evaluations | false |
| 305 | Internal — Biz Dev - AWS | false |
| 306 | Internal — Sales Project Work | false |
| 307 | Internal –– Sales Management | false |
| 308 | Internal –– Individual Selling Activity | false |
| 327 | Internal - Sales - Prototyping | false |

## MCP tools

### `get_time_entries`
Returns entries for a date range with a per-day summary. Shows which days are missing (0h logged).
- `date_from`: YYYY-MM-DD
- `date_to`: YYYY-MM-DD

### `get_projects`
Lists active projects. Optional `search` param filters by name.

### `create_time_entry`
Creates a single time entry.
- `date`: YYYY-MM-DD
- `hours`: number (decimal OK, e.g. 7.5)
- `project`: name or partial match
- `description`: optional string
- `billable`: optional boolean (defaults to project's billable setting)

### `delete_time_entry`
Deletes an entry by `entry_id` (number).

## Claude Desktop config

Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

After `.pkg` install (set automatically by post-install.sh):
```json
{
  "mcpServers": {
    "projectx": {
      "command": "/usr/local/bin/projectx-mcp"
    }
  }
}
```

## Distribution (.pkg installer)

```bash
npm run build:installer   # generates projectx-mcp.pkg in repo root
```

Employee installs it with a double-click. The installer:
1. Copies app to `/usr/local/lib/projectx-mcp/`
2. Creates launcher at `/usr/local/bin/projectx-mcp`
3. Writes Claude Desktop config automatically (post-install.sh detects the real logged-in user)

On first Claude Desktop launch after install → Chrome opens → employee logs in with Google → Chrome closes → ready.

## Common workflows

**Fill missing days in a week:**
1. Call `get_time_entries` with Monday–Friday range
2. Identify days with `total_hours === 0`
3. Call `create_time_entry` for each missing day

**Typical week prompt:**
> "Check my time entries for this week and fill the missing days with 8h of Ontrac"

## Dev setup (contributors only)

```bash
npm install
npm run build
# First run will auto-open Chrome for login
# restart Claude Desktop
```

## Troubleshooting

- **Session expired** → restart Claude Desktop, Chrome opens automatically for re-login
- **Chrome not found** → install Google Chrome (required for auth)
- **Project not found** → call `get_projects` to get exact names
- **Test the API directly** → `npm run test:entry`
- **post-install didn't update Claude config** → edit `~/Library/Application Support/Claude/claude_desktop_config.json` manually and set `"command": "/usr/local/bin/projectx-mcp"`
