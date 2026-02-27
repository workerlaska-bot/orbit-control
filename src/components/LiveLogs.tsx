"use client";

import { useState, useEffect } from "react";
import { Terminal, Filter, Search, Pause, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";

type LogEntry = {
  id: string;
  session_id: string | null;
  agent_id: string;
  level: string;
  message: string | null;
  metadata: any;
  timestamp: string;
};

export default function LiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      if (!isPaused) {
        fetchLogs();
      }
    }, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from('agent_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Fallback mock data
      setLogs([
        { id: "1", session_id: null, agent_id: "monitor", level: "info", message: "Failed to fetch logs, using mock data", metadata: {}, timestamp: new Date().toISOString() },
        { id: "2", session_id: null, agent_id: "system", level: "warn", message: "Connection to Supabase failed", metadata: {}, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter !== "all" && log.level !== filter) return false;
    if (search && !log.message?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

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
          {loading ? (
            <div className="text-center text-zinc-500 py-8">
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              No logs matching your filters
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`log-entry ${
                  log.level === "error" ? "log-error" :
                  log.level === "warn" ? "log-warn" : "log-info"
                }`}
              >
                <span className="text-zinc-500 mr-3">{formatTime(log.timestamp)}</span>
                <span className="text-zinc-400 mr-3">[{log.agent_id}]</span>
                <span className="text-zinc-300">{log.message}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="border-t border-zinc-800 px-3 py-2 flex items-center justify-between text-xs text-zinc-500">
          <span>{filteredLogs.length} entries</span>
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            {isPaused ? "Paused" : "Live"}
          </span>
        </div>
      </div>
    </div>
  );
}