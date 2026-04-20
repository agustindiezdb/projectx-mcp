#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ProjectX MCP — Installation Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Build the project
echo "→ Building project..."
npm install --silent
npm run build --silent
echo "✓ Built"
echo ""

# 2. Get absolute path
REPO_PATH="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_PATH="$REPO_PATH/dist/src/server.js"

if [ ! -f "$SERVER_PATH" ]; then
  echo "❌ Error: $SERVER_PATH not found"
  exit 1
fi

echo "✓ Server path: $SERVER_PATH"
echo ""

# 3. Configure Claude Desktop
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CONFIG_DIR="$(dirname "$CONFIG_FILE")"

if [ ! -d "$CONFIG_DIR" ]; then
  echo "❌ Error: Claude Desktop not found at $CONFIG_DIR"
  echo "   Please install Claude Desktop first: https://claude.ai/download"
  exit 1
fi

# Create config if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
  echo "→ Creating Claude Desktop config..."
  mkdir -p "$CONFIG_DIR"
  echo '{"mcpServers":{}}' > "$CONFIG_FILE"
fi

# Backup existing config
BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✓ Backup saved: $BACKUP_FILE"

# Update config with jq or Python
if command -v jq &> /dev/null; then
  # Use jq if available
  jq --arg path "$SERVER_PATH" '.mcpServers.projectx = {"command": "node", "args": [$path]}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
  mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
else
  # Fallback to Python
  python3 -c "
import json, sys
with open('$CONFIG_FILE', 'r') as f:
    config = json.load(f)
if 'mcpServers' not in config:
    config['mcpServers'] = {}
config['mcpServers']['projectx'] = {
    'command': 'node',
    'args': ['$SERVER_PATH']
}
with open('$CONFIG_FILE', 'w') as f:
    json.dump(config, f, indent=2)
"
fi

echo "✓ Claude Desktop config updated"
echo ""

# 4. Done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Installation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Desktop"
echo "  2. Chrome will open automatically for login"
echo "  3. Sign in with your Dualboot Google account"
echo "  4. Start using: 'Log 8h of Ontrac for today'"
echo ""
