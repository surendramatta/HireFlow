import React, { useState } from "react";
import { CandidateProfile, OutreachTemplate } from "../types";
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Linkedin, 
  Mail, 
  User, 
  Building2, 
  MessageSquare 
} from "lucide-react";

interface OutreachStudioProps {
  profile: CandidateProfile;
  prefill?: {
    company?: string;
    jobTitle?: string;
    contactName?: string;
  };
}

export const OutreachStudio: React.FC<OutreachStudioProps> = ({ profile, prefill }) => {
  const [recruiterName, setRecruiterName] = useState(prefill?.contactName || "");
  const [recruiterTitle, setRecruiterTitle] = useState("Technical Recruiter");
  const [company, setCompany] = useState(prefill?.company || "");
  const [jobTitle, setJobTitle] = useState(prefill?.jobTitle || profile.targetTitles?.[0] || "Software Engineer");
  const [platform, setPlatform] = useState<"LinkedIn InMail" | "Email">("LinkedIn InMail");

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedOutreach, setGeneratedOutreach] = useState<{ subject: string; message: string } | null>(null);

  React.useEffect(() => {
    if (!prefill) return;
    if (prefill.contactName) setRecruiterName(prefill.contactName);
    if (prefill.company) setCompany(prefill.company);
    if (prefill.jobTitle) setJobTitle(prefill.jobTitle);
  }, [prefill]);

  const handleGenerateOutreach = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiterName,
          recruiterTitle,
          jobTitle,
          jobCompany: company,
          candidateSkills: profile.skills,
          platform,
        }),
      });
      const data = await res.json();
      setGeneratedOutreach(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedOutreach) return;
    const textToCopy = `Subject: ${generatedOutreach.subject}\n\n${generatedOutreach.message}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <Send className="w-5 h-5 text-indigo-400" />
          <span>AI Recruiter Outreach & InMail Studio</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Craft high-converting cold messages to recruiters and hiring managers on LinkedIn or Email using Gemini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Outreach Targeting Parameters</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Recruiter / Contact Name</label>
              <input
                type="text"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Recruiter Title</label>
              <input
                type="text"
                value={recruiterTitle}
                onChange={(e) => setRecruiterTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Company Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Job Title Applying For</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Outreach Platform</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPlatform("LinkedIn InMail")}
                  className={`py-2 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    platform === "LinkedIn InMail"
                      ? "bg-blue-600/20 text-blue-300 border-blue-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn InMail</span>
                </button>

                <button
                  onClick={() => setPlatform("Email")}
                  className={`py-2 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    platform === "Email"
                      ? "bg-indigo-600/20 text-indigo-300 border-indigo-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Direct Email</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateOutreach}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 mt-4"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Crafting Message..." : "Generate AI Outreach"}</span>
            </button>
          </div>
        </div>

        {/* Right Output Card (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-slate-200 text-sm flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Generated Message Preview</span>
            </span>

            {generatedOutreach && (
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? "Copied!" : "Copy All"}</span>
              </button>
            )}
          </div>

          {generatedOutreach ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Subject Line:</span>
                <p className="font-bold text-white text-sm">{generatedOutreach.subject}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium">Message Body:</span>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {generatedOutreach.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Click "Generate AI Outreach" to craft a personalized message.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
