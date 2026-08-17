import React, { useState } from "react";
import { TabType, AutoApplyConfig } from "../types";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";
import { 
  Briefcase, 
  Sparkles, 
  FileText, 
  Bot, 
  Kanban, 
  Send, 
  MessageSquareCode, 
  BarChart3, 
  Zap, 
  UserCircle,
  LogIn,
  LogOut,
  Database,
  Globe
} from "lucide-react";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  autoApplyConfig: AutoApplyConfig;
  toggleAutopilot: () => void;
  totalApplications: number;
  candidateName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  autoApplyConfig,
  toggleAutopilot,
  totalApplications,
  candidateName,
}) => {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Sparkles className="w-4 h-4" /> },
    { id: "jobs", label: "Find Jobs", icon: <Briefcase className="w-4 h-4" /> },
    { id: "resume", label: "Resume AI", icon: <FileText className="w-4 h-4" /> },
    { id: "autoapply", label: "Batch Prep", icon: <Bot className="w-4 h-4" />, badge: autoApplyConfig.enabled ? "ON" : undefined },
    { id: "tracker", label: "App Tracker", icon: <Kanban className="w-4 h-4" />, badge: totalApplications },
    { id: "outreach", label: "Outreach AI", icon: <Send className="w-4 h-4" /> },
    { id: "interview", label: "Mock Interview", icon: <MessageSquareCode className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-white">HireFlow</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  AI
                </span>
                <span className="hidden md:inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                  <Database className="w-3 h-3" />
                  <span>Assisted Apply</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">AI Job Hunt & Auto-Apply Copilot</p>
            </div>
          </div>

          {/* Autopilot Quick Status & Auth */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAutopilot}
              className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                autoApplyConfig.enabled
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoApplyConfig.enabled ? "bg-emerald-400" : "bg-slate-500"}`} />
              <span>Batch prep: {autoApplyConfig.enabled ? "ON" : "OFF"}</span>
              <span className="text-slate-400">({autoApplyConfig.appliedToday}/{autoApplyConfig.dailyLimit})</span>
            </button>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* Auth status & button */}
            {user ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setActiveTab("resume")}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 transition border border-slate-700/80"
                >
                  <UserCircle className="w-4 h-4 text-indigo-400" />
                  <div className="text-left leading-none hidden md:block">
                    <span className="font-bold text-white block text-xs">{candidateName.split(" ")[0]}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">{user.email}</span>
                  </div>
                </button>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-transparent hover:border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold transition shadow-lg shadow-indigo-600/30"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : item.badge === "ON"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

