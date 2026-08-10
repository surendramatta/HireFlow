import React, { useState } from "react";
import { JobListing, CandidateProfile, ApplicationRecord, TabType } from "../types";
import { JobDetailModal } from "./JobDetailModal";
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Send, 
  FileText, 
  Building2, 
  Zap, 
  Check, 
  ChevronRight,
  ShieldCheck,
  Briefcase,
  PlusCircle,
  Plus,
  X,
  Globe,
  Loader2,
  Bot,
  Maximize2
} from "lucide-react";

interface JobSearchProps {
  jobs: JobListing[];
  profile: CandidateProfile;
  applications: ApplicationRecord[];
  onApplyJob: (job: JobListing, tailoredCoverLetter?: string) => void;
  onSaveJob: (job: JobListing) => void;
  onAddCustomJob?: (job: Omit<JobListing, "id">) => Promise<string>;
  selectedJob: JobListing | null;
  setSelectedJob: (job: JobListing | null) => void;
  setActiveTab: (tab: TabType) => void;
  isSearchingJobs?: boolean;
  setIsSearchingJobs?: (val: boolean) => void;
  setJobs?: React.Dispatch<React.SetStateAction<JobListing[]>>;
}

export const JobSearch: React.FC<JobSearchProps> = ({
  jobs,
  profile,
  applications,
  onApplyJob,
  onSaveJob,
  onAddCustomJob,
  selectedJob,
  setSelectedJob,
  setActiveTab,
  isSearchingJobs = false,
  setIsSearchingJobs,
  setJobs,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [remoteOnlyFilter, setRemoteOnlyFilter] = useState(false);
  const [minMatchFilter, setMinMatchFilter] = useState<number>(50);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);

  // Tsenta-Style URL & Description Importer State
  const [importUrlInput, setImportUrlInput] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportJobUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!importUrlInput.trim()) return;

    setIsImportingUrl(true);
    setImportError(null);

    try {
      const isUrl = importUrlInput.trim().startsWith("http://") || importUrlInput.trim().startsWith("https://");
      const res = await fetch("/api/ai/parse-job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: isUrl ? importUrlInput.trim() : undefined,
          rawText: !isUrl ? importUrlInput.trim() : undefined,
          candidateSkills: profile.skills || [],
        }),
      });

      if (!res.ok) throw new Error("Failed to parse job details");
      const data = await res.json();
      if (data.job && onAddCustomJob) {
        const { id, ...jobPayload } = data.job;
        const createdId = await onAddCustomJob(jobPayload);
        const fullJob = { ...jobPayload, id: createdId || id };
        setSelectedJob(fullJob);
        setViewingDetailJob(fullJob);
        setImportUrlInput("");
        setApplySuccessMessage(`Successfully imported "${fullJob.title} at ${fullJob.company}"! Match Score: ${fullJob.matchScore}%`);
        setTimeout(() => setApplySuccessMessage(null), 5000);
      }
    } catch (err: any) {
      console.error("Import error:", err);
      setImportError("Unable to extract job details from link. Please verify URL format or paste raw job description text.");
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleSearchRealWebJobs = async () => {
    setIsSearchingWeb(true);
    setIsSearchingJobs?.(true);
    try {
      const queryToSearch = searchQuery.trim() || (profile.targetTitles && profile.targetTitles[0]) || "Software Engineer";
      const res = await fetch("/api/ai/search-real-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryToSearch,
          location: profile.preferredLocation || "Remote",
          targetSkills: profile.skills,
          platforms: selectedPlatform !== "all" ? [selectedPlatform] : [],
        }),
      });

      if (res.ok) {
        const liveJobs: JobListing[] = await res.json();
        if (Array.isArray(liveJobs) && liveJobs.length > 0 && onAddCustomJob) {
          for (const j of liveJobs) {
            const { id, ...jobData } = j;
            await onAddCustomJob(jobData);
          }
          setJobs?.(liveJobs);
        }
      }
    } catch (err) {
      console.error("Error searching live jobs:", err);
    } finally {
      setIsSearchingWeb(false);
      setIsSearchingJobs?.(false);
    }
  };

  // Add custom job modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newSalary, setNewSalary] = useState("$160,000 - $190,000");
  const [newPlatform, setNewPlatform] = useState<JobListing["platform"]>("Greenhouse");
  const [newApplyUrl, setNewApplyUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSkillsStr, setNewSkillsStr] = useState("TypeScript, React, Node.js");
  const [isAdding, setIsAdding] = useState(false);

  // Tailoring state in Inspector drawer
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredCoverLetter, setTailoredCoverLetter] = useState<string | null>(null);
  const [aiScreeningAnswers, setAiScreeningAnswers] = useState<Record<string, string> | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Full-Screen Job Modal
  const [viewingDetailJob, setViewingDetailJob] = useState<JobListing | null>(null);

  const handleAddJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;

    setIsAdding(true);
    const skillsRequired = newSkillsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const candidateSkills = profile.skills || [];
    const matchingSkills = skillsRequired.filter((s) =>
      candidateSkills.some((ps) => ps.toLowerCase() === s.toLowerCase())
    );
    const missingSkills = skillsRequired.filter(
      (s) => !candidateSkills.some((ps) => ps.toLowerCase() === s.toLowerCase())
    );

    const calculatedMatch = Math.min(
      99,
      Math.max(65, Math.round((matchingSkills.length / (skillsRequired.length || 1)) * 100) + 20)
    );

    const newJobPayload: Omit<JobListing, "id"> = {
      title: newTitle,
      company: newCompany,
      logoUrl: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80",
      location: newLocation || "San Francisco, CA / Remote",
      isRemote: newLocation.toLowerCase().includes("remote") || true,
      type: "Full-time",
      salaryRange: newSalary,
      minSalary: 150000,
      postedDate: "Just now",
      platform: newPlatform,
      matchScore: calculatedMatch,
      skillsRequired: skillsRequired.length > 0 ? skillsRequired : ["TypeScript", "React"],
      matchingSkills,
      missingSkills,
      description: newDescription || `Exciting engineering role at ${newCompany}. Join a fast-growing tech team building next-generation web applications.`,
      requirements: ["3+ years experience with software development", "Strong problem solving skills", "Experience with modern web stacks"],
      benefits: ["Competitive compensation", "Full healthcare", "Flexible PTO"],
      companySize: "100-500 employees",
      applyUrl: newApplyUrl || `https://${newCompany.toLowerCase().replace(/\s+/g, "")}.com/careers`
    };

    if (onAddCustomJob) {
      await onAddCustomJob(newJobPayload);
    }

    setIsAdding(false);
    setIsAddModalOpen(false);
    // Reset form
    setNewTitle("");
    setNewCompany("");
    setNewLocation("");
    setNewApplyUrl("");
    setNewDescription("");
  };

  // Dynamically calculate match score & skills for every job based on Candidate Resume & Profile
  const processedJobs = (jobs || []).map((job) => {
    const candidateSkillsLower = new Set(
      (profile.skills || []).map((s) => s.toLowerCase())
    );
    const resumeTextLower = (profile.resumeText || "").toLowerCase();
    const jobSkills = job.skillsRequired || [];

    const matchingSkills = jobSkills.filter((skill) => {
      const sLower = skill.toLowerCase();
      return candidateSkillsLower.has(sLower) || resumeTextLower.includes(sLower);
    });

    const missingSkills = jobSkills.filter((skill) => {
      const sLower = skill.toLowerCase();
      return !candidateSkillsLower.has(sLower) && !resumeTextLower.includes(sLower);
    });

    const totalRequired = jobSkills.length || 1;
    const skillRatio = matchingSkills.length / totalRequired;

    const jobTitleLower = (job.title || "").toLowerCase();
    const titleMatch = (profile.targetTitles || []).some((title) => {
      const keywords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      return keywords.some((kw) => jobTitleLower.includes(kw));
    });

    let calculatedScore = Math.round(skillRatio * 65);
    if (titleMatch) calculatedScore += 20;
    if (matchingSkills.length > 0) calculatedScore += 15;
    const finalScore = Math.min(99, Math.max(55, calculatedScore));

    return {
      ...job,
      matchScore: finalScore,
      matchingSkills,
      missingSkills,
    };
  });

  const [resumeFilterOnly, setResumeFilterOnly] = useState(false);
  const [hideAppliedFilter, setHideAppliedFilter] = useState<boolean>(true);

  const isApplied = (job: JobListing | string) => {
    if (!job) return false;
    const targetId = typeof job === "string" ? job : job.id;
    const targetCompany = typeof job === "object" ? (job.company || "").toLowerCase().trim() : "";
    const targetTitle = typeof job === "object" ? (job.title || "").toLowerCase().trim() : "";

    return (applications || []).some((a) => {
      if (a.status === "saved") return false;
      if (a.jobId && a.jobId === targetId) return true;
      if (
        targetCompany &&
        targetTitle &&
        (a.company || "").toLowerCase().trim() === targetCompany &&
        (a.title || "").toLowerCase().trim() === targetTitle
      ) {
        return true;
      }
      return false;
    });
  };

  const filteredJobs = processedJobs
    .filter((job) => {
      const applied = isApplied(job);
      const matchesAppliedFilter = !hideAppliedFilter || !applied;

      const matchesQuery =
        (job.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.platform || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.skillsRequired || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPlatform = selectedPlatform === "all" || (job.platform || "").toLowerCase() === selectedPlatform.toLowerCase();
      const matchesRemote = !remoteOnlyFilter || job.isRemote;
      const matchesMatchScore = job.matchScore >= minMatchFilter;

      const matchesResumeFilter = !resumeFilterOnly || ((job.matchingSkills || []).length > 0 || job.matchScore >= 80);

      return matchesAppliedFilter && matchesQuery && matchesPlatform && matchesRemote && matchesMatchScore && matchesResumeFilter;
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const activeJob = selectedJob || (filteredJobs.length > 0 ? filteredJobs[0] : null);

  const handleGenerateCoverLetter = async (job: JobListing) => {
    setIsTailoring(true);
    setTailoredCoverLetter(null);
    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: profile.fullName,
          candidateBackground: profile.resumeText,
          jobTitle: job.title,
          jobCompany: job.company,
          jobDescription: job.description,
          tone: "professional and enthusiastic",
        }),
      });
      const data = await res.json();
      setTailoredCoverLetter(data.coverLetter);
    } catch (err) {
      console.error(err);
      setTailoredCoverLetter(
        `Dear Hiring Manager at ${job.company},\n\nI am thrilled to apply for the ${job.title} role. My background in TypeScript, React, and building scalable fullstack applications directly mirrors your requirements.\n\nBest regards,\n${profile.fullName}`
      );
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerateScreeningAnswers = async (job: JobListing) => {
    setIsTailoring(true);
    try {
      const sampleQuestions = [
        `Why do you want to join ${job.company}?`,
        `Describe your experience with ${job.skillsRequired.slice(0, 2).join(" and ")}.`,
        `What is your expected compensation range?`
      ];

      const res = await fetch("/api/ai/answer-screening-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: sampleQuestions,
          candidateProfile: profile,
          jobTitle: job.title,
          jobCompany: job.company,
        }),
      });
      const data = await res.json();
      setAiScreeningAnswers(data.answers || {});
    } catch (err) {
      console.error(err);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleApplyClick = (job: JobListing) => {
    onApplyJob(job);
  };

  return (
    <div className="space-y-6">
      {(isSearchingJobs || isSearchingWeb) && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 flex items-center gap-3 text-xs text-indigo-200">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
          <span>Scanning Greenhouse, Lever, and Ashby boards for live openings...</span>
        </div>
      )}

      {/* Tsenta-Style Instant Job URL / Description Auto-Apply Importer */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 rounded-2xl p-5 border border-indigo-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <span>Instant Job Link Importer & AI Auto-Apply</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Tsenta Auto-Pilot
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Paste any job vacancy URL (LinkedIn, Greenhouse, Lever, Workday, Indeed) or raw job description text.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-indigo-300/80 font-mono hidden md:inline">
            Supports Greenhouse • Lever • Workday • LinkedIn
          </span>
        </div>

        <form onSubmit={handleImportJobUrl} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="https://boards.greenhouse.io/stripe/jobs/12345 or paste job description..."
              value={importUrlInput}
              onChange={(e) => setImportUrlInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-indigo-500/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isImportingUrl || !importUrlInput.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-xs font-bold text-white transition flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            {isImportingUrl ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Extracting Job Data...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Import & Auto-Apply</span>
              </>
            )}
          </button>
        </form>

        {importError && (
          <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center space-x-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </p>
        )}
      </div>

      {/* Header & Filter Controls */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <span>Job Feed & AI Match Engine</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Aggregated live vacancies across LinkedIn, Greenhouse, Lever, Workday & Google Jobs with real-time match scoring.
            </p>
          </div>

          {/* Search bar & Add Custom Job button */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filter or search real jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchRealWebJobs();
                  }
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSearchRealWebJobs}
              disabled={isSearchingWeb}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-xs font-bold text-white transition flex items-center space-x-1.5 shrink-0 shadow-lg shadow-indigo-600/25"
              title="Search active live jobs on LinkedIn, Indeed, Google Jobs, Workday & Greenhouse"
            >
              {isSearchingWeb ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Searching Live Web...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>Search Real Jobs</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Add Job URL</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 flex items-center mr-1 font-semibold text-[11px]">
              <Filter className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Platform:
            </span>
            {["all", "LinkedIn", "Indeed", "Google Jobs", "Hiring Cafe", "Workday", "Greenhouse", "Lever", "Ashby"].map((platform) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedPlatform.toLowerCase() === platform.toLowerCase()
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {platform === "all" ? "All Platforms" : platform}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setHideAppliedFilter(!hideAppliedFilter)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
                hideAppliedFilter
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                  : "bg-slate-950/80 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
              title="Toggle visibility of jobs you have already applied to"
            >
              <CheckCircle className={`w-3.5 h-3.5 ${hideAppliedFilter ? "text-indigo-400" : "text-slate-400"}`} />
              <span>Hide Applied Jobs</span>
              {(applications || []).filter((a) => a.status !== "saved").length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-[10px] text-indigo-200 font-bold">
                  {(applications || []).filter((a) => a.status !== "saved").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setResumeFilterOnly(!resumeFilterOnly)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center space-x-1.5 ${
                resumeFilterOnly
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                  : "bg-slate-950/80 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${resumeFilterOnly ? "text-emerald-400" : "text-slate-400"}`} />
              <span>Match My Resume Skills</span>
            </button>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remoteOnlyFilter}
                onChange={(e) => setRemoteOnlyFilter(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">Remote Only</span>
            </label>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Min Match:</span>
              <select
                value={minMatchFilter}
                onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value={50}>50%+</option>
                <option value={60}>60%+</option>
                <option value={75}>75%+</option>
                <option value={85}>85%+</option>
                <option value={90}>90%+</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Job Cards List + Active Job Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Job Cards Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing {filteredJobs.length} opportunities</span>
            <span className="text-emerald-400 font-medium">Sorted by AI Match Score</span>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl p-8 border border-slate-800 text-center space-y-4">
              <Globe className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
              <div>
                <p className="text-sm text-slate-200 font-bold">No active jobs in your current feed.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Search live vacancies across LinkedIn, Indeed, Google Jobs & Workday or add a direct job link.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleSearchRealWebJobs}
                  disabled={isSearchingWeb}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-xs font-bold text-white transition flex items-center space-x-2 shadow-lg shadow-indigo-600/25"
                >
                  {isSearchingWeb ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Searching Live Web...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span>Fetch Live Web Jobs</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Add Real Job Link</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedPlatform("all");
                  setRemoteOnlyFilter(false);
                  setMinMatchFilter(50);
                  setResumeFilterOnly(false);
                }}
                className="text-xs text-slate-400 hover:text-indigo-400 underline block mx-auto pt-2"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const selected = activeJob?.id === job.id;
              const applied = isApplied(job.id);
              return (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setTailoredCoverLetter(null);
                    setAiScreeningAnswers(null);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative ${
                    selected
                      ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-indigo-400">
                        {job.logoUrl ? (
                          <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm line-clamp-1">{job.title}</h3>
                        <p className="text-xs text-slate-400">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          job.matchScore >= 90
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : job.matchScore >= 80
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {job.matchScore}% Match
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">{job.postedDate}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-slate-400" /> {job.location}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="w-3 h-3 text-slate-400" /> {job.salaryRange}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                      {job.platform}
                    </span>

                    {applied ? (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Applied
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-slate-200 flex items-center font-medium">
                        View details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detailed Job Inspector Column (7 cols) */}
        <div className="lg:col-span-7">
          {activeJob ? (
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {applySuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{applySuccessMessage}</span>
                </div>
              )}

              {/* Inspector Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold">
                      {activeJob.platform} Portal
                    </span>
                    {activeJob.isRemote && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-medium">
                        🌐 100% Remote
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{activeJob.title}</h2>
                  <p className="text-sm font-semibold text-indigo-400">{activeJob.company}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {activeJob.location}</span>
                    <span className="flex items-center"><DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-400" /> {activeJob.salaryRange}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3">
                  <div className="text-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-400">Match Score</div>
                    <div className="text-2xl font-black text-emerald-400">{activeJob.matchScore}%</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleApplyClick(activeJob)}
                      disabled={isApplied(activeJob)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isApplied(activeJob)
                          ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                      }`}
                    >
                      <Bot className="w-4 h-4 text-amber-300 animate-bounce" />
                      <span>{isApplied(activeJob) ? "Applied" : "Application Assistant"}</span>
                    </button>

                    <button
                      onClick={() => setViewingDetailJob(activeJob)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700"
                      title="Open full job description modal"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden sm:inline">Full Description</span>
                    </button>

                    {activeJob.applyUrl && (
                      <a
                        href={activeJob.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 shadow-md"
                        title="Open Official Job Posting on Career Portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="hidden md:inline">Open Career URL</span>
                      </a>
                    )}

                    <button
                      onClick={() => onSaveJob(activeJob)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
                      title="Save to Tracker"
                    >
                      <Briefcase className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Resume Match Analysis Badge Section */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>AI Resume Skill Alignment</span>
                  </span>
                  <span className="text-slate-400">{activeJob.matchingSkills.length} of {activeJob.skillsRequired.length} skills matched</span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {activeJob.matchingSkills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium flex items-center">
                        <Check className="w-3 h-3 mr-1" /> {skill}
                      </span>
                    ))}
                    {activeJob.missingSkills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-medium flex items-center">
                        <XCircle className="w-3 h-3 mr-1" /> Missing: {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Copilot Quick Tailor Tools */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Instant AI Copilot Generators</span>
                  </span>
                  {isTailoring && <span className="text-xs text-indigo-400 animate-pulse">Generating with Gemini...</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleGenerateCoverLetter(activeJob)}
                    disabled={isTailoring}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition flex items-center space-x-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generate Tailored Cover Letter</span>
                  </button>

                  <button
                    onClick={() => handleGenerateScreeningAnswers(activeJob)}
                    disabled={isTailoring}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition flex items-center space-x-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Solve Recruiter Screening Q&A</span>
                  </button>
                </div>

                {/* Cover Letter Output */}
                {tailoredCoverLetter && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-indigo-500/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-indigo-300">
                      <span>Tailored Cover Letter</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(tailoredCoverLetter)}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {tailoredCoverLetter}
                    </p>
                  </div>
                )}

                {/* Screening Q&A Output */}
                {aiScreeningAnswers && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-emerald-500/30 space-y-2 text-xs">
                    <div className="font-bold text-emerald-300">Generated Screening Answers</div>
                    {Object.entries(aiScreeningAnswers).map(([q, a], idx) => (
                      <div key={idx} className="space-y-1 border-t border-slate-800 pt-2">
                        <div className="font-semibold text-slate-200">Q: {q}</div>
                        <div className="text-slate-300 bg-slate-950 p-2 rounded">{a}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Description & Requirements */}
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-white text-sm mb-2">About the Role</h4>
                  <p className="text-slate-300">{activeJob.description}</p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm mb-2">Key Requirements</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {activeJob.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>

                {activeJob.benefits && activeJob.benefits.length > 0 && (
                  <div>
                    <h4 className="font-bold text-white text-sm mb-2">Perks & Compensation</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {activeJob.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-2xl p-12 border border-slate-800 text-center text-slate-400 text-xs">
              Select a job from the list to inspect match details.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Custom Real Job */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[11px] font-semibold border border-indigo-500/20">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cloud Database Live Sync</span>
              </div>
              <h3 className="text-lg font-bold text-white">Add Custom Real Job Listing</h3>
              <p className="text-xs text-slate-400">
                Paste any active vacancy from LinkedIn, Greenhouse, Lever, or Workday to track & auto-apply in real-time.
              </p>
            </div>

            <form onSubmit={handleAddJobSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior React Developer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI / Vercel"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA (Remote)"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Greenhouse">Greenhouse</option>
                    <option value="Lever">Lever</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Workday">Workday</option>
                    <option value="Google Jobs">Google Jobs</option>
                    <option value="Indeed">Indeed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Application / Career URL</label>
                <input
                  type="url"
                  placeholder="https://job-board.com/careers/apply-123"
                  value={newApplyUrl}
                  onChange={(e) => setNewApplyUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Required Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="TypeScript, React, Node.js, GraphQL"
                  value={newSkillsStr}
                  onChange={(e) => setNewSkillsStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Job Description / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Paste core requirements or responsibilities..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Cloud DB...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Save Job & Calculate AI Match Score</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modal 1: Full Job Description Viewer */}
      {viewingDetailJob && (
        <JobDetailModal
          job={viewingDetailJob}
          profile={profile}
          isApplied={isApplied(viewingDetailJob)}
          onClose={() => setViewingDetailJob(null)}
          onStartAutoApply={(job) => {
            setViewingDetailJob(null);
            onApplyJob(job);
          }}
          onSaveJob={onSaveJob}
        />
      )}
    </div>
  );
};
