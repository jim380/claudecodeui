#!/usr/bin/env bash

echo "🚀 Starting Docker entrypoint..."
echo "📍 Current PATH: $PATH"
echo "👤 Current user: $(whoami) (UID: $(id -u))"

if [ "$(id -u)" = "0" ]; then
    echo "🔄 Running as root, switching to appuser..."
    
    if ! id -u appuser >/dev/null 2>&1; then
        echo "📝 Creating appuser..."
        useradd -m -s /bin/bash -u 1000 appuser
    fi
    
    if [ -d "/root/.claude" ] && [ ! -d "/home/appuser/.claude" ]; then
        echo "📋 Copying Claude config to appuser..."
        cp -r /root/.claude /home/appuser/.claude
        chown -R appuser:appuser /home/appuser/.claude
    fi
    
    chown -R appuser:appuser /app 2>/dev/null || true
    chown -R appuser:appuser /opt/claude-code 2>/dev/null || true
    chown -R appuser:appuser /home/appuser 2>/dev/null || true
    
    exec su - appuser -c "cd /app && bash $0"
fi

echo "✅ Running as user: $(whoami)"

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