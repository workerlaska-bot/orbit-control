#!/usr/bin/env node
/**
 * Orbit Control Collector - 10-second intervals
 * 
 * Fetches data from OpenClaw and pushes to Orbit Control dashboard
 * Run this on the same machine as OpenClaw
 * 
 * Features:
 * - Runs every 10 seconds
 * - Pushes sessions (UPSERT by session_key)
 * - Pushes cron jobs (UPSERT by job_id)
 * - Pushes system metrics (UPSERT by metric_name)
 * - Pushes activity logs (INSERT, cleaned up daily)
 */

const ORBIT_CONTROL = process.env.ORBIT_CONTROL_URL || 'https://orbit-control-three.vercel.app';
const COLLECTOR_INTERVAL_MS = parseInt(process.env.COLLECTOR_INTERVAL_MS || '10000'); // 10 seconds
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '7');

// Last seen sessions to track changes
let lastSessions = new Map();
let lastCronJobs = new Map();

async function fetchOpenClawData() {
  const { execSync } = require('child_process');
  
  try {
    const statusOutput = execSync('openclaw status --json', { encoding: 'utf8' });
    const status = JSON.parse(statusOutput);
    
    const cronOutput = execSync('openclaw cron list --json', { encoding: 'utf8' });
    const cronData = JSON.parse(cronOutput);
    
    return { status, cronData };
  } catch (error) {
    console.error('Failed to fetch OpenClaw data:', error.message);
    return { status: null, cronData: null };
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
    console.log(`✓ ${type}: ${result.count || 'ok'}`);
    return true;
  } catch (error) {
    console.error(`Failed to push ${type}:`, error.message);
    return false;
  }
}

async function cleanupOldData() {
  try {
    const response = await fetch(`${ORBIT_CONTROL}/api/collector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'cleanup', 
        payload: { retentionDays: RETENTION_DAYS } 
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`🧹 Cleanup: deleted ${result.deleted.agent_logs} logs, ${result.deleted.agent_sessions} sessions`);
    }
  } catch (error) {
    console.error('Cleanup failed:', error.message);
  }
}

function extractLogsFromSessionChanges(currentSessions) {
  const logs = [];
  const now = new Date().toISOString();
  
  // Detect new sessions
  for (const [key, session] of Object.entries(currentSessions)) {
    if (!lastSessions.has(key)) {
      logs.push({
        agent_id: session.agent_id,
        level: 'info',
        message: `Session started: ${session.agent_id} (${session.model})`,
        timestamp: now,
      });
    }
    
    // Detect token usage changes
    const lastSession = lastSessions.get(key);
    if (lastSession && session.tokens_in > lastSession.tokens_in) {
      const diff = session.tokens_in - lastSession.tokens_in;
      if (diff > 100) { // Only log significant token usage
        logs.push({
          agent_id: session.agent_id,
          level: 'info',
          message: `${session.agent_id} used ${diff} tokens`,
          timestamp: now,
        });
      }
    }
  }
  
  return logs;
}

async function collectAndPush() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Collecting data...`);
  
  const { status, cronData } = await fetchOpenClawData();
  
  if (status) {
    // Process sessions
    const sessions = status.sessions?.recent || [];
    const sessionMap = {};
    
    const formattedSessions = sessions.map(s => {
      const session = {
        key: s.key,
        sessionId: s.sessionId,
        agent_id: s.agentId,
        model: s.model,
        status: 'active',
        tokens_in: s.inputTokens || 0,
        tokens_out: s.outputTokens || 0,
        context_tokens: s.contextTokens || 0,
        started_at: new Date(s.updatedAt).toISOString(),
        last_activity: new Date().toISOString(),
      };
      
      sessionMap[s.key] = session;
      return session;
    });
    
    if (formattedSessions.length > 0) {
      await pushToDashboard('sessions', formattedSessions);
    }
    
    // Extract logs from session changes
    const logs = extractLogsFromSessionChanges(sessionMap);
    if (logs.length > 0) {
      await pushToDashboard('logs', logs);
    }
    
    lastSessions = new Map(Object.entries(sessionMap));
    
    // Push system metrics
    const metrics = {
      activeSessions: sessions.length,
      totalTokens: sessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0),
      contextWindow: sessions.length > 0 ? sessions[0].contextTokens : 200000,
      lastCollection: { timestamp },
    };
    
    await pushToDashboard('metrics', metrics);
  }
  
  if (cronData) {
    // Process cron jobs
    const cronJobs = cronData.jobs || [];
    const formattedCronJobs = cronJobs.map(j => ({
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
  }
  
  // Run cleanup once per hour
  const now = new Date();
  if (now.getMinutes() === 0 && now.getSeconds() < 10) {
    await cleanupOldData();
  }
}

// Start collector
console.log(`🚀 Orbit Control Collector started (${COLLECTOR_INTERVAL_MS}ms interval)`);
console.log(`📊 Dashboard: ${ORBIT_CONTROL}`);

// Run immediately
collectAndPush();

// Schedule regular collection
setInterval(collectAndPush, COLLECTOR_INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Collector shutting down...');
  process.exit(0);
});