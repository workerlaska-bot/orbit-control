"use client";

import { Cpu, Brain, Sparkles, Shield, BarChart3, Rocket, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const agentIcons: Record<string, any> = {
  "honzik": Brain,
  "orbit": Brain,
  "monitor": Cpu,
  "evaluator": BarChart3,
  "executor": Rocket,
  "strategist": Shield,
  "kea": Sparkles,
  "luna": User,
};

const agentColors: Record<string, string> = {
  "honzik": "violet",
  "orbit": "violet",
  "monitor": "cyan",
  "evaluator": "emerald",
  "executor": "rose",
  "strategist": "amber",
  "kea": "blue",
  "luna": "violet",
};

const colorMap = {
  violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function AgentGrid() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      const { data: sessions, error } = await supabase
        .from('agent_sessions')
        .select('*')
        .order('last_activity', { ascending: false })
        .limit(8);

      if (error) throw error;

      // Group by agent_id to get unique agents with latest data
      const agentMap = new Map();
      sessions?.forEach(session => {
        const existing = agentMap.get(session.agent_id);
        if (!existing || new Date(session.last_activity) > new Date(existing.last_activity)) {
          agentMap.set(session.agent_id, session);
        }
      });

      const uniqueAgents = Array.from(agentMap.values()).map(session => ({
        id: session.agent_id,
        name: session.agent_id.charAt(0).toUpperCase() + session.agent_id.slice(1),
        model: session.model || 'Unknown',
        status: session.status,
        tokens: (session.tokens_in / 1000) || 0, // Convert to k tokens
        icon: agentIcons[session.agent_id] || Cpu,
        color: agentColors[session.agent_id] || 'violet',
      }));

      setAgents(uniqueAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback to mock data if needed
      const fallbackAgents = [
        { id: "honzik", name: "Orbit", model: "GLM-5-TEE", status: "active", tokens: 145.2, icon: Brain, color: "violet" },
        { id: "monitor", name: "Monitor", model: "GLM-4.7-TEE", status: "idle", tokens: 89.7, icon: Cpu, color: "cyan" },
        { id: "evaluator", name: "Evaluator", model: "DeepSeek-V3.2", status: "active", tokens: 42.3, icon: BarChart3, color: "emerald" },
      ];
      setAgents(fallbackAgents);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Agent Grid</h2>
          <p className="text-zinc-400 text-sm mt-1">Live status of all active agents</p>
        </div>
        <div className="text-sm text-zinc-400">
          Total <span className="text-white font-medium">7</span> agents
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const statusColor = 
            agent.status === "active" ? "status-active" :
            agent.status === "idle" ? "status-idle" : "status-error";
          
          return (
            <div
              key={agent.id}
              className={`p-4 rounded-xl border ${colorMap[agent.color as keyof typeof colorMap]} transition-all duration-300 cursor-pointer hover:scale-105 ${
                selectedAgent === agent.id ? "ring-2 ring-offset-1 ring-offset-zinc-900 ring-violet-500" : ""
              }`}
              onClick={() => setSelectedAgent(agent.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-black/30">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`status-dot ${statusColor}`}></div>
                  <span className="text-xs font-medium capitalize">{agent.status}</span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="font-bold text-lg">{agent.name}</div>
                <div className="text-xs text-zinc-400 truncate">{agent.model}</div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-zinc-400">Tokens:</span>{" "}
                  <span className="font-medium text-white">
                    {agent.tokens.toFixed(1)}k
                  </span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  agent.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                  agent.status === "idle" ? "bg-amber-500/20 text-amber-400" :
                  "bg-rose-500/20 text-rose-400"
                }`}>
                  {agent.status.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedAgent && (
        <div className="mt-6 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Selected: {selectedAgent}</div>
            <button 
              onClick={() => setSelectedAgent(null)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="text-sm text-zinc-400">
            Click on agent details to view detailed session information, logs, and performance metrics.
          </div>
        </div>
      )}
    </div>
  );
}