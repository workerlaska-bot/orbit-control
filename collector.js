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
const { execSync } = require('child_process');

// Extract agent ID from session key, fallback to provided agentId
function extractAgentId(key, agentId) {
  if (agentId) return agentId;
  if (!key) return 'unknown';
  // Key formats: "agent:honzik:main", "agent:kea:slack:channel:xxx", "telegram:slash:xxx"
  if (key.startsWith('agent:')) {
    const parts = key.split(':');
    if (parts[1]) return parts[1];
  }
  // For telegram/slack/etc sessions without agent prefix, mark as 'external'
  return 'external';
}

async function fetchOpenClawData() {
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
    
    // Get contextTokens early
    const contextTokens = status.sessions?.defaults?.contextTokens || 200000;
    
    // Push sessions
    const sessions = status.sessions?.recent || [];
    const unique = new Map();
    sessions.forEach(s => {
      if (!unique.has(s.key)) unique.set(s.key, s);
    });
    
    const formattedSessions = Array.from(unique.values()).map(s => ({
      session_key: s.key,
      agent_id: extractAgentId(s.key, s.agentId),
      model: s.model,
      status: 'active',
      tokens_in: s.inputTokens || 0,
      tokens_out: s.outputTokens || 0,
      context_tokens: s.contextTokens || 0,
      context_max: contextTokens,
      started_at: new Date(s.updatedAt).toISOString(),
      last_activity: new Date().toISOString(),
    }));
    
    if (formattedSessions.length > 0) {
      await pushToDashboard('sessions', formattedSessions);
    }
    
    // Push metrics - more detailed system metrics
    const activeSessions = sessions.filter(s => Date.now() - s.updatedAt < 3600000).length; // last hour
    
    const metrics = {
      contextWindow: { current: Math.max(...sessions.map(s => s.inputTokens || 0)), max: contextTokens },
      activeSessions: { value: activeSessions },
      totalSessions: { value: sessions.length },
      totalTokens: { value: sessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0) },
      queueDepth: { value: 0 },
      cacheHitRate: { value: 18 },
    };
    await pushToDashboard('metrics', metrics);
    
    // Push cron jobs
    const formattedCronJobs = (cronData.jobs || []).map(j => ({
      id: j.id,
      name: j.name,
      agent_id: j.agentId,
      status: j.state?.lastStatus || 'unknown',
      ran_at: j.state?.lastRunAtMs ? new Date(j.state.lastRunAtMs).toISOString() : null,
      next_run_at: j.state?.nextRunAtMs ? new Date(j.state.nextRunAtMs).toISOString() : null,
      error_message: j.state?.lastError || null,
      duration_ms: j.state?.lastDurationMs || null,
    }));
    
    if (formattedCronJobs.length > 0) {
      await pushToDashboard('cron', formattedCronJobs);
    }
    
    // Push launchd jobs
    const launchdOutput = execSync('launchctl list', { encoding: 'utf8' });
    const launchdLines = launchdOutput.trim().split('\n').slice(1); // Skip header
    const launchdJobs = launchdLines
      .map(line => {
        const parts = line.split('\t');
        if (parts.length < 3) return null;
        return {
          label: parts[2]?.trim(),
          pid: parts[0] === '-' ? null : parseInt(parts[0]),
          status: parseInt(parts[1]) || 0,
          last_exit_code: parseInt(parts[1]) || 0,
        };
      })
      .filter(j => j && j.label && (j.label.startsWith('com.openclaw') || j.label.startsWith('ai.openclaw')));
    
    if (launchdJobs.length > 0) {
      // Push via cron endpoint with "launchd:" prefix in job_id
      const launchdFormatted = launchdJobs.map(l => ({
        id: `launchd:${l.label}`,
        name: l.label.replace('launchd:', ''),
        agent_id: l.label,
        status: l.status === 0 ? 'running' : 'stopped',
        ran_at: new Date().toISOString(),
        next_run_at: null,
        error_message: l.last_exit_code !== 0 ? `Exit code: ${l.last_exit_code}` : null,
        duration_ms: null,
      }));
      await pushToDashboard('cron', launchdFormatted);
    }
    
    // Push logs - create log entries from active sessions
    const logs = sessions.slice(0, 5).map(s => ({
      session_id: s.sessionId,
      agent_id: extractAgentId(s.key, s.agentId),
      level: 'info',
      message: `Session active: ${s.inputTokens || 0} tokens used, model: ${s.model || 'unknown'}`,
      timestamp: new Date(s.updatedAt).toISOString(),
    }));
    
    if (logs.length > 0) {
      await pushToDashboard('logs', logs);
    }
    
    console.log('Done.');
  } catch (error) {
    console.error('Collection failed:', error.message);
    process.exit(1);
  }
}

// Run once and exit
collectAndPush();
