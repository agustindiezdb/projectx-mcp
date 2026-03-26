<img src="src/assets/DBP_Logo_Horizontal.svg" alt="Dualboot Partners" width="200" />

# projectx-mcp

Log hours in [ProjectX](https://projectx.dualbootpartners.com) by talking to Claude.

> "Log 8 hours of Ontrac for today"
> "Fill in the missing days this week with Ontrac"
> "Which days am I missing hours for this month?"

---

## Installation (Mac)

### 1. Download the installer

Download `projectx-mcp.pkg` from [Releases](https://github.com/agustindiezdb/projectx-mcp/releases).

### 2. Install

Double-click the downloaded file and follow the installer steps.

### 3. Open Claude Desktop

The first time you open Claude Desktop, a browser window will open automatically. Sign in with your Dualboot Google account. The browser closes on its own when done.

**That's it.** You can now ask Claude to log your hours.

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

---

## If login fails or the session expired

Restart Claude Desktop. The browser will open again for you to sign in.

---

## Available tools

| Tool | Description |
|------|-------------|
| `get_time_entries` | View entries for a date range |
| `get_projects` | List available projects |
| `create_time_entry` | Create an entry |
| `delete_time_entry` | Delete an entry by ID |

---

## For developers

### Architecture

```
Claude Desktop → MCP Server (stdio) → fetch() + _interslice_session cookie → ProjectX API
```

### Setup from scratch

```bash
npm install
npm run build
```

The session is stored at `~/Library/Application Support/projectx-mcp/auth.json` (gitignored).

On startup, if no valid session is found, Chrome opens automatically for login.

### Build the installer

```bash
npm run build:installer   # generates projectx-mcp.pkg
```

The `.pkg` installs the app to `/usr/local/lib/projectx-mcp/` and automatically writes the Claude Desktop config.

### Test the API directly

```bash
npm run test:entry
```

### Claude Desktop config (manual)

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "projectx": {
      "command": "/usr/local/bin/projectx-mcp"
    }
  }
}
```

### Troubleshooting

- **Session expired** → restart Claude Desktop, the browser opens automatically
- **Chrome not found** → install Google Chrome
- **Project not found** → ask Claude to run `get_projects` to see exact names
- **post-install didn't write the config** → manually edit the JSON above
