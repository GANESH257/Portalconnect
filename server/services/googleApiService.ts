/**
 * Google API Service
 * 
 * Provides functions for calling Google APIs:
 * - PageSpeed Insights
 * - Safe Browsing
 * - Places API
 */

import axios from "axios";

const GOOGLE_PAGESPEED_API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_INSIGHTS_API_KEY;
const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const SAFE_BROWSING_API_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const PLACES_API_URL = "https://maps.googleapis.com/maps/api/place";

/**
 * Get PageSpeed Insights data
 */
export async function getPageSpeedInsights(url: string): Promise<{
  performance: number | null;
  mobile: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
  opportunities: any[];
  diagnostics: any[];
  metrics: {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    tti?: number;
    speedIndex?: number;
  };
} | null> {
  if (!GOOGLE_PAGESPEED_API_KEY) {
    console.log("⚠️  Google PageSpeed Insights API key not configured");
    return null;
  }

  try {
    const [desktopResponse, mobileResponse] = await Promise.all([
      axios.get(PAGESPEED_API_URL, {
        params: {
          url: url,
          key: GOOGLE_PAGESPEED_API_KEY,
          strategy: "desktop"
        },
        timeout: 60000
      }),
      axios.get(PAGESPEED_API_URL, {
        params: {
          url: url,
          key: GOOGLE_PAGESPEED_API_KEY,
          strategy: "mobile"
        },
        timeout: 60000
      })
    ]);

    const lighthouse = desktopResponse.data?.lighthouseResult;
    const mobileLighthouse = mobileResponse.data?.lighthouseResult;
    
    const desktopScore = lighthouse?.categories?.performance?.score
      ? Math.round(lighthouse.categories.performance.score * 100)
      : null;
    
    const mobileScore = mobileLighthouse?.categories?.performance?.score
      ? Math.round(mobileLighthouse.categories.performance.score * 100)
      : null;
    
    const accessibilityScore = lighthouse?.categories?.accessibility?.score
      ? Math.round(lighthouse.categories.accessibility.score * 100)
      : null;
    
    const seoScore = lighthouse?.categories?.seo?.score
      ? Math.round(lighthouse.categories.seo.score * 100)
      : null;
    
    const bestPracticesScore = lighthouse?.categories?.["best-practices"]?.score
      ? Math.round(lighthouse.categories["best-practices"].score * 100)
      : null;

    const audits = lighthouse?.audits || {};
    const metrics = {
      fcp: audits["first-contentful-paint"]?.numericValue || null,
      lcp: audits["largest-contentful-paint"]?.numericValue || null,
      fid: audits["max-potential-fid"]?.numericValue || null,
      cls: audits["cumulative-layout-shift"]?.numericValue || null,
      tti: audits["interactive"]?.numericValue || null,
      speedIndex: audits["speed-index"]?.numericValue || null
    };

    const opportunities = Object.values(audits)
      .filter((audit: any) => audit.details?.type === "opportunity" && audit.score !== null && audit.score < 1)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
        details: audit.details
      }));

    const diagnostics = Object.values(audits)
      .filter((audit: any) => audit.details?.type === "diagnostic" && audit.score !== null)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue
      }));

    return {
      performance: desktopScore,
      mobile: mobileScore,
      accessibility: accessibilityScore,
      seo: seoScore,
      bestPractices: bestPracticesScore,
      opportunities,
      diagnostics,
      metrics
    };
  } catch (error: any) {
    console.error("PageSpeed Insights API error:", error.message);
    return null;
  }
}

/**
 * Check Safe Browsing status
 */
export async function checkSafeBrowsing(url: string): Promise<{
  isSafe: boolean;
  threatTypes?: string[];
} | null> {
  if (!GOOGLE_PAGESPEED_API_KEY) {
    return null;
  }

  try {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];

    const response = await axios.post(
      `${SAFE_BROWSING_API_URL}?key=${GOOGLE_PAGESPEED_API_KEY}`,
      {
        client: {
          clientId: "ensemble-seo-tool",
          clientVersion: "1.0"
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [
            { url: `https://${domain}` },
            { url: `http://${domain}` }
          ]
        }
      },
      { timeout: 10000 }
    );

    const matches = response.data?.matches || [];
    const threatTypes = matches.map((match: any) => match.threatType);

    return {
      isSafe: matches.length === 0,
      threatTypes: threatTypes.length > 0 ? threatTypes : undefined
    };
  } catch (error: any) {
    if (error.response?.status === 200 || error.response?.data?.matches?.length === 0) {
      return { isSafe: true };
    }
    console.error("Safe Browsing API error:", error.message);
    return null;
  }
}

/**
 * Get Google Places reviews
 */
export async function getGooglePlacesReviews(params: {
  placeId?: string;
  businessName?: string;
  address?: string;
}): Promise<{
  rating: number | null;
  totalRatings: number | null;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    time: number;
  }>;
  placeId: string | null;
} | null> {
  if (!GOOGLE_PAGESPEED_API_KEY) {
    return null;
  }

  try {
    let placeId = params.placeId;

    if (!placeId && (params.businessName || params.address)) {
      const searchQuery = params.businessName 
        ? `${params.businessName} ${params.address || ''}`.trim()
        : params.address || '';
      
      const searchResponse = await axios.get(`${PLACES_API_URL}/textsearch/json`, {
        params: {
          query: searchQuery,
          key: GOOGLE_PAGESPEED_API_KEY
        },
        timeout: 10000
      });

      const results = searchResponse.data?.results || [];
      if (results.length > 0) {
        placeId = results[0].place_id;
      } else {
        return null;
      }
    }

    if (!placeId) {
      return null;
    }

    const detailsResponse = await axios.get(`${PLACES_API_URL}/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_PAGESPEED_API_KEY,
        fields: 'name,rating,user_ratings_total,reviews'
      },
      timeout: 10000
    });

    const result = detailsResponse.data?.result;
    if (!result) {
      return null;
    }

    return {
      rating: result.rating || null,
      totalRatings: result.user_ratings_total || null,
      reviews: (result.reviews || []).map((review: any) => ({
        author: review.author_name || 'Anonymous',
        rating: review.rating || 0,
        text: review.text || '',
        time: review.time || 0
      })),
      placeId: placeId
    };
  } catch (error: any) {
    console.error("Google Places API error:", error.message);
    return null;
  }
}

