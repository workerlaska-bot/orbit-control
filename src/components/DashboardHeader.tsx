"use client";

import { Activity, Cpu, Database, Zap, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function DashboardHeader() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Never");

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Trigger a refresh event that child components can listen to
    // We'll dispatch a custom event that other components can listen to
    window.dispatchEvent(new CustomEvent('orbit-control-refresh'));
    
    // Also update the timestamp
    setLastUpdated(new Date().toLocaleTimeString());
    
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
            <Zap className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Orbit Control</span>
            </h1>
            <p className="text-zinc-400 mt-1">
              Real-time monitoring dashboard for OpenClaw agents
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">Live</span>
          <div className="status-dot status-active"></div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium">7 Agents</span>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <Database className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium">Synced</span>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}