import { CandidateProfile, JobListing, ApplicationRecord, AutoApplyConfig, AutoApplyLog } from "../types";

export const initialProfile: CandidateProfile = {
  fullName: "",
  email: "",
  phone: "",
  location: "Remote",
  linkedInUrl: "",
  portfolioUrl: "",
  gitHubUrl: "",
  targetTitles: ["Software Engineer", "Full Stack Engineer"],
  preferredLocation: "Remote",
  remoteOnly: true,
  minSalary: 120000,
  yearsOfExperience: 3,
  skills: ["TypeScript", "React", "Node.js"],
  resumeText: "",
  experiences: [],
  education: [],
  screeningVault: {
    workAuthorization: "Authorized to work in US without sponsorship",
    needsSponsorship: "No",
    noticePeriod: "2 Weeks",
    expectedSalary: "$150,000",
    relocate: false,
    primaryTechStack: "TypeScript, React, Node.js",
    bioSummary: "Software Engineer specializing in full-stack web applications and modern API architectures.",
    customAnswers: {
      "Why do you want to join?": "Excited about the company's product vision, innovative culture, and high engineering standards.",
      "How many years of experience do you have with TypeScript?": "3+ years of building production web services."
    }
  },
  lastUpdated: new Date().toISOString().split("T")[0]
};

export const initialJobs: JobListing[] = [];

export const initialApplications: ApplicationRecord[] = [];

export const initialAutoApplyConfig: AutoApplyConfig = {
  enabled: true,
  dailyLimit: 15,
  appliedToday: 0,
  minMatchScore: 80,
  targetRoles: ["Frontend Engineer", "Full Stack Engineer", "React Developer", "Software Engineer"],
  targetLocations: ["Remote", "San Francisco, CA", "New York, NY"],
  autoGenerateCoverLetter: true,
  autoAnswerScreening: true,
  preferredWorkType: ["Remote", "Hybrid"],
  excludedCompanies: []
};

export const initialLogs: AutoApplyLog[] = [];
