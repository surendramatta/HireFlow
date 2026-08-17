import React, { useState, useEffect } from "react";
import { JobListing, CandidateProfile } from "../types";
import { resolveApplyUrl } from "../lib/applyUrl";
import { 
  Bot, 
  Code, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Play, 
  X, 
  Globe, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  Laptop
} from "lucide-react";

interface PlaywrightWorkflowModalProps {
  job: JobListing;
  profile: CandidateProfile;
  coverLetter?: string;
  screeningAnswers?: Record<string, string>;
  onClose: () => void;
  onConfirmApply: (job: JobListing, coverLetter?: string, answers?: Record<string, string>) => void | Promise<void>;
}

export const PlaywrightWorkflowModal: React.FC<PlaywrightWorkflowModalProps> = ({
  job,
  profile,
  coverLetter,
  screeningAnswers,
  onClose,
  onConfirmApply,
}) => {
  const [activeTab, setActiveTab] = useState<"runner" | "node" | "python" | "selectors">("runner");
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedStepsCount, setExecutedStepsCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const [playwrightData, setPlaywrightData] = useState<{
    jobTitle: string;
    jobCompany: string;
    platform: string;
    applyUrl: string;
    steps: Array<{
      id: string;
      action: string;
      selector: string;
      description: string;
      timestamp: string;
      status: string;
    }>;
    nodeScript: string;
    pythonScript: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchWorkflow() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/ai/generate-playwright-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: job.title,
            jobCompany: job.company,
            applyUrl: resolveApplyUrl(job) || job.applyUrl || "",
            platform: job.platform || "Greenhouse",
            candidateProfile: profile,
            coverLetter,
            screeningAnswers,
          }),
        });
        const data = await res.json();
        if (isMounted) {
          setPlaywrightData(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load Playwright workflow:", err);
        if (isMounted) setIsLoading(false);
      }
    }
    fetchWorkflow();
    return () => { isMounted = false; };
  }, [job, profile, coverLetter, screeningAnswers]);

  const handleStartPlaywrightRun = async () => {
    if (!playwrightData) return;
    setIsExecuting(true);
    setExecutedStepsCount(0);
    setIsDone(false);

    for (let i = 1; i <= playwrightData.steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setExecutedStepsCount(i);
    }

    setIsDone(true);
    setIsExecuting(false);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFinalSubmit = async () => {
    // Copy materials, open real portal, stage as Ready — do NOT claim Applied
    if (coverLetter) {
      try {
        await navigator.clipboard.writeText(coverLetter);
      } catch (err) {
        console.warn("Clipboard copy error:", err);
      }
    }

    const urlToOpen = resolveApplyUrl(job);
    if (!urlToOpen) {
      alert("No valid apply URL for this job. Search live jobs for a real career-page link.");
      return;
    }
    window.open(urlToOpen, "_blank", "noopener,noreferrer");

    // Caller should treat this as Ready to Submit / open portal — not silent Applied
    await onConfirmApply(job, coverLetter, screeningAnswers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Playwright Script Export</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-700 text-slate-300 border border-slate-600">
                  {job.platform || "Greenhouse"} · local scripts
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {job.title} at <span className="text-white font-medium">{job.company}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("runner")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition border-b-2 ${
                activeTab === "runner"
                  ? "bg-slate-900 text-emerald-400 border-emerald-500"
                  : "text-slate-400 hover:text-slate-200 border-transparent"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Live Automation Trace</span>
            </button>

            <button
              onClick={() => setActiveTab("node")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition border-b-2 ${
                activeTab === "node"
                  ? "bg-slate-900 text-indigo-400 border-indigo-500"
                  : "text-slate-400 hover:text-slate-200 border-transparent"
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Node.js / TS Script</span>
            </button>

            <button
              onClick={() => setActiveTab("python")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition border-b-2 ${
                activeTab === "python"
                  ? "bg-slate-900 text-sky-400 border-sky-500"
                  : "text-slate-400 hover:text-slate-200 border-transparent"
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Python Script</span>
            </button>

            <button
              onClick={() => setActiveTab("selectors")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition border-b-2 ${
                activeTab === "selectors"
                  ? "bg-slate-900 text-amber-400 border-amber-500"
                  : "text-slate-400 hover:text-slate-200 border-transparent"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>DOM Selector Mapping</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 pb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Detection Human SlowMo Enabled</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs font-semibold">Generating custom Playwright DOM automation workflow...</p>
            </div>
          ) : !playwrightData ? (
            <div className="p-6 text-center text-rose-400 text-xs">
              Failed to build Playwright workflow. Please try again.
            </div>
          ) : (
            <>
              {/* TAB 1: LIVE RUNNER */}
              {activeTab === "runner" && (
                <div className="space-y-4">
                  {/* Top Status Bar */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <div className="text-xs font-bold text-white">Chromium Headless Playwright Context</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-md">{job.applyUrl || playwrightData.applyUrl}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleStartPlaywrightRun}
                      disabled={isExecuting}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                        isExecuting
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                      }`}
                    >
                      {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>{isExecuting ? "Executing Playwright..." : "Run Playwright Simulation"}</span>
                    </button>
                  </div>

                  {/* Terminal Log Execution Box */}
                  <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs border border-slate-800 space-y-2 max-h-80 overflow-y-auto shadow-inner">
                    <div className="text-slate-500 flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span>PLAYWRIGHT EXECUTION TRACE LOGS</span>
                      <span>STATUS: {isExecuting ? "RUNNING" : isDone ? "COMPLETED" : "IDLE"}</span>
                    </div>

                    {playwrightData.steps.map((step, idx) => {
                      const isPast = idx < executedStepsCount;
                      const isCurrent = idx === executedStepsCount && isExecuting;

                      return (
                        <div
                          key={step.id}
                          className={`p-2.5 rounded-lg transition-all border ${
                            isCurrent
                              ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-200"
                              : isPast
                              ? "bg-slate-900/60 border-slate-800 text-slate-300"
                              : "bg-slate-950 border-transparent text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              {isCurrent ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                              ) : isPast ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                              )}
                              <span className="font-bold">{step.action}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{step.timestamp}</span>
                          </div>

                          <div className="text-[11px] text-slate-400 pl-5">{step.description}</div>
                          <div className="text-[10px] text-emerald-400/80 font-mono pl-5 mt-0.5">
                            selector: <span className="text-slate-300">{step.selector}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Visual Simulation Card */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-indigo-400" />
                        <span>Form Auto-Fill Payload Preview</span>
                      </span>
                      <span className="text-emerald-400 text-[11px] font-normal">100% Tailored for {job.company}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Candidate Name</span>
                        <p className="text-slate-200 font-medium">{profile.fullName || "Jane Doe"}</p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Email & Phone</span>
                        <p className="text-slate-200 font-medium">{profile.email || "jane@example.com"} | {profile.phone || "+1 555-0192"}</p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 md:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Tailored Cover Letter Attachment</span>
                        <p className="text-slate-300 italic text-[11px] line-clamp-2">
                          "{coverLetter || `Dear Hiring Team at ${job.company}, I am excited to apply for the ${job.title} position...`}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: NODE.JS / TYPESCRIPT SCRIPT */}
              {activeTab === "node" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-300 font-semibold flex items-center space-x-2">
                      <Code className="w-4 h-4 text-indigo-400" />
                      <span>Node.js / TypeScript Playwright Script</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyCode(playwrightData.nodeScript)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied!" : "Copy Code"}</span>
                      </button>

                      <button
                        onClick={() => handleDownloadScript("playwright_auto_apply.ts", playwrightData.nodeScript)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .ts</span>
                      </button>
                    </div>
                  </div>

                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-96 leading-relaxed">
                    {playwrightData.nodeScript}
                  </pre>
                </div>
              )}

              {/* TAB 3: PYTHON SCRIPT */}
              {activeTab === "python" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-300 font-semibold flex items-center space-x-2">
                      <Laptop className="w-4 h-4 text-sky-400" />
                      <span>Python Playwright Async Script</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyCode(playwrightData.pythonScript)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied!" : "Copy Code"}</span>
                      </button>

                      <button
                        onClick={() => handleDownloadScript("playwright_auto_apply.py", playwrightData.pythonScript)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .py</span>
                      </button>
                    </div>
                  </div>

                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto max-h-96 leading-relaxed">
                    {playwrightData.pythonScript}
                  </pre>
                </div>
              )}

              {/* TAB 4: SELECTORS */}
              {activeTab === "selectors" && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h3 className="font-bold text-white flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>ATS DOM Selector Engine Rules ({job.platform || "Greenhouse"})</span>
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Our auto-apply algorithm utilizes dynamic Playwright locators to match form inputs across top ATS portals.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-indigo-400">First / Last Name</span>
                      <p className="font-mono text-[11px] text-slate-300">input[name*="first_name"], input[id*="first_name"]</p>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-indigo-400">Email Address</span>
                      <p className="font-mono text-[11px] text-slate-300">input[type="email"], input[name*="email"]</p>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-indigo-400">Resume PDF File Upload</span>
                      <p className="font-mono text-[11px] text-slate-300">input[type="file"][accept*="pdf"]</p>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-indigo-400">Cover Letter Box</span>
                      <p className="font-mono text-[11px] text-slate-300">textarea[name*="cover_letter"]</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Export scripts or open the real portal — you submit</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              onClick={handleFinalSubmit}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Portal & Stage Ready</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
