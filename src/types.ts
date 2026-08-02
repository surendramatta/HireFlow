export type TabType = 
  | "dashboard" 
  | "jobs" 
  | "resume" 
  | "autoapply" 
  | "tracker" 
  | "outreach" 
  | "interview" 
  | "analytics";

export type ApplicationStatus = "saved" | "applied" | "screening" | "interviewing" | "offer" | "rejected";

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
}

export interface ScreeningVault {
  workAuthorization: string;
  needsSponsorship: string;
  noticePeriod: string;
  expectedSalary: string;
  relocate: boolean;
  primaryTechStack: string;
  bioSummary: string;
  customAnswers?: Record<string, string>;
}

export interface CandidateProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedInUrl: string;
  portfolioUrl: string;
  gitHubUrl: string;
  targetTitles: string[];
  preferredLocation: string;
  remoteOnly: boolean;
  minSalary: number;
  yearsOfExperience: number;
  skills: string[];
  resumeText: string;
  experiences?: WorkExperience[];
  education?: EducationItem[];
  screeningVault?: ScreeningVault;
  lastUpdated: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  location: string;
  isRemote: boolean;
  type: "Full-time" | "Contract" | "Part-time";
  salaryRange: string;
  minSalary: number;
  postedDate: string;
  platform: "Greenhouse" | "Lever" | "Workday" | "LinkedIn" | "Indeed" | "Google Jobs" | "Hiring Cafe" | "Ashby" | "ZipRecruiter" | string;
  matchScore: number;
  skillsRequired: string[];
  matchingSkills: string[];
  missingSkills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  companySize: string;
  applied?: boolean;
  applicationDate?: string;
  applyUrl: string;
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  title: string;
  company: string;
  logoUrl?: string;
  location: string;
  salaryRange: string;
  platform: string;
  status: ApplicationStatus;
  appliedDate: string;
  lastUpdated: string;
  matchScoreAtApply: number;
  coverLetterUsed?: string;
  screeningAnswers?: Record<string, string>;
  notes?: string;
  interviewDate?: string;
  followUpDueDate?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface AutoApplyConfig {
  enabled: boolean;
  dailyLimit: number;
  appliedToday: number;
  minMatchScore: number;
  targetRoles: string[];
  targetLocations: string[];
  autoGenerateCoverLetter: boolean;
  autoAnswerScreening: boolean;
  preferredWorkType: ("Remote" | "Hybrid" | "On-site")[];
  excludedCompanies: string[];
}

export interface AutoApplyLog {
  id: string;
  timestamp: string;
  company: string;
  role: string;
  status: "success" | "pending" | "skipped" | "failed";
  matchScore: number;
  message: string;
}

export interface ResumeAnalysisResult {
  atsScore: number;
  impactScore: number;
  brevityScore: number;
  extractedSkills: string[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  tailoredSummary: string;
}

export interface OutreachTemplate {
  id: string;
  recruiterName: string;
  company: string;
  role: string;
  subject: string;
  body: string;
  createdDate: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: string;
  starTip: string;
  userAnswer?: string;
  feedback?: {
    score: number;
    clarityRating: string;
    starFrameworkScore: number;
    feedback: string[];
    improvedResponse: string;
  };
}
