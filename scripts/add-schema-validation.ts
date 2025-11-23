/**
 * Schema Validation - Validate Structured Data
 * 
 * Validates JSON-LD schemas for syntax errors and required fields
 * Similar to Google's Rich Results Test validation
 */
export function validateSchemas(html: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  schemas: Array<{
    type: string;
    valid: boolean;
    errors: string[];
  }>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const schemas: Array<{ type: string; valid: boolean; errors: string[] }> = [];

  // Extract JSON-LD schemas
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  
  if (!jsonLdMatches || jsonLdMatches.length === 0) {
    warnings.push("No JSON-LD structured data found");
    return { valid: false, errors, warnings, schemas };
  }

  jsonLdMatches.forEach((match, index) => {
    try {
      const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
      const schema = JSON.parse(jsonContent);
      const schemaArray = Array.isArray(schema) ? schema : [schema];

      schemaArray.forEach((s: any) => {
        const schemaType = s['@type'] || s.type || 'Unknown';
        const schemaErrors: string[] = [];

        // Validate required @context
        if (!s['@context']) {
          schemaErrors.push(`Missing @context in ${schemaType} schema`);
        }

        // Validate required @type
        if (!s['@type']) {
          schemaErrors.push(`Missing @type in schema`);
        }

        // Validate LocalBusiness schema
        if (schemaType.toLowerCase().includes('localbusiness')) {
          if (!s.name) schemaErrors.push("LocalBusiness: Missing required field 'name'");
          if (!s.address) schemaErrors.push("LocalBusiness: Missing required field 'address'");
          if (!s.telephone && !s.phoneNumber) warnings.push("LocalBusiness: Missing 'telephone' (recommended)");
        }

        // Validate Organization schema
        if (schemaType.toLowerCase().includes('organization')) {
          if (!s.name) schemaErrors.push("Organization: Missing required field 'name'");
          if (!s.url) warnings.push("Organization: Missing 'url' (recommended)");
        }

        // Validate FAQPage schema
        if (schemaType.toLowerCase().includes('faqpage')) {
          if (!s.mainEntity || !Array.isArray(s.mainEntity)) {
            schemaErrors.push("FAQPage: Missing required field 'mainEntity' (array)");
          } else {
            s.mainEntity.forEach((faq: any, i: number) => {
              if (!faq['@type'] || faq['@type'] !== 'Question') {
                schemaErrors.push(`FAQPage: Item ${i} must have @type 'Question'`);
              }
              if (!faq.name) schemaErrors.push(`FAQPage: Question ${i} missing 'name'`);
              if (!faq.acceptedAnswer || !faq.acceptedAnswer.text) {
                schemaErrors.push(`FAQPage: Question ${i} missing 'acceptedAnswer.text'`);
              }
            });
          }
        }

        // Validate Product schema
        if (schemaType.toLowerCase().includes('product')) {
          if (!s.name) schemaErrors.push("Product: Missing required field 'name'");
          if (!s.offers) warnings.push("Product: Missing 'offers' (recommended for rich results)");
        }

        // Validate Review schema
        if (schemaType.toLowerCase().includes('review')) {
          if (!s.itemReviewed) schemaErrors.push("Review: Missing required field 'itemReviewed'");
          if (!s.reviewRating || !s.reviewRating.ratingValue) {
            schemaErrors.push("Review: Missing required field 'reviewRating.ratingValue'");
          }
        }

        // Validate BreadcrumbList schema
        if (schemaType.toLowerCase().includes('breadcrumb')) {
          if (!s.itemListElement || !Array.isArray(s.itemListElement)) {
            schemaErrors.push("BreadcrumbList: Missing required field 'itemListElement' (array)");
          }
        }

        schemas.push({
          type: schemaType,
          valid: schemaErrors.length === 0,
          errors: schemaErrors
        });

        errors.push(...schemaErrors);
      });
    } catch (e: any) {
      errors.push(`Schema ${index + 1}: JSON parse error - ${e.message}`);
      schemas.push({
        type: 'Invalid',
        valid: false,
        errors: [`JSON parse error: ${e.message}`]
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    schemas
  };
}

