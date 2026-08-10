import React, { useMemo, useState } from "react";
import { CandidateProfile, JobListing } from "../types";
import {
  buildAutofillBookmarklet,
  buildAutofillPayload,
} from "../lib/autofillBookmarklet";
import {
  Zap,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface BookmarkletModalProps {
  profile: CandidateProfile;
  job?: JobListing;
  coverLetter?: string;
  screeningAnswers?: Record<string, string>;
  onClose: () => void;
  onConfirmSubmitted?: () => void;
}

export const BookmarkletModal: React.FC<BookmarkletModalProps> = ({
  profile,
  job,
  coverLetter,
  screeningAnswers = {},
  onClose,
  onConfirmSubmitted,
}) => {
  const [copied, setCopied] = useState(false);

  const bookmarkletCode = useMemo(
    () =>
      buildAutofillBookmarklet(
        buildAutofillPayload(profile, { job, coverLetter, screeningAnswers })
      ),
    [profile, job, coverLetter, screeningAnswers]
  );

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenPortal = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter).catch(() => {});
    }
    const targetUrl =
      job?.applyUrl ||
      (job
        ? `https://boards.greenhouse.io/${job.company.toLowerCase().replace(/\s+/g, "")}/jobs/101`
        : "https://boards.greenhouse.io");
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">HireFlow ATS Autofill</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  NEW TAB FILL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Opens the portal in a new tab. Click the bookmarklet there to fill — if it stops, finish and submit yourself.
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

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-white">How this works</h4>
              <p className="text-slate-300 leading-relaxed">
                Browsers block websites from typing into other sites. The bookmarklet runs on the ATS page itself and fills
                name, email, links, cover letter, and screening answers from your tailored resume. Verification challenges
                stay for you to complete.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Install autofill (one-time)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Drag to Bookmarks bar</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 bg-slate-900 rounded-xl border border-slate-800/80">
              <a
                href={bookmarkletCode}
                onClick={(e) => e.preventDefault()}
                className="cursor-grab active:cursor-grabbing px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition duration-200 flex items-center space-x-2 border border-emerald-300/40 select-none"
                title="Drag this button to your browser Bookmarks Bar!"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>⚡ HireFlow Auto-Fill</span>
              </a>

              <span className="text-xs text-slate-500 font-medium">OR</span>

              <button
                onClick={handleCopyBookmarklet}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-2 border border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                <span>{copied ? "Copied!" : "Copy Bookmarklet Code"}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <p className="font-semibold text-slate-300">Steps</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Show bookmarks bar (Ctrl/Cmd+Shift+B) and drag the green button into it.</li>
                <li>Open the job portal (button below).</li>
                <li>On that tab, click <span className="text-emerald-300 font-bold">HireFlow Auto-Fill</span>.</li>
                <li>If filling stops, finish any remaining fields / checks and submit there.</li>
              </ol>
            </div>
          </div>

          {job && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>
                    {job.title} at {job.company}
                  </span>
                </span>
                <span className="text-emerald-400 text-[11px]">{job.platform || "ATS"}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>
                    Candidate: <strong className="text-slate-200">{profile.fullName || "—"}</strong>
                  </span>
                  <span>
                    Email: <strong className="text-slate-200">{profile.email || "—"}</strong>
                  </span>
                </div>
                {coverLetter && (
                  <p className="text-slate-300 text-[11px] line-clamp-3 italic bg-slate-950 p-2 rounded border border-slate-800/60">
                    &ldquo;{coverLetter}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>

          <div className="flex gap-2">
            {onConfirmSubmitted && (
              <button
                onClick={() => {
                  onConfirmSubmitted();
                  onClose();
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
              >
                I submitted — mark Applied
              </button>
            )}
            {job && (
              <button
                onClick={handleOpenPortal}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Job Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
