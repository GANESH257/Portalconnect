/**
 * Score Calculation Service
 * 
 * Provides functions for calculating SEO/PPC scores and generating recommendations
 */

export interface SEOAndPPCData {
  serpPosition: number | null;
  schemas: {
    localBusiness: boolean;
    faq: boolean;
    organization: boolean;
    breadcrumbs: boolean;
    product: boolean;
    review: boolean;
  };
  analytics: {
    googleAnalytics: { found: boolean; type?: string; id?: string | null };
    facebookPixel: { found: boolean; id?: string | null };
  };
  ppcStatus: {
    runningAds: boolean;
    adCount: number;
    creativesCount?: number;
    paidETV?: number | null;
  };
  speedScores: {
    desktop: number | null;
    mobile: number | null;
  };
  safeBrowsing?: {
    isSafe: boolean;
    threatTypes?: string[];
  } | null;
  schemaValidation?: {
    valid: boolean;
    errors: string[];
  } | null;
  domainAuthority?: number | null;
  backlinks?: number | null;
  monthlyTraffic?: number | null;
  accessibilityScore?: number | null;
  seoScore?: number | null;
}

/**
 * Calculate Opportunity Score (0-100)
 * Based on various SEO/PPC factors
 */
export function calculateOpportunityScore(data: SEOAndPPCData): number {
  let opportunityScore = 0;
  let maxPossible = 0;

  // SERP Position (30 points max)
  maxPossible += 30;
  if (data.serpPosition) {
    if (data.serpPosition <= 3) opportunityScore += 30;
    else if (data.serpPosition <= 10) opportunityScore += 20;
    else if (data.serpPosition <= 20) opportunityScore += 10;
    else opportunityScore += 5;
  }

  // Schema presence (20 points max)
  maxPossible += 20;
  if (data.schemas.localBusiness) opportunityScore += 10;
  if (data.schemas.faq) opportunityScore += 10;

  // Analytics presence (15 points max)
  maxPossible += 15;
  if (data.analytics.googleAnalytics.found) opportunityScore += 10;
  if (data.analytics.facebookPixel.found) opportunityScore += 5;

  // Speed scores (20 points max)
  maxPossible += 20;
  if (data.speedScores.desktop && data.speedScores.desktop >= 90) opportunityScore += 10;
  else if (data.speedScores.desktop && data.speedScores.desktop >= 70) opportunityScore += 5;
  if (data.speedScores.mobile && data.speedScores.mobile >= 90) opportunityScore += 10;
  else if (data.speedScores.mobile && data.speedScores.mobile >= 70) opportunityScore += 5;

  // PPC status (15 points max)
  maxPossible += 15;
  if (data.ppcStatus.runningAds) {
    opportunityScore += 15; // Running ads is good
  } else {
    // Not running ads = opportunity to start = potential score
    opportunityScore += 8; // Medium opportunity
  }

  // Safe Browsing (10 points max)
  maxPossible += 10;
  if (data.safeBrowsing?.isSafe) {
    opportunityScore += 10; // Safe = good
  } else if (data.safeBrowsing) {
    opportunityScore += 0; // Unsafe = critical issue
  }

  // Schema Validation (10 points max)
  maxPossible += 10;
  if (data.schemaValidation?.valid) {
    opportunityScore += 10; // Valid schemas = good
  } else if (data.schemaValidation && data.schemaValidation.errors.length > 0) {
    // Invalid schemas = opportunity to fix
    const errorCount = data.schemaValidation.errors.length;
    if (errorCount <= 2) opportunityScore += 7; // Minor issues
    else if (errorCount <= 5) opportunityScore += 4; // Moderate issues
    else opportunityScore += 1; // Major issues
  }

  // Normalize to 0-100 scale
  return maxPossible > 0 ? Math.round((opportunityScore / maxPossible) * 100) : 0;
}

/**
 * Generate opportunity score breakdown
 */
export function calculateOpportunityScoreBreakdown(data: SEOAndPPCData): {
  serpPosition: number;
  schemas: number;
  analytics: number;
  speedScores: number;
  ppcStatus: number;
  safeBrowsing: number;
  schemaValidation: number;
} {
  return {
    serpPosition: data.serpPosition ? (data.serpPosition <= 3 ? 30 : data.serpPosition <= 10 ? 20 : data.serpPosition <= 20 ? 10 : 5) : 0,
    schemas: (data.schemas.localBusiness ? 10 : 0) + (data.schemas.faq ? 10 : 0),
    analytics: (data.analytics.googleAnalytics.found ? 10 : 0) + (data.analytics.facebookPixel.found ? 5 : 0),
    speedScores: (data.speedScores.desktop && data.speedScores.desktop >= 90 ? 10 : data.speedScores.desktop && data.speedScores.desktop >= 70 ? 5 : 0) + 
                 (data.speedScores.mobile && data.speedScores.mobile >= 90 ? 10 : data.speedScores.mobile && data.speedScores.mobile >= 70 ? 5 : 0),
    ppcStatus: data.ppcStatus.runningAds ? 15 : 8,
    safeBrowsing: data.safeBrowsing?.isSafe ? 10 : 0,
    schemaValidation: data.schemaValidation?.valid ? 10 : (data.schemaValidation?.errors.length <= 2 ? 7 : data.schemaValidation?.errors.length <= 5 ? 4 : 1) || 0
  };
}

/**
 * Generate SEO recommendations based on analysis
 */
