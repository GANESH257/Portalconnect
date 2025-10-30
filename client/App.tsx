import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import WelcomePage from "./pages/WelcomePage";
import SettingsPage from "./pages/SettingsPage";
import WatchlistPage from "./pages/WatchlistPage";
import ProspectsPage from "./pages/ProspectsPage";
import BusinessProfilePage from "./pages/BusinessProfilePage";
import Dashboard from "./pages/Dashboard";
import ProspectManagementPage from "./pages/ProspectManagementPage";
import ProposalsPage from "./pages/ProposalsPage";
import OfferingsPage from "./pages/OfferingsPage";
import ProtectedAppLayout from "./components/ProtectedAppLayout";
import ImageGenerationAgent from "./agents/nanobanana";
import SERPRankCheckerAgent from "./agents/serp-rank-checker";
import MultiLLMChatbotAgent from "./agents/multi-llm-chatbot";
import ContentCreationAgent from "./agents/content-creation";
import PatientEngagementAgent from "./agents/patient-engagement";
import CampaignOptimizationAgent from "./agents/campaign-optimization";
import GrowthStrategyAgent from "./agents/growth-strategy";
import CustomerSupportAgent from "./agents/customer-support";
import CopywriterAgent from "./agents/copywriter";
import EmailMarketingAgent from "./agents/email-marketing";
import ImageArtistAgent from "./agents/image-artist";
import MarketingGeniusAgent from "./agents/marketing-genius";
import CodingHelperAgent from "./agents/coding-helper";
import SEOSpecialistAgent from "./agents/seo-specialist";
import SERPIntelligenceAgent from "./agents/serp-intelligence";
import ProspectFinderAgent from "./agents/prospect-finder";
import WebsiteIntelligenceAgent from "./agents/website-intelligence";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
              <Routes>
                {/* Public routes (no sidebar) */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected routes (with sidebar layout) */}
                <Route element={<ProtectedRoute><ProtectedAppLayout /></ProtectedRoute>}>
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                  <Route path="/prospects" element={<ProspectsPage />} />
                  <Route path="/prospect-management" element={<ProspectManagementPage />} />
                  <Route path="/proposals" element={<ProposalsPage />} />
                  <Route path="/offerings" element={<OfferingsPage />} />
                  <Route path="/business/:profileId" element={<BusinessProfilePage />} />
                  {/* Legacy AI Agent Routes under protected */}
                  <Route path="/agents/nanobanana" element={<ImageGenerationAgent />} />
                  <Route path="/agents/serp-rank-checker" element={<SERPRankCheckerAgent />} />
                  <Route path="/agents/multi-llm-chatbot" element={<MultiLLMChatbotAgent />} />
                  <Route path="/agents/content-creation" element={<ContentCreationAgent />} />
                  <Route path="/agents/patient-engagement" element={<PatientEngagementAgent />} />
                  <Route path="/agents/campaign-optimization" element={<CampaignOptimizationAgent />} />
                  <Route path="/agents/growth-strategy" element={<GrowthStrategyAgent />} />
                  <Route path="/agents/customer-support" element={<CustomerSupportAgent />} />
                  <Route path="/agents/copywriter" element={<CopywriterAgent />} />
                  <Route path="/agents/email-marketing" element={<EmailMarketingAgent />} />
                  <Route path="/agents/image-artist" element={<ImageArtistAgent />} />
                  <Route path="/agents/marketing-genius" element={<MarketingGeniusAgent />} />
                  <Route path="/agents/coding-helper" element={<CodingHelperAgent />} />
                  <Route path="/agents/seo-specialist" element={<SEOSpecialistAgent />} />
                  <Route path="/agents/serp-intelligence" element={<SERPIntelligenceAgent />} />
                  <Route path="/agents/prospect-finder" element={<ProspectFinderAgent />} />
                  <Route path="/agents/website-intelligence" element={<WebsiteIntelligenceAgent />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
