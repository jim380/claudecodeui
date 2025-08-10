import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Claude CLI command routes

// GET /api/mcp/cli/list - List MCP servers using Claude CLI
router.get('/cli/list', async (req, res) => {
  try {
    const { spawn } = await import('child_process');
    const { promisify } = await import('util');
    const exec = promisify(spawn);
    
    const process = spawn('claude', ['mcp', 'list'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output: stdout, servers: parseClaudeListOutput(stdout) });
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(500).json({ error: 'Claude CLI command failed', details: stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({ error: 'Failed to run Claude CLI', details: error.message });
    });
  } catch (error) {
    console.error('Error listing MCP servers via CLI:', error);
    res.status(500).json({ error: 'Failed to list MCP servers', details: error.message });
  }
});

// POST /api/mcp/cli/add - Add MCP server using Claude CLI
router.post('/cli/add', async (req, res) => {
  try {
    const { name, type = 'stdio', command, args = [], url, headers = {}, env = {} } = req.body;
    
    
    const { spawn } = await import('child_process');
    
    let cliArgs = ['mcp', 'add'];
    
    if (type === 'http') {
      cliArgs.push('--transport', 'http', name, '-s', 'user', url);
      // Add headers if provided
      Object.entries(headers).forEach(([key, value]) => {
        cliArgs.push('--header', `${key}: ${value}`);
      });
    } else if (type === 'sse') {
      cliArgs.push('--transport', 'sse', name, '-s', 'user', url);
      // Add headers if provided
      Object.entries(headers).forEach(([key, value]) => {
        cliArgs.push('--header', `${key}: ${value}`);
      });
    } else {
      // stdio (default): claude mcp add <name> -s user <command> [args...]
      cliArgs.push(name, '-s', 'user');
      // Add environment variables
      Object.entries(env).forEach(([key, value]) => {
        cliArgs.push('-e', `${key}=${value}`);
      });
      cliArgs.push(command);
      if (args && args.length > 0) {
        cliArgs.push(...args);
      }
    }
    
    
    const process = spawn('claude', cliArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output: stdout, message: `MCP server "${name}" added successfully` });
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(400).json({ error: 'Claude CLI command failed', details: stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({ error: 'Failed to run Claude CLI', details: error.message });
    });
  } catch (error) {
    console.error('Error adding MCP server via CLI:', error);
    res.status(500).json({ error: 'Failed to add MCP server', details: error.message });
  }
});

// DELETE /api/mcp/cli/remove/:name - Remove MCP server using Claude CLI
router.delete('/cli/remove/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    
    const { spawn } = await import('child_process');
    
    const process = spawn('claude', ['mcp', 'remove', '--scope', 'user', name], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output: stdout, message: `MCP server "${name}" removed successfully` });
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(400).json({ error: 'Claude CLI command failed', details: stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({ error: 'Failed to run Claude CLI', details: error.message });
    });
  } catch (error) {
    console.error('Error removing MCP server via CLI:', error);
    res.status(500).json({ error: 'Failed to remove MCP server', details: error.message });
  }
});

// GET /api/mcp/cli/get/:name - Get MCP server details using Claude CLI
router.get('/cli/get/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    
    const { spawn } = await import('child_process');
    
    const process = spawn('claude', ['mcp', 'get', name], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output: stdout, server: parseClaudeGetOutput(stdout) });
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(404).json({ error: 'Claude CLI command failed', details: stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({ error: 'Failed to run Claude CLI', details: error.message });
    });
  } catch (error) {
    console.error('Error getting MCP server details via CLI:', error);
    res.status(500).json({ error: 'Failed to get MCP server details', details: error.message });
  }
});

// Helper functions to parse Claude CLI output
function parseClaudeListOutput(output) {
  // Parse the output from 'claude mcp list' command
  // Format: "name: command/url" or "name: url (TYPE)"
  const servers = [];
  const lines = output.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const name = line.substring(0, colonIndex).trim();
      const rest = line.substring(colonIndex + 1).trim();
      
      let type = 'stdio'; // default type
      
      // Check if it has transport type in parentheses like "(SSE)" or "(HTTP)"
      const typeMatch = rest.match(/\((\w+)\)\s*$/);
      if (typeMatch) {
        type = typeMatch[1].toLowerCase();
      } else if (rest.startsWith('http://') || rest.startsWith('https://')) {
        // If it's a URL but no explicit type, assume HTTP
        type = 'http';
      }
      
      if (name) {
        servers.push({
          name,
          type,
          status: 'active'
        });
      }
    }
  }
  
  return servers;
}

