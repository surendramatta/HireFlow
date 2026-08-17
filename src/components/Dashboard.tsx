import React from "react";
import { JobListing, ApplicationRecord, AutoApplyConfig, CandidateProfile, TabType } from "../types";
import { 
  Send, 
  Calendar, 
  CheckCircle2, 
  Bot, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Building2, 
  Briefcase, 
  Zap, 
  Clock, 
  Award, 
  Search, 
  Play, 
  Pause 
} from "lucide-react";

interface DashboardProps {
  jobs: JobListing[];
  applications: ApplicationRecord[];
  autoApplyConfig: AutoApplyConfig;
  profile: CandidateProfile;
  toggleAutopilot: () => void;
  setActiveTab: (tab: TabType) => void;
  setSelectedJob: (job: JobListing) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  jobs,
  applications,
  autoApplyConfig,
  profile,
  toggleAutopilot,
  setActiveTab,
  setSelectedJob,
}) => {
  const safeApps = applications || [];
  const safeJobs = jobs || [];

  const totalApplied = safeApps.filter((a) =>
    ["applied", "screening", "interviewing", "offer", "rejected"].includes(a.status)
  ).length;
  const readyToSubmitCount = safeApps.filter((a) => a.status === "ready_to_submit").length;
  const interviewingCount = safeApps.filter((a) => a.status === "interviewing").length;
  const screeningCount = safeApps.filter((a) => a.status === "screening").length;
  const offerCount = safeApps.filter((a) => a.status === "offer").length;

  const topMatches = [...safeJobs]
    .filter((j) => !safeApps.some((a) => a.jobId === j.id && a.status !== "saved"))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 4);

  const upcomingInterviews = safeApps.filter(
    (a) => a.status === "interviewing" && a.interviewDate
  );

  const userName = (profile?.fullName || "Candidate").split(" ")[0];
  const targetTitle = (profile?.targetTitles || [])[0] || "Software Engineer";

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>HireFlow AI Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your assisted apply copilot monitors company ATS boards and remote job marketplaces. Target:{" "}
              <span className="text-indigo-300 font-semibold">{targetTitle}</span> · min match{" "}
              <span className="text-emerald-400 font-semibold">{autoApplyConfig?.minMatchScore || 70}%</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleAutopilot}
              className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                autoApplyConfig.enabled
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
              }`}
            >
              {autoApplyConfig.enabled ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Batch Prep</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Enable Batch Prep</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveTab("jobs")}
              className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-sm font-medium text-slate-200 transition"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Explore Jobs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Applications</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{totalApplied}</span>
            <span className="text-xs text-emerald-400 flex items-center font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{autoApplyConfig.appliedToday} today
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full" 
              style={{ width: `${Math.min(100, (autoApplyConfig.appliedToday / autoApplyConfig.dailyLimit) * 100)}%` }} 
            />
          </div>
          {readyToSubmitCount > 0 && (
            <div className="mt-2 text-[11px] text-violet-300 font-medium">
              {readyToSubmitCount} ready to submit
            </div>
          )}
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Interviews Scheduled</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{interviewingCount}</span>
            <span className="text-xs text-slate-400">
              {totalApplied > 0 ? `${Math.round((interviewingCount / totalApplied) * 100)}% rate` : "0% rate"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Active interviewing round</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Recruiter Screening</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{screeningCount}</span>
            <span className="text-xs text-amber-400 font-medium">Pending responses</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Initial contact step</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Job Offers</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{offerCount}</span>
            <span className="text-xs text-cyan-400 font-semibold">
              {offerCount > 0 ? "🎉 Offer Ready" : "Target: 2+"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Final compensation stage</div>
        </div>
      </div>

      {/* Middle Section: Upcoming Interviews & Top Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Matches Panel */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-white text-base">Top Recommended Matches</h2>
            </div>
            <button
              onClick={() => setActiveTab("jobs")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium"
            >
              <span>View All ({jobs.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topMatches.map((job) => (
              <div
                key={job.id}
                onClick={() => {
                  setSelectedJob(job);
                  setActiveTab("jobs");
                }}
                className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-950 transition cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold overflow-hidden">
                        {job.logoUrl ? (
                          <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-200 text-sm group-hover:text-indigo-300 transition line-clamp-1">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-400">{job.company}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
                      {job.matchScore}%
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{job.location}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{job.salaryRange}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-400">Via {job.platform}</span>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition font-medium flex items-center">
                    Inspect Match &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Interview Alerts & Quick Action Hub */}
        <div className="space-y-6">
          {/* Upcoming Interviews Box */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Calendar className="w-4 h-4" />
              <span>Upcoming Interviews ({upcomingInterviews.length})</span>
            </div>

            {upcomingInterviews.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                <p>No interview rounds scheduled for today.</p>
                <button
                  onClick={() => setActiveTab("interview")}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs hover:bg-indigo-600/30 transition font-medium"
                >
                  Practice AI Mock Interview
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((app) => (
                  <div key={app.id} className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-xs">{app.title}</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        {app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : "TBD"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{app.company} • {app.contactName || "Recruiter"}</p>
                    <button
                      onClick={() => setActiveTab("interview")}
                      className="w-full py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                    >
                      Prepare Answers with AI
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Tools Card */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Copilot Quick Actions</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("resume")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Run ATS Resume Audit</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => setActiveTab("outreach")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition"
              >
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Generate Recruiter InMail</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => setActiveTab("autoapply")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition"
              >
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>Configure Autopilot Rules</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
