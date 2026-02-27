"use client";

import { useState, useEffect } from "react";
import { Terminal, Filter, Search, Pause, Play } from "lucide-react";

type LogEntry = {
  id: string;
  timestamp: string;
  agent: string;
  level: "info" | "warn" | "error";
  message: string;
};

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "09:45:23", agent: "monitor", level: "info", message: "Scanning leaderboard for qualified traders..." },
  { id: "2", timestamp: "09:45:24", agent: "monitor", level: "info", message: "Found 2 traders with >55% win rate" },
  { id: "3", timestamp: "09:45:25", agent: "evaluator", level: "info", message: "Evaluating signal sig_20260227_043838" },
  { id: "4", timestamp: "09:45:26", agent: "evaluator", level: "warn", message: "Price 0.88 requires >88% WR for +EV, trader has 56%" },
  { id: "5", timestamp: "09:45:27", agent: "evaluator", level: "info", message: "Signal REJECTED - negative EV: -$0.96" },
  { id: "6", timestamp: "09:46:01", agent: "honzik", level: "info", message: "Session resumed, context loaded from memory" },
  { id: "7", timestamp: "09:46:15", agent: "kea", level: "info", message: "Task spawned: code review for orbit-control" },
  { id: "8", timestamp: "09:47:00", agent: "executor", level: "error", message: "No approved signals pending execution" },
  { id: "9", timestamp: "09:48:22", agent: "strategist", level: "info", message: "Daily summary generated: 0 trades, 0 PnL" },
  { id: "10", timestamp: "09:49:01", agent: "monitor", level: "info", message: "Cron scan completed, next run in 5 minutes" },
];

export default function LiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const filteredLogs = logs.filter(log => {
    if (filter !== "all" && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Live Logs</h2>
            <p className="text-zinc-400 text-sm">Real-time agent activity stream</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`btn btn-secondary flex items-center gap-2 ${isPaused ? "text-amber-400" : ""}`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-1">
          {["all", "info", "warn", "error"].map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === level
                  ? level === "error" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                    level === "warn" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    level === "info" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                    "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Log viewer */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="max-h-64 overflow-y-auto p-3 font-mono text-sm">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`log-entry ${
                log.level === "error" ? "log-error" :
                log.level === "warn" ? "log-warn" : "log-info"
              }`}
            >
              <span className="text-zinc-500 mr-3">{log.timestamp}</span>
              <span className="text-zinc-400 mr-3">[{log.agent}]</span>
              <span className="text-zinc-300">{log.message}</span>
            </div>
          ))}
          
          {filteredLogs.length === 0 && (
            <div className="text-center text-zinc-500 py-8">
              No logs matching your filters
            </div>
          )}
        </div>
        
        <div className="border-t border-zinc-800 px-3 py-2 flex items-center justify-between text-xs text-zinc-500">
          <span>{filteredLogs.length} entries</span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {isPaused ? "Paused" : "Live"}
          </span>
        </div>
      </div>
    </div>
  );
}