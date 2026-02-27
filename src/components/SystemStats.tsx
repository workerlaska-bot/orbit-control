"use client";

import { Cpu, Database, HardDrive, Wifi, Server, Zap } from "lucide-react";

const metrics = [
  { 
    name: "Context Window", 
    value: "84k / 164k", 
    percent: 51,
    icon: Database, 
    color: "violet",
    status: "normal"
  },
  { 
    name: "Queue Depth", 
    value: "0", 
    percent: 0,
    icon: Cpu, 
    color: "emerald",
    status: "optimal"
  },
  { 
    name: "Cache Hit Rate", 
    value: "22%", 
    percent: 22,
    icon: HardDrive, 
    color: "cyan",
    status: "normal"
  },
  { 
    name: "Active Sessions", 
    value: "2", 
    percent: 20,
    icon: Server, 
    color: "amber",
    status: "normal"
  },
  { 
    name: "Gateway Status", 
    value: "Connected", 
    percent: 100,
    icon: Wifi, 
    color: "emerald",
    status: "healthy"
  },
  { 
    name: "Compactions", 
    value: "0", 
    percent: 0,
    icon: Zap, 
    color: "violet",
    status: "optimal"
  },
];

const colorClasses = {
  violet: "from-violet-500 to-violet-600",
  cyan: "from-cyan-500 to-cyan-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  rose: "from-rose-500 to-rose-600",
};

export default function SystemStats() {
  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">System Stats</h2>
      </div>

      <div className="space-y-3">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[metric.color as keyof typeof colorClasses]} bg-opacity-20`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-zinc-400">{metric.name}</span>
                  <span className="text-sm font-medium text-white">{metric.value}</span>
                </div>
                
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colorClasses[metric.color as keyof typeof colorClasses]} transition-all duration-500`}
                    style={{ width: `${metric.percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Uptime: 14d 6h 32m</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            All systems operational
          </span>
        </div>
      </div>
    </div>
  );
}