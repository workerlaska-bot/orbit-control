"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Metric = {
  id: string;
  metric_name: string;
  value: any;
  recorded_at: string;
};

export default function SystemStats() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    
    // Listen for manual refresh button clicks
    const handleRefresh = () => fetchMetrics();
    window.addEventListener('orbit-control-refresh', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('orbit-control-refresh', handleRefresh);
    };
  }, []);

  async function fetchMetrics() {
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics([]); // No fallback mock data
    } finally {
      setLoading(false);
    }
  }

  // Convert metrics array to display format
  const metricDisplay: Record<string, { name: string; value: string; percent: number; icon: string; color: string }> = {};
  
  metrics.forEach(m => {
    if (m.metric_name === "contextWindow") {
      const current = m.value.current || 0;
      const max = m.value.max || 200000;
      metricDisplay["contextWindow"] = {
        name: "Context Window",
        value: `${(current/1000).toFixed(0)}k / ${(max/1000).toFixed(0)}k`,
        percent: (current / max) * 100,
        icon: "Database",
        color: "violet"
      };
    } else if (m.metric_name === "queueDepth") {
      metricDisplay["queueDepth"] = {
        name: "Queue Depth",
        value: String(m.value.value || 0),
        percent: 0,
        icon: "Cpu",
        color: "emerald"
      };
    } else if (m.metric_name === "cacheHitRate") {
      metricDisplay["cacheHitRate"] = {
        name: "Cache Hit Rate",
        value: `${m.value.value || 0}%`,
        percent: m.value.value || 0,
        icon: "HardDrive",
        color: "cyan"
      };
    } else if (m.metric_name === "activeSessions") {
      metricDisplay["activeSessions"] = {
        name: "Active Sessions",
        value: String(m.value.value || 0),
        percent: (m.value.value || 0) * 10,
        icon: "Server",
        color: "amber"
      };
    } else if (m.metric_name === "gatewayStatus") {
      metricDisplay["gatewayStatus"] = {
        name: "Gateway Status",
        value: m.value.status === "connected" ? "Connected" : "Disconnected",
        percent: m.value.status === "connected" ? 100 : 0,
        icon: "Wifi",
        color: m.value.status === "connected" ? "emerald" : "rose"
      };
    } else if (m.metric_name === "compactions") {
      metricDisplay["compactions"] = {
        name: "Compactions",
        value: String(m.value.value || 0),
        percent: 0,
        icon: "Zap",
        color: "violet"
      };
    }
  });

  // If no metrics from DB, show empty state
  const displayMetrics = Object.keys(metricDisplay).length > 0 
    ? Object.values(metricDisplay)
    : [];

  const colorClasses: Record<string, string> = {
    violet: "from-violet-500 to-violet-600",
    cyan: "from-cyan-500 to-cyan-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
  };

  if (loading) {
    return (
      <div className="animate-fadeIn flex items-center justify-center h-32">
        <div className="text-zinc-400 text-sm">Loading system stats...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 text-emerald-400">⚡</div>
        <h2 className="text-lg font-bold text-white">System Stats</h2>
      </div>

      <div className="space-y-3">
        {displayMetrics.map((metric, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[metric.color] || colorClasses.violet} bg-opacity-20`}>
              <div className="w-4 h-4 text-white flex items-center justify-center text-xs">
                {metric.icon === "Database" ? "💾" : 
                 metric.icon === "Cpu" ? "⚡" :
                 metric.icon === "HardDrive" ? "💿" :
                 metric.icon === "Server" ? "🖥️" :
                 metric.icon === "Wifi" ? "📶" : "⚡"}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">{metric.name}</span>
                <span className="text-sm font-medium text-white">{metric.value}</span>
              </div>
              
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colorClasses[metric.color] || colorClasses.violet} transition-all duration-500`}
                  style={{ width: `${metric.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Updated: {new Date().toLocaleTimeString()}</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            All systems operational
          </span>
        </div>
      </div>
    </div>
  );
}