<img src="src/assets/DBP_Logo_Horizontal.svg" alt="Dualboot Partners" width="200" />

# projectx-mcp

Log hours in [ProjectX](https://projectx.dualbootpartners.com) by talking to Claude Desktop.

> "Log 8 hours of Ontrac for today"
> "Fill in the missing days this week with Ontrac"
> "Which days am I missing hours for this month?"

---

## Installation

### Quick install (automated)

```bash
git clone git@github.com:agustindiezdb/projectx-mcp.git
cd projectx-mcp
bash scripts/install.sh
```

The script will:
- Install dependencies
- Build the project
- Configure Claude Desktop automatically
- Create a backup of your existing config

Then **restart Claude Desktop**. Chrome will open automatically for login with your Dualboot Google account.

**That's it!** You can now ask Claude to log your hours.

---

### Manual installation

If you prefer to configure manually:

1. **Clone and build:**
   ```bash
   git clone git@github.com:agustindiezdb/projectx-mcp.git
   cd projectx-mcp
   npm install
   npm run build
   ```

2. **Edit Claude Desktop config:**  
   Open `~/Library/Application Support/Claude/claude_desktop_config.json` and add:
   ```json
   {
     "mcpServers": {
       "projectx": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/projectx-mcp/dist/src/server.js"]
       }
     }
   }
   ```
   Replace `/ABSOLUTE/PATH/TO/` with the full path to your cloned repo.

3. **Restart Claude Desktop**

---

## Using with Cursor

Cursor uses a **per-project** MCP config. Create `.cursor/mcp.json` in your project root:

```json
{
  "$schema": "https://json.schemastore.org/mcp.json",
  "mcpServers": {
    "projectx": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/projectx-mcp/dist/src/server.js"]
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/` with the full path to your cloned repo.

Then restart Cursor. The first time, Chrome will open for login.

---

## Usage

Just talk to Claude naturally:

```
Log 8 hours of Ontrac for today with description "Sprint planning"
```
```
Check my entries for this week and fill the missing days with 8h of Ontrac
```
```
Delete yesterday's entry and log 4h of Internal — Administrative
```
```
Which days am I missing hours for April?
```

---

## Available tools

| Tool | Description |
|------|-------------|
| `get_time_entries` | View entries for a date range |
| `get_projects` | List available projects |
| `create_time_entry` | Create an entry |
| `delete_time_entry` | Delete an entry by ID |

---

## If login fails or the session expires

Simply restart Claude Desktop. Chrome will open again for you to sign in.

---

## Useful scripts

You can also use the API directly without Claude Desktop:

```bash
# Test the API (creates and deletes a test entry)
npm run test:entry

# Check which days you're missing hours in April
npx ts-node scripts/check-april.ts

# Manually refresh your session (if expired)
npm run save-session
```

---

## For developers

### Architecture

```
Claude Desktop → MCP Server (stdio) → fetch() + _interslice_session cookie → ProjectX API
```

The session cookie is stored at `~/Library/Application Support/projectx-mcp/auth.json` (gitignored).

On startup, if no valid session is found, Chrome opens automatically for login via Playwright.

### Development mode

```bash
npm run dev
```

This runs the server with `ts-node` for rapid development (no build step needed).

### How it works

1. **Authentication**: Uses Playwright to open Chrome and auto-detect when login is successful by polling `/api/v1/current_user`
2. **Session persistence**: Saves cookies to `auth.json` using Playwright's `storageState()`
3. **API client**: Reads the `_interslice_session` cookie and makes authenticated requests to ProjectX
4. **MCP protocol**: Exposes 4 tools to Claude Desktop via stdio transport

### Claude Desktop config (manual)

If you prefer to edit manually:

```json
{
  "mcpServers": {
    "projectx": {
      "command": "node",
      "args": ["/path/to/projectx-mcp/dist/src/server.js"]
    }
  }
}
```

### Troubleshooting

- **Session expired** → restart Claude Desktop, Chrome opens automatically
- **Chrome not found** → install Google Chrome
- **Project not found** → ask Claude to run `get_projects` to see exact names
- **Path issues** → use absolute paths, not `~` or relative paths

---

## Requirements

- macOS (tested on macOS 14+)
- Node.js 20+
- Google Chrome
- Claude Desktop
- Dualboot Google account

---

## License

Internal tool for Dualboot Partners.
