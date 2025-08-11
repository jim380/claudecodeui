#!/usr/bin/env bash

echo "🚀 Starting Docker entrypoint..."
echo "📍 Current PATH: $PATH"
echo "👤 Current user: $(whoami) (UID: $(id -u))"

echo "📂 Checking /opt/claude-code directory:"
ls -la /opt/claude-code/ 2>&1 || echo "   Directory not found"

echo "📂 Checking ~/.claude directory:"
ls -la ~/.claude/ 2>&1 || echo "   Directory not found"

echo "🔍 Looking for node binary:"
which node 2>&1 || echo "   'which node' failed"
echo "📍 Node locations:"
find /root/.nix-profile /nix/var/nix/profiles /usr/local/bin /usr/bin -name node 2>/dev/null | head -5

if [ -f "/opt/claude-code/cli.js" ]; then
    echo "✅ Claude module mounted at /opt/claude-code/cli.js"
    
    NODE_PATH=$(which node 2>/dev/null || echo "")
    if [ -n "$NODE_PATH" ]; then
        echo "📍 Found node at: $NODE_PATH"
        $NODE_PATH /opt/claude-code/cli.js --version 2>&1 || echo "   Version check failed (normal if not authenticated)"
    else
        echo "❌ Could not find node in PATH"
    fi
else
    echo "❌ Claude module NOT mounted at /opt/claude-code"
    echo "   Expected: /opt/claude-code/cli.js"
    echo "   Please check volume mounts in Dokploy"
fi

export PATH="/usr/local/bin:$PATH"

echo "📍 Using direct node execution for Claude CLI"

echo "🧪 Testing Claude spawn with PATH fix..."
node test-claude-spawn.js

echo "🎯 Starting Node.js server..."
exec env PATH="/usr/local/bin:$PATH" node server/index.js