import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Collector error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleSessions(sessions: any[]) {
  const records = sessions.map(s => ({
    session_key: s.key || s.sessionId,
    agent_id: extractAgentId(s.key || s.sessionId),
    model: s.model,
    status: s.status || 'active',
    tokens_in: s.contextTokens || 0,
    tokens_out: s.totalTokens || 0,
    context_tokens: s.contextTokens || 0,
    started_at: s.startedAt || new Date().toISOString(),
    last_activity: new Date().toISOString(),
  }));

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
    session_id: l.sessionId,
    agent_id: l.agentId,
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
  const records = cronData.map(c => ({
    job_name: c.name || c.job_name,
    job_id: c.id,
    status: c.status,
    ran_at: c.lastRun || new Date().toISOString(),
    next_run: c.nextRun,
    error_message: c.errorMessage,
    duration_ms: c.durationMs,
  }));

  const { error } = await supabase
    .from('cron_runs')
    .insert(records);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
}

async function handleMetrics(metrics: any) {
  const records = Object.entries(metrics).map(([name, value]) => ({
    metric_name: name,
    value: typeof value === 'object' ? value : { value },
    recorded_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('system_metrics')
    .insert(records);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
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