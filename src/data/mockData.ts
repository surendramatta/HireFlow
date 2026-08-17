import { CandidateProfile, JobListing, ApplicationRecord, AutoApplyConfig, AutoApplyLog } from "../types";

export const initialProfile: CandidateProfile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedInUrl: "",
  portfolioUrl: "",
  gitHubUrl: "",
  targetTitles: [],
  preferredLocation: "",
  remoteOnly: true,
  minSalary: 0,
  yearsOfExperience: 0,
  skills: [],
  resumeText: "",
  experiences: [],
  education: [],
  screeningVault: {
    workAuthorization: "",
    needsSponsorship: "",
    noticePeriod: "",
    expectedSalary: "",
    relocate: false,
    primaryTechStack: "",
    bioSummary: "",
    customAnswers: {}
  },
  lastUpdated: new Date().toISOString().split("T")[0]
};

export const initialJobs: JobListing[] = [];

export const initialApplications: ApplicationRecord[] = [];

export const initialAutoApplyConfig: AutoApplyConfig = {
  enabled: false,
  dailyLimit: 20,
  appliedToday: 0,
  lastResetDate: new Date().toISOString().split("T")[0],
  minMatchScore: 80,
  targetRoles: [],
  targetLocations: ["Remote"],
  autoGenerateCoverLetter: true,
  autoAnswerScreening: true,
  preferredWorkType: ["Remote"],
  excludedCompanies: []
};

export const initialLogs: AutoApplyLog[] = [];