function parseClaudeGetOutput(output) {
  // Parse the output from 'claude mcp get <name>' command
  // This is a simple parser - might need adjustment based on actual output format
  try {
    // Try to extract JSON if present
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Otherwise, parse as text
    const server = { raw_output: output };
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Name:')) {
        server.name = line.split(':')[1]?.trim();
      } else if (line.includes('Type:')) {
        server.type = line.split(':')[1]?.trim();
      } else if (line.includes('Command:')) {
        server.command = line.split(':')[1]?.trim();
      } else if (line.includes('URL:')) {
        server.url = line.split(':')[1]?.trim();
      }
    }
    
    return server;
  } catch (error) {
    return { raw_output: output, parse_error: error.message };
  }
}

function executeClaudeCommand(args) {
  return new Promise((resolve, reject) => {
    const process = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        reject(new Error(`Claude CLI failed with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', (error) => {
      reject(new Error(`Failed to run Claude CLI: ${error.message}`));
    });
  });
}

// POST /api/mcp/servers/test - Test MCP server configuration
router.post('/servers/test', async (req, res) => {
  try {
    let { name, type = 'stdio', command, args = [], url, headers = {}, env = {}, config } = req.body;
    
    if (config) {
      command = command || config.command;
      args = args.length > 0 ? args : (config.args || []);
      url = url || config.url;
      headers = Object.keys(headers).length > 0 ? headers : (config.headers || {});
      env = Object.keys(env).length > 0 ? env : (config.env || {});
    }
    
    
    if (!name) {
      return res.status(400).json({ error: 'Server name is required' });
    }
    
    // Simulate testing by temporarily adding the server and then getting its details
    const tempServerName = `temp-test-${name}-${Date.now()}`;
    let addSuccessful = false;
    
    try {
      let addArgs = ['mcp', 'add'];
      
      if (type === 'http') {
        if (!url) {
          return res.status(400).json({ error: 'URL is required for HTTP servers' });
        }
        addArgs.push('--transport', 'http', '--scope', 'user', tempServerName, url);
        
        Object.entries(headers).forEach(([key, value]) => {
          addArgs.push('--header', `${key}: ${value}`);
        });
      } else if (type === 'sse') {
        if (!url) {
          return res.status(400).json({ error: 'URL is required for SSE servers' });
        }
        addArgs.push('--transport', 'sse', '--scope', 'user', tempServerName, url);
        
        Object.entries(headers).forEach(([key, value]) => {
          addArgs.push('--header', `${key}: ${value}`);
        });
      } else {
        if (!command) {
          return res.status(400).json({ error: 'Command is required for stdio servers' });
        }
        addArgs.push('--scope', 'user', tempServerName);
        
        Object.entries(env).forEach(([key, value]) => {
          addArgs.push('-e', `${key}=${value}`);
        });
        
        addArgs.push(command);
        if (args && args.length > 0) {
          addArgs.push(...args);
        }
      }
      
      
      await executeClaudeCommand(addArgs);
      addSuccessful = true;
      
      const getResult = await executeClaudeCommand(['mcp', 'get', tempServerName]);
      const serverDetails = parseClaudeGetOutput(getResult.output);
      
      await executeClaudeCommand(['mcp', 'remove', '--scope', 'user', tempServerName]);
      
      res.json({
        success: true,
        message: `MCP server configuration "${name}" test completed successfully`,
        tested: { name, type, command, url, args, headers, env },
        serverDetails,
        note: 'Test performed by temporarily adding and removing the server configuration'
      });
      
    } catch (error) {
      if (addSuccessful) {
        try {
          await executeClaudeCommand(['mcp', 'remove', '--scope', 'user', tempServerName]);
        } catch (cleanupError) {
          console.error('Failed to cleanup temporary test server:', cleanupError.message);
        }
      }
      
      console.error('Error testing MCP server configuration:', error);
      res.status(400).json({
        error: 'MCP server configuration test failed',
        details: error.message,
        tested: { name, type, command, url },
        suggestion: 'Check server configuration. Common issues: invalid command path, incorrect URL, missing dependencies'
      });
    }
  } catch (error) {
    console.error('Error testing MCP server:', error);
    res.status(500).json({
      error: 'Internal error during MCP server test',
      details: error.message
    });
  }
});

// GET /api/mcp/servers - List MCP servers (fallback endpoint)
router.get('/servers', async (req, res) => {
  try {
    const { scope = 'user' } = req.query;
    
    
    const result = await executeClaudeCommand(['mcp', 'list']);
    const servers = parseClaudeListOutput(result.output);
    
    res.json({
      success: true,
      servers,
      scope,
      message: 'MCP servers listed successfully'
    });
  } catch (error) {
    console.error('Error listing MCP servers:', error);
    res.status(500).json({
      error: 'Failed to list MCP servers',
      details: error.message,
      suggestion: 'Ensure Claude CLI is installed and MCP servers are configured'
    });
  }
});

// POST /api/mcp/servers/:serverId/test - Test existing MCP server
router.post('/servers/:serverId/test', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { scope = 'user' } = req.query;
    
    
    if (!serverId) {
      return res.status(400).json({ error: 'Server ID is required' });
    }
    
    let serverDetails;
    try {
      const getResult = await executeClaudeCommand(['mcp', 'get', '-s', scope, serverId]);
      serverDetails = parseClaudeGetOutput(getResult.output);
    } catch (error) {
      return res.status(404).json({
        error: 'MCP server not found',
        serverId,
        details: error.message
      });
    }
    
    // For existing servers, perform a basic validation
    res.json({
      success: true,
      serverId,
      message: `MCP server "${serverId}" is configured and accessible`,
      server: serverDetails,
      scope,
      note: 'Server validated by retrieving configuration details'
    });
  } catch (error) {
    console.error('Error testing existing MCP server:', error);
    res.status(400).json({
      error: 'MCP server validation failed',
      serverId: req.params.serverId,
      details: error.message,
      suggestion: 'Check if the server is properly configured and the name is correct'
    });
  }
});

// POST /api/mcp/servers/:serverId/tools - Discover MCP server tools
router.post('/servers/:serverId/tools', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { scope = 'user' } = req.query;
    
    
    if (!serverId) {
      return res.status(400).json({ error: 'Server ID is required' });
    }
    
    let serverDetails;
    try {
      const getResult = await executeClaudeCommand(['mcp', 'get', '-s', scope, serverId]);
      serverDetails = parseClaudeGetOutput(getResult.output);
    } catch (error) {
      return res.status(404).json({
        error: 'MCP server not found',
        serverId,
        details: error.message
      });
    }
    
    // Return server configuration and indicate tools discovery is not available
    res.json({
      success: true,
      serverId,
      tools: [],
      server: serverDetails,
      message: `MCP server "${serverId}" found, but automatic tool discovery is not available`,
      note: 'Claude CLI does not provide a tools discovery command. Tools will be available when the server is used in Claude sessions.',
      scope,
      suggestion: 'Use the server in a Claude session to see available tools, or check the server documentation'
    });
  } catch (error) {
    console.error('Error discovering MCP server tools:', error);
    res.status(400).json({
      error: 'MCP server tools discovery failed',
      serverId: req.params.serverId,
      details: error.message,
      suggestion: 'Ensure the MCP server is running and supports tool discovery'
    });
  }
});

// Catch-all route handler to prevent auth confusion
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'MCP endpoint not found',
    method: req.method,
    requested: req.originalUrl,
    available: [
      'GET /api/mcp/cli/list',
      'POST /api/mcp/cli/add', 
      'DELETE /api/mcp/cli/remove/:name',
      'GET /api/mcp/cli/get/:name',
      'POST /api/mcp/servers/test',
      'GET /api/mcp/servers',
      'POST /api/mcp/servers/:serverId/test',
      'POST /api/mcp/servers/:serverId/tools'
    ],
  });
});

export default router;