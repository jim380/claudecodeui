#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Testing Claude spawn with explicit PATH...');

// Test with PATH fix
const envWithPath = {
  ...process.env,
  PATH: `/usr/local/bin:${process.env.PATH || ''}`
};

const claudeProcess = spawn('claude', ['--version'], {
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