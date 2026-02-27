"use client";

import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const tokenData = [
  { agent: "Orbit", input: 145.2, output: 12.3, color: "#a78bfa" },
  { agent: "Monitor", input: 89.7, output: 8.9, color: "#22d3ee" },
  { agent: "Evaluator", input: 42.3, output: 5.2, color: "#34d399" },
  { agent: "Kea", input: 112.4, output: 9.8, color: "#60a5fa" },
  { agent: "Luna", input: 78.9, output: 7.1, color: "#fbbf24" },
  { agent: "Strategist", input: 56.8, output: 4.3, color: "#fb7185" },
];

const hourlyData = [
  { hour: "00:00", tokens: 45 },
  { hour: "04:00", tokens: 32 },
  { hour: "08:00", tokens: 89 },
  { hour: "12:00", tokens: 124 },
  { hour: "16:00", tokens: 98 },
  { hour: "20:00", tokens: 156 },
];

export default function TokenUsage() {
  const totalInput = tokenData.reduce((sum, d) => sum + d.input, 0);
  const totalOutput = tokenData.reduce((sum, d) => sum + d.output, 0);
  const maxTokens = Math.max(...hourlyData.map(d => d.tokens));

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Token Usage</h2>
          <p className="text-zinc-400 text-sm mt-1">Real-time token consumption across agents</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+12.4%</span>
          </div>
          <div className="text-sm text-zinc-400">
            Last 24h
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="text-zinc-400 text-sm mb-1">Input Tokens</div>
          <div className="text-2xl font-bold text-white">{totalInput.toFixed(1)}k</div>
          <div className="text-xs text-emerald-400 mt-1">+8.2% from yesterday</div>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="text-zinc-400 text-sm mb-1">Output Tokens</div>
          <div className="text-2xl font-bold text-white">{totalOutput.toFixed(1)}k</div>
          <div className="text-xs text-cyan-400 mt-1">+5.7% from yesterday</div>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="text-zinc-400 text-sm mb-1">Total</div>
          <div className="text-2xl font-bold gradient-text">{(totalInput + totalOutput).toFixed(1)}k</div>
          <div className="text-xs text-violet-400 mt-1">+7.1% from yesterday</div>
        </div>
      </div>

      {/* Bar chart - hourly */}
      <div className="mb-6">
        <div className="text-sm text-zinc-400 mb-3">Hourly Distribution</div>
        <div className="flex items-end justify-between gap-2 h-24">
          {hourlyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${(d.tokens / maxTokens) * 100}%`,
                  background: `linear-gradient(to top, #8b5cf6, #06b6d4)`,
                  minHeight: "4px"
                }}
              />
              <span className="text-xs text-zinc-500">{d.hour.split(":")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent breakdown */}
      <div>
        <div className="text-sm text-zinc-400 mb-3">By Agent</div>
        <div className="space-y-3">
          {tokenData.map((agent, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium truncate">{agent.agent}</div>
              <div className="flex-1 h-6 bg-zinc-900 rounded-full overflow-hidden flex">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(agent.input / totalInput) * 100}%`,
                    background: agent.color,
                    opacity: 0.8
                  }}
                />
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(agent.output / totalOutput) * 50}%`,
                    background: agent.color,
                    opacity: 0.4
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm">
                <span className="text-white font-medium">{(agent.input + agent.output).toFixed(1)}k</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}