import React from "react";
import { ApplicationRecord, JobListing } from "../types";
import { BarChart3, TrendingUp, Target, Inbox } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface AnalyticsViewProps {
  applications: ApplicationRecord[];
  jobs: JobListing[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ applications = [], jobs = [] }) => {
  const safeApps = applications || [];
  const safeJobs = jobs || [];

  const totalApps = safeApps.filter((a) => a.status !== "saved" && a.status !== "ready_to_submit").length;
  const readyApps = safeApps.filter((a) => a.status === "ready_to_submit").length;
  const screeningApps = safeApps.filter((a) => a.status === "screening").length;
  const interviewingApps = safeApps.filter((a) => a.status === "interviewing" || a.status === "offer").length;
  const offerApps = safeApps.filter((a) => a.status === "offer").length;
  const rejectedApps = safeApps.filter((a) => a.status === "rejected").length;

  const conversionRate = totalApps > 0 ? ((interviewingApps / totalApps) * 100).toFixed(1) + "%" : "0.0%";

  // Calculate average match score at apply time
  const matchScores = safeApps.map((a) => a.matchScoreAtApply || 0).filter((s) => s > 0);
  const avgMatchScore = matchScores.length > 0 
    ? Math.round(matchScores.reduce((sum, s) => sum + s, 0) / matchScores.length) + "%"
    : "N/A";

  // Skills demand from searched/saved jobs
  const skillCounts: Record<string, number> = {};
  safeJobs.forEach((j) => {
    (j.skillsRequired || []).forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  const skillDemandData = Object.entries(skillCounts)
    .map(([skill, count]) => ({ name: skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Group applications by status for real funnel chart
  const funnelChartData = [
    { name: "Ready", count: readyApps, fill: "#8b5cf6" },
    { name: "Applied", count: totalApps, fill: "#6366f1" },
    { name: "Screening", count: screeningApps, fill: "#f59e0b" },
    { name: "Interviewing", count: interviewingApps, fill: "#10b981" },
    { name: "Offers", count: offerApps, fill: "#06b6d4" },
    { name: "Rejected", count: rejectedApps, fill: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span>Application Analytics & Conversion Pipeline</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time analytics computed directly from your tracked submissions and active job board listings.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Applications</div>
          <div className="text-2xl font-black text-white mt-1">{totalApps}</div>
          <div className="text-[10px] text-slate-500 mt-1">Recorded submissions</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Interview Rate</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{conversionRate}</div>
          <div className="text-[10px] text-slate-500 mt-1">Interview callback ratio</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Offers Received</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">{offerApps}</div>
          <div className="text-[10px] text-slate-500 mt-1">Active job offers</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Avg Match Score</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{avgMatchScore}</div>
          <div className="text-[10px] text-slate-500 mt-1">Across submitted applications</div>
        </div>
      </div>

      {totalApps === 0 && readyApps === 0 ? (
        <div className="bg-slate-900/80 rounded-2xl p-12 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Application Data Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Apply to jobs using the Application Assistant to see real-time pipeline conversion metrics and interview response rates.
          </p>
        </div>
      ) : (
        /* Recharts Visualizations Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Application Status Breakdown</span>
            </h2>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Demand Chart */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Most In-Demand Skills Across Job Listings</span>
            </h2>
            <div className="h-64 w-full text-xs">
              {skillDemandData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Search or view jobs to populate skill demand analysis.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={skillDemandData}>
                    <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" width={90} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Vacancies Requiring Skill" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