export function generateRecommendations(data: SEOAndPPCData, score: number): string[] {
  const recommendations: string[] = [];
  
  // Schema recommendations
  if (!data.schemas.localBusiness) {
    recommendations.push('Add LocalBusiness schema markup to improve local SEO visibility and Google Maps rankings');
  }
  if (!data.schemas.faq) {
    recommendations.push('Add FAQPage schema to capture featured snippets and improve visibility in search results');
  }
  if (!data.schemas.organization) {
    recommendations.push('Add Organization schema to establish brand identity and improve knowledge graph presence');
  }
  if (!data.schemas.breadcrumbs) {
    recommendations.push('Implement breadcrumb schema to improve navigation and search result display');
  }

  // Analytics recommendations
  if (!data.analytics.googleAnalytics.found) {
    recommendations.push('Install Google Analytics to track website performance and user behavior');
  }
  if (!data.analytics.facebookPixel.found) {
    recommendations.push('Install Facebook Pixel to enable retargeting and track conversion events');
  }

  // Speed recommendations
  if (data.speedScores.desktop && data.speedScores.desktop < 70) {
    recommendations.push(`Improve desktop page speed (current: ${data.speedScores.desktop}/100) - optimize images, minify CSS/JS, enable caching`);
  }
  if (data.speedScores.mobile && data.speedScores.mobile < 70) {
    recommendations.push(`Improve mobile page speed (current: ${data.speedScores.mobile}/100) - optimize for mobile devices, reduce render-blocking resources`);
  }

  // PPC recommendations
  if (!data.ppcStatus.runningAds) {
    recommendations.push('Start running Google Ads to capture high-intent traffic and increase visibility');
  } else if (data.ppcStatus.adCount < 5) {
    recommendations.push(`Expand ad campaign - currently running ${data.ppcStatus.adCount} ads, consider adding more creatives`);
  }

  // SERP position recommendations
  if (data.serpPosition && data.serpPosition > 10) {
    recommendations.push(`Improve SERP ranking (current: #${data.serpPosition}) - optimize on-page SEO, build quality backlinks`);
  }

  // Safe Browsing recommendations
  if (data.safeBrowsing && !data.safeBrowsing.isSafe) {
    recommendations.push('⚠️ CRITICAL: Website flagged by Google Safe Browsing - resolve security issues immediately');
  }

  // Schema validation recommendations
  if (data.schemaValidation && !data.schemaValidation.valid && data.schemaValidation.errors.length > 0) {
    recommendations.push(`Fix ${data.schemaValidation.errors.length} schema validation error(s) to ensure proper structured data`);
  }

  // Domain authority recommendations
  if (data.domainAuthority && data.domainAuthority < 30) {
    recommendations.push('Build domain authority through quality backlinks and content marketing');
  }

  // Backlinks recommendations
  if (data.backlinks && data.backlinks < 10) {
    recommendations.push('Build quality backlinks to improve domain authority and search rankings');
  }

  // Limit to top 5-7 recommendations
  return recommendations.slice(0, 7);
}

/**
 * Calculate SEO Score (0-100)
 * Based on technical SEO factors
 */
export function calculateSEOScore(metrics: {
  domainAuthority?: number | null;
  backlinks?: number | null;
  monthlyTraffic?: number | null;
  speedScores?: { desktop: number | null; mobile: number | null };
  accessibilityScore?: number | null;
  schemas?: { localBusiness: boolean; faq: boolean; organization: boolean };
}): number {
  let score = 0;
  let maxPossible = 0;

  // Domain Authority (30 points max)
  maxPossible += 30;
  if (metrics.domainAuthority) {
    if (metrics.domainAuthority >= 70) score += 30;
    else if (metrics.domainAuthority >= 50) score += 20;
    else if (metrics.domainAuthority >= 30) score += 10;
    else score += 5;
  }

  // Backlinks (20 points max)
  maxPossible += 20;
  if (metrics.backlinks) {
    if (metrics.backlinks >= 1000) score += 20;
    else if (metrics.backlinks >= 500) score += 15;
    else if (metrics.backlinks >= 100) score += 10;
    else if (metrics.backlinks >= 10) score += 5;
  }

  // Monthly Traffic (20 points max)
  maxPossible += 20;
  if (metrics.monthlyTraffic) {
    if (metrics.monthlyTraffic >= 10000) score += 20;
    else if (metrics.monthlyTraffic >= 5000) score += 15;
    else if (metrics.monthlyTraffic >= 1000) score += 10;
    else if (metrics.monthlyTraffic >= 100) score += 5;
  }

  // Speed Scores (15 points max)
  maxPossible += 15;
  if (metrics.speedScores) {
    const avgSpeed = metrics.speedScores.desktop && metrics.speedScores.mobile
      ? (metrics.speedScores.desktop + metrics.speedScores.mobile) / 2
      : metrics.speedScores.desktop || metrics.speedScores.mobile || 0;
    if (avgSpeed >= 90) score += 15;
    else if (avgSpeed >= 70) score += 10;
    else if (avgSpeed >= 50) score += 5;
  }

  // Accessibility (10 points max)
  maxPossible += 10;
  if (metrics.accessibilityScore) {
    if (metrics.accessibilityScore >= 90) score += 10;
    else if (metrics.accessibilityScore >= 70) score += 7;
    else if (metrics.accessibilityScore >= 50) score += 4;
  }

  // Schemas (5 points max)
  maxPossible += 5;
  if (metrics.schemas) {
    if (metrics.schemas.localBusiness) score += 2;
    if (metrics.schemas.faq) score += 2;
    if (metrics.schemas.organization) score += 1;
  }

  // Normalize to 0-100 scale
  return maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0;
}

