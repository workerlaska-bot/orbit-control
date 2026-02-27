#!/usr/bin/env node
/**
 * Orbit Control Collector - One-shot version
 * 
 * Fetches data from OpenClaw and pushes to Orbit Control dashboard.
 * Designed to run once per cron trigger (not continuous).
 * 
 * Usage: node collector.js
 * Schedule via cron every 10 seconds
 */

const ORBIT_CONTROL = process.env.ORBIT_CONTROL_URL || 'https://orbit-control-three.vercel.app';
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '7');

async function fetchOpenClawData() {
  const { execSync } = require('child_process');
  
  const statusOutput = execSync('openclaw status --json', { encoding: 'utf8' });
  const status = JSON.parse(statusOutput);
  
  const cronOutput = execSync('openclaw cron list --json', { encoding: 'utf8' });
  const cronData = JSON.parse(cronOutput);
  
  return { status, cronData };
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
      console.error(`✗ ${type}: ${error}`);
      return false;
    }
    
    const result = await response.json();
    console.log(`✓ ${type}: ${result.count || 'ok'}`);
    return true;
  } catch (error) {
    console.error(`✗ ${type}: ${error.message}`);
    return false;
  }
}

async function collectAndPush() {
  console.log(`\n[${new Date().toISOString()}] Collecting...`);
  
  try {
    const { status, cronData } = await fetchOpenClawData();
    
    // Push sessions
    const sessions = status.sessions?.recent || [];
    const unique = new Map();
    sessions.forEach(s => {
      if (!unique.has(s.key)) unique.set(s.key, s);
    });
    
    const formattedSessions = Array.from(unique.values()).map(s => ({
      session_key: s.key,
      agent_id: s.agentId || 'unknown',
      model: s.model,
      status: 'active',
      tokens_in: s.inputTokens || 0,
      tokens_out: s.outputTokens || 0,
      context_tokens: s.contextTokens || 0,
      started_at: new Date(s.updatedAt).toISOString(),
      last_activity: new Date().toISOString(),
    }));
    
    if (formattedSessions.length > 0) {
      await pushToDashboard('sessions', formattedSessions);
    }
    
    // Push metrics
    const metrics = {
      totalSessions: sessions.length,
      totalTokens: sessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0),
    };
    await pushToDashboard('metrics', metrics);
    
    // Push cron jobs
    const formattedCronJobs = (cronData.jobs || []).map(j => ({
      id: j.id,
      name: j.name,
      agent_id: j.agentId,
      status: j.state?.lastStatus || 'unknown',
      last_run_at: j.state?.lastRunAtMs ? new Date(j.state.lastRunAtMs).toISOString() : null,
      next_run_at: j.state?.nextRunAtMs ? new Date(j.state.nextRunAtMs).toISOString() : null,
      error_message: j.state?.lastError || null,
      duration_ms: j.state?.lastDurationMs || null,
    }));
    
    if (formattedCronJobs.length > 0) {
      await pushToDashboard('cron', formattedCronJobs);
    }
    
    console.log('Done.');
  } catch (error) {
    console.error('Collection failed:', error.message);
    process.exit(1);
  }
}

// Run once and exit
collectAndPush();
