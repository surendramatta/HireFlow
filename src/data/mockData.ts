import { CandidateProfile, JobListing, ApplicationRecord, AutoApplyConfig, AutoApplyLog } from "../types";

export const initialProfile: CandidateProfile = {
  fullName: "Surendra Naidu",
  email: "surendranaidu1603@gmail.com",
  phone: "+1 (555) 382-9102",
  location: "San Francisco, CA (Remote)",
  linkedInUrl: "https://linkedin.com/in/surendra-naidu",
  portfolioUrl: "https://surendranaidu.dev",
  gitHubUrl: "https://github.com/surendranaidu",
  targetTitles: ["Senior Full Stack Engineer", "Senior Frontend Engineer", "AI Applications Engineer"],
  preferredLocation: "Remote",
  remoteOnly: true,
  minSalary: 140000,
  yearsOfExperience: 5,
  skills: ["TypeScript", "React", "Node.js", "Express", "Tailwind CSS", "Next.js", "GraphQL", "PostgreSQL", "REST APIs", "Docker", "Python"],
  resumeText: `Surendra Naidu
Senior Full Stack Engineer | surendranaidu1603@gmail.com | San Francisco, CA

SUMMARY
Senior Software Engineer with 5+ years of experience engineering high-performance TypeScript, React, and Node.js web platforms. Expertise in building AI agent workflows, real-time web applications, and scalable backend microservices.

CORE SKILLS
Frontend: React 18, TypeScript, Next.js, Tailwind CSS, Redux/Zustand, WebSockets
Backend: Node.js, Express, Python, PostgreSQL, RESTful APIs, GraphQL, Docker
AI/ML: Gemini API, OpenAI SDK, Prompt Engineering, Vector Databases`,
  experiences: [
    {
      id: "exp-1",
      company: "Scale AI Tech Labs",
      role: "Senior Full Stack Engineer",
      startDate: "2022-03",
      endDate: "Present",
      current: true,
      description: "Engineered scalable React & TypeScript web applications serving over 300k monthly active users. Integrated AI agent automation pipelines and reduced API latency by 42%."
    },
    {
      id: "exp-2",
      company: "CloudFlow Systems",
      role: "Full Stack Engineer",
      startDate: "2020-01",
      endDate: "2022-02",
      current: false,
      description: "Developed real-time microservices in Node.js and Express with PostgreSQL. Designed responsive UI components with Tailwind CSS and React."
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science",
      fieldOfStudy: "Computer Science & Software Engineering",
      graduationYear: "2020"
    }
  ],
  screeningVault: {
    workAuthorization: "Authorized to work in US without sponsorship",
    needsSponsorship: "No",
    noticePeriod: "Immediate / 2 Weeks",
    expectedSalary: "$165,000",
    relocate: false,
    primaryTechStack: "TypeScript, React, Node.js, Express, PostgreSQL",
    bioSummary: "Senior Full Stack Engineer passionate about building seamless AI agents, high-performance web interfaces, and robust backend systems.",
    customAnswers: {
      "Why do you want to join?": "I am deeply inspired by your team's engineering standards and mission to revolutionize technology. My background in building high-scale React/Node.js products aligns directly with your goals.",
      "How many years of experience do you have with TypeScript?": "5+ years of production TypeScript and React web application development."
    }
  },
  lastUpdated: new Date().toISOString().split("T")[0]
};

