#!/usr/bin/env node
/**
 * Orbit Control Collector
 * 
 * Fetches data from OpenClaw and pushes to Orbit Control dashboard
 * Run this on the same machine as OpenClaw
 * 
 * Usage: node collector.js
 * 
 * Environment variables:
 * - OPENCLAW_API_URL (default: http://127.0.0.1:18789)
 * - ORBIT_CONTROL_URL (required: your vercel deployment URL)
 */

const OPENCLAW_API = process.env.OPENCLAW_API_URL || 'http://127.0.0.1:18789';
const ORBIT_CONTROL = process.env.ORBIT_CONTROL_URL || 'https://orbit-control-three.vercel.app';
const INTERVAL_MS = (parseInt(process.env.COLLECTOR_INTERVAL_MINUTES || '5') * 60 * 1000);

async function fetchOpenClawStatus() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('openclaw status --json', { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('Failed to fetch OpenClaw status:', error.message);
    return null;
  }
}

async function fetchOpenClawCron() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('openclaw cron list --json', { encoding: 'utf8' });
    const data = JSON.parse(output);
    return data.jobs || [];
  } catch (error) {
    console.error('Failed to fetch OpenClaw cron:', error.message);
    return [];
  }
}

async function pushToDashboard(type, payload) {
  try {
    const response = await fetch(`${ORBIT_CONTROL}/api/collector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to push ${type}:`, error);
      return false;
    }
    
    const result = await response.json();
    console.log(`✓ Pushed ${type}: ${result.count || 'ok'}`);
    return true;
  } catch (error) {
    console.error(`Failed to push ${type}:`, error.message);
    return false;
  }
}

async function collectAndPush() {
  console.log(`\n[${new Date().toISOString()}] Collecting data...`);
  
  // Fetch OpenClaw status
  const status = await fetchOpenClawStatus();
  if (status) {
    // Extract sessions from status
    const sessions = status.sessions?.recent || [];
    const formattedSessions = sessions.map(s => ({
      key: s.key,
      sessionId: s.sessionId,
      agent_id: s.agentId,
      model: s.model,
      status: 'active', // Simplified - could check age, abortedLastRun, etc.
      tokens_in: s.inputTokens || 0,
      tokens_out: s.outputTokens || 0,
      context_tokens: s.contextTokens || 0,
      started_at: new Date(s.updatedAt).toISOString(),
      last_activity: new Date().toISOString(),
    }));
    
    if (formattedSessions.length > 0) {
      await pushToDashboard('sessions', formattedSessions);
    }
    
    // Extract metrics
    const metrics = {
      contextWindow: sessions.length > 0 ? sessions[0].contextTokens : 200000,
      activeSessions: sessions.length,
      totalTokens: sessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0),
      recentActivity: sessions.slice(0, 10).map(s => ({
        agent: s.agentId,
        tokens: s.inputTokens || 0,
        age: s.age || 0,
      })),
    };
    await pushToDashboard('metrics', metrics);
  }
  
  // Fetch cron jobs
  const cronJobs = await fetchOpenClawCron();
  if (cronJobs.length > 0) {
    const formattedCronJobs = cronJobs.map(job => ({
      id: job.id,
      name: job.name,
      agent_id: job.agentId,
      status: job.state?.lastStatus || 'unknown',
      last_run_at: job.state?.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : null,
      next_run_at: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
      error_message: job.state?.lastError || null,
      duration_ms: job.state?.lastDurationMs || null,
      consecutive_errors: job.state?.consecutiveErrors || 0,
    }));
    
    await pushToDashboard('cron', formattedCronJobs);
  }
  
  console.log('Collection complete.');
}

// Run immediately, then on interval
collectAndPush();
setInterval(collectAndPush, INTERVAL_MS);

console.log(`Orbit Control Collector started`);
console.log(`OpenClaw API: ${OPENCLAW_API}`);
console.log(`Dashboard: ${ORBIT_CONTROL}`);
console.log(`Interval: ${INTERVAL_MS / 1000}s`);
