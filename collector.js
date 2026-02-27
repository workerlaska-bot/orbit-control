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
    const response = await fetch(`${OPENCLAW_API}/status`);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch OpenClaw status:', error.message);
    return null;
  }
}

async function fetchOpenClawCron() {
  try {
    const response = await fetch(`${OPENCLAW_API}/cron`);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
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
    const sessions = status.sessions || [];
    if (sessions.length > 0) {
      await pushToDashboard('sessions', sessions);
    }
    
    // Extract metrics
    const metrics = {
      contextWindow: status.contextWindow,
      queueDepth: status.queue?.depth || 0,
      cacheHitRate: status.cache?.hitRate || 0,
      activeSessions: status.activeSessionsCount || sessions.length,
      gatewayStatus: status.gateway?.status || 'unknown',
      compactions: status.compactions || 0,
    };
    await pushToDashboard('metrics', metrics);
  }
  
  // Fetch cron jobs
  const cronJobs = await fetchOpenClawCron();
  if (cronJobs.length > 0) {
    await pushToDashboard('cron', cronJobs);
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
