import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use anon key - RLS is disabled so this should work for all operations
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { type, payload } = data;

    switch (type) {
      case 'sessions':
        return await handleSessions(payload);
      case 'logs':
        return await handleLogs(payload);
      case 'cron':
        return await handleCron(payload);
      case 'metrics':
        return await handleMetrics(payload);
      case 'cleanup':
        return await handleCleanup(payload);
      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Collector error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleSessions(sessions: any[]) {
  // Deduplicate by session_key
  const seen = new Set<string>();
  const records = sessions
    .map(s => ({
      session_key: s.session_key || s.key,
      agent_id: s.agent_id || extractAgentId(s.key || s.session_key),
      model: s.model,
      status: s.status || 'active',
      tokens_in: s.tokens_in || s.inputTokens || 0,
      tokens_out: s.tokens_out || s.outputTokens || 0,
      context_tokens: s.context_tokens || s.contextTokens || 0,
      started_at: s.started_at || new Date().toISOString(),
      last_activity: new Date().toISOString(),
    }))
    .filter(r => {
      if (seen.has(r.session_key)) return false;
      seen.add(r.session_key);
      return true;
    });

  const { error } = await supabase
    .from('agent_sessions')
    .upsert(records, { onConflict: 'session_key' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
}

async function handleLogs(logs: any[]) {
  const records = logs.map(l => ({
    session_id: l.session_id || l.sessionId || null,
    agent_id: l.agent_id || l.agentId || 'system',
    level: l.level || 'info',
    message: l.message,
    metadata: l.metadata || null,
    timestamp: l.timestamp || new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('agent_logs')
    .insert(records);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
}

async function handleCron(cronData: any[]) {
  // UPSERT by job_id to prevent duplicates
  const records = cronData.map(c => ({
    job_id: c.id || c.job_id,
    job_name: c.name || c.job_name,
    status: c.status,
    ran_at: c.last_run_at || c.ran_at || new Date().toISOString(),
    next_run: c.next_run_at || c.next_run || null,
    error_message: c.error_message || c.errorMessage || null,
    duration_ms: c.duration_ms || c.durationMs || null,
  }));

  // Use upsert on job_id to update existing jobs
  const { error } = await supabase
    .from('cron_runs')
    .upsert(records, { onConflict: 'job_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
}

async function handleMetrics(metrics: any) {
  // UPSERT by metric_name to prevent duplicates
  const records = Object.entries(metrics).map(([name, value]) => ({
    metric_name: name,
    value: typeof value === 'object' ? value : { value },
    recorded_at: new Date().toISOString(),
  }));

  // Use upsert on metric_name to update existing metrics
  const { error } = await supabase
    .from('system_metrics')
    .upsert(records, { onConflict: 'metric_name' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
}

async function handleCleanup(params: { retentionDays?: number }) {
  const retentionDays = params.retentionDays || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffIso = cutoffDate.toISOString();

  const results = {
    agent_logs: 0,
    agent_sessions: 0,
  };

  // Delete old logs (keep for retention period)
  const { data: deletedLogs, error: logError } = await supabase
    .from('agent_logs')
    .delete()
    .lt('timestamp', cutoffIso)
    .select('id');

  if (!logError && deletedLogs) {
    results.agent_logs = deletedLogs.length;
  }

  // Delete old sessions (keep for retention period)
  const { data: deletedSessions, error: sessionError } = await supabase
    .from('agent_sessions')
    .delete()
    .lt('last_activity', cutoffIso)
    .select('id');

  if (!sessionError && deletedSessions) {
    results.agent_sessions = deletedSessions.length;
  }

  return NextResponse.json({ 
    success: true, 
    deleted: results,
    cutoffDate: cutoffIso 
  });
}

function extractAgentId(sessionKey: string): string {
  // Extract agent id from session key like "agent:honzik:main" or "agent:monitor:subagent:..."
  const parts = sessionKey.split(':');
  if (parts[0] === 'agent' && parts[1]) {
    return parts[1];
  }
  return 'unknown';
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Orbit Control Collector API',
    timestamp: new Date().toISOString()
  });
}