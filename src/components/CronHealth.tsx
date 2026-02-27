"use client";

import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type CronRun = {
  id: string;
  name: string;
  agent_id: string;
  status: string;
  last_run_at: string | null;
  next_run_at: string | null;
  error_message: string | null;
  duration_ms: number | null;
};

export default function CronHealth() {
  const [cronJobs, setCronJobs] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCronData();
  }, []);

  async function fetchCronData() {
    try {
      const { data, error } = await supabase
        .from('cron_runs')
        .select('*')
        .order('last_run_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCronJobs(data || []);
    } catch (error) {
      console.error('Error fetching cron data:', error);
      // Fallback mock data
      setCronJobs([
        { id: "1", name: "monitor-scan", agent_id: "monitor", status: "ok", last_run_at: new Date().toISOString(), next_run_at: null, error_message: null, duration_ms: 5000 },
        { id: "2", name: "strategist-hourly", agent_id: "strategist", status: "error", last_run_at: new Date().toISOString(), next_run_at: null, error_message: "timeout", duration_ms: 60000 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const successCount = cronJobs.filter(j => j.status === 'ok' || j.status === 'success').length;
  const errorCount = cronJobs.filter(j => j.status === 'error').length;

  function formatTimeAgo(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  function formatTimeUntil(dateStr: string | null): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 0) return 'Overdue';
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    return `in ${Math.floor(diffHours / 24)}d`;
  }

  if (loading) {
    return (
      <div className="animate-fadeIn flex items-center justify-center h-32">
        <div className="text-zinc-400 text-sm">Loading cron data...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Cron Health</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-400">{successCount} OK</span>
          <span className="text-zinc-600">|</span>
          <span className="text-rose-400">{errorCount} Failed</span>
        </div>
      </div>

      <div className="space-y-2">
        {cronJobs.length === 0 ? (
          <div className="text-center text-zinc-500 py-4 text-sm">
            No cron data yet. Run the collector.
          </div>
        ) : (
          cronJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {job.status === 'ok' || job.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : job.status === 'error' ? (
                  <XCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
                )}
                <div>
                  <div className="text-sm font-medium text-white">{job.name}</div>
                  <div className="text-xs text-zinc-500 capitalize">{job.agent_id}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <div className="text-zinc-400">Last run</div>
                  <div className="text-white">{formatTimeAgo(job.last_run_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-400">Next</div>
                  <div className="text-cyan-400">{formatTimeUntil(job.next_run_at)}</div>
                </div>
                <div className={`px-2 py-1 rounded ${
                  job.status === 'ok' || job.status === 'success' 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/20 text-rose-400"
                }`}>
                  {job.status.toUpperCase()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}