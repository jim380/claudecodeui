#!/usr/bin/env bash

echo "🚀 Starting Docker entrypoint..."
echo "📍 Current PATH: $PATH"

echo "📂 Checking /opt/claude-code directory:"
ls -la /opt/claude-code/ 2>&1 || echo "   Directory not found"

echo "📂 Checking /root/.claude directory:"
ls -la /root/.claude/ 2>&1 || echo "   Directory not found"

# Check if Claude module is mounted
if [ -f "/opt/claude-code/cli.js" ]; then
    echo "✅ Claude module mounted at /opt/claude-code/cli.js"
    
    # Test direct node execution
    node /opt/claude-code/cli.js --version 2>&1 || echo "   Version check failed (normal if not authenticated)"
else
    echo "❌ Claude module NOT mounted at /opt/claude-code"
    echo "   Expected: /opt/claude-code/cli.js"
    echo "   Please check volume mounts in Dokploy"
fi

export PATH="/usr/local/bin:$PATH"

# No longer checking for claude wrapper since we use node directly
echo "📍 Using direct node execution for Claude CLI"

# Test spawn with PATH fix
echo "🧪 Testing Claude spawn with PATH fix..."
node test-claude-spawn.js

# Start the application with PATH explicitly set
echo "🎯 Starting Node.js server..."
exec env PATH="/usr/local/bin:$PATH" node server/index.js