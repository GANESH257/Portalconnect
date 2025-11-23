/**
 * Update Analytics and Schema Data for SPINE Center
 * 
 * This script re-fetches HTML content and updates analytics/schema detection
 * for the SPINE Center business profile.
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";
import axios from "axios";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery";
const DOMAIN = "onlinespinecare.com";

/**
 * Detect schemas in HTML
 */
function detectSchemasInHTML(html: string): {
  localBusiness: boolean;
  faq: boolean;
  organization: boolean;
  breadcrumbs: boolean;
  product: boolean;
  review: boolean;
} {
  const lowerHtml = html.toLowerCase();
  
  // Check for JSON-LD schemas
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  let hasLocalBusiness = false;
  let hasFAQ = false;
  let hasOrganization = false;
  let hasBreadcrumbs = false;
  let hasProduct = false;
  let hasReview = false;
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const schema = JSON.parse(jsonContent);
        
        if (Array.isArray(schema)) {
          schema.forEach((s: any) => {
            const schemaType = s['@type']?.toLowerCase() || '';
            if (schemaType.includes('localbusiness')) hasLocalBusiness = true;
            if (schemaType.includes('faqpage')) hasFAQ = true;
            if (schemaType.includes('organization')) hasOrganization = true;
            if (schemaType.includes('breadcrumb')) hasBreadcrumbs = true;
            if (schemaType.includes('product')) hasProduct = true;
            if (schemaType.includes('review')) hasReview = true;
          });
        } else {
          const schemaType = schema['@type']?.toLowerCase() || '';
          if (schemaType.includes('localbusiness')) hasLocalBusiness = true;
          if (schemaType.includes('faqpage')) hasFAQ = true;
          if (schemaType.includes('organization')) hasOrganization = true;
          if (schemaType.includes('breadcrumb')) hasBreadcrumbs = true;
          if (schemaType.includes('product')) hasProduct = true;
          if (schemaType.includes('review')) hasReview = true;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
  
  // Check for microdata and RDFa
  if (lowerHtml.includes('itemtype') && lowerHtml.includes('localbusiness')) hasLocalBusiness = true;
  if (lowerHtml.includes('itemtype') && lowerHtml.includes('faqpage')) hasFAQ = true;
  if (lowerHtml.includes('schema.org/localbusiness')) hasLocalBusiness = true;
  if (lowerHtml.includes('schema.org/faqpage')) hasFAQ = true;
  if (lowerHtml.includes('schema.org/organization')) hasOrganization = true;
  if (lowerHtml.includes('schema.org/breadcrumb')) hasBreadcrumbs = true;
  if (lowerHtml.includes('schema.org/product')) hasProduct = true;
  if (lowerHtml.includes('schema.org/review')) hasReview = true;
  
  return {
    localBusiness: hasLocalBusiness,
    faq: hasFAQ,
    organization: hasOrganization,
    breadcrumbs: hasBreadcrumbs,
    product: hasProduct,
    review: hasReview
  };
}

/**
 * Detect analytics in HTML
 */
function detectAnalyticsInHTML(html: string): {
  googleAnalytics: { found: boolean; type?: 'GA4' | 'UA' | 'gtag'; id?: string };
  facebookPixel: { found: boolean; id?: string };
} {
  // Google Analytics detection
  let gaFound = false;
  let gaType: 'GA4' | 'UA' | 'gtag' | undefined;
  let gaId: string | undefined;
  
  // Check for GA4 (gtag)
  const gtagMatch = html.match(/gtag\(['"]config['"],\s*['"]G-([^'"]+)['"]/i);
  if (gtagMatch) {
    gaFound = true;
    gaType = 'GA4';
    gaId = `G-${gtagMatch[1]}`;
  }
  
  // Check for Universal Analytics
  const uaMatch = html.match(/ga\(['"]create['"],\s*['"](UA-[^'"]+)['"]/i) || 
                          html.match(/_gaq\.push\(\[['"]create['"],\s*['"](UA-[^'"]+)['"]/i);
  if (uaMatch) {
    gaFound = true;
    gaType = 'UA';
    gaId = uaMatch[1];
  }
  
  // Check for gtag.js
  if (html.includes('gtag.js') && !gaFound) {
    gaFound = true;
    gaType = 'gtag';
  }
  
  // Check for analytics.js or ga.js
  if ((html.includes('analytics.js') || html.includes('ga.js')) && !gaFound) {
    gaFound = true;
    gaType = 'UA';
  }
  
  // Check for Google Tag Manager (can contain GA)
  if (html.includes('googletagmanager.com')) {
    // Try to extract GTM container ID
    const gtmMatch = html.match(/GTM-([A-Z0-9]+)/i);
    if (gtmMatch && !gaFound) {
      gaFound = true;
      gaType = 'gtag';
      gaId = `GTM-${gtmMatch[1]}`;
    }
  }
  
  // Facebook Pixel detection
  let fbPixelFound = false;
  let fbPixelId: string | undefined;
  
  // Check for fbq('init', 'PIXEL_ID')
  const fbPixelMatch = html.match(/fbq\(['"]init['"],\s*['"]([^'"]+)['"]/i) ||
                        html.match(/_fbp=['"]([^'"]+)['"]/i);
  if (fbPixelMatch) {
    fbPixelFound = true;
    fbPixelId = fbPixelMatch[1];
  }
  
  // Check for Facebook Pixel script
  if (html.includes('fbevents.js') || html.includes('facebook.com/tr')) {
    fbPixelFound = true;
  }
  
  return {
    googleAnalytics: {
      found: gaFound,
      type: gaType,
      id: gaId
    },
    facebookPixel: {
      found: fbPixelFound,
      id: fbPixelId
    }
  };
}

async function updateAnalyticsAndSchemas() {
  console.log("🔄 Updating Analytics and Schema Data for SPINE Center\n");
  
  try {
    // Find the business profile
    const businessProfile = await prisma.businessProfile.findFirst({
      where: {
        name: { contains: BUSINESS_NAME }
      },
      include: {
        serpResult: {
          select: {
            id: true,
            rawData: true
          }
        }
      }
    });
    
    if (!businessProfile) {
      console.log("❌ Business profile not found");
      return;
    }
    
    console.log(`✅ Found business profile: ${businessProfile.name}`);
    console.log(`   Domain: ${businessProfile.domain || DOMAIN}`);
    
    // Fetch HTML content
    const url = businessProfile.websiteUrl || `https://${businessProfile.domain || DOMAIN}`;
    console.log(`\n📥 Fetching HTML from: ${url}`);
    
    try {
      const htmlResponse = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 30000,
        maxRedirects: 5
      });
      
      const htmlContent = htmlResponse.data;
      console.log(`✅ HTML fetched successfully (${htmlContent.length} bytes)`);
      
      // Detect analytics and schemas
      const analytics = detectAnalyticsInHTML(htmlContent);
      const schemas = detectSchemasInHTML(htmlContent);
      
      console.log("\n📊 Detection Results:");
      console.log("   Analytics:", JSON.stringify(analytics, null, 2));
      console.log("   Schemas:", JSON.stringify(schemas, null, 2));
      
      // Update the serpResult's rawData.enriched
      if (businessProfile.serpResult) {
        const serpResult = businessProfile.serpResult;
        const rawData: any = serpResult.rawData || {};
        const enriched: any = rawData.enriched || {};
        
        // Update analytics and schemas
        enriched.analytics = analytics;
        enriched.schemas = schemas;
        enriched.htmlContent = htmlContent; // Store HTML for future reference
        
        // Update the serpResult
        await prisma.serpResult.update({
          where: { id: serpResult.id },
          data: {
            rawData: {
              ...rawData,
              enriched: enriched
            }
          }
        });
        
        console.log("\n✅ Updated serpResult with new analytics and schema data");
        console.log(`   SerpResult ID: ${serpResult.id}`);
      } else {
        console.log("\n❌ No serpResult linked to business profile");
      }
      
    } catch (htmlError: any) {
      console.log(`\n❌ HTML fetch failed: ${htmlError.message}`);
      if (htmlError.response) {
        console.log(`   Status: ${htmlError.response.status}`);
        console.log(`   Status Text: ${htmlError.response.statusText}`);
      }
    }
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAnalyticsAndSchemas().catch(console.error);

