import React, { useState, useRef, useEffect } from "react";
import { CandidateProfile, ResumeAnalysisResult, WorkExperience, EducationItem, ScreeningVault } from "../types";
import { updateCandidateProfileWithResume } from "../lib/resumeParser";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  UserCircle, 
  Zap, 
  Briefcase,
  Upload,
  FileUp,
  FileCheck,
  Loader2,
  Wand2,
  GraduationCap,
  Plus,
  Trash2,
  ShieldCheck,
  Check,
  Building2,
  Calendar,
  DollarSign,
  HelpCircle,
  Clock,
  Globe
} from "lucide-react";

interface ResumeBuilderProps {
  profile: CandidateProfile;
  setProfile: React.Dispatch<React.SetStateAction<CandidateProfile>>;
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ profile, setProfile }) => {
  const { updateProfileInDb } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<"resume" | "experience" | "vault">("resume");
  const [resumeText, setResumeText] = useState(profile.resumeText || "");
  const [targetRoleInput, setTargetRoleInput] = useState(profile.targetTitles?.[0] || "Software Engineer");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>({
    atsScore: 88,
    impactScore: 82,
    brevityScore: 90,
    extractedSkills: profile.skills || ["TypeScript", "React", "Node.js"],
    missingKeywords: ["Docker", "GraphQL", "CI/CD Pipeline", "System Architecture", "Unit Testing"],
    strengths: [
      "Excellent skill alignment for senior fullstack and frontend engineering roles",
      "Clear quantitative bullet points showing bundle reduction and performance gains",
      "Strong technical summary highlighting TypeScript and React ecosystem leadership"
    ],
    weaknesses: [
      "Could add explicit AWS/GCP/Docker deployment keywords to pass cloud-focused ATS filters",
      "Ensure all project achievements list team size or scope metrics"
    ],
    tailoredSummary: `Versatile Software Engineer with experience engineering scalable web applications, React micro-frontends, and Node.js REST API services.`
  });

  const [newSkill, setNewSkill] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if profile changes from Firestore
  useEffect(() => {
    if (profile.resumeText && profile.resumeText !== resumeText && !uploadedFileName) {
      setResumeText(profile.resumeText);
    }
  }, [profile.resumeText]);

  // Screening Vault Form state
  const [vault, setVault] = useState<ScreeningVault>(
    profile.screeningVault || {
      workAuthorization: "Authorized to work in US without sponsorship",
      needsSponsorship: "No",
      noticePeriod: "2 Weeks",
      expectedSalary: profile.minSalary ? `$${profile.minSalary.toLocaleString()}` : "$150,000",
      relocate: false,
      primaryTechStack: profile.skills ? profile.skills.slice(0, 5).join(", ") : "TypeScript, React, Node.js",
      bioSummary: `Software engineer specializing in modern web applications.`,
      customAnswers: {
        "Why do you want to join?": "Passionate about building intuitive, scalable digital products and driving engineering best practices.",
        "How many years of experience do you have with TypeScript?": `${profile.yearsOfExperience || 3}+ years of production experience.`
      }
    }
  );

  // Work Experience Form states
  const [experiences, setExperiences] = useState<WorkExperience[]>(profile.experiences || []);
  const [newExpCompany, setNewExpCompany] = useState("");
  const [newExpRole, setNewExpRole] = useState("");
  const [newExpStart, setNewExpStart] = useState("");
  const [newExpEnd, setNewExpEnd] = useState("");
  const [newExpCurrent, setNewExpCurrent] = useState(false);
  const [newExpDesc, setNewExpDesc] = useState("");

  // Education Form states
  const [educationList, setEducationList] = useState<EducationItem[]>(profile.education || []);
  const [newEduInst, setNewEduInst] = useState("");
  const [newEduDegree, setNewEduDegree] = useState("");
  const [newEduField, setNewEduField] = useState("");
  const [newEduYear, setNewEduYear] = useState("");

  // Custom Screening Question state
  const [customQuestionKey, setCustomQuestionKey] = useState("");
  const [customQuestionVal, setCustomQuestionVal] = useState("");

  const handleSaveAllToDatabase = async (updatedData?: Partial<CandidateProfile>) => {
    const finalProfile: CandidateProfile = {
      ...profile,
      resumeText,
      targetTitles: targetRoleInput ? [targetRoleInput] : profile.targetTitles,
      experiences,
      education: educationList,
      screeningVault: vault,
      lastUpdated: new Date().toISOString().split("T")[0],
      ...updatedData
    };

    setProfile(finalProfile);
    await updateProfileInDb(finalProfile);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsParsingFile(true);
    setUploadedFileName(file.name);
    setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    try {
      let extracted = "";
      let parsedData: any = {};

      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".rtf")) {
        extracted = await file.text();
        setResumeText(extracted);

        try {
          const res = await fetch("/api/ai/parse-resume-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type || "text/plain",
              rawText: extracted,
            }),
          });
          parsedData = await res.json();
          if (parsedData.extractedText) {
            extracted = parsedData.extractedText;
            setResumeText(extracted);
          }
        } catch (e) {
          console.warn("Notice parsing resume file:", e);
        }
      } else {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        try {
          const res = await fetch("/api/ai/parse-resume-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64Data,
              mimeType: file.type || "application/pdf",
            }),
          });
          parsedData = await res.json();
          if (parsedData.extractedText) {
            extracted = parsedData.extractedText;
            setResumeText(extracted);
          }
        } catch (e) {
          console.warn("Notice parsing PDF resume:", e);
        }
      }

      const finalResumeText = extracted || resumeText;

      const updated = updateCandidateProfileWithResume(profile, finalResumeText, {
        fullName: parsedData.fullName && parsedData.fullName.length > 2 ? parsedData.fullName : undefined,
        email: parsedData.email && parsedData.email.includes("@") ? parsedData.email : undefined,
        skills: parsedData.skills && Array.isArray(parsedData.skills) ? parsedData.skills : undefined,
        targetTitles: parsedData.targetTitle ? [parsedData.targetTitle] : undefined,
      });

      await handleSaveAllToDatabase({ ...updated, resumeText: finalResumeText });

      if (finalResumeText) {
        setIsAnalyzing(true);
        fetch("/api/ai/analyze-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: finalResumeText,
            targetRole: targetRoleInput,
          }),
        })
          .then((res) => res.json())
          .then((data) => setAnalysisResult(data))
          .catch(console.warn)
          .finally(() => setIsAnalyzing(false));
      }
    } catch (err) {
      console.error("Resume upload error:", err);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          targetRole: targetRoleInput,
        }),
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddExperience = () => {
    if (!newExpCompany.trim() || !newExpRole.trim()) return;
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: newExpCompany.trim(),
      role: newExpRole.trim(),
      startDate: newExpStart || "2022",
      endDate: newExpCurrent ? "Present" : newExpEnd || "2024",
      current: newExpCurrent,
      description: newExpDesc.trim() || "Developed core application services and user interfaces."
    };
    const updated = [...experiences, newExp];
    setExperiences(updated);
    setNewExpCompany("");
    setNewExpRole("");
    setNewExpStart("");
    setNewExpEnd("");
    setNewExpDesc("");
    setNewExpCurrent(false);

    handleSaveAllToDatabase({ experiences: updated });
  };

  const handleRemoveExperience = (id: string) => {
    const updated = experiences.filter((e) => e.id !== id);
    setExperiences(updated);
    handleSaveAllToDatabase({ experiences: updated });
  };

  const handleAddEducation = () => {
    if (!newEduInst.trim() || !newEduDegree.trim()) return;
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: newEduInst.trim(),
      degree: newEduDegree.trim(),
      fieldOfStudy: newEduField.trim() || "Computer Science",
      graduationYear: newEduYear || "2021"
    };
    const updated = [...educationList, newEdu];
    setEducationList(updated);
    setNewEduInst("");
    setNewEduDegree("");
    setNewEduField("");
    setNewEduYear("");

    handleSaveAllToDatabase({ education: updated });
  };

  const handleRemoveEducation = (id: string) => {
    const updated = educationList.filter((e) => e.id !== id);
    setEducationList(updated);
    handleSaveAllToDatabase({ education: updated });
  };

  const handleAddCustomQuestion = () => {
    if (!customQuestionKey.trim() || !customQuestionVal.trim()) return;
    const updatedVault = {
      ...vault,
      customAnswers: {
        ...(vault.customAnswers || {}),
        [customQuestionKey.trim()]: customQuestionVal.trim()
      }
    };
    setVault(updatedVault);
    setCustomQuestionKey("");
    setCustomQuestionVal("");
    handleSaveAllToDatabase({ screeningVault: updatedVault });
  };

  const handleRemoveCustomQuestion = (key: string) => {
    const newAnswers = { ...(vault.customAnswers || {}) };
    delete newAnswers[key];
    const updatedVault = { ...vault, customAnswers: newAnswers };
    setVault(updatedVault);
    handleSaveAllToDatabase({ screeningVault: updatedVault });
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!profile.skills.includes(newSkill.trim())) {
      const updatedSkills = [...profile.skills, newSkill.trim()];
      handleSaveAllToDatabase({ skills: updatedSkills });
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = profile.skills.filter((s) => s !== skillToRemove);
    handleSaveAllToDatabase({ skills: updatedSkills });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Candidate Profile, Resume & ATS Screening Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store your resume, experience history, and pre-filled screening answers. All edits automatically save to Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSaveAllToDatabase()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? "Saved to Cloud!" : "Save Profile & Vault"}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("resume")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeSubTab === "resume"
              ? "bg-slate-800 text-white border border-slate-700 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Resume & AI ATS Audit</span>
        </button>

        <button
          onClick={() => setActiveSubTab("experience")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeSubTab === "experience"
              ? "bg-slate-800 text-white border border-slate-700 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <span>Work History & Education ({(experiences || []).length + (educationList || []).length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("vault")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeSubTab === "vault"
              ? "bg-slate-800 text-white border border-slate-700 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Recruiter Screening Vault (Tsenta AI)</span>
        </button>
      </div>

      {/* SUB-TAB 1: RESUME & ATS AUDIT */}
      {activeSubTab === "resume" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Document Upload & Text Editor */}
          <div className="lg:col-span-7 space-y-6">
            {/* Dropzone */}
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Upload Resume File</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">PDF, DOCX, TXT</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                    : "border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/50 text-slate-400"
                }`}
              >
                {isParsingFile ? (
                  <div className="flex flex-col items-center space-y-2 py-2">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <span className="text-xs font-semibold text-slate-200">Parsing Resume Document with Gemini...</span>
                  </div>
                ) : uploadedFileName ? (
                  <div className="flex flex-col items-center space-y-2 py-1">
                    <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-100 flex items-center justify-center space-x-2">
                        <span>{uploadedFileName}</span>
                        {uploadedFileSize && <span className="text-[10px] text-slate-400 font-mono">({uploadedFileSize})</span>}
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium">Document loaded and saved to Cloud Firestore!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-indigo-400">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-200">
                        Drag & drop resume file here, or <span className="text-indigo-400 underline">browse computer</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Auto-extracts name, contact, skills, and work history.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Basic Candidate Contacts */}
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserCircle className="w-4 h-4 text-indigo-400" />
                <span>Basic Contact & Target Role</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => handleSaveAllToDatabase({ fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleSaveAllToDatabase({ email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => handleSaveAllToDatabase({ phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Current Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => handleSaveAllToDatabase({ location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs text-slate-400 font-medium">Core Skills ({profile.skills?.length || 0})</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add skill (e.g. Docker, GraphQL, React)..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile.skills?.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium flex items-center">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="ml-1.5 text-slate-400 hover:text-rose-400">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Resume Text Area */}
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Resume Text Content</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">{resumeText.split(/\s+/).filter(Boolean).length} words</span>
              </div>

              <textarea
                rows={12}
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                }}
                onBlur={() => handleSaveAllToDatabase({ resumeText })}
                placeholder="Paste your raw resume text here..."
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Right Column: AI ATS Scorecard */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-6 sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="font-bold text-white text-base flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>AI ATS Audit Scorecard</span>
                </h2>
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center space-x-1"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>Audit Resume</span>
                </button>
              </div>

              {analysisResult && (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-medium">ATS Match</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">{analysisResult.atsScore}%</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-medium">Impact Verbs</div>
                      <div className="text-2xl font-black text-indigo-400 mt-1">{analysisResult.impactScore}%</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-medium">Brevity Grade</div>
                      <div className="text-2xl font-black text-cyan-400 mt-1">{analysisResult.brevityScore}%</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5 text-xs">
                    <span className="font-bold text-indigo-300 flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>AI Professional Summary Pitch</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">{analysisResult.tailoredSummary}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-rose-300 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Missing Keyword Gaps ({(analysisResult.missingKeywords || []).length})</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(analysisResult.missingKeywords || []).map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-medium">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: WORK EXPERIENCE & EDUCATION */}
      {activeSubTab === "experience" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Work Experience Form & List (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Add Work Experience</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Google / TechCorp"
                    value={newExpCompany}
                    onChange={(e) => setNewExpCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Role Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={newExpRole}
                    onChange={(e) => setNewExpRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Start Year / Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2022"
                    value={newExpStart}
                    onChange={(e) => setNewExpStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">End Year / Date</label>
                  <input
                    type="text"
                    disabled={newExpCurrent}
                    placeholder={newExpCurrent ? "Present" : "e.g. Dec 2024"}
                    value={newExpCurrent ? "Present" : newExpEnd}
                    onChange={(e) => setNewExpEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  id="currentRoleCheck"
                  checked={newExpCurrent}
                  onChange={(e) => setNewExpCurrent(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="currentRoleCheck" className="cursor-pointer">I currently work here</label>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Responsibilities / Key Achievements</label>
                <textarea
                  rows={3}
                  placeholder="Architected micro-services, improved web vitals by 35%, managed React codebase..."
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleAddExperience}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Work Experience Record</span>
              </button>
            </div>

            {/* List of Experiences */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Experience Vault ({experiences.length})</h3>
              {experiences.length === 0 ? (
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 text-center text-slate-400 text-xs">
                  No work experience records added yet.
                </div>
              ) : (
                experiences.map((exp) => (
                  <div key={exp.id} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2 relative group">
                    <button
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <h4 className="font-bold text-white text-sm">{exp.role}</h4>
                      <span className="text-xs text-slate-400 font-semibold">• {exp.company}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pt-1 border-t border-slate-800/80">
                      {exp.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Education Form & List (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Add Education / Degree</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">University / Institution *</label>
                  <input
                    type="text"
                    placeholder="e.g. UC Berkeley / Stanford"
                    value={newEduInst}
                    onChange={(e) => setNewEduInst(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Degree *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bachelor of Science (B.S.)"
                    value={newEduDegree}
                    onChange={(e) => setNewEduDegree(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Major / Field</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={newEduField}
                      onChange={(e) => setNewEduField(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Graduation Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021"
                      value={newEduYear}
                      onChange={(e) => setNewEduYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddEducation}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Education Record</span>
                </button>
              </div>
            </div>

            {/* List of Education */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Education Vault ({educationList.length})</h3>
              {educationList.length === 0 ? (
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 text-center text-slate-400 text-xs">
                  No education records added yet.
                </div>
              ) : (
                educationList.map((edu) => (
                  <div key={edu.id} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-1 relative">
                    <button
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className="font-bold text-white text-sm">{edu.institution}</h4>
                    <p className="text-xs text-indigo-400 font-medium">{edu.degree} in {edu.fieldOfStudy}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Class of {edu.graduationYear}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RECRUITER SCREENING VAULT (Tsenta style) */}
      {activeSubTab === "vault" && (
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>ATS Screening Questions Vault</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-configure answers to standard recruiter screening forms (work authorization, notice period, salary, custom questions). HireFlow auto-fills these when applying!
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
              Auto-Filler Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Standard Recruiter Dropdowns */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Work Authorization Status *</label>
                <select
                  value={vault.workAuthorization}
                  onChange={(e) => {
                    const updated = { ...vault, workAuthorization: e.target.value };
                    setVault(updated);
                    handleSaveAllToDatabase({ screeningVault: updated });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Authorized to work in US without sponsorship">Authorized to work in US without sponsorship</option>
                  <option value="US Citizen / Permanent Resident (Green Card)">US Citizen / Permanent Resident (Green Card)</option>
                  <option value="Requires visa sponsorship (H-1B, F-1 OPT, TN, etc.)">Requires visa sponsorship (H-1B, F-1 OPT, TN, etc.)</option>
                  <option value="Authorized to work in EU / UK">Authorized to work in EU / UK</option>
                  <option value="Authorized to work in India">Authorized to work in India</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Will you now or in future require visa sponsorship? *</label>
                <select
                  value={vault.needsSponsorship}
                  onChange={(e) => {
                    const updated = { ...vault, needsSponsorship: e.target.value };
                    setVault(updated);
                    handleSaveAllToDatabase({ screeningVault: updated });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="In Future">In Future</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notice Period Availability *</label>
                <select
                  value={vault.noticePeriod}
                  onChange={(e) => {
                    const updated = { ...vault, noticePeriod: e.target.value };
                    setVault(updated);
                    handleSaveAllToDatabase({ screeningVault: updated });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Immediate / Available Now">Immediate / Available Now</option>
                  <option value="2 Weeks Notice">2 Weeks Notice</option>
                  <option value="1 Month Notice">1 Month Notice</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expected Annual Compensation ($) *</label>
                <input
                  type="text"
                  placeholder="e.g. $160,000"
                  value={vault.expectedSalary}
                  onChange={(e) => {
                    const updated = { ...vault, expectedSalary: e.target.value };
                    setVault(updated);
                    handleSaveAllToDatabase({ screeningVault: updated });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="relocateCheck"
                  checked={vault.relocate}
                  onChange={(e) => {
                    const updated = { ...vault, relocate: e.target.checked };
                    setVault(updated);
                    handleSaveAllToDatabase({ screeningVault: updated });
                  }}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="relocateCheck" className="text-slate-300 font-semibold cursor-pointer">
                  Willing to relocate for the right role
                </label>
              </div>
            </div>

            {/* Custom Answers & Elevator Pitch */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Tech Stack Summary</label>
                <input
                  type="text"
                  placeholder="TypeScript, React, Node.js, Express, REST APIs, Tailwind CSS"
                  value={vault.primaryTechStack}
                  onChange={(e) => {
                    const updated = { ...vault, primaryTechStack: e.target.value };
                    setVault(updated);
                    handleSaveAllToDatabase({ screeningVault: updated });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">30-Second Candidate Elevator Pitch</label>
                <textarea
                  rows={4}
                  value={vault.bioSummary}
                  onChange={(e) => {
                    const updated = { ...vault, bioSummary: e.target.value };
                    setVault(updated);
                    handleSaveAllToDatabase({ screeningVault: updated });
                  }}
                  placeholder="Brief summary of your technical background..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Custom ATS Screening Answers */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Custom Recruiter Question Bank</span>
            </h3>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Question / Prompt</label>
                  <input
                    type="text"
                    placeholder="e.g. Describe your experience with system design"
                    value={customQuestionKey}
                    onChange={(e) => setCustomQuestionKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Your Custom Answer</label>
                  <input
                    type="text"
                    placeholder="e.g. Designed REST & GraphQL micro-services serving 1M daily requests..."
                    value={customQuestionVal}
                    onChange={(e) => setCustomQuestionVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleAddCustomQuestion}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Question to Vault</span>
              </button>
            </div>

            {/* List Saved Custom Questions */}
            <div className="space-y-2">
              {vault.customAnswers && Object.keys(vault.customAnswers).length > 0 ? (
                Object.entries(vault.customAnswers).map(([q, a]) => (
                  <div key={q} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-200">Q: {q}</div>
                      <div className="text-slate-300 font-mono text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800">{a}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomQuestion(q)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No custom screening Q&As saved yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
