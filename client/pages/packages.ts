export type ServiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Service = {
  id: string;
  name: string;
  setup: number;
  monthly: number;
  description?: string;
  items?: ServiceLineItem[];
};

export const SERVICE_PACKAGES: Service[] = [
  { id: "website", name: "Website Only", setup: 2500, monthly: 500, description: "Professional website design and development tailored for healthcare clinics", items: [] },
  { id: "website_seo", name: "Website + SEO", setup: 4000, monthly: 1500, description: "Complete website with ongoing SEO optimization to improve search rankings", items: [] },
  { id: "website_full", name: "Website + Full Marketing", setup: 7000, monthly: 3000, description: "Website + SEO, PPC, and reputation management bundled", items: [] },
  { id: "seo_only", name: "SEO Only", setup: 1500, monthly: 1200, description: "On-page, technical, and content SEO services", items: [] },
  { id: "ppc", name: "PPC Management", setup: 1000, monthly: 1000, description: "Google Ads setup, optimization, and reporting", items: [] },
  { id: "reputation", name: "Reputation Management", setup: 500, monthly: 1000, description: "Review generation, monitoring, and response systems", items: [] },
  { id: "full_transform", name: "Full Digital Transformation", setup: 12000, monthly: 5000, description: "End-to-end digital marketing transformation program", items: [] },
  { id: "ai_chatbot", name: "AI Chatbot", setup: 1500, monthly: 300, description: "24/7 AI assistant for patient support and lead capture", items: [] },
];


