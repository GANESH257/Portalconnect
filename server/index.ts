import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import { handleDemo } from "./routes/demo";
// import { handleNanobananaGenerate } from "./routes/nanobanana";
import { 
  signup, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  logout, 
  refreshToken,
  verifyToken 
} from "./routes/auth.js";
import {
  searchProspects,
  analyzeWebsite,
  trackKeywordRankings,
  addToWatchlist,
  getWatchlistItems,
  updateWatchlistItem,
  removeFromWatchlist,
  getSerpJobResults,
  getBusinessProfile,
  enrichBusinessProfile,
  getBusinessQAndA,
  getBusinessUpdates,
  getCategoriesAggregation,
  getDomainAnalysis,
  getBacklinkAnalysis,
  getComprehensiveBusinessScore,
  getBusinessReviews,
  getRankedKeywords,
  getBulkTrafficEstimation,
  getAdsSearch,
  getBusinessAds,
  getBusinessSEOAndPPC,
  getOnPageAnalysis,
  getBusinessListings,
  getGoogleMyBusinessInfo,
  addToProspects,
  getProspectItems,
  updateProspectItem,
  removeFromProspects,
  generateAIRecommendations
} from "./routes/serp-intelligence.js";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000'],
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // app.get("/api/demo", handleDemo);

  // AI Agent routes (only nanobanana image generation)
  // app.post("/api/nanobanana/generate", handleNanobananaGenerate);

  // Authentication routes
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", verifyToken, logout);
  app.post("/api/auth/refresh", refreshToken);
  
  // Protected routes
  app.get("/api/auth/profile", verifyToken, getProfile);
  app.put("/api/auth/profile", verifyToken, updateProfile);
  app.put("/api/auth/password", verifyToken, changePassword);

  // SERP Intelligence routes
  app.post("/api/serp/search-prospects", verifyToken, searchProspects);
  app.post("/api/serp/analyze-website", verifyToken, analyzeWebsite);
  app.post("/api/serp/track-keywords", verifyToken, trackKeywordRankings);
  app.post("/api/serp/add-to-watchlist", verifyToken, addToWatchlist);
  app.get("/api/serp/watchlist", verifyToken, getWatchlistItems);
  app.put("/api/serp/watchlist/:itemId", verifyToken, updateWatchlistItem);
  app.delete("/api/serp/watchlist/:itemId", verifyToken, removeFromWatchlist);

  // Prospect management routes
  app.post("/api/serp/add-to-prospects", verifyToken, addToProspects);
  app.get("/api/serp/prospects", verifyToken, getProspectItems);
  app.put("/api/serp/prospects/:itemId", verifyToken, updateProspectItem);
  app.delete("/api/serp/prospects/:itemId", verifyToken, removeFromProspects);
  app.post("/api/serp/prospects/:itemId/ai-recommendations", verifyToken, generateAIRecommendations);
  app.get("/api/serp/job/:jobId", verifyToken, getSerpJobResults);
  // More specific routes first (order matters in Express)
  app.get("/api/serp/business/:profileId/seo-ppc", verifyToken, getBusinessSEOAndPPC);
  app.get("/api/serp/business/:profileId/ads", verifyToken, getBusinessAds);
  app.get("/api/serp/business/:profileId", verifyToken, getBusinessProfile);

  // Enhanced prospect finder endpoints
  app.post("/api/serp/enrich-business", verifyToken, enrichBusinessProfile);
  app.post("/api/serp/business-qa", verifyToken, getBusinessQAndA);
  app.post("/api/serp/business-updates", verifyToken, getBusinessUpdates);
  app.post("/api/serp/categories-aggregation", verifyToken, getCategoriesAggregation);
  app.post("/api/serp/domain-analysis", verifyToken, getDomainAnalysis);
  app.post("/api/serp/backlink-analysis", verifyToken, getBacklinkAnalysis);

  // Comprehensive business scoring endpoints
  app.post("/api/serp/comprehensive-score", verifyToken, getComprehensiveBusinessScore);
  app.post("/api/serp/business-reviews", verifyToken, getBusinessReviews);
  app.post("/api/serp/ranked-keywords", verifyToken, getRankedKeywords);
  app.post("/api/serp/bulk-traffic", verifyToken, getBulkTrafficEstimation);
  app.post("/api/serp/ads-search", verifyToken, getAdsSearch);
  app.post("/api/serp/onpage-analysis", verifyToken, getOnPageAnalysis);
  
  // Primary business data endpoints
  app.post("/api/serp/business-listings", verifyToken, getBusinessListings);
  app.post("/api/serp/google-my-business", verifyToken, getGoogleMyBusinessInfo);

  return app;
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createServer();
  const PORT = process.env.PORT || 8080;
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  });
}
