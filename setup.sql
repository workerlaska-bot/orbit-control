-- Enable Row Level Security
ALTER TABLE IF EXISTS public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cron_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies (public dashboard - anyone can read)
CREATE POLICY "Allow public read access" ON public.agent_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.agent_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.cron_runs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.system_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.daily_summaries FOR SELECT USING (true);

-- agent_sessions
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL,
  model TEXT,
  status TEXT DEFAULT 'active',
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  context_tokens INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- agent_logs
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES agent_sessions(session_key),
  agent_id TEXT NOT NULL,
  level TEXT DEFAULT 'info',
  message TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_agent ON agent_logs(agent_id);

-- cron_runs
CREATE TABLE IF NOT EXISTS cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  job_id TEXT,
  status TEXT NOT NULL,
  ran_at TIMESTAMPTZ DEFAULT NOW(),
  next_run TIMESTAMPTZ,
  error_message TEXT,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cron_job ON cron_runs(job_name, ran_at DESC);

-- system_metrics
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  value JSONB NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_name ON system_metrics(metric_name, recorded_at DESC);

-- daily_summaries (aggregated for efficiency)
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  agent_id TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_tokens_in INTEGER DEFAULT 0,
  total_tokens_out INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  avg_duration_seconds INTEGER DEFAULT 0,
  UNIQUE(date, agent_id)
);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE agent_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE cron_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE system_metrics;
