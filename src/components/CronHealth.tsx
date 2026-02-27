"use client";

import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type CronJob = {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  status: "success" | "error" | "running";
  successRate: number;
  nextRun: string;
};

const cronJobs: CronJob[] = [
  { id: "1", name: "monitor-scan", schedule: "*/5 * * * *", lastRun: "2 min ago", status: "success", successRate: 94, nextRun: "in 3 min" },
  { id: "2", name: "strategist-hourly", schedule: "0 * * * *", lastRun: "45 min ago", status: "success", successRate: 100, nextRun: "in 15 min" },
  { id: "3", name: "strategist-daily", schedule: "0 22 * * *", lastRun: "22h ago", status: "error", successRate: 67, nextRun: "in 2h" },
  { id: "4", name: "strategist-morning", schedule: "0 7 * * *", lastRun: "14h ago", status: "success", successRate: 100, nextRun: "in 10h" },
  { id: "5", name: "data-cleanup", schedule: "0 0 * * 0", lastRun: "5d ago", status: "success", successRate: 100, nextRun: "in 2d" },
];

export default function CronHealth() {
  const totalJobs = cronJobs.length;
  const successCount = cronJobs.filter(j => j.status === "success").length;
  const errorCount = cronJobs.filter(j => j.status === "error").length;

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
        {cronJobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              {job.status === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : job.status === "error" ? (
                <XCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
              <div>
                <div className="text-sm font-medium text-white">{job.name}</div>
                <div className="text-xs text-zinc-500">{job.schedule}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-zinc-400">Last run</div>
                <div className="text-white">{job.lastRun}</div>
              </div>
              <div className="text-right">
                <div className="text-zinc-400">Next</div>
                <div className="text-cyan-400">{job.nextRun}</div>
              </div>
              <div className={`px-2 py-1 rounded ${
                job.successRate >= 90 ? "bg-emerald-500/20 text-emerald-400" :
                job.successRate >= 70 ? "bg-amber-500/20 text-amber-400" :
                "bg-rose-500/20 text-rose-400"
              }`}>
                {job.successRate}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}