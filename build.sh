#!/bin/bash
# Build script for Domus
# Usage: ./build.sh [HA_URL] [HA_TOKEN]
# Example: ./build.sh "ws://homeassistant.local:8123/api/websocket" "your-token-here"

set -e

HA_URL="${1:-ws://homeassistant.local:8123/api/websocket}"
HA_TOKEN="${2:-YOUR_TOKEN_HERE}"

echo "Building Domus..."
echo "HA URL: $HA_URL"

# Build TypeScript and bundle assets
npm run build:base

# Inline config directly into index.html for file:// protocol compatibility
echo "Inlining configuration..."

# Use a temp file with proper escaping
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" <<EOF
  <script>
window.DOMUS_CONFIG = {
  haUrl: '$HA_URL',
  haToken: '$HA_TOKEN'
};
</script>
EOF

# Replace the config script tag
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' '/<script src=".\/config.js"><\/script>/r '"$TEMP_FILE" dist/index.html
  sed -i '' '/<script src=".\/config.js"><\/script>/d' dist/index.html
else
  # Linux
  sed -i '/<script src=".\/config.js"><\/script>/r '"$TEMP_FILE" dist/index.html
  sed -i '/<script src=".\/config.js"><\/script>/d' dist/index.html
fi

rm "$TEMP_FILE"

# Fix asset paths to be relative (remove leading slashes for file:// protocol)
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' 's|href="/assets/|href="./assets/|g' dist/index.html
  sed -i '' 's|src="/assets/|src="./assets/|g' dist/index.html
else
  sed -i 's|href="/assets/|href="./assets/|g' dist/index.html
  sed -i 's|src="/assets/|src="./assets/|g' dist/index.html
fi

cp dist/index.html ./kiosk.html

echo "Build complete: kiosk.html"
