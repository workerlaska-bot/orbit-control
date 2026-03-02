"use client";

import { Clock, CheckCircle, XCircle, AlertCircle, Server } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type ScheduledJob = {
  id: string;
  job_id: string;
  job_name: string;
  agent_id: string;
  status: string;
  ran_at: string | null;
  next_run: string | null;
  error_message: string | null;
  duration_ms: number | null;
  source: 'cron' | 'launchd';
};

export default function CronHealth() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledJobs();
    
    // Listen for manual refresh button clicks
    const handleRefresh = () => fetchScheduledJobs();
    window.addEventListener('orbit-control-refresh', handleRefresh);
    return () => window.removeEventListener('orbit-control-refresh', handleRefresh);
  }, []);

  async function fetchScheduledJobs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cron_runs')
        .select('*')
        .order('ran_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Add source field based on job_id prefix
      const jobsWithSource = (data || []).map(j => ({
        ...j,
        source: j.job_id.startsWith('launchd:') ? 'launchd' as const : 'cron' as const,
      }));
      
      setJobs(jobsWithSource);
    } catch (error) {
      console.error('Error fetching scheduled jobs:', error);
      setJobs([]); // No fallback mock data
    } finally {
      setLoading(false);
    }
  }

  const cronJobs = jobs.filter(j => j.source === 'cron');
  const launchdJobs = jobs.filter(j => j.source === 'launchd');
  const successCount = jobs.filter(j => j.status === 'ok' || j.status === 'success' || j.status === 'running').length;
  const errorCount = jobs.filter(j => j.status === 'error' || j.status === 'stopped');

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

  function getStatusIcon(status: string) {
    if (status === 'ok' || status === 'success' || status === 'running') {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    if (status === 'error' || status === 'stopped') {
      return <XCircle className="w-4 h-4 text-rose-400" />;
    }
    return <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />;
  }

  function getStatusBadge(status: string) {
    const isOk = status === 'ok' || status === 'success' || status === 'running';
    return (
      <span className={`px-2 py-1 rounded text-xs ${
        isOk ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
      }`}>
        {status.toUpperCase()}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="animate-fadeIn flex items-center justify-center h-32">
        <div className="text-zinc-400 text-sm">Loading scheduled jobs...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Scheduled Jobs</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-400">{successCount} OK</span>
          <span className="text-zinc-600">|</span>
          <span className="text-rose-400">{errorCount.length} Failed</span>
        </div>
      </div>

      {/* OpenClaw Cron Jobs */}
      {cronJobs.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400 uppercase">OpenClaw Cron</span>
          </div>
          <div className="space-y-2">
            {cronJobs.map((job) => (
              <div
                key={job.job_id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="text-sm font-medium text-white">{job.job_name}</div>
                    <div className="text-xs text-zinc-500">{job.agent_id || 'system'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <div className="text-zinc-400">Last run</div>
                    <div className="text-white">{formatTimeAgo(job.ran_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-400">Next</div>
                    <div className="text-cyan-400">{formatTimeUntil(job.next_run)}</div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Launchd Jobs - DEBUG: show count */}
      {console.log('DEBUG: jobs count:', jobs.length, 'cron:', cronJobs.length, 'launchd:', launchdJobs.length) || launchdJobs.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400 uppercase">macOS Launchd</span>
          </div>
          <div className="space-y-2">
            {launchdJobs.map((job) => (
              <div
                key={job.job_id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="text-sm font-medium text-white">{job.job_name}</div>
                    <div className="text-xs text-zinc-500">{job.agent_id || 'system'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <div className="text-zinc-400">Status</div>
                    <div className="text-white">{job.status}</div>
                  </div>
                  {job.error_message && (
                    <div className="text-right max-w-32">
                      <div className="text-zinc-400">Error</div>
                      <div className="text-rose-400 text-xs truncate">{job.error_message}</div>
                    </div>
                  )}
                  {getStatusBadge(job.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="text-center text-zinc-500 py-4 text-sm">
          No scheduled jobs yet. Run the collector.
        </div>
      )}
    </div>
  );
}