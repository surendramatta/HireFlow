export interface CompanyBoard {
  slug: string;
  name: string;
  source: "greenhouse" | "lever" | "ashby" | "smartrecruiters" | "recruitee";
}

/** Public ATS company boards — expanded coverage beyond the original 3 ATS sets. */
export const COMPANY_BOARDS: CompanyBoard[] = [
  // —— Greenhouse ——
  { slug: "stripe", name: "Stripe", source: "greenhouse" },
  { slug: "airbnb", name: "Airbnb", source: "greenhouse" },
  { slug: "coinbase", name: "Coinbase", source: "greenhouse" },
  { slug: "cloudflare", name: "Cloudflare", source: "greenhouse" },
  { slug: "scaleai", name: "Scale AI", source: "greenhouse" },
  { slug: "figma", name: "Figma", source: "greenhouse" },
  { slug: "databricks", name: "Databricks", source: "greenhouse" },
  { slug: "discord", name: "Discord", source: "greenhouse" },
  { slug: "instacart", name: "Instacart", source: "greenhouse" },
  { slug: "doordash", name: "DoorDash", source: "greenhouse" },
  { slug: "dropbox", name: "Dropbox", source: "greenhouse" },
  { slug: "github", name: "GitHub", source: "greenhouse" },
  { slug: "hashicorp", name: "HashiCorp", source: "greenhouse" },
  { slug: "reddit", name: "Reddit", source: "greenhouse" },
  { slug: "toast", name: "Toast", source: "greenhouse" },
  { slug: "roblox", name: "Roblox", source: "greenhouse" },
  { slug: "airtable", name: "Airtable", source: "greenhouse" },
  { slug: "asana", name: "Asana", source: "greenhouse" },
  { slug: "twilio", name: "Twilio", source: "greenhouse" },
  { slug: "pinterest", name: "Pinterest", source: "greenhouse" },
  { slug: "lyft", name: "Lyft", source: "greenhouse" },
  { slug: "affirm", name: "Affirm", source: "greenhouse" },
  { slug: "brex", name: "Brex", source: "greenhouse" },
  { slug: "rippling", name: "Rippling", source: "greenhouse" },
  { slug: "coursera", name: "Coursera", source: "greenhouse" },
  { slug: "duolingo", name: "Duolingo", source: "greenhouse" },
  { slug: "grammarly", name: "Grammarly", source: "greenhouse" },
  { slug: "notion", name: "Notion GH", source: "greenhouse" },
  { slug: "openai", name: "OpenAI", source: "greenhouse" },
  { slug: "anthropic", name: "Anthropic", source: "greenhouse" },
  { slug: "mongodb", name: "MongoDB", source: "greenhouse" },
  { slug: "elastic", name: "Elastic", source: "greenhouse" },
  { slug: "okta", name: "Okta", source: "greenhouse" },
  { slug: "snowflake", name: "Snowflake", source: "greenhouse" },
  { slug: "uber", name: "Uber", source: "greenhouse" },
  { slug: "block", name: "Block", source: "greenhouse" },
  { slug: "shopify", name: "Shopify", source: "greenhouse" },
  { slug: "zendesk", name: "Zendesk", source: "greenhouse" },
  { slug: "hubspot", name: "HubSpot", source: "greenhouse" },
  { slug: "calendly", name: "Calendly", source: "greenhouse" },
  { slug: "canva", name: "Canva", source: "greenhouse" },
  { slug: "twitch", name: "Twitch", source: "greenhouse" },
  { slug: "nvidia", name: "NVIDIA", source: "greenhouse" },
  { slug: "wayfair", name: "Wayfair", source: "greenhouse" },
  { slug: "chime", name: "Chime", source: "greenhouse" },
  { slug: "plaid", name: "Plaid", source: "greenhouse" },
  { slug: "robinhood", name: "Robinhood", source: "greenhouse" },
  { slug: "cruise", name: "Cruise", source: "greenhouse" },
  { slug: "andurilindustries", name: "Anduril", source: "greenhouse" },
  { slug: "ramp", name: "Ramp GH", source: "greenhouse" },

  // —— Lever ——
  { slug: "spotify", name: "Spotify", source: "lever" },
  { slug: "netlify", name: "Netlify", source: "lever" },
  { slug: "palantir", name: "Palantir", source: "lever" },
  { slug: "atlassian", name: "Atlassian", source: "lever" },
  { slug: "gusto", name: "Gusto", source: "lever" },
  { slug: "gitlab", name: "GitLab", source: "lever" },
  { slug: "sentry", name: "Sentry", source: "lever" },
  { slug: "checkr", name: "Checkr", source: "lever" },
  { slug: "segment", name: "Segment", source: "lever" },
  { slug: "datadog", name: "DataDog", source: "lever" },
  { slug: "twitch", name: "Twitch Lever", source: "lever" },
  { slug: "eventbrite", name: "Eventbrite", source: "lever" },
  { slug: "box", name: "Box", source: "lever" },
  { slug: "wealthfront", name: "Wealthfront", source: "lever" },
  { slug: "lemonade", name: "Lemonade", source: "lever" },
  { slug: "mattermost", name: "Mattermost", source: "lever" },
  { slug: "fingerpaint", name: "Fingerpaint", source: "lever" },
  { slug: "nubank", name: "Nubank", source: "lever" },
  { slug: "klarna", name: "Klarna", source: "lever" },
  { slug: "shopify", name: "Shopify Lever", source: "lever" },
  { slug: "snap", name: "Snap Inc", source: "lever" },
  { slug: "tripadvisor", name: "Tripadvisor", source: "lever" },
  { slug: "yelp", name: "Yelp", source: "lever" },
  { slug: "buzzfeed", name: "BuzzFeed", source: "lever" },
  { slug: "coursera", name: "Coursera Lever", source: "lever" },

  // —— Ashby ——
  { slug: "linear", name: "Linear", source: "ashby" },
  { slug: "ramp", name: "Ramp", source: "ashby" },
  { slug: "notion", name: "Notion", source: "ashby" },
  { slug: "ashby", name: "Ashby", source: "ashby" },
  { slug: "postman", name: "Postman", source: "ashby" },
  { slug: "ironclad", name: "Ironclad", source: "ashby" },
  { slug: "modal", name: "Modal", source: "ashby" },
  { slug: "replit", name: "Replit", source: "ashby" },
  { slug: "perplexity", name: "Perplexity AI", source: "ashby" },
  { slug: "resend", name: "Resend", source: "ashby" },
  { slug: "vercel", name: "Vercel", source: "ashby" },
  { slug: "cursor", name: "Cursor", source: "ashby" },
  { slug: "anthropic", name: "Anthropic Ashby", source: "ashby" },
  { slug: "browserbase", name: "Browserbase", source: "ashby" },
  { slug: "elevenlabs", name: "ElevenLabs", source: "ashby" },
  { slug: "langchain", name: "LangChain", source: "ashby" },
  { slug: "hex", name: "Hex", source: "ashby" },
  { slug: "mercury", name: "Mercury", source: "ashby" },
  { slug: "loom", name: "Loom", source: "ashby" },
  { slug: "clay", name: "Clay", source: "ashby" },
  { slug: "watershed", name: "Watershed", source: "ashby" },
  { slug: "retellai", name: "Retell AI", source: "ashby" },
  { slug: "fal", name: "fal", source: "ashby" },
  { slug: "supabase", name: "Supabase", source: "ashby" },
  { slug: "temporal", name: "Temporal", source: "ashby" },

  // —— SmartRecruiters (keep higher-signal tech/enterprise boards) ——
  { slug: "Visa", name: "Visa", source: "smartrecruiters" },
  { slug: "Siemens", name: "Siemens", source: "smartrecruiters" },

  // —— Recruitee ——
  { slug: "bunq", name: "bunq", source: "recruitee" },
  { slug: "adjust", name: "Adjust", source: "recruitee" },
  { slug: "personio", name: "Personio", source: "recruitee" },
];

/** Aggregator boards that are searched as whole marketplaces (not per-company). */
export type AggregatorSource =
  | "remotive"
  | "remoteok"
  | "arbeitnow"
  | "jobicy"
  | "himalayas"
  | "themuse"
  | "weworkremotely"
  | "usajobs";

export const AGGREGATOR_SOURCES: AggregatorSource[] = [
  "remotive",
  "remoteok",
  "arbeitnow",
  "jobicy",
  "himalayas",
  "themuse",
  "weworkremotely",
  "usajobs",
];
