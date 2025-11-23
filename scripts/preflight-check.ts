/**
 * Pre-Flight Check: Verify All Fixes Before Re-Running
 */

import "dotenv/config";
import { readFileSync } from "fs";

console.log('🔍 PRE-FLIGHT CHECK: Verifying All Fixes');
console.log('============================================================\n');

const checks: Array<{ name: string; status: '✅' | '❌' | '⚠️'; details: string }> = [];

// Check 1: Ranked Keywords API fix
try {
  const serviceFile = readFileSync('server/services/dataforseoService.ts', 'utf-8');
  if (serviceFile.includes('// Remove location_name - this API doesn\'t accept it')) {
    checks.push({ name: 'Ranked Keywords API Fix', status: '✅', details: 'location_name removed from API call' });
  } else if (serviceFile.includes('location_name: params.location') && serviceFile.includes('ranked_keywords')) {
    checks.push({ name: 'Ranked Keywords API Fix', status: '❌', details: 'Still using location_name (will cause errors)' });
  } else {
    checks.push({ name: 'Ranked Keywords API Fix', status: '✅', details: 'location_name not found in ranked keywords request' });
  }
} catch (e) {
  checks.push({ name: 'Ranked Keywords API Fix', status: '❌', details: 'Could not check file' });
}

// Check 2: Analytics/Schemas storage fix
try {
  const collectFile = readFileSync('scripts/collect-spine-data.ts', 'utf-8');
  if (collectFile.includes('analytics: business.analytics || null') && 
      collectFile.includes('schemas: business.schemas || null')) {
    checks.push({ name: 'Analytics/Schemas Storage', status: '✅', details: 'Analytics and schemas are stored in rawData.enriched' });
  } else {
    checks.push({ name: 'Analytics/Schemas Storage', status: '❌', details: 'Analytics/schemas not being stored' });
  }
} catch (e) {
  checks.push({ name: 'Analytics/Schemas Storage', status: '❌', details: 'Could not check file' });
}

// Check 3: HTML Content storage
try {
  const collectFile = readFileSync('scripts/collect-spine-data.ts', 'utf-8');
  if (collectFile.includes('htmlContent: business.htmlContent || null')) {
    checks.push({ name: 'HTML Content Storage', status: '✅', details: 'HTML content is stored' });
  } else {
    checks.push({ name: 'HTML Content Storage', status: '❌', details: 'HTML content not being stored' });
  }
} catch (e) {
  checks.push({ name: 'HTML Content Storage', status: '❌', details: 'Could not check file' });
}

// Check 4: OnPage results storage
try {
  const collectFile = readFileSync('scripts/collect-spine-data.ts', 'utf-8');
  if (collectFile.includes('onPageResults: business.onPageResults || null')) {
    checks.push({ name: 'OnPage Results Storage', status: '✅', details: 'OnPage results are stored' });
  } else {
    checks.push({ name: 'OnPage Results Storage', status: '❌', details: 'OnPage results not being stored' });
  }
} catch (e) {
  checks.push({ name: 'OnPage Results Storage', status: '❌', details: 'Could not check file' });
}

// Check 5: HTML fetch error handling
try {
  const collectFile = readFileSync('scripts/collect-spine-data.ts', 'utf-8');
  if (collectFile.includes('HTML fetch blocked (403)') && 
      collectFile.includes('validateStatus: (status) => status < 500')) {
    checks.push({ name: 'HTML Fetch Error Handling', status: '✅', details: '403 errors handled gracefully' });
  } else {
    checks.push({ name: 'HTML Fetch Error Handling', status: '❌', details: '403 errors not handled properly' });
  }
} catch (e) {
  checks.push({ name: 'HTML Fetch Error Handling', status: '❌', details: 'Could not check file' });
}

// Check 6: OnPage wait time
try {
  const collectFile = readFileSync('scripts/collect-spine-data.ts', 'utf-8');
  if (collectFile.includes('await delay(10000)') && collectFile.includes('On-Page task to complete')) {
    checks.push({ name: 'OnPage Wait Time', status: '✅', details: 'Wait time increased to 10s' });
  } else if (collectFile.includes('await delay(5000)') && collectFile.includes('On-Page')) {
    checks.push({ name: 'OnPage Wait Time', status: '⚠️', details: 'Still using 5s wait (may cause 404s)' });
  } else {
    checks.push({ name: 'OnPage Wait Time', status: '❌', details: 'Could not verify wait time' });
  }
} catch (e) {
  checks.push({ name: 'OnPage Wait Time', status: '❌', details: 'Could not check file' });
}

// Check 7: Analytics/Schemas detection
try {
  const collectFile = readFileSync('scripts/collect-spine-data.ts', 'utf-8');
  if (collectFile.includes('enriched.analytics = detectAnalyticsInHTML') && 
      collectFile.includes('enriched.schemas = detectSchemasInHTML')) {
    checks.push({ name: 'Analytics/Schemas Detection', status: '✅', details: 'Detection functions are called' });
  } else {
    checks.push({ name: 'Analytics/Schemas Detection', status: '❌', details: 'Detection functions not being called' });
  }
} catch (e) {
  checks.push({ name: 'Analytics/Schemas Detection', status: '❌', details: 'Could not check file' });
}

// Check 8: Routes database-only mode
try {
  const routesFile = readFileSync('server/routes/serp-intelligence.ts', 'utf-8');
  const hasDatabaseOnly = routesFile.includes('DATABASE-ONLY MODE') || routesFile.includes('Database-Only Mode');
  
  if (hasDatabaseOnly && routesFile.includes('isFromDatabase: true')) {
    checks.push({ name: 'Routes Database-Only', status: '✅', details: 'Routes are in database-only mode' });
  } else {
    checks.push({ name: 'Routes Database-Only', status: '❌', details: 'Routes may still have API calls' });
  }
} catch (e) {
  checks.push({ name: 'Routes Database-Only', status: '❌', details: 'Could not check file' });
}

// Print results
console.log('CHECK RESULTS:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
  console.log(`   ${check.details}\n`);
});

const allPassed = checks.every(c => c.status === '✅');
const criticalFailed = checks.some(c => c.status === '❌' && (c.name.includes('API') || c.name.includes('Storage') || c.name.includes('Detection')));

console.log('============================================================');
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED - Safe to re-run collection');
} else if (criticalFailed) {
  console.log('❌ CRITICAL ISSUES FOUND - Fix before re-running');
} else {
  console.log('⚠️  SOME ISSUES FOUND - Review before re-running');
}
console.log('============================================================');
