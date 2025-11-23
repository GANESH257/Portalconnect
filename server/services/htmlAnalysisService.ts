import axios from "axios";

/**
 * HTML Analysis Service
 * 
 * Provides functions for fetching HTML and analyzing it for:
 * - Analytics detection (Google Analytics, Facebook Pixel)
 * - Schema detection (JSON-LD, microdata, RDFa)
 * - Schema validation
 */

/**
 * Fetch HTML from a URL with browser-like headers
 */
export async function fetchHTML(url: string): Promise<string> {
  try {
    // Ensure URL has protocol
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }

    const htmlResponse = await axios.get(fullUrl, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      validateStatus: (status) => status < 500 // Accept 403, 404, etc. but not 500+
    });

    if (htmlResponse && htmlResponse.data && typeof htmlResponse.data === 'string') {
      return htmlResponse.data;
    }

    throw new Error(`Invalid HTML response: status ${htmlResponse.status}`);
  } catch (error: any) {
    if (error.response) {
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    }
    throw new Error(`Failed to fetch HTML: ${error.message}`);
  }
}

/**
 * Detect analytics in HTML (Google Analytics, Facebook Pixel)
 */
export function detectAnalyticsInHTML(html: string): {
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

/**
 * Detect schemas in HTML (JSON-LD, microdata, RDFa)
 */
export function detectSchemasInHTML(html: string): {
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
 * Validate JSON-LD schemas in HTML
 */
export function validateSchemas(html: string): {
  valid: boolean;
  errors: string[];
  schemas: any[];
} {
  const errors: string[] = [];
  const schemas: any[] = [];
  
  // Extract all JSON-LD scripts
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  
  if (!jsonLdMatches || jsonLdMatches.length === 0) {
    return {
      valid: true,
      errors: [],
      schemas: []
    };
  }
  
  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      const schema = JSON.parse(jsonContent);
      
      // Basic validation
      if (Array.isArray(schema)) {
        schema.forEach((s: any, index: number) => {
          if (!s['@type']) {
            errors.push(`Schema ${index} missing @type`);
          } else {
            schemas.push(s);
          }
        });
      } else {
        if (!schema['@type']) {
          errors.push('Schema missing @type');
        } else {
          schemas.push(schema);
        }
      }
    } catch (e: any) {
      errors.push(`Invalid JSON: ${e.message}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    schemas
  };
}

