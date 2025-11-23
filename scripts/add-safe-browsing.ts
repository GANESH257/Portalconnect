/**
 * Google Safe Browsing API - Security Checks
 * 
 * Requirements:
 * - Same API key as PageSpeed Insights (GOOGLE_PAGESPEED_API_KEY)
 * - Enable "Safe Browsing API" in Google Cloud Console
 * 
 * Rate Limits:
 * - Free tier: 10,000 requests/day
 * - No cost per request (free tier)
 */
import axios from "axios";

const GOOGLE_SAFE_BROWSING_API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY; // Same key
const SAFE_BROWSING_API_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

export async function checkSafeBrowsing(url: string): Promise<{
  isSafe: boolean;
  threats: string[];
  malware: boolean;
  phishing: boolean;
  unwantedSoftware: boolean;
} | null> {
  if (!GOOGLE_SAFE_BROWSING_API_KEY) {
    console.log("⚠️  Google Safe Browsing API key not configured");
    return null;
  }

  try {
    // Extract domain from URL
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];

    const response = await axios.post(
      `${SAFE_BROWSING_API_URL}?key=${GOOGLE_SAFE_BROWSING_API_KEY}`,
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
      }
    );

    const matches = response.data?.matches || [];
    const threats: string[] = [];
    let malware = false;
    let phishing = false;
    let unwantedSoftware = false;

    matches.forEach((match: any) => {
      const threatType = match.threatType;
      threats.push(threatType);
      
      if (threatType === "MALWARE") malware = true;
      if (threatType === "SOCIAL_ENGINEERING") phishing = true;
      if (threatType === "UNWANTED_SOFTWARE") unwantedSoftware = true;
    });

    return {
      isSafe: matches.length === 0,
      threats: threats,
      malware: malware,
      phishing: phishing,
      unwantedSoftware: unwantedSoftware
    };
  } catch (error: any) {
    // If API returns 200 with no matches, it's safe
    if (error.response?.status === 200 || error.response?.data?.matches?.length === 0) {
      return {
        isSafe: true,
        threats: [],
        malware: false,
        phishing: false,
        unwantedSoftware: false
      };
    }
    console.error("Safe Browsing API error:", error.message);
    return null;
  }
}

