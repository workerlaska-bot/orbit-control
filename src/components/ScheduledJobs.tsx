"use client";

import { Clock, CheckCircle, XCircle, Server } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  'https://lygudcxsamhxaqcycbkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Z3VkY3hzYW1oeGFxY3ljYmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzcyNjUsImV4cCI6MjA4Nzc1MzI2NX0.xCqiyZyb6izFmeiAjDHgq6t_zdd8_5psm8tQCjEAc-U'
);

type Job = {
  id: string;
  job_id: string;
  job_name: string;
  agent_id: string;
  status: string;
  ran_at: string | null;
  next_run: string | null;
  error_message: string | null;
};

export default function ScheduledJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cron_runs')
      .select('*')
      .limit(20);
    
    if (error) {
      console.error('Error:', error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  }

  const cronJobs = (jobs || []).filter((j: any) => !j.job_id?.startsWith('launchd:'));
  const launchdJobs = (jobs || []).filter((j: any) => j.job_id?.startsWith('launchd:'));

  if (loading) return <div className="p-4 text-zinc-400">Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Server className="w-5 h-5 text-cyan-400" />
        Scheduled Jobs
      </h2>

      {cronJobs.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-zinc-400 uppercase mb-2">OpenClaw Cron</h3>
          {cronJobs.map((job) => (
            <div key={job.job_id} className="p-3 bg-zinc-900/50 rounded-lg mb-2 border border-zinc-800">
              <div className="text-white text-sm">{job.job_name}</div>
              <div className="text-zinc-500 text-xs">{job.status}</div>
            </div>
          ))}
        </div>
      )}

      {launchdJobs.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-zinc-400 uppercase mb-2">macOS Launchd</h3>
          {launchdJobs.map((job) => (
            <div key={job.job_id} className="p-3 bg-zinc-900/50 rounded-lg mb-2 border border-zinc-800">
              <div className="text-white text-sm">{job.job_name}</div>
              <div className="text-zinc-500 text-xs">{job.status}</div>
            </div>
          ))}
        </div>
      )}

      {jobs.length === 0 && (
        <div className="text-zinc-500 text-sm">No jobs found</div>
      )}
    </div>
  );
}
