#!/bin/bash

# Check if Claude module is mounted and create symlink at runtime
if [ -f "/opt/claude-code/cli.js" ]; then
    echo "✅ Claude module mounted, creating symlink..."
    ln -sf /opt/claude-code/cli.js /usr/local/bin/claude
    chmod +x /opt/claude-code/cli.js
    echo "✅ Claude CLI ready at /usr/local/bin/claude"
elif [ -f "/usr/local/bin/claude" ]; then
    echo "✅ Claude binary already exists at /usr/local/bin/claude"
else
    echo "⚠️  Claude module not mounted at /opt/claude-code"
fi

# Start the application
exec node server/index.js