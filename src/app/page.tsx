import DashboardHeader from "@/components/DashboardHeader";
import AgentGrid from "@/components/AgentGrid";
import TokenUsage from "@/components/TokenUsage";
import LiveLogs from "@/components/LiveLogs";
import CronHealth from "@/components/CronHealth";
import SystemStats from "@/components/SystemStats";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card card-hover">
              <AgentGrid />
            </div>
            
            <div className="card card-hover">
              <TokenUsage />
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            <div className="card card-hover">
              <SystemStats />
            </div>
            
            <div className="card card-hover">
              <CronHealth />
            </div>
          </div>
        </div>
        
        {/* Full width bottom */}
        <div className="card card-hover">
          <LiveLogs />
        </div>
      </div>
    </div>
  );
}