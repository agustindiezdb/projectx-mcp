#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/.pkg-build"
PKG_OUT="$REPO_ROOT/projectx-mcp.pkg"

echo "▶ Building TypeScript..."
cd "$REPO_ROOT"
npm run build

echo "▶ Preparing payload..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/usr/local/lib/projectx-mcp"
mkdir -p "$BUILD_DIR/usr/local/bin"

# Copy app files (production only)
cp -r "$REPO_ROOT/dist"         "$BUILD_DIR/usr/local/lib/projectx-mcp/"
cp -r "$REPO_ROOT/node_modules" "$BUILD_DIR/usr/local/lib/projectx-mcp/"
cp    "$REPO_ROOT/package.json" "$BUILD_DIR/usr/local/lib/projectx-mcp/"

# Bundle the Node.js binary so the installer is self-contained
NODE_BIN="$(which node)"
echo "▶ Bundling Node.js from: $NODE_BIN ($(node --version))"
mkdir -p "$BUILD_DIR/usr/local/lib/projectx-mcp/bin"
cp "$NODE_BIN" "$BUILD_DIR/usr/local/lib/projectx-mcp/bin/node"

# Launcher script — uses bundled Node, no external dependency
cat > "$BUILD_DIR/usr/local/bin/projectx-mcp" <<'LAUNCHER'
#!/bin/bash
exec /usr/local/lib/projectx-mcp/bin/node /usr/local/lib/projectx-mcp/dist/src/server.js "$@"
LAUNCHER
chmod +x "$BUILD_DIR/usr/local/bin/projectx-mcp"

echo "▶ Preparing installer scripts..."
SCRIPTS_DIR="$REPO_ROOT/.pkg-scripts"
rm -rf "$SCRIPTS_DIR"
mkdir -p "$SCRIPTS_DIR"
cp "$REPO_ROOT/scripts/installer/post-install.sh" "$SCRIPTS_DIR/postinstall"
chmod +x "$SCRIPTS_DIR/postinstall"

echo "▶ Building .pkg..."
pkgbuild \
  --root "$BUILD_DIR" \
  --scripts "$SCRIPTS_DIR" \
  --identifier "com.dualboot.projectx-mcp" \
  --version "1.0.0" \
  "$PKG_OUT"

rm -rf "$SCRIPTS_DIR"

rm -rf "$BUILD_DIR"

echo ""
echo "✓ Done: $PKG_OUT"
echo ""
echo "Install with: sudo installer -pkg projectx-mcp.pkg -target /"
echo "Then restart Claude Desktop."
