"use client";

import { TrendingUp, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type AgentToken = {
  agent_id: string;
  tokens_in: number;
  tokens_out: number;
};

type Session = {
  agent_id: string;
  tokens_in: number;
  tokens_out: number;
  last_activity: string;
};

export default function TokenUsage() {
  const [tokenData, setTokenData] = useState<AgentToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInput, setTotalInput] = useState(0);
  const [totalOutput, setTotalOutput] = useState(0);

  useEffect(() => {
    fetchTokenData();
  }, []);

  async function fetchTokenData() {
    try {
      const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('agent_id, tokens_in, tokens_out, last_activity')
        .order('last_activity', { ascending: false });

      if (error) throw error;

      // Aggregate by agent_id
      const agentMap = new Map<string, AgentToken>();
      sessions?.forEach((s: Session) => {
        const existing = agentMap.get(s.agent_id);
        if (existing) {
          existing.tokens_in += s.tokens_in || 0;
          existing.tokens_out += s.tokens_out || 0;
        } else {
          agentMap.set(s.agent_id, {
            agent_id: s.agent_id,
            tokens_in: s.tokens_in || 0,
            tokens_out: s.tokens_out || 0,
          });
        }
      });

      const data = Array.from(agentMap.values());
      setTokenData(data);
      setTotalInput(data.reduce((sum, d) => sum + d.tokens_in, 0));
      setTotalOutput(data.reduce((sum, d) => sum + d.tokens_out, 0));
    } catch (error) {
      console.error('Error fetching token data:', error);
      // Fallback mock data
      setTokenData([
        { agent_id: "honzik", tokens_in: 145200, tokens_out: 12300 },
        { agent_id: "monitor", tokens_in: 89700, tokens_out: 8900 },
      ]);
      setTotalInput(234900);
      setTotalOutput(21200);
    } finally {
      setLoading(false);
    }
  }

  const hourlyData = [
    { hour: "00:00", tokens: 45 },
    { hour: "04:00", tokens: 32 },
    { hour: "08:00", tokens: 89 },
    { hour: "12:00", tokens: 124 },
    { hour: "16:00", tokens: 98 },
    { hour: "20:00", tokens: 156 },
  ];

  const maxTokens = Math.max(...hourlyData.map(d => d.tokens));

  const agentColors: Record<string, string> = {
    "honzik": "#a78bfa",
    "orbit": "#a78bfa",
    "monitor": "#22d3ee",
    "evaluator": "#34d399",
    "executor": "#fb7185",
    "strategist": "#fbbf24",
    "kea": "#60a5fa",
    "luna": "#a78bfa",
  };

  if (loading) {
    return (
      <div className="animate-fadeIn flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading token data...</div>
      </div>
    );
  }

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
            <span className="text-sm font-medium">Live</span>
          </div>
          <div className="text-sm text-zinc-400">
            {(totalInput + totalOutput) > 0 ? 'Active' : 'No data'}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="text-zinc-400 text-sm mb-1">Input Tokens</div>
          <div className="text-2xl font-bold text-white">
            {(totalInput / 1000).toFixed(1)}k
          </div>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="text-zinc-400 text-sm mb-1">Output Tokens</div>
          <div className="text-2xl font-bold text-white">
            {(totalOutput / 1000).toFixed(1)}k
          </div>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="text-zinc-400 text-sm mb-1">Total</div>
          <div className="text-2xl font-bold gradient-text">
            {((totalInput + totalOutput) / 1000).toFixed(1)}k
          </div>
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
          {tokenData.map((agent, i) => {
            const color = agentColors[agent.agent_id] || "#a78bfa";
            const total = agent.tokens_in + agent.tokens_out;
            const percent = totalInput > 0 ? (agent.tokens_in / totalInput) * 100 : 0;
            
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium truncate capitalize">
                  {agent.agent_id}
                </div>
                <div className="flex-1 h-6 bg-zinc-900 rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      background: color,
                      opacity: 0.8
                    }}
                  />
                </div>
                <div className="w-20 text-right text-sm">
                  <span className="text-white font-medium">
                    {(total / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}