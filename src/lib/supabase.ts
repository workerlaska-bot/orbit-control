import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface AgentSession {
  id: string
  session_key: string
  agent_id: string
  model: string | null
  status: string
  tokens_in: number
  tokens_out: number
  context_tokens: number
  started_at: string
  ended_at: string | null
  last_activity: string
}

export interface AgentLog {
  id: string
  session_id: string | null
  agent_id: string
  level: string
  message: string | null
  metadata: any
  timestamp: string
}

export interface CronRun {
  id: string
  job_name: string
  job_id: string | null
  status: string
  ran_at: string
  next_run: string | null
  error_message: string | null
  duration_ms: number | null
}

export interface SystemMetric {
  id: string
  metric_name: string
  value: any
  recorded_at: string
}

export interface DailySummary {
  id: string
  date: string
  agent_id: string
  total_sessions: number
  total_tokens_in: number
  total_tokens_out: number
  total_errors: number
  avg_duration_seconds: number
}
