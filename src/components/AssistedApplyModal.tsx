import React, { useState, useEffect } from "react";
import { JobListing, CandidateProfile } from "../types";
import { postJson } from "../lib/apiClient";
import { PlaywrightWorkflowModal } from "./PlaywrightWorkflowModal";
import { BookmarkletModal } from "./BookmarkletModal";
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Building2, 
  MapPin, 
  DollarSign,
  Loader2,
  Bot
} from "lucide-react";

interface Props {
  job: JobListing | null;
  profile: CandidateProfile;
  onClose: () => void;
  onConfirmSubmitted: (job: JobListing, coverLetter: string, screeningAnswers?: Record<string, string>) => void;
}

export const AssistedApplyModal: React.FC<Props> = ({
  job,
  profile,
  onClose,
  onConfirmSubmitted,
}) => {
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<boolean>(true);
  const [copiedCover, setCopiedCover] = useState<boolean>(false);
  const [copiedAnswers, setCopiedAnswers] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [portalOpened, setPortalOpened] = useState<boolean>(false);
  const [showPlaywrightModal, setShowPlaywrightModal] = useState<boolean>(false);
  const [showBookmarkletModal, setShowBookmarkletModal] = useState<boolean>(false);


  useEffect(() => {
    if (!job) return;

    let isMounted = true;
    setGenerating(true);
    setAiError(null);

    async function prepareMaterials() {
      try {
        // 1. Generate Cover Letter
        let generatedLetter = "";
        try {
          const res = await postJson<{ coverLetter: string }>("/api/ai/generate-cover-letter", {
            candidateName: profile.fullName || "Candidate",
            candidateBackground: `${profile.skills?.join(", ") || ""}. ${profile.targetTitles?.join(", ") || ""}`,
            jobTitle: job.title,
            jobCompany: job.company,
            jobDescription: job.description || job.requirements?.join(" ") || "Software engineering opportunity",
            tone: "professional, tailored, high-impact",
          });
          generatedLetter = res.coverLetter;
        } catch (err: any) {
          console.warn("Cover letter fallback:", err.message);
          generatedLetter = `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. With my background in ${profile.skills?.join(", ") || "software engineering"}, I am confident I can make an immediate contribution to your team.\n\nBest regards,\n${profile.fullName || "Applicant"}`;
          if (err.code === "ai_unavailable") {
            setAiError("AI tailoring is unavailable (API key not configured). Standard profile materials prepared below.");
          }
        }

        // 2. Generate Screening Answers if job has requirements
        let generatedAnswers: Record<string, string> = {};
        if (job.requirements && job.requirements.length > 0) {
          try {
            const res = await postJson<{ answers: Record<string, string> }>("/api/ai/answer-screening-questions", {
              questions: job.requirements.slice(0, 3),
              candidateProfile: profile,
              jobTitle: job.title,
              jobCompany: job.company,
            });
            generatedAnswers = res.answers || {};
          } catch {
            // Non-critical
          }
        }

        if (isMounted) {
          setCoverLetter(generatedLetter);
          setScreeningAnswers(generatedAnswers);
        }
      } catch (err: any) {
        if (isMounted) {
          setAiError("Failed to auto-generate materials. You can still apply directly.");
        }
      } finally {
        if (isMounted) setGenerating(false);
      }
    }

    prepareMaterials();

    return () => {
      isMounted = false;
    };
  }, [job, profile]);

  if (!job) return null;

  const handleCopyCover = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopiedCover(true);
    setTimeout(() => setCopiedCover(false), 2000);
  };

  const handleCopyAnswers = () => {
    const formatted = Object.entries(screeningAnswers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join("\n\n");
    navigator.clipboard.writeText(formatted);
    setCopiedAnswers(true);
    setTimeout(() => setCopiedAnswers(false), 2000);
  };

  const handleOpenJobPortal = () => {
    setPortalOpened(true);
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter).catch(() => {});
    }
    window.open(job.applyUrl || `https://boards.greenhouse.io/${job.company.toLowerCase().replace(/\s+/g, "")}/jobs/101`, "_blank", "noopener,noreferrer");
  };

  const handleConfirmSubmission = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter).catch(() => {});
    }
    if (!portalOpened) {
      window.open(job.applyUrl || `https://boards.greenhouse.io/${job.company.toLowerCase().replace(/\s+/g, "")}/jobs/101`, "_blank", "noopener,noreferrer");
    }
    onConfirmSubmitted(job, coverLetter, screeningAnswers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 space-y-6 text-slate-100 relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Application Assistant
            </div>
            <h2 className="text-xl font-bold text-white">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-500" />{job.company}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" />{job.location}</span>
              {job.salaryRange && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-500" />{job.salaryRange}</span>}
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">{job.platform}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Modal"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {aiError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {/* Playwright Workflow Auto-Apply Callout */}
        <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Playwright Auto-Apply Automation Workflow
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 uppercase">
                  Automated
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Auto-fill ATS forms, attach resume, and execute submission via Playwright browser scripts.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPlaywrightModal(true)}
            className="w-full md:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 shrink-0 flex items-center justify-center space-x-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>Launch Playwright Auto-Apply</span>
          </button>
        </div>

        {/* Step 1: Material Preparation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> 1. Application Materials Prepared
            </h3>
            {generating && (
              <span className="text-xs text-indigo-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Tailoring with AI...
              </span>
            )}
          </div>

          {/* Cover Letter */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tailored Cover Letter</span>
              <button
                onClick={handleCopyCover}
                disabled={generating || !coverLetter}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition disabled:opacity-50"
              >
                {copiedCover ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCover ? "Copied!" : "Copy Cover Letter"}
              </button>
            </div>
            <textarea
              readOnly
              value={coverLetter}
              rows={5}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none focus:outline-none"
            />
          </div>

          {/* Screening Answers if present */}
          {Object.keys(screeningAnswers).length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Screening Question Answers</span>
                <button
                  onClick={handleCopyAnswers}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition"
                >
                  {copiedAnswers ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedAnswers ? "Copied!" : "Copy Answers"}
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(screeningAnswers).map(([q, a], idx) => (
                  <div key={idx} className="bg-slate-900 p-2.5 rounded border border-slate-800 text-xs space-y-1">
                    <p className="font-semibold text-slate-300">Q: {q}</p>
                    <p className="text-slate-400 font-mono text-[11px]">A: {a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Open Portal & Auto-Fill Options */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-indigo-400" /> 2. Complete Application on Official Portal
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose your auto-fill mechanism to populate forms on <strong>{job.platform}</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleOpenJobPortal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition shadow-lg shadow-indigo-600/20"
            >
              <ExternalLink className="w-4 h-4" /> Open Official Portal ({job.platform})
            </button>

            <button
              onClick={() => setShowBookmarkletModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition shadow-lg shadow-emerald-600/20"
            >
              <span>⚡ Get 1-Click Auto-Fill Bookmarklet</span>
            </button>
          </div>
        </div>

        {/* Step 3: Honest Confirmation Step */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-4 space-y-3 text-center">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            3. Did you submit this application on the company portal?
          </h4>
          <p className="text-xs text-slate-400">
            Confirming updates your tracking status to <strong>Applied</strong> and records your submission in your dashboard.
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={handleConfirmSubmission}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <span>✓ Open Portal & Confirm Application</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
            >
              Not Yet / Cancel
            </button>
          </div>
          {!portalOpened && (
            <p className="text-[11px] text-amber-400">Please click step 2 to open the job portal before confirming.</p>
          )}
        </div>
      </div>

      {showPlaywrightModal && (
        <PlaywrightWorkflowModal
          job={job}
          profile={profile}
          coverLetter={coverLetter}
          screeningAnswers={screeningAnswers}
          onClose={() => setShowPlaywrightModal(false)}
          onConfirmApply={(j, cl, sa) => {
            onConfirmSubmitted(j, cl || "", sa);
            onClose();
          }}
        />
      )}

      {showBookmarkletModal && (
        <BookmarkletModal
          profile={profile}
          job={job}
          coverLetter={coverLetter}
          screeningAnswers={screeningAnswers}
          onClose={() => setShowBookmarkletModal(false)}
          onConfirmSubmitted={() => {
            onConfirmSubmitted(job, coverLetter, screeningAnswers);
            onClose();
          }}
        />
      )}
    </div>
  );
};
