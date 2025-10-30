import { Link } from "react-router-dom";

const apps = [
  // Core
  { name: "Prospect Finder", to: "/agents/prospect-finder", description: "Search and discover local prospects" },
  { name: "Watchlist", to: "/watchlist", description: "Track saved prospects and competitors" },
  { name: "Prospect Management", to: "/prospect-management", description: "Manage prospects, notes, and outreach" },
  { name: "Proposals", to: "/proposals", description: "Prepare and manage proposals" },

  // Intelligence agents
  { name: "SERP Intelligence", to: "/agents/serp-intelligence", description: "Keyword tracking and SERP data" },
  { name: "Website Intelligence", to: "/agents/website-intelligence", description: "SEO and competitor analysis" },

  // Other agents currently available
  { name: "Customer Support Agent", to: "/agents/customer-support", description: "Customer help workflows" },
  { name: "Copywriter", to: "/agents/copywriter", description: "Creative content generation" },
  { name: "Email Marketing", to: "/agents/email-marketing", description: "Automated email campaigns" },
  { name: "Image Artist", to: "/agents/image-artist", description: "AI visual content" },
  { name: "Marketing Genius", to: "/agents/marketing-genius", description: "Strategy and optimization" },
  { name: "Coding Helper", to: "/agents/coding-helper", description: "Development assistance" },
  { name: "SEO Specialist", to: "/agents/seo-specialist", description: "On-page and visibility" },
  { name: "SERP Rank Checker", to: "/agents/serp-rank-checker", description: "Ranking snapshots" },
  { name: "Multi‑LLM Chatbot", to: "/agents/multi-llm-chatbot", description: "Conversational assistant" },
  { name: "Campaign Optimization", to: "/agents/campaign-optimization", description: "Ad & campaign insights" },
  { name: "Growth Strategy", to: "/agents/growth-strategy", description: "Growth planning" },
  { name: "Patient Engagement", to: "/agents/patient-engagement", description: "Patient communication" },
  { name: "Content Creation", to: "/agents/content-creation", description: "Long-form content" },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <Link key={app.to} to={app.to} className="block border rounded-md p-4 hover:bg-accent">
            <div className="text-sm font-medium">{app.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{app.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}


