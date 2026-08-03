import React, { useState } from "react";
import { CandidateProfile, JobListing } from "../types";
import { 
  Bot, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Zap, 
  BookOpen, 
  HelpCircle,
  FileText
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
  const [activeStep, setActiveStep] = useState<"installer" | "guide">("installer");

  // Candidate identity payload for script
  const candidateData = {
    firstName: (profile.fullName || "Candidate").split(" ")[0] || "Candidate",
    lastName: (profile.fullName || "Candidate").split(" ").slice(1).join(" ") || "Applicant",
    fullName: profile.fullName || "Candidate Applicant",
    email: profile.email || "candidate@example.com",
    phone: profile.phone || "+1 (555) 019-2834",
    linkedin: profile.linkedInUrl || "https://linkedin.com/in/candidate",
    github: profile.gitHubUrl || "https://github.com/candidate",
    portfolio: profile.portfolioUrl || "https://candidate.dev",
    coverLetter: coverLetter || `Dear Hiring Team,\n\nI am excited to apply for this opportunity. With my background in ${profile.skills?.slice(0, 3).join(", ") || "software engineering"}, I am confident I can make a strong contribution.\n\nBest regards,\n${profile.fullName || "Applicant"}`,
    screeningAnswers: screeningAnswers,
  };

  const bookmarkletCode = `javascript:(function(){
    try {
      const data = ${JSON.stringify(candidateData)};
      let filled = 0;
      
      function setFieldValue(el, val) {
        if (!el || !val) return;
        el.focus();
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.style.border = '2px solid #10b981';
        el.style.backgroundColor = '#f0fdf4';
        filled++;
      }

      // First & Last Name
      const fname = document.querySelector('input[name*="first_name"], input[id*="first_name"], input[autocomplete="given-name"], input[placeholder*="First"]');
      const lname = document.querySelector('input[name*="last_name"], input[id*="last_name"], input[autocomplete="family-name"], input[placeholder*="Last"]');
      const fullname = document.querySelector('input[name*="name"], input[id*="name"], input[placeholder*="Full Name"]');

      if (fname && lname) {
        setFieldValue(fname, data.firstName);
        setFieldValue(lname, data.lastName);
      } else if (fullname) {
        setFieldValue(fullname, data.fullName);
      }

      // Contact Details
      setFieldValue(document.querySelector('input[type="email"], input[name*="email"]'), data.email);
      setFieldValue(document.querySelector('input[type="tel"], input[name*="phone"]'), data.phone);

      // Links & Portfolios
      setFieldValue(document.querySelector('input[name*="linkedin"], input[id*="linkedin"]'), data.linkedin);
      setFieldValue(document.querySelector('input[name*="github"], input[id*="github"]'), data.github);
      setFieldValue(document.querySelector('input[name*="website"], input[name*="portfolio"], input[id*="portfolio"]'), data.portfolio);

      // Cover Letter Box
      const clBox = document.querySelector('textarea[name*="cover_letter"], textarea[id*="cover_letter"], textarea[placeholder*="cover letter"], textarea[name*="comments"]');
      if (clBox && data.coverLetter) {
        setFieldValue(clBox, data.coverLetter);
      }

      // Banner Notification overlay
      const banner = document.createElement('div');
      banner.style.position = 'fixed';
      banner.style.top = '16px';
      banner.style.right = '16px';
      banner.style.zIndex = '999999';
      banner.style.padding = '14px 20px';
      banner.style.borderRadius = '12px';
      banner.style.backgroundColor = '#065f46';
      banner.style.color = '#ffffff';
      banner.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
      banner.style.fontFamily = 'system-ui, sans-serif';
      banner.style.fontSize = '13px';
      banner.style.fontWeight = '700';
      banner.innerHTML = '⚡ HireFlow AI: Filled ' + filled + ' fields automatically! Ready to review & submit.';
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 6000);
    } catch(err) {
      alert('HireFlow Auto-Fill error: ' + err.message);
    }
  })();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenAndApply = () => {
    // Copy cover letter to clipboard for 1-click paste fallback
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter).catch(() => {});
    }

    const targetUrl = job?.applyUrl || (job ? `https://boards.greenhouse.io/${job.company.toLowerCase().replace(/\s+/g, "")}/jobs/101` : "https://boards.greenhouse.io");
    window.open(targetUrl, "_blank", "noopener,noreferrer");

    if (onConfirmSubmitted) {
      onConfirmSubmitted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">HireFlow 1-Click ATS Auto-Fill Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL FORM FILLER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auto-fill forms on Greenhouse, Lever, Ashby, Workday, and LinkedIn in 1 second.
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Security & Architecture Explanation Card */}
          <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-white">How Real ATS Auto-Fill Works</h4>
              <p className="text-slate-300 leading-relaxed">
                Due to browser Same-Origin security policies, web apps cannot directly type into external websites without browser permissions. Our 1-Click Auto-Fill Bookmarklet injects your tailored resume, contact details, and cover letter directly into the real ATS site (Greenhouse, Lever, Ashby) with 1 click!
              </p>
            </div>
          </div>

          {/* Bookmarklet Drag / Copy Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Step 1: Install 1-Click Auto-Fill Bookmarklet</span>
              </h3>
              <span className="text-[11px] text-slate-400">Drag button to your Bookmarks bar</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 bg-slate-900 rounded-xl border border-slate-800/80">
              
              {/* Draggable Bookmarklet Button */}
              <a
                href={bookmarkletCode}
                onClick={(e) => e.preventDefault()}
                className="cursor-grab active:cursor-grabbing px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition duration-200 flex items-center space-x-2 border border-emerald-300/40 select-none"
                title="Drag this button to your browser Bookmarks Bar!"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>⚡ HireFlow Auto-Fill (Drag to Bookmarks)</span>
              </a>

              <span className="text-xs text-slate-500 font-medium">OR</span>

              {/* Copy Code Button */}
              <button
                onClick={handleCopyBookmarklet}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-2 border border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                <span>{copied ? "Bookmarklet Code Copied!" : "Copy Bookmarklet Code"}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <p className="font-semibold text-slate-300">💡 Quick 2-Second Guide:</p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                <li>Show your browser Bookmarks bar (<span className="text-slate-200 font-mono">Ctrl+Shift+B</span> / <span className="text-slate-200 font-mono">Cmd+Shift+B</span>).</li>
                <li>Drag the green <span className="text-emerald-300 font-bold">⚡ HireFlow Auto-Fill</span> button into your bookmarks bar.</li>
                <li>When you open any job application form on Greenhouse, Lever, or Ashby, click the bookmarklet!</li>
              </ol>
            </div>
          </div>

          {/* Form Payload Summary */}
          {job && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Target Application: {job.title} at {job.company}</span>
                </span>
                <span className="text-emerald-400 text-[11px]">{job.platform || "Greenhouse"}</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs space-y-2 text-slate-300">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Candidate: <strong className="text-slate-200">{profile.fullName}</strong></span>
                  <span>Email: <strong className="text-slate-200">{profile.email}</strong></span>
                </div>
                {coverLetter && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tailored Cover Letter</span>
                    <p className="text-slate-300 text-[11px] line-clamp-3 italic bg-slate-950 p-2 rounded border border-slate-800/60">
                      "{coverLetter}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>

          {job && (
            <button
              onClick={handleOpenAndApply}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Job Portal & Copy Auto-Fill Data</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
