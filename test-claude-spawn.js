#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Testing Claude spawn with direct node execution...');

// Test with direct node execution
const envWithPath = {
  ...process.env,
  PATH: `/usr/local/bin:${process.env.PATH || ''}`
};

// Use node directly to execute the Claude script
const claudeProcess = spawn('node', ['/opt/claude-code/cli.js', '--version'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: envWithPath
});

claudeProcess.stdout.on('data', (data) => {
  console.log('✅ SUCCESS - Claude output:', data.toString());
});

claudeProcess.stderr.on('data', (data) => {
  console.error('stderr:', data.toString());
});

claudeProcess.on('error', (error) => {
  console.error('❌ FAILED - Error spawning claude:', error.message);
});

claudeProcess.on('exit', (code) => {
  console.log('Process exited with code:', code);
});