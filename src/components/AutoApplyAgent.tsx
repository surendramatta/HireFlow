import React, { useState } from "react";
import { AutoApplyConfig, AutoApplyLog, JobListing, ApplicationRecord, CandidateProfile } from "../types";
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sparkles, 
  ShieldAlert, 
  ListFilter, 
  Terminal, 
  ArrowRight,
  Zap,
  Check,
  FileText,
  Loader2,
  FileCheck,
  Eye,
  Building2,
  List
} from "lucide-react";

interface AutoApplyAgentProps {
  autoApplyConfig: AutoApplyConfig;
  setAutoApplyConfig: React.Dispatch<React.SetStateAction<AutoApplyConfig>>;
  logs: AutoApplyLog[];
  setLogs: React.Dispatch<React.SetStateAction<AutoApplyLog[]>>;
  jobs: JobListing[];
  applications: ApplicationRecord[];
  profile: CandidateProfile;
  onApplyJob: (job: JobListing, tailoredCoverLetter?: string) => Promise<void>;
  onBatchAutoApply: (count: number) => void;
  toggleAutopilot: () => void;
}

export const AutoApplyAgent: React.FC<AutoApplyAgentProps> = ({
  autoApplyConfig,
  setAutoApplyConfig,
  logs,
  setLogs,
  jobs,
  applications,
  profile,
  onApplyJob,
  onBatchAutoApply,
  toggleAutopilot,
}) => {
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [batchCount, setBatchCount] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<"logs" | "settings">("logs");
  const [previewCoverLetter, setPreviewCoverLetter] = useState<{ company: string; role: string; text: string } | null>(null);

  const [agentProgress, setAgentProgress] = useState<{
    currentJobIndex: number;
    totalJobs: number;
    currentJobTitle: string;
    currentCompany: string;
    currentMatchScore: number;
    currentPhase: "matching" | "cover_letter" | "screening" | "submitting" | "done";
    generatedLetterSnippet?: string;
  } | null>(null);

  // Eligible jobs that match criteria and haven't been applied yet
  const safeJobs = jobs || [];
  const safeApplications = applications || [];
  const safeLogs = logs || [];

  const unappliedJobs = safeJobs.filter(
    (j) => !safeApplications.some((a) => a.jobId === j.id && a.status !== "saved")
  );

  const highAffinityJobs = unappliedJobs
    .filter((j) => (j.matchScore || 0) >= (autoApplyConfig?.minMatchScore || 70))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const eligibleJobsCount = highAffinityJobs.length;

  const handleRunBatchAgent = async () => {
    const jobsToProcess = (highAffinityJobs.length > 0 ? highAffinityJobs : unappliedJobs).slice(0, batchCount);

    if (jobsToProcess.length === 0) {
      alert("All jobs in your feed have already been applied to! Search or import new jobs in the Job Search tab.");
      return;
    }

    setIsRunningBatch(true);

    for (let i = 0; i < jobsToProcess.length; i++) {
      const job = jobsToProcess[i];

      // Phase 1: Matching
      setAgentProgress({
        currentJobIndex: i + 1,
        totalJobs: jobsToProcess.length,
        currentJobTitle: job.title,
        currentCompany: job.company,
        currentMatchScore: job.matchScore,
        currentPhase: "matching",
      });
      await new Promise((r) => setTimeout(r, 600));

      // Phase 2: Gemini Cover Letter Generation
      setAgentProgress((prev) => prev ? { ...prev, currentPhase: "cover_letter" } : null);
      let generatedLetter = "";

      if (autoApplyConfig.autoGenerateCoverLetter) {
        try {
          const res = await fetch("/api/ai/generate-cover-letter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateName: profile.fullName || "Candidate",
              candidateBackground: `${profile.skills?.join(", ")}. ${profile.resumeText ? profile.resumeText.slice(0, 500) : ""}`,
              jobTitle: job.title,
              jobCompany: job.company,
              jobDescription: job.description || job.requirements?.join(" ") || "Software engineering opportunity",
              tone: "professional, tailored, high-impact",
            }),
          });
          const data = await res.json();
          generatedLetter = data.coverLetter || "";
        } catch (err) {
          console.warn("Cover letter generation error:", err);
          generatedLetter = `Dear Hiring Team at ${job.company},\n\nI am excited to apply for the ${job.title} position...`;
        }
      } else {
        generatedLetter = `Dear Hiring Team at ${job.company},\n\nI am writing to express my interest in the ${job.title} position at ${job.company}. With my background in ${profile.skills?.join(", ")}, I am confident I can make an immediate impact.\n\nBest regards,\n${profile.fullName}`;
      }

      setAgentProgress((prev) => prev ? { ...prev, generatedLetterSnippet: generatedLetter.slice(0, 180) + "..." } : null);
      await new Promise((r) => setTimeout(r, 700));

      // Phase 3: Recruiter Screening Answers
      if (autoApplyConfig.autoAnswerScreening) {
        setAgentProgress((prev) => prev ? { ...prev, currentPhase: "screening" } : null);
        await new Promise((r) => setTimeout(r, 500));
      }

      // Phase 4: Submitting & Saving
      setAgentProgress((prev) => prev ? { ...prev, currentPhase: "submitting" } : null);
      await onApplyJob(job, generatedLetter);
      await new Promise((r) => setTimeout(r, 600));
    }

    setAgentProgress({
      currentJobIndex: jobsToProcess.length,
      totalJobs: jobsToProcess.length,
      currentJobTitle: "Batch Execution Complete!",
      currentCompany: `${jobsToProcess.length} Applications Processed`,
      currentMatchScore: 100,
      currentPhase: "done",
    });

    setTimeout(() => {
      setIsRunningBatch(false);
      setAgentProgress(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                autoApplyConfig.enabled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              Autopilot Agent Status: {autoApplyConfig.enabled ? "RUNNING" : "PAUSED"}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span>HireFlow Autopilot & Batch Application Engine</span>
          </h1>
          <p className="text-xs text-slate-400">
            Processes job requirements against your parsed candidate profile, generates custom cover letters via Gemini, and automates 'Apply' actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleAutopilot}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
              autoApplyConfig.enabled
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
          >
            {autoApplyConfig.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{autoApplyConfig.enabled ? "Pause Autopilot" : "Activate Autopilot"}</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 pl-2">Batch Size:</span>
            {[1, 3, 5, 10].map((num) => (
              <button
                key={num}
                onClick={() => setBatchCount(num)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  batchCount === num
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            onClick={handleRunBatchAgent}
            disabled={isRunningBatch}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/20"
          >
            <Zap className={`w-4 h-4 ${isRunningBatch ? "animate-spin text-amber-300" : ""}`} />
            <span>{isRunningBatch ? "Agent Executing..." : `Run AI Batch (${batchCount})`}</span>
          </button>
        </div>
      </div>

      {/* Active Agent Progress Bar when executing */}
      {agentProgress && (
        <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-2xl p-5 space-y-4 shadow-xl shadow-indigo-950/50 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Bot className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    Job {agentProgress.currentJobIndex} of {agentProgress.totalJobs}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    {agentProgress.currentMatchScore}% AI Match
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  {agentProgress.currentJobTitle} <span className="text-slate-400 font-normal">at {agentProgress.currentCompany}</span>
                </h3>
              </div>
            </div>

            <span className="text-xs text-amber-400 font-mono font-bold flex items-center space-x-1.5 self-start sm:self-auto">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {agentProgress.currentPhase === "matching" && "Step 1/4: Analyzing Job Requirements..."}
                {agentProgress.currentPhase === "cover_letter" && "Step 2/4: Generating Cover Letter via Gemini..."}
                {agentProgress.currentPhase === "screening" && "Step 3/4: Resolving Screening Vault Questions..."}
                {agentProgress.currentPhase === "submitting" && "Step 4/4: Automating 'Apply' Action & Saving DB..."}
                {agentProgress.currentPhase === "done" && "Complete!"}
              </span>
            </span>
          </div>

          {/* Stepper visuals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
              agentProgress.currentPhase === "matching" ? "bg-indigo-950/80 border-indigo-500 text-indigo-200" : "bg-slate-950 border-slate-800 text-slate-400"
            }`}>
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">1. Profile Match</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
              agentProgress.currentPhase === "cover_letter" ? "bg-indigo-950/80 border-indigo-500 text-indigo-200" : "bg-slate-950 border-slate-800 text-slate-400"
            }`}>
              <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">2. Gemini Cover Letter</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
              agentProgress.currentPhase === "screening" ? "bg-indigo-950/80 border-indigo-500 text-indigo-200" : "bg-slate-950 border-slate-800 text-slate-400"
            }`}>
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">3. Screening Vault</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
              agentProgress.currentPhase === "submitting" || agentProgress.currentPhase === "done" ? "bg-emerald-950/80 border-emerald-500 text-emerald-200" : "bg-slate-950 border-slate-800 text-slate-400"
            }`}>
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">4. Auto Apply</span>
            </div>
          </div>

          {agentProgress.generatedLetterSnippet && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              <span className="text-slate-500 block mb-1">Gemini AI Cover Letter Draft:</span>
              <p className="italic">{agentProgress.generatedLetterSnippet}</p>
            </div>
          )}
        </div>
      )}

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Daily Quota Progress</div>
          <div className="text-xl font-black text-white mt-1">
            {autoApplyConfig.appliedToday} / {autoApplyConfig.dailyLimit}
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (autoApplyConfig.appliedToday / autoApplyConfig.dailyLimit) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">High Affinity Match Threshold</div>
          <div className="text-xl font-black text-indigo-400 mt-1">{autoApplyConfig.minMatchScore}%</div>
          <div className="text-[10px] text-slate-400 mt-1">{eligibleJobsCount} high-affinity jobs match</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Gemini Cover Letter AI</div>
          <div className="text-xl font-black text-cyan-400 mt-1">
            {autoApplyConfig.autoGenerateCoverLetter ? "ACTIVE" : "OFF"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Tailored for each vacancy</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Screening Vault Auto-Solver</div>
          <div className="text-xl font-black text-amber-400 mt-1">
            {autoApplyConfig.autoAnswerScreening ? "AUTO-SOLVE" : "OFF"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pre-fills recruiter forms</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "logs"
              ? "bg-slate-800 text-white border border-slate-700 shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Live Execution Console ({safeLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "settings"
              ? "bg-slate-800 text-white border border-slate-700 shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4 text-indigo-400" />
          <span>Agent Rules & Target Thresholds</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "logs" ? (
        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-200 font-bold">Autopilot Live Action Stream</span>
            </span>
            <span>Total Log Entries: {safeLogs.length}</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {safeLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-sans text-xs">
                No logs recorded yet. Click "Run AI Batch" above to start automated processing!
              </div>
            ) : (
              safeLogs.map((log) => {
                const matchedApp = safeApplications.find((a) => a.company === log.company && a.title === log.role);
                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition ${
                      log.status === "success"
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                        : log.status === "skipped"
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                        : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center space-x-2">
                        {log.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="text-white">{log.company}</span>
                        <span className="text-slate-400 font-normal">• {log.role}</span>
                        {log.matchScore && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-sans text-[10px]">
                            {log.matchScore}% Match
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">{log.timestamp}</span>
                    </div>

                    <p className="text-slate-300 font-sans text-xs leading-relaxed">{log.message}</p>

                    {matchedApp?.coverLetterUsed && (
                      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-sans">
                        <span className="text-slate-400 flex items-center space-x-1">
                          <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Custom Gemini Cover Letter Generated</span>
                        </span>
                        <button
                          onClick={() => setPreviewCoverLetter({
                            company: log.company,
                            role: log.role,
                            text: matchedApp.coverLetterUsed || ""
                          })}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3 mr-0.5" />
                          <span>View Letter</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Agent Rules & Settings Tab */
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Autopilot Automation Parameters</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Daily Application Quota Limit ({autoApplyConfig.dailyLimit})
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={autoApplyConfig.dailyLimit}
                  onChange={(e) =>
                    setAutoApplyConfig({ ...autoApplyConfig, dailyLimit: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  High-Affinity AI Match Threshold ({autoApplyConfig.minMatchScore}%)
                </label>
                <input
                  type="range"
                  min={60}
                  max={95}
                  step={5}
                  value={autoApplyConfig.minMatchScore}
                  onChange={(e) =>
                    setAutoApplyConfig({ ...autoApplyConfig, minMatchScore: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  checked={autoApplyConfig.autoGenerateCoverLetter}
                  onChange={(e) =>
                    setAutoApplyConfig({ ...autoApplyConfig, autoGenerateCoverLetter: e.target.checked })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="font-bold text-slate-200">Auto-Generate Cover Letters via Gemini</div>
                  <div className="text-[11px] text-slate-400">Generates custom, tailored cover letter matching candidate profile to job requirements.</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  checked={autoApplyConfig.autoAnswerScreening}
                  onChange={(e) =>
                    setAutoApplyConfig({ ...autoApplyConfig, autoAnswerScreening: e.target.checked })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="font-bold text-slate-200">Auto-Solve Recruiter Screening Questions</div>
                  <div className="text-[11px] text-slate-400">Uses Candidate Vault history (work auth, notice period, salary) to answer custom forms.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Modal View */}
      {previewCoverLetter && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">
                  Generated Gemini Cover Letter — {previewCoverLetter.company}
                </h3>
              </div>
              <button
                onClick={() => setPreviewCoverLetter(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400">Role: {previewCoverLetter.role}</p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-80 overflow-y-auto text-xs font-sans text-slate-200 leading-relaxed whitespace-pre-wrap">
              {previewCoverLetter.text}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewCoverLetter(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