export const initialJobs: JobListing[] = [
  {
    id: "job-1",
    title: "Senior Full Stack Engineer - AI Platform",
    company: "OpenAI",
    location: "San Francisco, CA / Remote",
    isRemote: true,
    type: "Full-time",
    salaryRange: "$180,000 - $240,000",
    minSalary: 180000,
    postedDate: "1 hour ago",
    platform: "Greenhouse",
    matchScore: 96,
    skillsRequired: ["TypeScript", "React", "Node.js", "Python", "GraphQL", "Tailwind CSS"],
    matchingSkills: ["TypeScript", "React", "Node.js", "Python", "Tailwind CSS"],
    missingSkills: ["GraphQL"],
    description: "We are seeking a Senior Full Stack Engineer to build next-generation web applications and real-time AI user experiences. You will collaborate with research scientists and product designers to build intuitive interfaces and ultra-fast backend APIs.",
    requirements: [
      "4+ years of professional experience building web applications in React and TypeScript.",
      "Strong background in Node.js or Python backend API development.",
      "Demonstrated track record of shipping performant, accessible UI design systems."
    ],
    benefits: ["Top-tier equity package", "Unlimited PTO & health insurance", "$3,000 home office stipend", "401(k) matching"],
    companySize: "1,000-5,000 employees",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
    applyUrl: "https://boards.greenhouse.io/openai"
  },
  {
    id: "job-2",
    title: "Staff Frontend Engineer",
    company: "Stripe",
    location: "Remote (US/Canada)",
    isRemote: true,
    type: "Full-time",
    salaryRange: "$175,000 - $225,000",
    minSalary: 175000,
    postedDate: "3 hours ago",
    platform: "Lever",
    matchScore: 94,
    skillsRequired: ["TypeScript", "React", "Next.js", "Tailwind CSS", "REST APIs", "Jest"],
    matchingSkills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "REST APIs"],
    missingSkills: ["Jest"],
    description: "Join Stripe's Dashboard Infrastructure team building the global economic infrastructure for the internet. You will architect modular React components, optimize page performance, and shape developer experience.",
    requirements: [
      "5+ years building large-scale web applications in React and TypeScript.",
      "Deep expertise in browser performance profiling, bundle optimization, and state management.",
      "Passionate about developer tooling and UI detail precision."
    ],
    benefits: ["Competitive base salary & equity", "Comprehensive healthcare coverage", "Annual learning & conference budget"],
    companySize: "5,000+ employees",
    logoUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=120&q=80",
    applyUrl: "https://jobs.lever.co/stripe"
  },
  {
    id: "job-3",
    title: "Senior React & Node.js Engineer",
    company: "Vercel",
    location: "Remote",
    isRemote: true,
    type: "Full-time",
    salaryRange: "$160,000 - $210,000",
    minSalary: 160000,
    postedDate: "5 hours ago",
    platform: "Workday",
    matchScore: 97,
    skillsRequired: ["TypeScript", "React", "Next.js", "Node.js", "Express", "Tailwind CSS"],
    matchingSkills: ["TypeScript", "React", "Next.js", "Node.js", "Express", "Tailwind CSS"],
    missingSkills: [],
    description: "Vercel is looking for a Senior Engineer to expand our developer platform and frontend web tooling. You will build high-throughput APIs and sleek web interfaces used by millions of developers globally.",
    requirements: [
      "3+ years with Next.js, React, and TypeScript.",
      "Solid understanding of serverless functions, edge routing, and cloud architectures.",
      "Excellent communication and open-source contribution mindset."
    ],
    benefits: ["100% remote company culture", "Flexible time off", "Health, dental & vision insurance"],
    companySize: "500-1,000 employees",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
    applyUrl: "https://vercel.com/careers"
  },
  {
    id: "job-4",
    title: "Full Stack AI Applications Engineer",
    company: "Supabase",
    location: "Remote",
    isRemote: true,
    type: "Full-time",
    salaryRange: "$150,000 - $195,000",
    minSalary: 150000,
    postedDate: "Today",
    platform: "LinkedIn",
    matchScore: 92,
    skillsRequired: ["TypeScript", "React", "PostgreSQL", "Node.js", "Docker", "REST APIs"],
    matchingSkills: ["TypeScript", "React", "PostgreSQL", "Node.js", "Docker", "REST APIs"],
    missingSkills: [],
    description: "Help build the open-source Firebase alternative. We need an experienced Full Stack Engineer to enhance our cloud dashboard, auth workflows, and vector database features.",
    requirements: [
      "Proven experience with TypeScript, React, and SQL databases (PostgreSQL).",
      "Familiarity with containerized deployments and cloud infrastructure.",
      "Enthusiasm for open-source community building."
    ],
    benefits: ["Fully remote global team", "Stock options", "Wellness & fitness allowance"],
    companySize: "100-500 employees",
    logoUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=120&q=80",
    applyUrl: "https://supabase.com/careers"
  },
  {
    id: "job-5",
    title: "Product Engineer - Interactive Web",
    company: "Linear",
    location: "Remote / San Francisco, CA",
    isRemote: true,
    type: "Full-time",
    salaryRange: "$170,000 - $220,000",
    minSalary: 170000,
    postedDate: "Yesterday",
    platform: "Ashby",
    matchScore: 95,
    skillsRequired: ["TypeScript", "React", "Node.js", "Tailwind CSS", "WebSockets"],
    matchingSkills: ["TypeScript", "React", "Node.js", "Tailwind CSS"],
    missingSkills: ["WebSockets"],
    description: "Linear is building the issue tracker that software teams love. We are hiring a Product Engineer to craft ultra-fast, keyboard-driven web applications and collaborative sync features.",
    requirements: [
      "Extensive experience crafting high-performance React and TypeScript applications.",
      "Obsession with micro-interactions, animation speed, and clean code principles.",
      "Experience with optimistic state updates and offline synchronization."
    ],
    benefits: ["Generous equity & base compensation", "Comprehensive health benefits", "Bi-annual team retreats"],
    companySize: "50-200 employees",
    logoUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80",
    applyUrl: "https://ashbyhq.com/linear"
  },
  {
    id: "job-6",
    title: "Senior Web Developer - User Experience",
    company: "Airbnb",
    location: "Remote / San Francisco, CA",
    isRemote: true,
    type: "Full-time",
    salaryRange: "$165,000 - $215,000",
    minSalary: 165000,
    postedDate: "2 days ago",
    platform: "Workday",
    matchScore: 91,
    skillsRequired: ["TypeScript", "React", "Node.js", "GraphQL", "Tailwind CSS"],
    matchingSkills: ["TypeScript", "React", "Node.js", "Tailwind CSS"],
    missingSkills: ["GraphQL"],
    description: "Design and implement core search and booking experiences for millions of guests worldwide. Focus on performance, internationalization, and seamless UI responsiveness.",
    requirements: [
      "4+ years building production consumer web services.",
      "Deep understanding of modern JavaScript, React state patterns, and API design."
    ],
    benefits: ["$2,000 annual Airbnb travel credit", "Full medical/dental/vision coverage", "401(k) matching"],
    companySize: "5,000+ employees",
    applyUrl: "https://careers.airbnb.com"
  }
];

export const initialApplications: ApplicationRecord[] = [];

export const initialAutoApplyConfig: AutoApplyConfig = {
  enabled: true,
  dailyLimit: 20,
  appliedToday: 0,
  minMatchScore: 80,
  targetRoles: ["Senior Full Stack Engineer", "Senior Frontend Engineer", "React Developer", "AI Applications Engineer"],
  targetLocations: ["Remote", "San Francisco, CA", "New York, NY"],
  autoGenerateCoverLetter: true,
  autoAnswerScreening: true,
  preferredWorkType: ["Remote", "Hybrid"],
  excludedCompanies: []
};

export const initialLogs: AutoApplyLog[] = [];

