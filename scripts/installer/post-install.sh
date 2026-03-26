#!/bin/bash

REAL_USER=$(stat -f "%Su" /dev/console)
REAL_HOME=$(dscl . -read /Users/"$REAL_USER" NFSHomeDirectory | awk '{print $2}')
CONFIG_DIR="$REAL_HOME/Library/Application Support/Claude"
CONFIG="$CONFIG_DIR/claude_desktop_config.json"

mkdir -p "$CONFIG_DIR"
chown "$REAL_USER" "$CONFIG_DIR"

python3 << PYEOF
import json, os

config_path = u"$CONFIG"

try:
    with open(config_path) as f:
        config = json.load(f)
except Exception:
    config = {}

config.setdefault("mcpServers", {})["projectx"] = {
    "command": "/usr/local/bin/projectx-mcp"
}

with open(config_path, "w") as f:
    json.dump(config, f, indent=2)
PYEOF

chown "$REAL_USER" "$CONFIG" 2>/dev/null || true
