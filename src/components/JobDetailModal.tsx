import React, { useState } from "react";
import { JobListing, CandidateProfile, ApplicationRecord } from "../types";
import {
  X,
  Building2,
  MapPin,
  DollarSign,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bot,
  FileText,
  ShieldCheck,
  Globe,
  Briefcase,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  Send,
  Zap,
  Users
} from "lucide-react";

interface JobDetailModalProps {
  job: JobListing;
  profile: CandidateProfile;
  isApplied: boolean;
  onClose: () => void;
  onStartAutoApply: (job: JobListing) => void;
  onSaveJob: (job: JobListing) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  profile,
  isApplied,
  onClose,
  onStartAutoApply,
  onSaveJob,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "company" | "coverletter">("overview");
  const [tailoredCoverLetter, setTailoredCoverLetter] = useState<string | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true);
    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: profile.fullName || "Candidate",
          candidateBackground: profile.resumeText || profile.skills?.join(", ") || "",
          jobTitle: job.title,
          jobCompany: job.company,
          jobDescription: job.description,
          tone: "professional, compelling, high impact",
        }),
      });
      const data = await res.json();
      setTailoredCoverLetter(data.coverLetter || "Generated bespoke cover letter.");
    } catch (err) {
      setTailoredCoverLetter(
        `Dear Hiring Manager at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. With my expertise in ${profile.skills?.join(", ") || "software engineering"}, I am confident I can bring immediate value to your team at ${job.company}.\n\nBest regards,\n${profile.fullName || "Candidate"}`
      );
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const copyCoverLetter = () => {
    if (!tailoredCoverLetter) return;
    navigator.clipboard.writeText(tailoredCoverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
              {job.logoUrl ? (
                <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7 text-indigo-400" />
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold flex items-center">
                  <Globe className="w-3 h-3 mr-1 text-indigo-400" />
                  {job.platform} Portal
                </span>
                {job.isRemote && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                    🌐 Remote
                  </span>
                )}
                {isApplied && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-blue-400" />
                    Applied
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="font-bold text-indigo-400">{job.company}</span>
                <span>•</span>
                <span className="flex items-center text-slate-400"><MapPin className="w-3.5 h-3.5 mr-1" /> {job.location}</span>
                <span>•</span>
                <span className="flex items-center text-emerald-400 font-semibold"><DollarSign className="w-3.5 h-3.5 mr-0.5" /> {job.salaryRange}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right hidden sm:block pr-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AI Match</div>
              <div className="text-xl font-black text-emerald-400">{job.matchScore}%</div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-1 px-6 border-b border-slate-800 bg-slate-950/40 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Description</span>
          </button>
          <button
            onClick={() => setActiveTab("requirements")}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "requirements"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Skills & AI Match ({(job.matchingSkills || []).length}/{(job.skillsRequired || []).length})</span>
          </button>
          <button
            onClick={() => setActiveTab("company")}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "company"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company & Benefits</span>
          </button>
          <button
            onClick={() => setActiveTab("coverletter")}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "coverletter"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>AI Cover Letter Preview</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-300 text-sm leading-relaxed">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Highlight summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 block font-medium">Job Type</span>
                  <span className="font-bold text-white block">{job.type}</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 block font-medium">Posted</span>
                  <span className="font-bold text-white block flex items-center"><Clock className="w-3 h-3 mr-1 text-indigo-400" /> {job.postedDate}</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 block font-medium">Platform Portal</span>
                  <span className="font-bold text-white block">{job.platform}</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 block font-medium">Match Fit</span>
                  <span className="font-bold text-emerald-400 block">{job.matchScore}% Match</span>
                </div>
              </div>

              {/* Description Body */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <span>Role Overview & Responsibilities</span>
                </h3>
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/80 text-slate-300 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {job.description}
                </div>
              </div>

              {/* Key Requirements List */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Key Qualifications & Duties</span>
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {(job.requirements || []).map((req, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span className="text-slate-200">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Candidate Resume Skill Alignment</span>
                  </span>
                  <span className="text-slate-400">{(job.matchingSkills || []).length} of {(job.skillsRequired || []).length} required skills</span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (((job.matchingSkills || []).length) / ((job.skillsRequired || []).length || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Matching Skills in Candidate Profile</h4>
                <div className="flex flex-wrap gap-2">
                  {(job.matchingSkills || []).map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center">
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> {skill}
                    </span>
                  ))}
                </div>
              </div>

              {(job.missingSkills || []).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider">Additional Skills Listed in Vacancy</h4>
                  <div className="flex flex-wrap gap-2">
                    {(job.missingSkills || []).map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center">
                        <XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "company" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Company Name</span>
                  <div className="text-lg font-bold text-white">{job.company}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Company Size</span>
                  <div className="text-lg font-bold text-white flex items-center">
                    <Users className="w-4 h-4 mr-2 text-indigo-400" />
                    {job.companySize || "250 - 1,000 employees"}
                  </div>
                </div>
              </div>

              {job.benefits && job.benefits.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Perks & Benefits</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {job.benefits.map((benefit, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-200 flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "coverletter" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Gemini AI Bespoke Cover Letter Engine</span>
                </span>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isGeneratingCoverLetter}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-xs font-bold text-white transition flex items-center space-x-1.5 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isGeneratingCoverLetter ? "Writing with Gemini..." : "Generate New Cover Letter"}</span>
                </button>
              </div>

              {tailoredCoverLetter ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-bold text-indigo-300">Tailored Cover Letter Preview</span>
                    <button
                      onClick={copyCoverLetter}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>
                  <div className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {tailoredCoverLetter}
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-3">
                  <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Click "Generate New Cover Letter" to create a bespoke, job-matched application cover letter using Gemini AI before running the auto-apply agent.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Action Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400 w-full sm:w-auto">
            <button
              onClick={() => onSaveJob(job)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center space-x-1.5 border border-slate-700"
            >
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Save Job</span>
            </button>
            {job.applyUrl && (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center space-x-1.5 border border-slate-700"
              >
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>Open Direct Link</span>
              </a>
            )}
          </div>

          <div className="w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onStartAutoApply(job);
              }}
              disabled={isApplied}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                isApplied
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                  : "bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-indigo-600/30"
              }`}
            >
              <Bot className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>{isApplied ? "Already Applied" : "Open Application Assistant"}</span>
              {!isApplied && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
