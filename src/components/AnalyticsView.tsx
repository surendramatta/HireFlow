import React from "react";
import { ApplicationRecord, JobListing } from "../types";
import { BarChart3, TrendingUp, Award, DollarSign, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AnalyticsViewProps {
  applications: ApplicationRecord[];
  jobs: JobListing[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ applications, jobs }) => {
  const weeklyData = [
    { week: "Week 1", applied: 6, interviews: 1 },
    { week: "Week 2", applied: 12, interviews: 2 },
    { week: "Week 3", applied: 18, interviews: 3 },
    { week: "Week 4", applied: 24, interviews: 5 },
  ];

  const safeApps = applications || [];
  const safeJobs = jobs || [];

  const funnelData = [
    { value: safeApps.length || 15, name: "Applied", fill: "#6366f1" },
    { value: safeApps.filter((a) => a.status !== "saved" && a.status !== "applied").length || 8, name: "Screening", fill: "#f59e0b" },
    { value: safeApps.filter((a) => a.status === "interviewing" || a.status === "offer").length || 4, name: "Interviewing", fill: "#10b981" },
    { value: safeApps.filter((a) => a.status === "offer").length || 1, name: "Offers", fill: "#06b6d4" },
  ];

  const skillCounts: Record<string, number> = {};
  safeJobs.forEach((j) => {
    (j.skillsRequired || []).forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  const skillDemandData = Object.entries(skillCounts)
    .map(([skill, count]) => ({ name: skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span>Job Hunt Analytics & Conversion Engine</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Track application conversion funnels, interview call-back rates, and industry skill demand trends.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Interview Conversion Rate</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">26.8%</div>
          <div className="text-[10px] text-slate-400 mt-1">+8.2% vs industry average (18.6%)</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Avg Response Time</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">4.2 Days</div>
          <div className="text-[10px] text-slate-400 mt-1">From application submission</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Avg Target Salary</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">$188,500</div>
          <div className="text-[10px] text-slate-400 mt-1">Across 6 matched vacancies</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Avg AI Resume Match</div>
          <div className="text-2xl font-black text-amber-400 mt-1">91.2%</div>
          <div className="text-[10px] text-slate-400 mt-1">High recruiter ATS alignment</div>
        </div>
      </div>

      {/* Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Volume Chart */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Applications & Interview Callbacks Trend</span>
          </h2>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Bar dataKey="applied" fill="#6366f1" radius={[4, 4, 0, 0]} name="Applications Sent" />
                <Bar dataKey="interviews" fill="#10b981" radius={[4, 4, 0, 0]} name="Interviews Scheduled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Demand Chart */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Most In-Demand Skills in Matching Roles</span>
          </h2>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={skillDemandData}>
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Vacancies Requiring Skill" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
