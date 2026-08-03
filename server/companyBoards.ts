export interface CompanyBoard {
  slug: string;
  name: string;
  source: "greenhouse" | "lever" | "ashby";
}

export const COMPANY_BOARDS: CompanyBoard[] = [
  // Greenhouse boards
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

  // Lever boards
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

  // Ashby boards
  { slug: "linear", name: "Linear", source: "ashby" },
  { slug: "ramp", name: "Ramp", source: "ashby" },
  { slug: "notion", name: "Notion", source: "ashby" },
  { slug: "ashby", name: "Ashby", source: "ashby" },
  { slug: "postman", name: "Postman", source: "ashby" },
  { slug: "ironclad", name: "Ironclad", source: "ashby" },
  { slug: "modal", name: "Modal", source: "ashby" },
  { slug: "replit", name: "Replit", source: "ashby" },
  { slug: "perplexity", name: "Perplexity AI", source: "ashby" },
  { slug: "resend", name: "Resend", source: "ashby" }
];
