import React, { useState, useEffect, useMemo } from "react";
import { JobListing, CandidateProfile } from "../types";
import { postJson } from "../lib/apiClient";
import { PlaywrightWorkflowModal } from "./PlaywrightWorkflowModal";
import {
  buildAutofillBookmarklet,
  buildAutofillPayload,
} from "../lib/autofillBookmarklet";
import { resolveApplyUrl } from "../lib/applyUrl";
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
  Bot,
  Zap,
  MousePointerClick,
} from "lucide-react";

interface Props {
  job: JobListing | null;
  profile: CandidateProfile;
  onClose: () => void;
  onConfirmSubmitted: (job: JobListing, coverLetter: string, screeningAnswers?: Record<string, string>) => void;
  onSaveReadyToSubmit?: (job: JobListing, coverLetter: string, screeningAnswers?: Record<string, string>) => void;
}

export const AssistedApplyModal: React.FC<Props> = ({
  job,
  profile,
  onClose,
  onConfirmSubmitted,
  onSaveReadyToSubmit,
}) => {
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<boolean>(true);
  const [copiedCover, setCopiedCover] = useState<boolean>(false);
  const [copiedAnswers, setCopiedAnswers] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [portalOpened, setPortalOpened] = useState<boolean>(false);
  const [autofillLaunched, setAutofillLaunched] = useState<boolean>(false);
  const [showPlaywrightModal, setShowPlaywrightModal] = useState<boolean>(false);
  const [bookmarkCopied, setBookmarkCopied] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!job) return;

    let isMounted = true;
    setGenerating(true);
    setAiError(null);
    setPortalOpened(false);
    setAutofillLaunched(false);

    async function prepareMaterials() {
      try {
        let generatedLetter = "";
        try {
          const res = await postJson<{ coverLetter: string }>("/api/ai/generate-cover-letter", {
            candidateName: profile.fullName || "Candidate",
            candidateBackground: `${profile.skills?.join(", ") || ""}. ${profile.resumeText?.slice(0, 800) || ""} ${profile.targetTitles?.join(", ") || ""}`,
            jobTitle: job.title,
            jobCompany: job.company,
            jobDescription: job.description || job.requirements?.join(" ") || "Software engineering opportunity",
            tone: "professional, tailored, high-impact",
          });
          generatedLetter = res.coverLetter;
        } catch (err: any) {
          generatedLetter = `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. With my background in ${profile.skills?.join(", ") || "software engineering"}, I am confident I can make an immediate contribution to your team.\n\nBest regards,\n${profile.fullName || "Applicant"}`;
          if (err?.code === "ai_unavailable") {
            setAiError("AI tailoring is unavailable (API key not configured). Standard profile materials prepared below.");
          }
        }

        const vault = profile.screeningVault;
        const questions = [
          ...(job.requirements || []).slice(0, 4),
          `Why do you want to join ${job.company}?`,
          `Describe your experience with ${(job.skillsRequired || []).slice(0, 2).join(" and ") || "this stack"}.`,
          "Are you authorized to work without sponsorship?",
          "What is your expected compensation / salary range?",
          "What is your notice period / earliest start date?",
        ].filter(Boolean);

        let generatedAnswers: Record<string, string> = {};
        try {
          const res = await postJson<{ answers: Record<string, string> }>("/api/ai/answer-screening-questions", {
            questions,
            candidateProfile: {
              ...profile,
              resumeText: profile.resumeText || profile.experiences?.map((e) => `${e.role} at ${e.company}: ${e.description}`).join("\n") || "",
            },
            jobTitle: job.title,
            jobCompany: job.company,
          });
          generatedAnswers = res.answers || {};
        } catch {
          // Heuristic vault fallbacks
        }

        if (vault?.workAuthorization) {
          generatedAnswers["Are you authorized to work without sponsorship?"] =
            generatedAnswers["Are you authorized to work without sponsorship?"] ||
            `${vault.workAuthorization}. Sponsorship needed: ${vault.needsSponsorship || "N/A"}`;
        }
        if (vault?.expectedSalary) {
          generatedAnswers["What is your expected compensation / salary range?"] =
            generatedAnswers["What is your expected compensation / salary range?"] || vault.expectedSalary;
        }
        if (vault?.noticePeriod) {
          generatedAnswers["What is your notice period / earliest start date?"] =
            generatedAnswers["What is your notice period / earliest start date?"] || vault.noticePeriod;
        }

        if (isMounted) {
          setCoverLetter(generatedLetter);
          setScreeningAnswers(generatedAnswers);
        }
      } catch {
        if (isMounted) setAiError("Failed to auto-generate materials. You can still open the portal and fill manually.");
      } finally {
        if (isMounted) setGenerating(false);
      }
    }

    prepareMaterials();
    return () => {
      isMounted = false;
    };
  }, [job, profile]);

  const bookmarkletHref = useMemo(() => {
    if (!job) return "#";
    return buildAutofillBookmarklet(
      buildAutofillPayload(profile, { job, coverLetter, screeningAnswers })
    );
  }, [job, profile, coverLetter, screeningAnswers]);

  if (!job) return null;

  const applyUrl = resolveApplyUrl(job);

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

  const handleCopyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletHref);
      setBookmarkCopied(true);
      setTimeout(() => setBookmarkCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  /** Open ATS in a new tab, stage materials, save Ready to Submit — user finishes if blocked. */
  const handleOpenTabAndAutofill = async () => {
    setUrlError(null);
    if (!applyUrl) {
      setUrlError(
        "This job has no valid apply link (expired or fake URL). Use Find Jobs → Search Real Jobs for a live opening with a real apply URL."
      );
      return;
    }

    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter).catch(() => {});
    }

    window.open(applyUrl, "_blank", "noopener,noreferrer");
    setPortalOpened(true);
    setAutofillLaunched(true);

    if (onSaveReadyToSubmit) {
      onSaveReadyToSubmit(job, coverLetter, screeningAnswers);
    }
  };

  const handleConfirmSubmission = () => {
    if (!portalOpened && applyUrl) {
      window.open(applyUrl, "_blank", "noopener,noreferrer");
    }
    onConfirmSubmitted(job, coverLetter, screeningAnswers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 space-y-5 text-slate-100 relative">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Application Assistant
            </div>
            <h2 className="text-xl font-bold text-white">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {job.location}
              </span>
              {job.salaryRange && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  {job.salaryRange}
                </span>
              )}
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

        {urlError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{urlError}</span>
          </div>
        )}

        {!applyUrl && !urlError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              No valid career-page URL on this listing. It may be stale data — search live jobs again for a real apply link.
            </span>
          </div>
        )}

        {/* Primary: Open tab + autofill coach */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/50 border border-emerald-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Open ATS tab & autofill</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Opens the official {job.platform} application in a <strong className="text-slate-200">new tab</strong>,
                stages your tailored cover letter + screening answers, and saves this role as{" "}
                <strong className="text-violet-300">Ready to Submit</strong>. Click the autofill bookmarklet on that tab to fill fields.
                If a verification challenge or odd field stops you, finish and submit from that tab.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenTabAndAutofill}
            disabled={generating || !applyUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/25"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing tailored materials...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Open Job Portal in New Tab
              </>
            )}
          </button>

          {autofillLaunched && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-3">
              <p className="text-xs text-emerald-200 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Portal opened. Run autofill on that tab:
              </p>
              <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal pl-4">
                <li>
                  Drag{" "}
                  <a
                    href={bookmarkletHref}
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-bold cursor-grab"
                    title="Drag to bookmarks bar"
                  >
                    <Zap className="w-3 h-3" /> HireFlow Auto-Fill
                  </a>{" "}
                  to your bookmarks bar (one-time), or copy the code below.
                </li>
                <li className="flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                  On the application tab, click <strong>HireFlow Auto-Fill</strong> — fields highlight as they fill.
                </li>
                <li>If it stops (CAPTCHA / OTP / weird widget), complete that step yourself and Submit.</li>
                <li>Come back here and confirm so HireFlow tracks it as Applied.</li>
              </ol>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopyBookmarklet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100"
                >
                  {bookmarkCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {bookmarkCopied ? "Bookmarklet copied" : "Copy autofill bookmarklet"}
                </button>
                <button
                  onClick={handleOpenTabAndAutofill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Re-open portal tab
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Materials preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Tailored materials
            </h3>
            {generating && (
              <span className="text-xs text-indigo-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Tailoring with AI...
              </span>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Cover letter</span>
              <button
                onClick={handleCopyCover}
                disabled={generating || !coverLetter}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition disabled:opacity-50"
              >
                {copiedCover ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCover ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              readOnly
              value={coverLetter}
              rows={4}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none focus:outline-none"
            />
          </div>

          {Object.keys(screeningAnswers).length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Screening answers (from tailored resume / vault)</span>
                <button
                  onClick={handleCopyAnswers}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition"
                >
                  {copiedAnswers ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedAnswers ? "Copied!" : "Copy"}
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

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={() => setShowPlaywrightModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            Export Playwright script
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handleConfirmSubmission}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
            >
              ✓ I submitted — mark Applied
            </button>
          </div>
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
            if (onSaveReadyToSubmit) onSaveReadyToSubmit(j, cl || "", sa);
            setShowPlaywrightModal(false);
          }}
        />
      )}
    </div>
  );
};
