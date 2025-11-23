import { Request, Response } from 'express';
import { dataForSEOService, databaseService } from '../services/dataforseoService';
import { verifyToken } from './auth';
import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Check if a city is in Missouri by looking it up in the CSV
 */
function isMissouriCity(city: string): boolean {
  try {
    if (!city) return false;
    
    const csvPath = path.join(process.cwd(), 'missouri_locations_transformed.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    const normalizedCity = city.toLowerCase().trim();
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = line.split(',').map(field => field.replace(/"/g, '').trim());
      if (fields.length < 4) continue;
      
      const csvCity = fields[1].toLowerCase();
      const state = fields[2].toLowerCase();
      
      // Check if this is a Missouri city
      if ((state === 'missouri' || state === 'mo') && csvCity === normalizedCity) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking Missouri city:', error);
    return false;
  }
}

/**
 * Ensure a valid BusinessProfile exists and return its ID.
 * Accepts either a real BusinessProfile.id or a SERP identifier (serpResultId/placeId/cid),
 * creates a BusinessProfile from stored SerpResult.rawData when needed.
 */
async function ensureBusinessProfileIdFromAny(inputId?: string, serpResultIdParam?: string): Promise<string | null> {
  const candidate = inputId || serpResultIdParam;
  if (!candidate) return null;

  // 1) Already a BusinessProfile ID?
  const existingProfileById = await prisma.businessProfile.findUnique({ where: { id: candidate } });
  if (existingProfileById) return existingProfileById.id;

  // 2) BusinessProfile linked to serpResultId/placeId/cid?
  const existingProfileByRefs = await prisma.businessProfile.findFirst({
    where: {
      OR: [
        { serpResultId: candidate },
        { placeId: candidate } as any,
        { cid: candidate } as any,
      ],
    },
  });
  if (existingProfileByRefs) return existingProfileByRefs.id;

  // 3) Find a SerpResult by id/placeId/cid
  const serpResult = await prisma.serpResult.findFirst({
    where: {
      OR: [
        { id: candidate },
        { placeId: candidate },
        { cid: candidate },
      ],
    },
  });
  if (!serpResult) return null;

  // 4) Create BusinessProfile from SerpResult (prefer rawData fields)
  const raw: any = serpResult.rawData || {};
  const created = await prisma.businessProfile.create({
    data: {
      serpResultId: serpResult.id,
      placeId: serpResult.placeId || raw.place_id || null,
      cid: serpResult.cid || raw.cid || null,
      name: raw.title || serpResult.title || 'Unknown Business',
      domain: raw.domain || serpResult.domain || null,
      websiteUrl: raw.url || serpResult.url || null,
      category: raw.category || null,
      address: raw.address || serpResult.address || null,
      city: raw.address_info?.city || serpResult.city || null,
      state: raw.address_info?.region || serpResult.state || null,
      zipCode: raw.address_info?.postal_code || serpResult.zipCode || null,
      phone: raw.phone || serpResult.phone || null,
      rating: (raw.rating && raw.rating.value) ? raw.rating.value : (serpResult.rating as any),
      reviewsCount: (raw.rating && raw.rating.votes_count) ? raw.rating.votes_count : (serpResult.reviewsCount as any),
      services: Array.isArray(raw.additional_categories) ? raw.additional_categories : [],
      specialties: Array.isArray(raw.category_ids) ? raw.category_ids : [],
      insuranceAccepted: [],
      languages: [],
      isActive: true,
    },
  });
  return created.id;
}

/**
 * Search for prospects using Google Maps/Local Pack
 */
export const searchProspects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { 
      keyword, 
      location, 
      locationType, 
      locationValue, 
      device = 'desktop',
      radius = 10,
      mapView = 'standard',
      selectedZipCodes = [],
      selectedCounties = []
    } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required'
      });
    }

    // DATABASE-ONLY MODE: Query existing data from database
    console.log('🔍 Database-Only Mode: Querying database for cached data...');
    console.log(`   Searching for: keyword="${keyword}", location="${location}"`);
    
    // Normalize location for flexible matching
    const normalizedLocation = location?.trim() || '';
    const locationVariations = [
      normalizedLocation, // Exact match
      normalizedLocation + ', MO', // Add state if missing
      normalizedLocation + ', Missouri', // Full state name
      normalizedLocation.replace(/,?\s*MO$/, '') + ', MO', // Normalize to ", MO"
      normalizedLocation.replace(/,?\s*Missouri$/, '') + ', MO' // Normalize to ", MO"
    ].filter((loc, index, self) => self.indexOf(loc) === index); // Remove duplicates
    
    console.log(`   Trying location variations:`, locationVariations);
    
    // First, find the job ID without loading large JSON data to avoid MySQL sort memory issues
    // Try exact match first, then try variations
    let jobInfo = await prisma.serpJob.findFirst({
      where: {
        keyword: keyword,
        location: { in: locationVariations },
        status: 'completed'
      },
      select: {
        id: true,
        keyword: true,
        location: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!jobInfo) {
      console.log('⚠️  No data found in database for:', keyword, location);
      console.log('   Tried variations:', locationVariations);
      return res.json({
        success: false,
        message: `No data found in database for "${keyword}" in "${location}". Please run data collection script first.`,
        data: {
          jobId: null,
          businesses: [],
          isFromDatabase: false
        }
      });
    }
    
    console.log(`✅ Found job: ID=${jobInfo.id}, keyword="${jobInfo.keyword}", location="${jobInfo.location}"`);

    // Now fetch results WITHOUT rawData to avoid MySQL sort memory issues
    // rawData is a large JSON field that causes "Out of sort memory" when sorting
    const serpResults = await prisma.serpResult.findMany({
      where: {
        serpJobId: jobInfo.id
      },
      select: {
        id: true,
        rankGroup: true,
        rankAbsolute: true,
        resultType: true,
        title: true,
        url: true,
        domain: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        rating: true,
        reviewsCount: true,
        ratingMax: true,
        placeId: true,
        cid: true,
        // DO NOT include rawData here - fetch separately
        businessProfile: {
          select: {
            id: true,
            name: true,
            domain: true,
            websiteUrl: true,
            isPaid: true,
            seoScore: true,
            domainAuthority: true,
            backlinks: true,
            monthlyTraffic: true,
            pageSpeed: true,
            mobileScore: true,
            keywordRankings: {
              select: {
                keyword: true,
                rankAbsolute: true,
                url: true
              },
              orderBy: { rankAbsolute: 'asc' },
              take: 10
            }
          }
        }
      },
      orderBy: { rankAbsolute: 'asc' },
      take: 100
    });

    // Fetch rawData separately for each result (without sorting)
    const resultIds = serpResults.map(r => r.id);
    const rawDataMap = new Map<string, any>();
    if (resultIds.length > 0) {
      const rawDataResults = await prisma.serpResult.findMany({
        where: {
          id: { in: resultIds }
        },
        select: {
          id: true,
          rawData: true
        }
        // No orderBy here - just fetch rawData by IDs
      });
      rawDataResults.forEach(r => {
        rawDataMap.set(r.id, r.rawData);
      });
    }

    if (!serpResults || serpResults.length === 0) {
      console.log('⚠️  No data found in database for:', keyword, location);
      return res.json({
        success: false,
        message: `No data found in database for "${keyword}" in "${location}". Please run data collection script first.`,
        data: {
          jobId: null,
          businesses: [],
          isFromDatabase: false
        }
      });
    }

    console.log(`✅ Found ${serpResults.length} businesses in database`);

    // Map database results to expected format
    const businesses = serpResults.map((result: any) => {
      const rawData = rawDataMap.get(result.id) || {}; // Get rawData from map
      const profile = result.businessProfile || {};
      
      return {
        id: profile.id || result.placeId || result.cid || result.id, // Use businessProfileId as primary ID
        businessProfileId: profile.id || result.id, // Always include businessProfileId
        placeId: result.placeId || rawData.place_id, // Keep placeId separate
        title: result.title || profile.name || rawData.title,
        name: profile.name || result.title || rawData.title,
        domain: result.domain || profile.domain || rawData.domain,
        website: result.url || profile.websiteUrl || rawData.url || rawData.website,
        url: result.url || profile.websiteUrl || rawData.url,
        phone: result.phone || profile.phone || rawData.phone,
        address: result.address || profile.address || rawData.address,
        city: result.city || profile.city || rawData.address_info?.city,
        state: result.state || profile.state || rawData.address_info?.region,
        zipCode: result.zipCode || profile.zipCode || rawData.address_info?.postal_code,
        rating: result.rating || profile.rating || rawData.rating?.value,
        reviewsCount: result.reviewsCount || profile.reviewsCount || rawData.rating?.votes_count,
        cid: result.cid || rawData.cid,
        category: result.resultType || profile.category || rawData.category,
        rankAbsolute: result.rankAbsolute,
        rankGroup: result.rankGroup,
        type: result.resultType || 'maps',
        // Include enriched data from business profile
        keywordRankings: profile.keywordRankings || [],
        domainAuthority: profile.domainAuthority,
        backlinks: profile.backlinks,
        monthlyTraffic: profile.monthlyTraffic,
        isPaid: profile.isPaid || false,
        isVerified: profile.isVerified || false,
        // GPS coordinates - extract from multiple possible locations
        lat: (() => {
          const val = rawData.lat || rawData.latitude || 
                     rawData.gps_coordinates?.lat || rawData.gps_coordinates?.latitude ||
                     rawData.address_info?.lat || rawData.address_info?.latitude;
          return val != null ? (typeof val === 'number' ? val : parseFloat(String(val))) : null;
        })(),
        lng: (() => {
          const val = rawData.lng || rawData.longitude ||
                     rawData.gps_coordinates?.lng || rawData.gps_coordinates?.longitude ||
                     rawData.address_info?.lng || rawData.address_info?.longitude;
          return val != null ? (typeof val === 'number' ? val : parseFloat(String(val))) : null;
        })(),
        // Also include as latitude/longitude for compatibility
        latitude: (() => {
          const val = rawData.lat || rawData.latitude || 
                     rawData.gps_coordinates?.lat || rawData.gps_coordinates?.latitude ||
                     rawData.address_info?.lat || rawData.address_info?.latitude;
          return val != null ? (typeof val === 'number' ? val : parseFloat(String(val))) : null;
        })(),
        longitude: (() => {
          const val = rawData.lng || rawData.longitude ||
                     rawData.gps_coordinates?.lng || rawData.gps_coordinates?.longitude ||
                     rawData.address_info?.lng || rawData.address_info?.longitude;
          return val != null ? (typeof val === 'number' ? val : parseFloat(String(val))) : null;
        })(),
        gps_coordinates: rawData.gps_coordinates,
        address_info: rawData.address_info || {
          city: result.city || profile.city,
          region: result.state || profile.state,
          postal_code: result.zipCode || profile.zipCode,
          country_code: 'US'
        },
        // NEW: Google Places Reviews
        googlePlaces: (rawData.enriched?.googlePlaces) || null
      };
    });

        return res.json({
          success: true,
          data: {
            jobId: jobInfo.id,
            businesses: businesses,
            jobDetails: {
              ...jobInfo,
              serpResults: serpResults.length
            },
            isFromDatabase: true,
            message: `Returned ${businesses.length} businesses from database (no API calls)`
          }
        });

    /* OLD API-BASED CODE - DISABLED FOR DATABASE-ONLY MODE
    // Create SERP job with Missouri-specific parameters
    const job = await databaseService.createSerpJob(userId, {
      keyword,
      location,
      locationType,
      locationValue,
      searchType: 'maps',
      device,
      radius,
      mapView,
      selectedZipCodes,
      selectedCounties
    });
    const jobId = job.id;

    // Update job status to processing
    await databaseService.updateSerpJobStatus(jobId, 'processing');

    try {
      console.log('Starting Missouri-specific DataForSEO API calls...');
      
      // Use standard Maps API with Missouri location codes
      console.log('Using standard Maps API with Missouri location codes...');
      
      const mapsData = await dataForSEOService.searchMaps({
        keyword,
        location,
        device
      });
      console.log('Maps API response status:', mapsData.status_code);

      const localPackData = await dataForSEOService.searchLocalPack({
        keyword,
        location,
        device
      });
      console.log('Local Pack API response status:', localPackData.status_code);

      // Combine results from Maps and Local Pack APIs
      const mapsResults = mapsData?.tasks?.[0]?.result?.[0]?.items || [];
      const localPackResults = localPackData?.tasks?.[0]?.result?.[0]?.items || [];
      const allResults = [...mapsResults, ...localPackResults];
      console.log(`Standard API results: ${allResults.length} items`);
      
      // Normalize the result types
      allResults.forEach(result => {
        if (result.type === 'maps_search') {
          result.type = 'maps';
        } else if (result.type === 'local_pack_search') {
          result.type = 'local_pack';
        }
      });
      console.log('Combined results:', allResults.length);

      // Filter results to Missouri locations only
      const missouriResults = allResults.filter(result => {
        const address = result.address || '';
        const addressInfo = result.address_info || {};
        const city = addressInfo.city || '';
        const state = addressInfo.region || '';
        const country = addressInfo.country_code || '';
        
        // More strict Missouri filtering
        const isMissouri = (
          // State must be Missouri or MO
          (state.toLowerCase() === 'missouri' || state.toLowerCase() === 'mo') ||
          // Address must contain Missouri indicators
          address.toLowerCase().includes('missouri') || 
          address.toLowerCase().includes(', mo') ||
          address.toLowerCase().includes(', missouri') ||
          // City must be in Missouri (check if it's a known Missouri city)
          isMissouriCity(city)
        );
        
        if (!isMissouri) {
          console.log(`Filtering out non-Missouri result: ${result.title} - ${city}, ${state} - ${address}`);
        }
        
        return isMissouri;
      });
      
      console.log(`Missouri-filtered results: ${missouriResults.length} items (filtered from ${allResults.length})`);
      
      // Use Missouri-filtered results
      const finalResults = missouriResults;

      // Store results in database
      console.log('Storing SERP results...');
      console.log('Sample result structure:', JSON.stringify(finalResults[0], null, 2));
      const serpResultIds = await databaseService.storeSerpResults(jobId, finalResults);
      console.log('Created SERP result IDs:', serpResultIds);

      // Initialize business profile IDs array
      const businessProfileIds = [];
      
      // Always set business profile IDs for all results using the actual database IDs
      console.log(`Setting business profile IDs for ${finalResults.length} results`);
      for (let i = 0; i < finalResults.length; i++) {
        const result = finalResults[i];
          
          console.log(`Processing result ${i}:`, {
            type: result.type,
            title: result.title,
          id: result.id
          });
          
        // Use the actual database record ID as the business profile ID
        const businessProfileId = serpResultIds[i];
        result.businessProfileId = businessProfileId;
              businessProfileIds[i] = businessProfileId;
        
        console.log(`Set businessProfileId for result ${i}:`, businessProfileId);
      }

      // Update job status to completed
      await databaseService.updateSerpJobStatus(jobId, 'completed', {
        resultsCount: finalResults.length,
        cost: 0.002 * 2 // Cost for both API calls
      });

      // Get the complete job with results
      const jobWithResults = await databaseService.getSerpJobWithResults(jobId);

      // Lightweight ad data enrichment (non-blocking)
      // Fetch advertisers for this keyword+location to identify which businesses are running ads
      let advertisersData: any = null;
      try {
        // Use locationCode for St. Louis/Chesterfield (Missouri) to avoid location_name validation issues
        const locationCode = (location.includes('St. Louis') || location.includes('Chesterfield') || location.includes('Missouri')) ? 2840 : undefined;
        advertisersData = await dataForSEOService.getAdsAdvertisers({
          keyword,
          locationCode: locationCode, // Use location code when available (preferred)
          locationName: locationCode ? undefined : location // Only use locationName if no locationCode
        });
        const advertiserCount = advertisersData?.tasks?.[0]?.result?.[0]?.items?.length || 0;
        console.log(`[Ad Enrichment] ✅ Advertisers data fetched: ${advertiserCount} advertisers found for keyword "${keyword}" in ${location}`);
        if (advertisersData?.tasks?.[0]) {
          console.log(`[Ad Enrichment] API Response structure:`, JSON.stringify({
            status: advertisersData.tasks[0].status_code,
            statusMessage: advertisersData.tasks[0].status_message,
            itemsCount: advertiserCount,
            hasResult: !!advertisersData.tasks[0].result?.[0]
          }));
        }
        if (advertiserCount > 0) {
          const sampleDomains = advertisersData.tasks[0].result[0].items
            .filter((item: any) => item.domain)
            .slice(0, 3)
            .map((item: any) => item.domain);
          console.log(`[Ad Enrichment] Sample advertiser domains: ${sampleDomains.join(', ')}`);
        }
      } catch (error) {
        console.log('[Ad Enrichment] ❌ Could not fetch advertisers data (non-critical):', error);
        // Continue without ad data - don't block the search results
      }

      // Add business profile IDs and enrich with ad data
      const resultsWithProfileIds = finalResults.map((result, index) => {
        const enrichedResult: any = {
        ...result,
          businessProfileId: businessProfileIds[index] || null,
          // Ensure the businessProfileId is the database ID, not the Google Place ID
          id: result.id, // Keep the original Google Place ID as 'id'
          databaseId: businessProfileIds[index] || null // Add the database ID as 'databaseId'
        };

        // Lightweight ad enrichment: check if this business domain matches any advertiser
        if (advertisersData) {
          // Try multiple possible fields for domain/website
          const businessDomain = result.domain || result.website || result.url || result.website_url || 
                                 result.raw_data?.domain || result.raw_data?.website || result.raw_data?.url;
          
          if (businessDomain) {
            // Extract domain from URL if needed
            let normalizedDomain = businessDomain.toLowerCase();
            // Remove protocol, www, paths, and query strings
            normalizedDomain = normalizedDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0];
            
            console.log(`[Ad Enrichment] Checking domain: ${normalizedDomain} for business: ${result.title || result.name || 'Unknown'}`);
            
            const advertiserId = dataForSEOService.findAdvertiserIdForDomain(advertisersData, normalizedDomain);
            enrichedResult.isRunningAds = !!advertiserId;
            
            if (advertiserId) {
              console.log(`[Ad Enrichment] ✅ Found advertiser ID ${advertiserId} for domain: ${normalizedDomain}`);
              enrichedResult.advertiserId = advertiserId;
              // Extract approximate ads count from advertiser data
              const items = advertisersData?.tasks?.[0]?.result?.[0]?.items || [];
              const advertiserItem = items.find((item: any) => item.advertiser_id === advertiserId);
              if (advertiserItem) {
                enrichedResult.approxAdsCount = advertiserItem.approx_ads_count || 0;
                enrichedResult.advertiserVerified = advertiserItem.verified || false;
              }
            } else {
              // Log available advertiser domains for debugging (only for first few items to avoid spam)
              if (index < 3) {
                const items = advertisersData?.tasks?.[0]?.result?.[0]?.items || [];
                const advertiserDomains = items
                  .filter((item: any) => item.type === 'ads_advertiser' || item.type === 'ads_multi_account_advertiser')
                  .map((item: any) => {
                    const dom = item.domain || 'N/A';
                    return dom.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                  })
                  .slice(0, 5); // First 5 for debugging
                console.log(`[Ad Enrichment] ❌ No match for "${normalizedDomain}". Sample advertiser domains from API: ${advertiserDomains.join(', ')}`);
              }
            }
          } else {
            // Only log for first few to avoid spam
            if (index < 3) {
              console.log(`[Ad Enrichment] No domain available for: ${result.title || result.name || 'Unknown'}. Fields checked: domain=${!!result.domain}, website=${!!result.website}, url=${!!result.url}`);
            }
          }
        } else {
          if (index === 0) {
            console.log('[Ad Enrichment] ⚠️ No advertisers data available - this may indicate the DataForSEO API call failed or returned no advertisers');
          }
        }

        return enrichedResult;
      });

      console.log('Final results with businessProfileIds:');
      console.log('businessProfileIds array length:', businessProfileIds.length);
      console.log('businessProfileIds array:', businessProfileIds);
      console.log('finalResults length:', finalResults.length);
      console.log('First result businessProfileId:', resultsWithProfileIds[0]?.businessProfileId);
      console.log('First result databaseId:', resultsWithProfileIds[0]?.databaseId);
      console.log('First result id:', resultsWithProfileIds[0]?.id);
      console.log('First result from finalResults:', finalResults[0]?.businessProfileId);

      res.json({
        success: true,
        data: {
          jobId,
          businesses: resultsWithProfileIds,
          jobDetails: jobWithResults
        }
      });

    } catch (apiError) {
      // Update job status to failed
      await databaseService.updateSerpJobStatus(jobId, 'failed', {
        errorMessage: apiError.message
      });

      throw apiError;
    }
    */

  } catch (error) {
    console.error('Search prospects error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to search prospects',
      error: error.message
    });
  }
};

/**
 * Analyze website for intelligence
 */
export const analyzeWebsite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { url, location, device = 'desktop' } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Create SERP job for website analysis
    const job = await databaseService.createSerpJob(userId, {
      keyword: url,
      location,
      searchType: 'organic',
      device
    });
    const jobId = job.id;

    // Update job status to processing
    await databaseService.updateSerpJobStatus(jobId, 'processing');

    try {
      // Analyze website using Organic API with site: operator
      const organicData = await databaseService.analyzeWebsite({
        url,
        location,
        device
      });

      // Create comprehensive analysis result
      const analysisResult = {
        url,
        organicResults: organicData.tasks?.[0]?.result?.[0] || {},
        analyzedAt: new Date().toISOString()
      };

      // Update job status to completed
      await databaseService.updateSerpJobStatus(jobId, 'completed', {
        resultsCount: 1,
        cost: 0.002 // Cost for one API call
      });

      res.json({
        success: true,
        data: analysisResult
      });

    } catch (apiError) {
      // Update job status to failed
      await databaseService.updateSerpJobStatus(jobId, 'failed', {
        errorMessage: apiError.message
      });

      throw apiError;
    }

  } catch (error) {
    console.error('Analyze website error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze website',
      error: error.message
    });
  }
};

/**
 * Add item to watchlist
 */
export const addToWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      serpJobId,
      serpResultId,
      businessProfileId,
      itemType,
      name,
      domain,
      category,
      location,
      score,
      rating,
      status = 'active',
      priority = 'medium',
      tags = [],
      highlights = [],
      notes
    } = req.body;

    if (!itemType || !name) {
      return res.status(400).json({
        success: false,
        message: 'Item type and name are required'
      });
    }

    // Ensure BusinessProfile foreign key is valid (resolve from any id)
    const resolvedBusinessProfileId = await ensureBusinessProfileIdFromAny(businessProfileId, serpResultId);

    const watchlistItem = await databaseService.addToWatchlist(userId, {
      serpJobId: serpJobId || null,
      serpResultId: serpResultId || null,
      businessProfileId: resolvedBusinessProfileId || undefined,
      itemType,
      name,
      domain,
      category,
      location,
      score,
      rating,
      status,
      priority,
      tags,
      highlights,
      notes
    });

    res.json({
      success: true,
      data: {
        watchlistItemId: (watchlistItem as any).id,
        message: `${name} added to watchlist as ${itemType}`
      }
    });

  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to watchlist',
      error: error.message
    });
  }
};

/**
 * Get user's watchlist items
 */
export const getWatchlistItems = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { itemType, status, priority, category } = req.query;

    const filters: any = {};
    if (itemType) filters.itemType = itemType as string;
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;
    if (category) filters.category = category as string;

    const items = await databaseService.getWatchlistItems(userId, filters);

    res.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Get watchlist items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get watchlist items',
      error: error.message
    });
  }
};

/**
 * Update watchlist item
 */
export const updateWatchlistItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    await databaseService.updateWatchlistItem(itemId, updates);

    res.json({
      success: true,
      message: 'Watchlist item updated successfully'
    });

  } catch (error) {
    console.error('Update watchlist item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update watchlist item',
      error: error.message
    });
  }
};

/**
 * Remove item from watchlist
 */
export const removeFromWatchlist = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    await databaseService.removeFromWatchlist(itemId);

    res.json({
      success: true,
      message: 'Item removed from watchlist'
    });

  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from watchlist',
      error: error.message
    });
  }
};

/**
 * Get SERP job results
 */
export const getSerpJobResults = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const jobWithResults = await databaseService.getSerpJobWithResults(jobId);

    if (!jobWithResults) {
      return res.status(404).json({
        success: false,
        message: 'SERP job not found'
      });
    }

    res.json({
      success: true,
      data: jobWithResults
    });

  } catch (error) {
    console.error('Get SERP job results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SERP job results',
      error: error.message
    });
  }
};

/**
 * Track keyword rankings (SERP Intelligence)
 */
export const trackKeywordRankings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { keyword, location, device = 'desktop' } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required'
      });
    }

    // Create SERP job for keyword tracking
    const job = await databaseService.createSerpJob(userId, {
      keyword,
      location,
      searchType: 'organic',
      device
    });
    const jobId = job.id;

    // Update job status to processing
    await databaseService.updateSerpJobStatus(jobId, 'processing');

    try {
      // Track keyword rankings using Organic API
      const rankingData = await databaseService.trackKeywordRankings({
        keyword,
        location,
        device
      });

      // Create comprehensive tracking result
      const trackingResult = {
        keyword,
        rankings: rankingData.tasks?.[0]?.result?.[0] || {},
        trackedAt: new Date().toISOString()
      };

      // Update job status to completed
      await databaseService.updateSerpJobStatus(jobId, 'completed', {
        resultsCount: 1,
        cost: 0.002 // Cost for one API call
      });

      res.json({
        success: true,
        data: trackingResult
      });

    } catch (apiError: any) {
      console.error('DataForSEO API error:', apiError);
      
      // Update job status to failed
      await databaseService.updateSerpJobStatus(jobId, 'failed', {
        errorMessage: apiError.message
      });

      throw apiError;
    }

  } catch (error) {
    console.error('Track keyword rankings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track keyword rankings',
      error: error.message
    });
  }
};

/**
 * Get business profile details with FULL comprehensive scoring
 */
export const getBusinessProfile = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;

    console.log('🔍 Database-Only Mode: Getting business profile for ID:', profileId);
    
    // DATABASE-ONLY MODE: Only query database, no API calls
    const existingBusiness = await prisma.businessProfile.findUnique({
      where: { id: profileId },
      include: { 
        serpResult: true,
        keywordRankings: {
          orderBy: { rankAbsolute: 'asc' },
          take: 100
        }
      }
    });
    if (existingBusiness) {
      let sr: any = existingBusiness.serpResult || null;
      let raw: any = sr?.rawData || {};
      let enriched = raw?.enriched || {};
      
      // If the linked serpResult doesn't have enriched data, search for one that does
      // Search by business name AND domain to find the correct serpResult
      if (!enriched || Object.keys(enriched).length === 0) {
        console.log('⚠️ Linked serpResult has no enriched data, searching for one with enriched data...');
        
        // Build search criteria - use name and/or domain
        const searchCriteria: any[] = [];
        if (existingBusiness.name) {
          searchCriteria.push({ title: { contains: existingBusiness.name } });
        }
        if (existingBusiness.domain) {
          searchCriteria.push({ domain: existingBusiness.domain });
        }
        if (existingBusiness.websiteUrl) {
          const domainFromUrl = existingBusiness.websiteUrl.replace(/^https?:\/\//, '').split('/')[0];
          if (domainFromUrl && domainFromUrl !== existingBusiness.domain) {
            searchCriteria.push({ domain: domainFromUrl });
          }
        }
        
        // Find serpResults matching the business and check for enriched data in code
        const candidateSerpResults = await prisma.serpResult.findMany({
          where: {
            OR: searchCriteria.length > 0 ? searchCriteria : [{ title: { contains: existingBusiness.name || '' } }]
          },
          orderBy: { rankAbsolute: 'asc' },
          take: 20,
          select: {
            id: true,
            rawData: true,
            rankAbsolute: true,
            title: true,
            domain: true
          }
        });
        
        // Find the first one with enriched data
        for (const candidate of candidateSerpResults) {
          const candidateRaw: any = candidate.rawData || {};
          const candidateEnriched = candidateRaw.enriched || {};
          if (candidateEnriched && Object.keys(candidateEnriched).length > 0) {
            sr = candidate;
            raw = candidateRaw;
            enriched = candidateEnriched;
            console.log(`✅ Found serpResult with enriched data: ${sr.id} (${Object.keys(candidateEnriched).length} enriched keys)`);
            break;
          }
        }
      }
      
      const profile = {
        id: existingBusiness.id,
        name: existingBusiness.name || raw.title || sr?.title || 'Unknown Business',
        domain: existingBusiness.domain || raw.domain || sr?.domain || '',
        websiteUrl: existingBusiness.websiteUrl || raw.url || sr?.url || '',
        category: existingBusiness.category || raw.category || 'Business',
        subcategory: (Array.isArray(raw.additional_categories) && raw.additional_categories[0]) || '',
        location: [existingBusiness.city || raw.address_info?.city || sr?.city || '', existingBusiness.state || raw.address_info?.region || sr?.state || ''].filter(Boolean).join(', '),
        address: existingBusiness.address || raw.address || sr?.address || '',
        city: existingBusiness.city || raw.address_info?.city || sr?.city || '',
        state: existingBusiness.state || raw.address_info?.region || sr?.state || '',
        zipCode: existingBusiness.zipCode || raw.address_info?.postal_code || sr?.zipCode || '',
        phone: existingBusiness.phone || raw.phone || sr?.phone || '',
        email: existingBusiness.email || '',
        rating: typeof existingBusiness.rating === 'number' ? existingBusiness.rating : (raw.rating?.value || sr?.rating || 0),
        reviewsCount: typeof existingBusiness.reviewsCount === 'number' ? existingBusiness.reviewsCount : (raw.rating?.votes_count || sr?.reviewsCount || 0),
        services: Array.isArray(existingBusiness.services) ? existingBusiness.services : (raw.additional_categories || []),
        specialties: Array.isArray(existingBusiness.specialties) ? existingBusiness.specialties : (raw.category_ids || []),
        insuranceAccepted: existingBusiness.insuranceAccepted || [],
        socialMedia: existingBusiness.socialMedia || { facebook: '', instagram: '' },
        businessHours: existingBusiness.businessHours || raw.work_hours || {},
        lastAnalyzed: existingBusiness.lastAnalyzed?.toISOString() || new Date().toISOString(),
        isActive: existingBusiness.isActive,
        latitude: raw.latitude || raw.gps_coordinates?.latitude || raw.address_info?.latitude,
        longitude: raw.longitude || raw.gps_coordinates?.longitude || raw.address_info?.longitude,
        isClaimed: raw.is_claimed,
        totalPhotos: raw.total_photos,
        mainImage: raw.main_image,
        ratingDistribution: raw.rating_distribution,
        // Include enriched data from database
        keywordRankings: existingBusiness.keywordRankings || [],
        domainAuthority: existingBusiness.domainAuthority,
        backlinks: existingBusiness.backlinks,
        monthlyTraffic: existingBusiness.monthlyTraffic,
        pageSpeed: existingBusiness.pageSpeed,
        mobileScore: existingBusiness.mobileScore,
        accessibilityScore: existingBusiness.accessibilityScore,
        isPaid: existingBusiness.isPaid,
        isVerified: existingBusiness.isVerified,
        isFromDatabase: true,
        // NEW: Google Places Reviews
        googlePlaces: (() => {
          const enriched = (sr?.rawData as any)?.enriched || {};
          return enriched.googlePlaces || null;
        })()
      };
      return res.json({ 
        success: true,
        data: profile,
        message: 'Data retrieved from database (no API calls)'
      });
    }

    // First, try to find the business in our stored SERP results
    // IMPORTANT: Try BusinessProfile first (most specific), then SerpResult
    let serpResult = null;
    
    // First check if profileId is a BusinessProfile ID
    const businessProfileById = await prisma.businessProfile.findUnique({
      where: { id: profileId },
      include: { serpResult: true }
    });
    
    if (businessProfileById && businessProfileById.serpResult) {
      serpResult = businessProfileById.serpResult;
    } else {
      // If not found, try SerpResult lookup
      serpResult = await prisma.serpResult.findFirst({
        where: {
          OR: [
            { id: profileId }, // Database record ID
            { placeId: profileId },
            { cid: profileId }
          ]
        }
      });
    }

    console.log('Database lookup result:', serpResult ? 'Found' : 'Not found');
    if (serpResult) {
      console.log('Found business:', serpResult.title, 'with rawData:', !!serpResult.rawData);
    }

    if (serpResult && serpResult.rawData) {
      // Ensure there is a BusinessProfile linked to this SerpResult
      let linkedProfile = await prisma.businessProfile.findFirst({ where: { serpResultId: serpResult.id } });
      if (!linkedProfile) {
        const raw: any = serpResult.rawData || {};
        linkedProfile = await prisma.businessProfile.create({
        data: {
            serpResultId: serpResult.id,
            placeId: serpResult.placeId || raw.place_id || null,
            cid: serpResult.cid || raw.cid || null,
            name: raw.title || serpResult.title || 'Unknown Business',
            domain: raw.domain || serpResult.domain || null,
            websiteUrl: raw.url || serpResult.url || null,
            category: raw.category || null,
            address: raw.address || serpResult.address || null,
            city: raw.address_info?.city || serpResult.city || null,
            state: raw.address_info?.region || serpResult.state || null,
            zipCode: raw.address_info?.postal_code || serpResult.zipCode || null,
            phone: raw.phone || serpResult.phone || null,
            rating: (raw.rating && raw.rating.value) ? raw.rating.value : (serpResult.rating as any),
            reviewsCount: (raw.rating && raw.rating.votes_count) ? raw.rating.votes_count : (serpResult.reviewsCount as any),
            services: Array.isArray(raw.additional_categories) ? raw.additional_categories : [],
            specialties: Array.isArray(raw.category_ids) ? raw.category_ids : [],
            insuranceAccepted: [],
            languages: [],
            isActive: true,
        }
      });
    }

      const rawData = serpResult.rawData as any;
      const profile = {
        id: linkedProfile.id,
        name: linkedProfile.name || rawData.title || serpResult.title || 'Unknown Business',
        domain: linkedProfile.domain || rawData.domain || serpResult.domain || '',
        websiteUrl: linkedProfile.websiteUrl || rawData.url || serpResult.url || '',
        category: linkedProfile.category || rawData.category || 'Business',
        subcategory: rawData.additional_categories?.[0] || '',
        location: `${linkedProfile.city || rawData.address_info?.city || serpResult.city || ''}, ${linkedProfile.state || rawData.address_info?.region || serpResult.state || ''}`,
        address: linkedProfile.address || rawData.address || serpResult.address || '',
        city: linkedProfile.city || rawData.address_info?.city || serpResult.city || '',
        state: linkedProfile.state || rawData.address_info?.region || serpResult.state || '',
        zipCode: linkedProfile.zipCode || rawData.address_info?.zip || serpResult.zipCode || '',
        phone: linkedProfile.phone || rawData.phone || serpResult.phone || '',
        email: '',
        rating: typeof linkedProfile.rating === 'number' ? linkedProfile.rating : (rawData.rating?.value || serpResult.rating || 0),
        reviewsCount: typeof linkedProfile.reviewsCount === 'number' ? linkedProfile.reviewsCount : (rawData.rating?.votes_count || serpResult.reviewsCount || 0),
        services: Array.isArray(linkedProfile.services) ? linkedProfile.services : (rawData.additional_categories || []),
        specialties: Array.isArray(linkedProfile.specialties) ? linkedProfile.specialties : (rawData.category_ids || []),
        insuranceAccepted: linkedProfile.insuranceAccepted || [],
        socialMedia: linkedProfile.socialMedia || { facebook: '', instagram: '' },
        businessHours: linkedProfile.businessHours || rawData.work_hours || {},
        lastAnalyzed: new Date().toISOString(),
        isActive: true,
        latitude: rawData.latitude,
        longitude: rawData.longitude,
        isClaimed: rawData.is_claimed,
        totalPhotos: rawData.total_photos,
        mainImage: rawData.main_image,
        ratingDistribution: rawData.rating_distribution
      };

      console.log('Created/loaded profile from stored SerpResult:', profile.name);
      return res.json({ success: true, data: profile });
    }

    // Fallback: Create a basic profile if no stored data found
    const profile = {
            id: profileId,
      name: `Business ${profileId.slice(-8)}`,
      domain: '',
      websiteUrl: '',
      category: 'Business',
      subcategory: '',
      location: 'St. Louis, MO',
      address: '',
      city: 'St. Louis',
      state: 'MO',
      zipCode: '',
      phone: '',
            email: '',
      rating: 0,
      reviewsCount: 0,
            services: [],
            specialties: [],
            insuranceAccepted: [],
      socialMedia: {
        facebook: '',
        instagram: ''
      },
            businessHours: {},
            lastAnalyzed: new Date().toISOString(),
            isActive: true
    };

    console.log('Created fallback business profile:', profile.name);
    
    return res.json({
        success: true,
      data: profile
      });

  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get business profile',
      error: error.message
    });
  }
};

/**
 * Enrich business profile with Google My Business Info
 */
export const enrichBusinessProfile = async (req: Request, res: Response) => {
  try {
    const { businessName, location, placeId, cid } = req.body;

    if (!businessName || !location) {
      return res.status(400).json({
        success: false,
        message: 'Business name and location are required'
      });
    }

    const enrichedData = await dataForSEOService.enrichBusinessProfile({
      businessName,
      location,
      placeId,
      cid
    });

    res.json({
      success: true,
      data: enrichedData
    });
  } catch (error) {
    console.error('Error enriching business profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get business Questions & Answers for sales triggers
 */
export const getBusinessQAndA = async (req: Request, res: Response) => {
  try {
    const { businessName, location, placeId } = req.body;

    if (!businessName || !location) {
      return res.status(400).json({
        success: false,
        message: 'Business name and location are required'
      });
    }

    const qaData = await dataForSEOService.getBusinessQAndA({
      businessName,
      location,
      placeId
    });

    res.json({
      success: true,
      data: qaData
    });
  } catch (error) {
    console.error('Error getting business Q&A:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get business updates/posts for activity tracking
 */
export const getBusinessUpdates = async (req: Request, res: Response) => {
  try {
    const { businessName, location, placeId } = req.body;

    if (!businessName || !location) {
      return res.status(400).json({
        success: false,
        message: 'Business name and location are required'
      });
    }

    const updatesData = await dataForSEOService.getBusinessUpdates({
      businessName,
      location,
      placeId
    });

    res.json({
      success: true,
      data: updatesData
    });
  } catch (error) {
    console.error('Error getting business updates:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get categories aggregation for market analysis
 */
export const getCategoriesAggregation = async (req: Request, res: Response) => {
  try {
    const { location, locationType, locationValue } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const categoriesData = await dataForSEOService.getCategoriesAggregation({
      location,
      locationType,
      locationValue
    });

    res.json({
      success: true,
      data: categoriesData
    });
  } catch (error) {
    console.error('Error getting categories aggregation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get domain analysis for prospect scoring
 */
export const getDomainAnalysis = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const [domainAnalysis, domainTraffic, domainKeywords] = await Promise.all([
      dataForSEOService.getDomainAnalysis({ domain }),
      dataForSEOService.getDomainTraffic({ domain }),
      dataForSEOService.getDomainKeywords({ domain, limit: 50 })
    ]);

    res.json({
      success: true,
      data: {
        domainAnalysis,
        domainTraffic,
        domainKeywords
      }
    });
  } catch (error) {
    console.error('Error getting domain analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get backlink analysis for authority scoring
 */
export const getBacklinkAnalysis = async (req: Request, res: Response) => {
  try {
    const { domain, limit = 100 } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const [backlinks, referringDomains] = await Promise.all([
      dataForSEOService.getBacklinkAnalysis({ domain, limit }),
      dataForSEOService.getReferringDomains({ domain, limit })
    ]);

    res.json({
      success: true,
      data: {
        backlinks,
        referringDomains
      }
    });
  } catch (error) {
    console.error('Error getting backlink analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get comprehensive business score with all metrics
 */
export const getComprehensiveBusinessScore = async (req: Request, res: Response) => {
  try {
    const { businessName, domain, location, keywords, profileId } = req.body;

    // DATABASE-ONLY MODE: Get score from database
    console.log('[getComprehensiveBusinessScore] 🔍 Database-Only Mode: Getting score from database...');
    
    let businessProfile = null;
    
    if (profileId) {
      businessProfile = await prisma.businessProfile.findUnique({
        where: { id: profileId },
        include: { serpResult: true, keywordRankings: true }
      });
    } else if (domain) {
      businessProfile = await prisma.businessProfile.findFirst({
        where: { domain: domain.replace(/^https?:\/\//, '').replace(/^www\./, '') },
        include: { serpResult: true, keywordRankings: true }
      });
    }
    
    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found in database'
      });
    }
    
    // Calculate comprehensive score from stored data
    const comprehensiveScore = {
      overallScore: businessProfile.seoScore || 0,
      domainAuthority: businessProfile.domainAuthority || 0,
      backlinks: businessProfile.backlinks || 0,
      monthlyTraffic: businessProfile.monthlyTraffic || 0,
      pageSpeed: businessProfile.pageSpeed || 0,
      mobileScore: businessProfile.mobileScore || 0,
      accessibilityScore: businessProfile.accessibilityScore || 0,
      keywordRankings: businessProfile.keywordRankings?.length || 0,
      isPaid: businessProfile.isPaid || false,
      isVerified: businessProfile.isVerified || false,
      isFromDatabase: true,
      message: 'Score calculated from database (no API calls)'
    };

    res.json({
      success: true,
      data: comprehensiveScore
    });
  } catch (error: any) {
    console.error('Error getting comprehensive business score:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get business reviews for reputation analysis
 */
export const getBusinessReviews = async (req: Request, res: Response) => {
  try {
    const { businessName, location, maxReviews = 1000 } = req.body;

    if (!businessName || !location) {
      return res.status(400).json({
        success: false,
        message: 'Business name and location are required'
      });
    }

    const reviewsData = await dataForSEOService.getBusinessReviews({
      businessName,
      location,
      maxReviews
    });

    res.json({
      success: true,
      data: reviewsData
    });
  } catch (error: any) {
    console.error('Error getting business reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get ranked keywords for SEO analysis
 */
export const getRankedKeywords = async (req: Request, res: Response) => {
  try {
    const { domain, location = 'United States', limit = 1000 } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const keywordsData = await dataForSEOService.getRankedKeywords({
      domain,
      location,
      limit
    });

    res.json({
      success: true,
      data: keywordsData
    });
  } catch (error: any) {
    console.error('Error getting ranked keywords:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get bulk traffic estimation for multiple domains
 */
export const getBulkTrafficEstimation = async (req: Request, res: Response) => {
  try {
    const { domains, location = 'United States' } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Domains array is required'
      });
    }

    const trafficData = await dataForSEOService.getBulkTrafficEstimation({
      domains,
      location
    });

    res.json({
      success: true,
      data: trafficData
    });
  } catch (error: any) {
    console.error('Error getting bulk traffic estimation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get ads for a specific business profile
 * Uses domain or advertiser_id to fetch all ads for that business
 */
export const getBusinessAds = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const { location } = req.query;

    console.log('Getting ads for business profile:', profileId);

    // Get business profile to extract domain - use same lookup logic as getBusinessProfile
    // 0) Try BusinessProfile by primary key first
    let businessProfile = await prisma.businessProfile.findUnique({
      where: { id: profileId },
      include: { 
        serpResult: {
          select: {
            id: true,
            rawData: true,
            rankAbsolute: true
          }
        }
      }
    });

    // 1) If not found, try to find via SerpResult (same logic as getBusinessProfile)
    if (!businessProfile) {
      const serpResult = await prisma.serpResult.findFirst({
        where: {
          OR: [
            { id: profileId },
            { placeId: profileId },
            { cid: profileId }
          ]
        }
      });

      if (serpResult) {
        // Ensure there is a BusinessProfile linked to this SerpResult
        businessProfile = await prisma.businessProfile.findFirst({ 
          where: { serpResultId: serpResult.id },
          include: { serpResult: true }
        });
        
        // If no linked profile exists, create one (same as getBusinessProfile)
        if (!businessProfile && serpResult.rawData) {
          const raw: any = serpResult.rawData || {};
          businessProfile = await prisma.businessProfile.create({
            data: {
              serpResultId: serpResult.id,
              placeId: serpResult.placeId || raw.place_id || null,
              cid: serpResult.cid || raw.cid || null,
              name: raw.title || serpResult.title || 'Unknown Business',
              domain: raw.domain || serpResult.domain || null,
              websiteUrl: raw.url || serpResult.url || null,
              category: raw.category || null,
              address: raw.address || serpResult.address || null,
              city: raw.address_info?.city || serpResult.city || null,
              state: raw.address_info?.region || serpResult.state || null,
              zipCode: raw.address_info?.postal_code || serpResult.zipCode || null,
              phone: raw.phone || serpResult.phone || null,
              rating: (raw.rating && raw.rating.value) ? raw.rating.value : (serpResult.rating as any),
              reviewsCount: (raw.rating && raw.rating.votes_count) ? raw.rating.votes_count : (serpResult.reviewsCount as any),
              services: Array.isArray(raw.additional_categories) ? raw.additional_categories : [],
              specialties: Array.isArray(raw.category_ids) ? raw.category_ids : [],
              insuranceAccepted: [],
              languages: [],
              isActive: true,
            },
            include: { serpResult: true }
          });
        }
      }
    }

    if (!businessProfile) {
      console.log('[getBusinessAds] ❌ Business profile not found after all lookup attempts');
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const domain = businessProfile.domain || businessProfile.websiteUrl;
    const businessName = businessProfile.name;
    const locationStr = (location as string) || (businessProfile.city && businessProfile.state ? `${businessProfile.city}, ${businessProfile.state}` : 'Missouri');

    console.log(`[getBusinessAds] Domain: ${domain}, Business: ${businessName}, Location: ${locationStr}`);

    if (!domain) {
      console.log('[getBusinessAds] ⚠️ No domain available for business');
      return res.status(400).json({
        success: false,
        message: 'Business domain not available',
        data: {
          ads: [],
          advertiserInfo: null,
          isRunningAds: false
        }
      });
    }

    // DATABASE-ONLY MODE: Read ads data from database
    const startTime = Date.now();
    console.log('[getBusinessAds] 🔍 Database-Only Mode: Reading ads from database...');
    
    try {
      // Get ads data from serpResult.rawData
      // Query serpResult directly by serpResultId to get complete rawData
      const serpResultId = businessProfile.serpResultId;
      if (!serpResultId) {
        console.log('[getBusinessAds] ❌ No serpResultId on business profile');
        return res.json({
          success: true,
          data: {
            ads: [],
            advertiserId: null,
            domain,
            businessName,
            totalAds: 0,
            isRunningAds: false,
            isFromDatabase: true,
            message: 'No serpResult linked to business profile'
          }
        });
      }
      
      // Fetch serpResult with rawData - CRITICAL: Must fetch rawData to access enriched
      let serpResult = await prisma.serpResult.findUnique({
        where: { id: serpResultId },
        select: {
          id: true,
          rawData: true,
          title: true,
          domain: true,
        }
      });
      
      if (!serpResult || !serpResult.rawData) {
        console.log('[getBusinessAds] ❌ SerpResult not found or has no rawData');
        return res.json({
          success: true,
          data: {
            ads: [],
            advertiserId: null,
            domain,
            businessName,
            totalAds: 0,
            isRunningAds: false,
            isFromDatabase: true,
            message: 'SerpResult not found or has no data'
          }
        });
      }
      
      // CRITICAL: Access data directly - Prisma returns JSON as objects
      const rawData: any = serpResult.rawData;
      const enriched: any = rawData?.enriched || {};
      
      console.log(`[getBusinessAds] ✅ Loaded serpResult ${serpResultId}`);
      console.log(`[getBusinessAds] rawData type: ${typeof rawData}, has enriched: ${!!rawData?.enriched}`);
      console.log(`[getBusinessAds] enriched type: ${typeof enriched}`);
      console.log(`[getBusinessAds] enriched keys: ${Object.keys(enriched).join(', ')}`);
      console.log(`[getBusinessAds] enriched.adsCreatives type: ${typeof enriched?.adsCreatives}, isArray: ${Array.isArray(enriched?.adsCreatives)}, length: ${enriched?.adsCreatives?.length || 0}`);
      
      // DIRECT CHECK: Get creatives from enriched.adsCreatives
      let creatives: any[] = [];
      let advertiserId: string | null = null;
      let totalAds = 0;
      
      // Check enriched.adsCreatives FIRST (this is where the data is stored)
      if (enriched?.adsCreatives && Array.isArray(enriched.adsCreatives) && enriched.adsCreatives.length > 0) {
        creatives = enriched.adsCreatives;
        console.log(`[getBusinessAds] ✅ Found ${creatives.length} creatives in enriched.adsCreatives`);
      } else {
        console.log(`[getBusinessAds] ⚠️ No creatives in enriched.adsCreatives, searching for alternative serpResult...`);
        
        // Only search if we don't have creatives
        const hasMatchedAds = rawData?.ads && rawData.ads.matched;
        
        if (!hasMatchedAds) {
          console.log('[getBusinessAds] ⚠️ Linked serpResult has no ads data, searching for one with enriched ads data...');
          
          // Build search criteria - use name and/or domain
          const searchCriteria: any[] = [];
          if (businessProfile.name) {
            searchCriteria.push({ title: { contains: businessProfile.name } });
          }
          if (businessProfile.domain) {
            searchCriteria.push({ domain: businessProfile.domain });
          }
          if (businessProfile.websiteUrl) {
            const domainFromUrl = businessProfile.websiteUrl.replace(/^https?:\/\//, '').split('/')[0];
            if (domainFromUrl && domainFromUrl !== businessProfile.domain) {
              searchCriteria.push({ domain: domainFromUrl });
            }
          }
          
          // Find serpResults matching the business and check for enriched ads data
          const candidateSerpResults = await prisma.serpResult.findMany({
            where: {
              OR: searchCriteria.length > 0 ? searchCriteria : [{ title: { contains: businessProfile.name || '' } }]
            },
            orderBy: { rankAbsolute: 'asc' },
            take: 20,
            select: {
              id: true,
              rawData: true,
              rankAbsolute: true,
              title: true,
              domain: true
            }
          });
          
          // Find the first one with enriched ads data
          for (const candidate of candidateSerpResults) {
            const candidateRaw: any = candidate.rawData || {};
            const candidateEnriched = candidateRaw.enriched || {};
            const candidateAds = candidateRaw.ads || {};
            
            // Check if this candidate has ads data
            if ((candidateEnriched.adsCreatives && Array.isArray(candidateEnriched.adsCreatives) && candidateEnriched.adsCreatives.length > 0) ||
                (candidateAds.matched || candidateAds.creatives?.length > 0)) {
              // Update ALL references to point to the candidate
              serpResult = candidate as any;
              // Re-assign rawData and enriched to use the candidate's data
              const updatedRawData: any = candidateRaw;
              const updatedEnriched = candidateEnriched;
              
              // Update our references - CRITICAL: reassign the variables
              if (updatedEnriched.adsCreatives && Array.isArray(updatedEnriched.adsCreatives) && updatedEnriched.adsCreatives.length > 0) {
                // Update the outer scope variables
                rawData = updatedRawData;
                enriched = updatedEnriched;
                creatives = updatedEnriched.adsCreatives;
                console.log(`[getBusinessAds] ✅ Found serpResult with ads data: ${serpResult.id} (${creatives.length} creatives)`);
                break;
              }
            }
          }
        }
      }
      
      // Get ads metadata
      const adsData = rawData?.ads || null;
      if (adsData && adsData.matched) {
        advertiserId = adsData.advertiserId || null;
        totalAds = adsData.approxAdsCount || 0;
      }
      
      // Final check: if we still don't have creatives, try other paths
      if (creatives.length === 0) {
        console.log(`[getBusinessAds] ⚠️ Still no creatives, trying fallback paths...`);
        
        // Try rawData.enriched.adsCreatives (in case enriched reference was lost)
        if (rawData?.enriched?.adsCreatives && Array.isArray(rawData.enriched.adsCreatives) && rawData.enriched.adsCreatives.length > 0) {
          creatives = rawData.enriched.adsCreatives;
          console.log(`[getBusinessAds] ✅ Found ${creatives.length} creatives via rawData.enriched.adsCreatives (fallback)`);
        }
        // Try top-level rawData.adsCreatives
        else if (rawData?.adsCreatives && Array.isArray(rawData.adsCreatives) && rawData.adsCreatives.length > 0) {
          creatives = rawData.adsCreatives;
          console.log(`[getBusinessAds] ✅ Found ${creatives.length} creatives via rawData.adsCreatives (top-level fallback)`);
        }
        // Try adsData.creatives
        else if (adsData?.creatives && Array.isArray(adsData.creatives) && adsData.creatives.length > 0) {
          creatives = adsData.creatives;
          console.log(`[getBusinessAds] ✅ Found ${creatives.length} creatives via adsData.creatives (fallback)`);
        } else {
          console.log(`[getBusinessAds] ❌ No creatives found in any location`);
          console.log(`[getBusinessAds] Final check - enriched.adsCreatives: ${enriched?.adsCreatives?.length || 'undefined/null'}`);
          console.log(`[getBusinessAds] Final check - rawData.enriched.adsCreatives: ${rawData?.enriched?.adsCreatives?.length || 'undefined/null'}`);
        }
      }
      
      // Transform creatives to match frontend format if needed
      const transformedAds = creatives.map((ad: any) => {
        // Extract previewImage - handle both string and object formats
        let previewImage = '';
        if (ad.previewImage) {
          if (typeof ad.previewImage === 'string') {
            previewImage = ad.previewImage;
          } else if (ad.previewImage.url) {
            previewImage = ad.previewImage.url;
          }
        } else if (ad.preview_image) {
          if (typeof ad.preview_image === 'string') {
            previewImage = ad.preview_image;
          } else if (ad.preview_image.url) {
            previewImage = ad.preview_image.url;
          }
        }
        
        // Extract platform from URL or use default
        let platform = ad.platform || 'google_search';
        if (ad.url && !platform) {
          if (ad.url.includes('adstransparency.google.com')) {
            platform = 'google_search';
          } else if (ad.url.includes('youtube')) {
            platform = 'youtube';
          } else if (ad.url.includes('maps')) {
            platform = 'google_maps';
          }
        }
        
        return {
          title: ad.title || 'Ad Title',
          description: ad.description || '',
          url: ad.url || '',
          previewImage: previewImage,
          platform: platform,
          format: ad.format || 'text',
          lastShown: ad.lastShown || ad.last_shown || null,
          verified: ad.verified || false,
          creativeId: ad.creativeId || ad.creative_id || null,
          advertiserId: ad.advertiserId || ad.advertiser_id || null
        };
      });
      
      // Get paid ETV if available
      const paidETV = enriched.paidETV || rawData.paidETV || null;
      
      const isRunningAds = businessProfile.isPaid || (adsData?.matched || false) || (transformedAds.length > 0);
      
      const responseData = {
        success: true,
        data: {
          ads: transformedAds, // Ad creatives transformed to frontend format
          advertiserId,
          domain,
          businessName,
          totalAds: totalAds || transformedAds.length || 0, // Use approxAdsCount or transformed creatives count
          paidETV: paidETV || null, // Paid traffic ETV
          isRunningAds,
          hasAdvertiserInfo: !!(adsData && adsData.matched),
          creativesAvailable: creatives.length > 0,
          creativesCount: creatives.length,
          isFromDatabase: true,
          message: isRunningAds 
            ? `Ads data retrieved from database. Business is running ads (${totalAds} ads estimated, ${transformedAds.length} creatives found)${paidETV ? `, Paid ETV: ${paidETV}` : ''}.`
            : 'Ads data retrieved from database (no API calls). Business is not running ads.'
        }
      };
      
      const duration = Date.now() - startTime;
      console.log(`[getBusinessAds] ✅ Returning ads data from database in ${duration}ms. isPaid: ${businessProfile.isPaid}, advertiserId: ${advertiserId}, creatives: ${transformedAds.length}`);
      res.json(responseData);
    } catch (error: any) {
      console.error('[getBusinessAds] Error reading ads from database:', error);
      // Return empty ads rather than failing completely
      res.json({
        success: true,
        data: {
          ads: [],
          advertiserId: null,
          domain,
          businessName,
          totalAds: 0,
          isRunningAds: businessProfile.isPaid || false,
          isFromDatabase: true,
          error: error.message
        }
      });
    }
  } catch (error) {
    console.error('Error getting business ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get business ads',
      error: error.message
    });
  }
};

/**
 * Extract ad creatives from ads_search response
 */
function extractAdCreativesFromResponse(adsData: any): any[] {
  try {
    if (!adsData?.tasks?.[0]?.result?.[0]?.items) {
      return [];
    }

    const items = adsData.tasks[0].result[0].items;
    return items
      .filter((item: any) => item.type === 'ads_search')
      .map((item: any) => ({
        creativeId: item.creative_id,
        advertiserId: item.advertiser_id,
        title: item.title,
        description: item.description,
        url: item.url,
        format: item.format,
        previewImage: item.preview_image,
        firstShown: item.first_shown,
        lastShown: item.last_shown,
        rankGroup: item.rank_group,
        rankAbsolute: item.rank_absolute,
        platform: item.platform,
        verified: item.verified
      }));
  } catch (error) {
    console.error('Error extracting ad creatives:', error);
    return [];
  }
}

/**
 * Get comprehensive SEO & PPC analysis for a business profile
 */
export const getBusinessSEOAndPPC = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const { location } = req.query;

    console.log('[getBusinessSEOAndPPC] Getting SEO & PPC analysis for business profile:', profileId);

    // Get business profile - use same lookup logic as getBusinessAds
    // Optimize: Only fetch what we need for fast response
    let businessProfile = await prisma.businessProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        name: true,
        domain: true,
        websiteUrl: true,
        city: true,
        state: true,
        isPaid: true,
        pageSpeed: true,
        mobileScore: true,
        domainAuthority: true,
        backlinks: true,
        monthlyTraffic: true,
        accessibilityScore: true,
        seoScore: true,
        keywordRankings: {
          select: {
            keyword: true,
            rankAbsolute: true,
            url: true
          },
          orderBy: { rankAbsolute: 'asc' },
          take: 10
        },
        serpResult: {
          select: {
            id: true,
            rawData: true,
            rankAbsolute: true
          }
        }
      }
    });

    if (!businessProfile) {
      const serpResult = await prisma.serpResult.findFirst({
        where: {
          OR: [
            { id: profileId },
            { placeId: profileId },
            { cid: profileId }
          ]
        }
      });

      if (serpResult) {
        businessProfile = await prisma.businessProfile.findFirst({ 
          where: { serpResultId: serpResult.id },
          select: {
            id: true,
            name: true,
            domain: true,
            websiteUrl: true,
            city: true,
            state: true,
            isPaid: true,
            pageSpeed: true,
            mobileScore: true,
            domainAuthority: true,
            backlinks: true,
            monthlyTraffic: true,
            accessibilityScore: true,
            seoScore: true,
            keywordRankings: {
              select: {
                keyword: true,
                rankAbsolute: true,
                url: true
              },
              orderBy: { rankAbsolute: 'asc' },
              take: 10
            },
            serpResult: {
              select: {
                id: true,
                rawData: true,
                rankAbsolute: true
              }
            }
          }
        });
        
        if (!businessProfile && serpResult.rawData) {
          const raw: any = serpResult.rawData || {};
          businessProfile = await prisma.businessProfile.create({
            data: {
              serpResultId: serpResult.id,
              placeId: serpResult.placeId || raw.place_id || null,
              cid: serpResult.cid || raw.cid || null,
              name: raw.title || serpResult.title || 'Unknown Business',
              domain: raw.domain || serpResult.domain || null,
              websiteUrl: raw.url || serpResult.url || null,
              category: raw.category || null,
              address: raw.address || serpResult.address || null,
              city: raw.address_info?.city || serpResult.city || null,
              state: raw.address_info?.region || serpResult.state || null,
              zipCode: raw.address_info?.postal_code || serpResult.zipCode || null,
              phone: raw.phone || serpResult.phone || null,
              rating: (raw.rating && raw.rating.value) ? raw.rating.value : (serpResult.rating as any),
              reviewsCount: (raw.rating && raw.rating.votes_count) ? raw.rating.votes_count : (serpResult.reviewsCount as any),
              services: Array.isArray(raw.additional_categories) ? raw.additional_categories : [],
              specialties: Array.isArray(raw.category_ids) ? raw.category_ids : [],
              insuranceAccepted: [],
              languages: [],
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              domain: true,
              websiteUrl: true,
              city: true,
              state: true,
              isPaid: true,
              pageSpeed: true,
              mobileScore: true,
              domainAuthority: true,
              backlinks: true,
              monthlyTraffic: true,
              accessibilityScore: true,
              seoScore: true,
              keywordRankings: {
                select: {
                  keyword: true,
                  rankAbsolute: true,
                  url: true
                },
                orderBy: { rankAbsolute: 'asc' },
                take: 10
              },
              serpResult: {
                select: {
                  id: true,
                  rawData: true,
                  rankAbsolute: true
                }
              }
            }
          });
        }
      }
    }

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const domain = businessProfile.domain || businessProfile.websiteUrl;
    const businessName = businessProfile.name;
    const locationStr = (location as string) || (businessProfile.city && businessProfile.state 
      ? `${businessProfile.city}, ${businessProfile.state}` 
      : 'Missouri');

    console.log(`[getBusinessSEOAndPPC] Domain: ${domain}, Business: ${businessName}, Location: ${locationStr}`);

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Business domain not available',
        data: {
          serpPosition: null,
          schemas: { localBusiness: false, faq: false },
          analytics: { googleAnalytics: { found: false }, facebookPixel: { found: false } },
          ppcStatus: { runningAds: false, adCount: 0 },
          speedScores: { desktop: 0, mobile: 0 },
          localCompetitors: null,
          opportunityScore: 0
        }
      });
    }

    // DATABASE-ONLY MODE: Calculate SEO & PPC analysis from stored data
    const startTime = Date.now();
    console.log('[getBusinessSEOAndPPC] 🔍 Database-Only Mode: Calculating from stored data...');
    
    // Get stored data from database - DIRECT ACCESS
    let serpResult = businessProfile.serpResult;
    const directRawData: any = serpResult?.rawData || {};
    let directEnriched: any = directRawData?.enriched || {};
    
    console.log(`[getBusinessSEOAndPPC] directEnriched keys: ${Object.keys(directEnriched).join(', ')}`);
    console.log(`[getBusinessSEOAndPPC] directEnriched.analytics: ${!!directEnriched?.analytics}`);
    console.log(`[getBusinessSEOAndPPC] directEnriched.schemas: ${!!directEnriched?.schemas}`);
    console.log(`[getBusinessSEOAndPPC] directEnriched.onPageResults: ${!!directEnriched?.onPageResults}`);
    
    // Use direct references
    let rawData: any = directRawData;
    let enriched: any = directEnriched;
    
    // If the linked serpResult doesn't have enriched data, search for one that does
    // Search by business name AND domain to find the correct serpResult
    if (!directEnriched || Object.keys(directEnriched).length === 0) {
      console.log('[getBusinessSEOAndPPC] ⚠️ Linked serpResult has no enriched data, searching for one with enriched data...');
      
      // Build search criteria - use name and/or domain
      const searchCriteria: any[] = [];
      if (businessProfile.name) {
        searchCriteria.push({ title: { contains: businessProfile.name } });
      }
      if (businessProfile.domain) {
        searchCriteria.push({ domain: businessProfile.domain });
      }
      if (businessProfile.websiteUrl) {
        const domainFromUrl = businessProfile.websiteUrl.replace(/^https?:\/\//, '').split('/')[0];
        if (domainFromUrl && domainFromUrl !== businessProfile.domain) {
          searchCriteria.push({ domain: domainFromUrl });
        }
      }
      
      // Find serpResults matching the business and check for enriched data in code
      const candidateSerpResults = await prisma.serpResult.findMany({
        where: {
          OR: searchCriteria.length > 0 ? searchCriteria : [{ title: { contains: businessProfile.name || '' } }]
        },
        orderBy: { rankAbsolute: 'asc' },
        take: 20,
        select: {
          id: true,
          rawData: true,
          rankAbsolute: true,
          title: true,
          domain: true
        }
      });
      
      // Find the first one with enriched data
      for (const candidate of candidateSerpResults) {
        const candidateRaw: any = candidate.rawData || {};
        const candidateEnriched = candidateRaw.enriched || {};
        if (candidateEnriched && Object.keys(candidateEnriched).length > 0) {
          serpResult = candidate;
          rawData = candidateRaw;
          enriched = candidateEnriched;
          // Also update directEnriched to point to the found enriched data
          directEnriched = candidateEnriched;
          console.log(`[getBusinessSEOAndPPC] ✅ Found serpResult with enriched data: ${candidate.id} (${Object.keys(candidateEnriched).length} enriched keys)`);
          console.log(`[getBusinessSEOAndPPC] ✅ Enriched keys: ${Object.keys(candidateEnriched).join(', ')}`);
          console.log(`[getBusinessSEOAndPPC] ✅ pageSpeedInsights: ${!!candidateEnriched.pageSpeedInsights}`);
          break;
        }
      }
    }
    
        try {
          // Extract analytics and schemas from stored enriched data
          // CRITICAL: Use directEnriched first, then fallback to enriched
          const storedAnalytics = directEnriched?.analytics || enriched?.analytics || {
            googleAnalytics: { found: false },
            facebookPixel: { found: false }
          };
          const storedSchemas = directEnriched?.schemas || enriched?.schemas || {
            localBusiness: false,
            faq: false,
            organization: false,
            breadcrumbs: false,
            product: false,
            review: false
          };
          
          console.log(`[getBusinessSEOAndPPC] storedAnalytics: ${JSON.stringify(storedAnalytics)}`);
          console.log(`[getBusinessSEOAndPPC] storedSchemas: ${JSON.stringify(storedSchemas)}`);
          
          // Extract onPage data - try multiple locations and structures
          // CRITICAL: Check directEnriched first, then enriched
          // onPage can be: task object, result array, or items array
          let onPageData: any = null;
          
          // Try: directEnriched.onPageResults first
          if (directEnriched?.onPageResults?.tasks?.[0]?.result?.[0]?.items?.[0]) {
            onPageData = directEnriched.onPageResults.tasks[0].result[0].items[0];
          }
          // Try: enriched.onPageResults.tasks[0].result[0].items[0] (full results)
          else if (enriched?.onPageResults?.tasks?.[0]?.result?.[0]?.items?.[0]) {
            onPageData = enriched.onPageResults.tasks[0].result[0].items[0];
          }
          // Try: directEnriched.onPage
          else if (directEnriched?.onPage?.result?.[0]?.items?.[0]) {
            onPageData = directEnriched.onPage.result[0].items[0];
          }
          // Try: enriched.onPage.result[0].items[0] (result structure)
          else if (enriched?.onPage?.result?.[0]?.items?.[0]) {
            onPageData = enriched.onPage.result[0].items[0];
          }
          // Try: enriched.onPage.result[0] (direct result)
          else if (enriched?.onPage?.result?.[0]) {
            onPageData = enriched.onPage.result[0];
          }
          // Try: enriched.onPage.tasks[0].result[0].items[0] (task structure)
          else if (enriched?.onPage?.tasks?.[0]?.result?.[0]?.items?.[0]) {
            onPageData = enriched.onPage.tasks[0].result[0].items[0];
          }
          // Try: enriched.onPage (direct object)
          else if (enriched?.onPage) {
            onPageData = enriched.onPage;
          }
          
          console.log(`[getBusinessSEOAndPPC] onPageData found: ${!!onPageData}`);
          
          // Extract speed scores - PRIORITY ORDER:
          // 1. businessProfile (already calculated and stored)
          // 2. PageSpeed Insights (from enriched.pageSpeedInsights)
          // 3. On-Page API data (from enriched.onPageResults)
          let desktopSpeed = businessProfile.pageSpeed;
          let mobileSpeed = businessProfile.mobileScore;
          let accessibilityScore = businessProfile.accessibilityScore;
          
          console.log(`[getBusinessSEOAndPPC] Initial speed scores from businessProfile: desktop=${desktopSpeed}, mobile=${mobileSpeed}, accessibility=${accessibilityScore}`);
          
          // Fallback to PageSpeed Insights if businessProfile doesn't have scores
          if (desktopSpeed == null) {
            if (directEnriched?.pageSpeedInsights?.performance != null) {
              desktopSpeed = directEnriched.pageSpeedInsights.performance;
              console.log(`[getBusinessSEOAndPPC] Using PageSpeed Insights performance: ${desktopSpeed}`);
            } else if (enriched?.pageSpeedInsights?.performance != null) {
              desktopSpeed = enriched.pageSpeedInsights.performance;
              console.log(`[getBusinessSEOAndPPC] Using PageSpeed Insights performance (fallback): ${desktopSpeed}`);
            }
          }
          
          if (mobileSpeed == null) {
            if (directEnriched?.pageSpeedInsights?.mobile != null) {
              mobileSpeed = directEnriched.pageSpeedInsights.mobile;
              console.log(`[getBusinessSEOAndPPC] Using PageSpeed Insights mobile: ${mobileSpeed}`);
            } else if (enriched?.pageSpeedInsights?.mobile != null) {
              mobileSpeed = enriched.pageSpeedInsights.mobile;
              console.log(`[getBusinessSEOAndPPC] Using PageSpeed Insights mobile (fallback): ${mobileSpeed}`);
            }
          }
          
          if (accessibilityScore == null) {
            if (directEnriched?.pageSpeedInsights?.accessibility != null) {
              accessibilityScore = directEnriched.pageSpeedInsights.accessibility;
              console.log(`[getBusinessSEOAndPPC] Using PageSpeed Insights accessibility: ${accessibilityScore}`);
            } else if (enriched?.pageSpeedInsights?.accessibility != null) {
              accessibilityScore = enriched.pageSpeedInsights.accessibility;
              console.log(`[getBusinessSEOAndPPC] Using PageSpeed Insights accessibility (fallback): ${accessibilityScore}`);
            }
          }
          
          // Last resort: Try On-Page API data if still null
          if (desktopSpeed == null && onPageData?.page_timing) {
            // Calculate speed score from page_timing (same logic as collection script)
            const timing = onPageData.page_timing;
            const lcp = timing.largest_contentful_paint || 0;
            const fid = timing.first_input_delay || 0;
            const cls = timing.cumulative_layout_shift || 0;
            const tti = timing.time_to_interactive || 0;
            
            // Calculate score based on Core Web Vitals thresholds
            let score = 100;
            // LCP: Good < 2.5s, Needs Improvement < 4s, Poor >= 4s
            if (lcp >= 4000) score -= 30;
            else if (lcp >= 2500) score -= 15;
            // FID: Good < 100ms, Needs Improvement < 300ms, Poor >= 300ms
            if (fid >= 300) score -= 20;
            else if (fid >= 100) score -= 10;
            // CLS: Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25
            if (cls >= 0.25) score -= 20;
            else if (cls >= 0.1) score -= 10;
            // TTI: Good < 3.8s, Needs Improvement < 7.3s, Poor >= 7.3s
            if (tti >= 7300) score -= 20;
            else if (tti >= 3800) score -= 10;
            desktopSpeed = Math.max(0, Math.min(100, score));
            console.log(`[getBusinessSEOAndPPC] Calculated desktop speed from On-Page data: ${desktopSpeed}`);
          }
          
          if (mobileSpeed == null && onPageData?.mobile_score != null) {
            mobileSpeed = onPageData.mobile_score;
            console.log(`[getBusinessSEOAndPPC] Using On-Page mobile_score: ${mobileSpeed}`);
          }
          
          console.log(`[getBusinessSEOAndPPC] Final speed scores: desktop=${desktopSpeed}, mobile=${mobileSpeed}, accessibility=${accessibilityScore}`);
          
          // Extract analytics with fallback to onPage technologies
          const hasGoogleAnalytics = storedAnalytics.googleAnalytics?.found || onPageData?.technologies?.some((tech: any) => 
            tech.name?.toLowerCase().includes('google analytics') || 
            tech.name?.toLowerCase().includes('ga4') ||
            tech.name?.toLowerCase().includes('gtag')
          ) || false;
          const gaId = storedAnalytics.googleAnalytics?.id || onPageData?.technologies?.find((tech: any) => 
            tech.name?.toLowerCase().includes('google analytics') || 
            tech.name?.toLowerCase().includes('ga4')
          )?.id || null;
          const gaType = storedAnalytics.googleAnalytics?.type || (gaId ? 'GA4' : null);
          const hasFacebookPixel = storedAnalytics.facebookPixel?.found || onPageData?.technologies?.some((tech: any) => 
            tech.name?.toLowerCase().includes('facebook pixel') || 
            tech.name?.toLowerCase().includes('fbpixel')
          ) || false;
          
          // Extract schemas with fallback to onPage schemas
          const finalSchemas = {
            localBusiness: storedSchemas.localBusiness || onPageData?.schemas?.some((s: any) => s['@type'] === 'LocalBusiness' || s['@type'] === 'Organization') || false,
            faq: storedSchemas.faq || onPageData?.schemas?.some((s: any) => s['@type'] === 'FAQPage') || false,
            organization: storedSchemas.organization || onPageData?.schemas?.some((s: any) => s['@type'] === 'Organization') || false,
            breadcrumbs: storedSchemas.breadcrumbs || onPageData?.schemas?.some((s: any) => s['@type'] === 'BreadcrumbList') || false,
            product: storedSchemas.product || onPageData?.schemas?.some((s: any) => s['@type'] === 'Product') || false,
            review: storedSchemas.review || onPageData?.schemas?.some((s: any) => s['@type'] === 'Review') || false
          };
          
          // Extract keyword rankings for serpResults
          const keywordRankings = businessProfile.keywordRankings || [];
          const serpResults = keywordRankings.length > 0 ? keywordRankings.map((kr: any) => ({
            keyword: kr.keyword || 'null',
            rank: kr.rankAbsolute,
            url: kr.url
          })) : null;
          
          // Calculate analysis from stored data
          const analysis = {
            serpPosition: serpResult?.rankAbsolute || null,
            serpResults: serpResults && serpResults.length > 0 ? serpResults : null,
            schemas: finalSchemas,
            analytics: {
              googleAnalytics: { 
                found: hasGoogleAnalytics,
                type: gaType || (gaId ? 'GA4' : null),
                id: gaId || null
              },
              facebookPixel: { 
                found: hasFacebookPixel,
                id: storedAnalytics.facebookPixel?.id || null
              }
            },
            ppcStatus: {
              runningAds: businessProfile.isPaid || (rawData.ads?.matched || false) || (enriched.adsCreatives?.length > 0) || false,
              advertiserId: rawData.ads?.advertiserId || enriched.ads?.advertiserId || null,
              adCount: rawData.ads?.approxAdsCount || enriched.ads?.approxAdsCount || enriched.adsCreativesCount || 0,
              paidETV: enriched.paidETV || rawData.paidETV || null,
              creativesCount: enriched.adsCreativesCount || (enriched.adsCreatives?.length || 0)
            },
            speedScores: {
              desktop: desktopSpeed ?? null,
              mobile: mobileSpeed ?? null
            },
        localCompetitors: null, // Would need to query other businesses
        domainAuthority: businessProfile.domainAuthority || null,
        backlinks: businessProfile.backlinks || null,
        monthlyTraffic: businessProfile.monthlyTraffic || null,
        accessibilityScore: businessProfile.accessibilityScore || null,
        seoScore: businessProfile.seoScore || null,
        // NEW: Safe Browsing and Schema Validation
        safeBrowsing: enriched.safeBrowsing || null,
        schemaValidation: enriched.schemaValidation || null,
        // Core Web Vitals from PageSpeed Insights
        coreWebVitals: (() => {
          // Use enriched (which is updated in the search loop if needed)
          const psi = enriched?.pageSpeedInsights;
          if (psi?.coreWebVitals) {
            return psi.coreWebVitals;
          }
          // Fallback: try to extract from rawData if available
          if (psi?.rawData?.desktop?.lighthouseResult?.audits) {
            const audits = psi.rawData.desktop.lighthouseResult.audits;
            return {
              lcp: audits['largest-contentful-paint']?.numericValue ? Math.round(audits['largest-contentful-paint'].numericValue) : null,
              fid: audits['max-potential-fid']?.numericValue ? Math.round(audits['max-potential-fid'].numericValue) : null,
              cls: audits['cumulative-layout-shift']?.numericValue ? audits['cumulative-layout-shift'].numericValue : null,
              fcp: audits['first-contentful-paint']?.numericValue ? Math.round(audits['first-contentful-paint'].numericValue) : null,
              tti: audits['interactive']?.numericValue ? Math.round(audits['interactive'].numericValue) : null,
            };
          }
          return null;
        })()
      };

      // Calculate Opportunity Score (0-100)
      let opportunityScore = 0;
      let maxPossible = 0;

      // SERP Position (30 points max)
      maxPossible += 30;
      if (analysis.serpPosition) {
        if (analysis.serpPosition <= 3) opportunityScore += 30;
        else if (analysis.serpPosition <= 10) opportunityScore += 20;
        else if (analysis.serpPosition <= 20) opportunityScore += 10;
        else opportunityScore += 5;
      }

      // Schema presence (20 points max)
      maxPossible += 20;
      if (analysis.schemas.localBusiness) opportunityScore += 10;
      if (analysis.schemas.faq) opportunityScore += 10;

      // Analytics presence (15 points max)
      maxPossible += 15;
      if (analysis.analytics.googleAnalytics.found) opportunityScore += 10;
      if (analysis.analytics.facebookPixel.found) opportunityScore += 5;

      // Speed scores (20 points max)
      maxPossible += 20;
      if (analysis.speedScores.desktop >= 90) opportunityScore += 10;
      else if (analysis.speedScores.desktop >= 70) opportunityScore += 5;
      if (analysis.speedScores.mobile >= 90) opportunityScore += 10;
      else if (analysis.speedScores.mobile >= 70) opportunityScore += 5;

      // PPC status (15 points max)
      maxPossible += 15;
      if (analysis.ppcStatus.runningAds) {
        opportunityScore += 15; // Running ads is good
      } else {
        // Not running ads = opportunity to start = potential score
        opportunityScore += 8; // Medium opportunity
      }

      // Safe Browsing (10 points max) - NEW
      maxPossible += 10;
      if (analysis.safeBrowsing?.isSafe) {
        opportunityScore += 10; // Safe = good
      } else if (analysis.safeBrowsing) {
        opportunityScore += 0; // Unsafe = critical issue
      }

      // Schema Validation (10 points max) - NEW
      maxPossible += 10;
      if (analysis.schemaValidation?.valid) {
        opportunityScore += 10; // Valid schemas = good
      } else if (analysis.schemaValidation && analysis.schemaValidation.errors.length > 0) {
        // Invalid schemas = opportunity to fix
        const errorCount = analysis.schemaValidation.errors.length;
        if (errorCount <= 2) opportunityScore += 7; // Minor issues
        else if (errorCount <= 5) opportunityScore += 4; // Moderate issues
        else opportunityScore += 1; // Major issues
      }

      // Normalize to 0-100 scale
      const normalizedScore = maxPossible > 0 ? Math.round((opportunityScore / maxPossible) * 100) : 0;

      const responseData = {
        success: true,
        data: {
          ...analysis,
          opportunityScore: normalizedScore,
          opportunityScoreBreakdown: {
            serpPosition: analysis.serpPosition ? (analysis.serpPosition <= 3 ? 30 : analysis.serpPosition <= 10 ? 20 : analysis.serpPosition <= 20 ? 10 : 5) : 0,
            schemas: (analysis.schemas.localBusiness ? 10 : 0) + (analysis.schemas.faq ? 10 : 0),
            analytics: (analysis.analytics.googleAnalytics.found ? 10 : 0) + (analysis.analytics.facebookPixel.found ? 5 : 0),
            speedScores: (analysis.speedScores.desktop >= 90 ? 10 : analysis.speedScores.desktop >= 70 ? 5 : 0) + 
                         (analysis.speedScores.mobile >= 90 ? 10 : analysis.speedScores.mobile >= 70 ? 5 : 0),
            ppcStatus: analysis.ppcStatus.runningAds ? 15 : 8,
            safeBrowsing: analysis.safeBrowsing?.isSafe ? 10 : 0,
            schemaValidation: analysis.schemaValidation?.valid ? 10 : (analysis.schemaValidation?.errors.length <= 2 ? 7 : analysis.schemaValidation?.errors.length <= 5 ? 4 : 1) || 0
          },
          recommendations: generateSEORecommendations(analysis, normalizedScore)
        }
      };
      
      const duration = Date.now() - startTime;
      console.log(`[getBusinessSEOAndPPC] ✅ Analysis complete in ${duration}ms. Opportunity Score: ${normalizedScore}/100`);
      res.json({
        ...responseData,
        isFromDatabase: true,
        message: 'SEO & PPC analysis calculated from database (no API calls)'
      });
    } catch (apiError: any) {
      console.error('[getBusinessSEOAndPPC] Error during analysis:', apiError);
      // Return partial data with error
      res.json({
        success: true,
        data: {
          serpPosition: serpResult?.rankAbsolute || null,
          schemas: { localBusiness: !!enriched.gmbInfo, faq: false },
          analytics: { googleAnalytics: { found: false }, facebookPixel: { found: false } },
          ppcStatus: { runningAds: businessProfile.isPaid || false, adCount: 0 },
          speedScores: { 
            desktop: businessProfile.pageSpeed || 0, 
            mobile: businessProfile.mobileScore || 0 
          },
          localCompetitors: null,
          opportunityScore: businessProfile.seoScore || 0,
          isFromDatabase: true,
          error: apiError.message
        }
      });
    }
  } catch (error: any) {
    console.error('[getBusinessSEOAndPPC] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve SEO & PPC analysis',
      error: error.message
    });
  }
};

/**
 * Generate SEO recommendations based on analysis
 * Uses ALL stored data for accurate, data-driven recommendations
 */
function generateSEORecommendations(analysis: any, score: number): string[] {
  const recommendations: string[] = [];
  
  // Schema recommendations (using all stored schema data)
  if (!analysis.schemas.localBusiness) {
    recommendations.push('Add LocalBusiness schema markup to improve local SEO visibility and Google Maps rankings');
  }
  
  if (!analysis.schemas.faq) {
    recommendations.push('Implement FAQ schema to appear in rich snippets and answer boxes, increasing click-through rates');
  }
  
  if (!analysis.schemas.organization) {
    recommendations.push('Add Organization schema to establish brand authority and improve knowledge graph presence');
  }
  
  if (!analysis.schemas.breadcrumbs) {
    recommendations.push('Implement BreadcrumbList schema to help search engines understand site structure and improve navigation');
  }
  
  if (!analysis.schemas.review && analysis.schemas.localBusiness) {
    recommendations.push('Add Review schema to display star ratings in search results, increasing click-through rates');
  }
  
  // Schema Validation recommendations (NEW)
  if (analysis.schemaValidation && !analysis.schemaValidation.valid) {
    const errorCount = analysis.schemaValidation.errors.length;
    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} schema validation error${errorCount > 1 ? 's' : ''} - invalid structured data can prevent rich results from appearing in search`);
      // Show first few errors
      analysis.schemaValidation.errors.slice(0, 3).forEach((error: string) => {
        recommendations.push(`Schema Error: ${error}`);
      });
    }
  }
  
  // Safe Browsing recommendations (NEW)
  if (analysis.safeBrowsing && !analysis.safeBrowsing.isSafe) {
    const threats = analysis.safeBrowsing.threats || [];
    if (analysis.safeBrowsing.malware) {
      recommendations.push('CRITICAL: Website flagged for malware - remove immediately to avoid being blacklisted by search engines');
    }
    if (analysis.safeBrowsing.phishing) {
      recommendations.push('CRITICAL: Website flagged for phishing - resolve security issues immediately');
    }
    if (analysis.safeBrowsing.unwantedSoftware) {
      recommendations.push('WARNING: Website flagged for unwanted software - review and remove any suspicious code');
    }
  }
  
  // Analytics recommendations (using stored analytics data with type/ID)
  if (!analysis.analytics.googleAnalytics.found) {
    recommendations.push('Install Google Analytics 4 to track website performance, user behavior, and conversion data');
  } else if (analysis.analytics.googleAnalytics.type === 'UA') {
    recommendations.push('Upgrade from Universal Analytics (UA) to Google Analytics 4 (GA4) - UA will stop processing data in July 2023');
  } else if (analysis.analytics.googleAnalytics.type === 'gtag' && !analysis.analytics.googleAnalytics.id) {
    recommendations.push('Configure Google Analytics tracking ID properly - gtag.js detected but no tracking ID found');
  }
  
  if (!analysis.analytics.facebookPixel.found) {
    recommendations.push('Add Facebook Pixel for better ad tracking, retargeting capabilities, and conversion optimization');
  }
  
  // SERP Position recommendations (using actual stored position)
  if (analysis.serpPosition) {
    if (analysis.serpPosition > 20) {
      recommendations.push(`Improve SERP position (currently #${analysis.serpPosition}) - focus on content optimization, local citations, and link building to reach top 10`);
    } else if (analysis.serpPosition > 10) {
      recommendations.push(`Optimize to reach top 10 (currently #${analysis.serpPosition}) - improve content relevance, local SEO signals, and user engagement metrics`);
    } else if (analysis.serpPosition > 3) {
      recommendations.push(`Push for top 3 position (currently #${analysis.serpPosition}) - enhance content quality, build high-quality backlinks, and optimize for featured snippets`);
    }
  } else {
    recommendations.push('Not ranking in top 100 - implement comprehensive SEO strategy including technical SEO, content marketing, and local optimization');
  }
  
  // Speed recommendations (using actual stored speed scores)
  if (analysis.speedScores.desktop < 50 || analysis.speedScores.mobile < 50) {
    recommendations.push(`Critical: Page speed is very poor (Desktop: ${analysis.speedScores.desktop}/100, Mobile: ${analysis.speedScores.mobile}/100) - optimize images, minimize JavaScript, and enable caching`);
  } else if (analysis.speedScores.desktop < 80 || analysis.speedScores.mobile < 70) {
    recommendations.push(`Optimize page speed (Desktop: ${analysis.speedScores.desktop}/100, Mobile: ${analysis.speedScores.mobile}/100) - compress images, reduce server response time, and eliminate render-blocking resources`);
  } else if (analysis.speedScores.mobile < 90) {
    recommendations.push(`Mobile speed can be improved (${analysis.speedScores.mobile}/100) - optimize for mobile-first indexing and improve Core Web Vitals`);
  }
  
  // Domain Authority & Backlinks (using stored data)
  if (analysis.domainAuthority !== null && analysis.domainAuthority < 30) {
    recommendations.push(`Low domain authority (${analysis.domainAuthority}) - build high-quality backlinks from authoritative sites in your industry`);
  } else if (analysis.domainAuthority !== null && analysis.domainAuthority < 50) {
    recommendations.push(`Domain authority is moderate (${analysis.domainAuthority}) - focus on earning backlinks from industry publications and local directories`);
  }
  
  if (analysis.backlinks !== null && analysis.backlinks < 50) {
    recommendations.push(`Low backlink count (${analysis.backlinks}) - develop link-building strategy through guest posting, partnerships, and local citations`);
  } else if (analysis.backlinks !== null && analysis.backlinks < 200) {
    recommendations.push(`Moderate backlink profile (${analysis.backlinks} backlinks) - continue building quality links to improve domain authority`);
  }
  
  // Traffic recommendations (using stored traffic data)
  if (analysis.monthlyTraffic !== null && analysis.monthlyTraffic < 1000) {
    recommendations.push(`Low organic traffic (${analysis.monthlyTraffic.toLocaleString()} monthly visits) - optimize for high-intent keywords and improve content quality`);
  } else if (analysis.monthlyTraffic !== null && analysis.monthlyTraffic < 10000) {
    recommendations.push(`Moderate traffic (${analysis.monthlyTraffic.toLocaleString()} monthly visits) - scale content marketing and target more competitive keywords`);
  }
  
  // Accessibility recommendations (using stored accessibility score)
  if (analysis.accessibilityScore !== null && analysis.accessibilityScore < 70) {
    recommendations.push(`Improve accessibility score (${analysis.accessibilityScore}/100) - add alt text to images, improve color contrast, and ensure keyboard navigation`);
  }
  
  // PPC recommendations (using stored ads data)
  if (!analysis.ppcStatus.runningAds) {
    recommendations.push('Start running Google Ads to capture paid traffic, test keywords, and compete for top positions while building organic presence');
  } else if (analysis.ppcStatus.adCount && analysis.ppcStatus.adCount < 5) {
    recommendations.push(`Limited ad presence (${analysis.ppcStatus.adCount} ads) - expand ad campaigns to more keywords and ad groups for better coverage`);
  }
  
  // Keyword rankings recommendations (using stored keyword data)
  if (analysis.serpResults && analysis.serpResults.length > 0) {
    const topRankings = analysis.serpResults.filter((r: any) => r.rank <= 10);
    if (topRankings.length === 0) {
      recommendations.push(`No keywords ranking in top 10 - focus on optimizing for high-value keywords and improving content relevance`);
    } else if (topRankings.length < 5) {
      recommendations.push(`Only ${topRankings.length} keyword(s) in top 10 - expand keyword targeting and optimize existing content for more search terms`);
    }
  }
  
  // Overall score recommendations
  if (score < 40) {
    recommendations.push(`Critical: Overall SEO health is very poor (${score}/100) - implement comprehensive SEO strategy across all areas`);
  } else if (score < 60) {
    recommendations.push(`SEO health needs improvement (${score}/100) - prioritize technical SEO, content optimization, and link building`);
  } else if (score < 80) {
    recommendations.push(`Good SEO foundation (${score}/100) - focus on advanced optimization, content expansion, and competitive analysis`);
  } else if (score < 90) {
    recommendations.push(`Strong SEO performance (${score}/100) - maintain current strategies and focus on advanced tactics like featured snippets and voice search`);
  }
  
  // Prioritize recommendations (limit to top 8 most impactful)
  return recommendations.slice(0, 8);
}

/**
 * Get ads search results for competitive analysis
 */
export const getAdsSearch = async (req: Request, res: Response) => {
  try {
    const { keyword, location, device = 'desktop' } = req.body;

    if (!keyword || !location) {
      return res.status(400).json({
        success: false,
        message: 'Keyword and location are required'
      });
    }

    const adsData = await dataForSEOService.getAdsSearch({
      keyword,
      location,
      device
    });

    res.json({
      success: true,
      data: adsData
    });
  } catch (error: any) {
    console.error('Error getting ads search:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get on-page SEO analysis
 */
export const getOnPageAnalysis = async (req: Request, res: Response) => {
  try {
    const { domain, location = 'United States' } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const onPageData = await dataForSEOService.getOnPageAnalysis({
      domain,
      location
    });

    res.json({
      success: true,
      data: onPageData
    });
  } catch (error: any) {
    console.error('Error getting on-page analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Business Listings Search (Primary API)
 */
export const getBusinessListings = async (req: Request, res: Response) => {
  try {
    const { keyword, location, limit, locationType, locationValue, radius } = req.body;

    if (!keyword || !location) {
      return res.status(400).json({
        success: false,
        message: 'Keyword and location are required'
      });
    }

    // Use Maps live/advanced for strictly local, lat/lng-rich items
    const businessListings = await dataForSEOService.searchMaps({
      keyword,
      location,
      device: 'desktop'
    });

    // Normalize maps results to a consistent shape with top-level lat/lng
    const items = businessListings?.tasks?.[0]?.result?.[0]?.items || [];
    const normalized = items.map((it: any) => ({
      id: it.place_id || it.cid || it.feature_id || it.type + '-' + (it.rank_absolute || ''),
      title: it.title,
      address_info: it.address_info,
      latitude: it.gps_coordinates?.latitude || it.latitude,
      longitude: it.gps_coordinates?.longitude || it.longitude,
      rating: it.rating,
      reviews_count: it.votes_count || it.rating?.votes_count,
      phone: it.phone,
      website: it.url || it.website,
      domain: it.domain,
      category: it.category,
      thumbnail: it.thumbnail,
      main_image: it.main_image,
      place_id: it.place_id,
      cid: it.cid
    }))
    // Hard-filter to Missouri by lat/lng bounding box OR address strings
    .filter((b: any) => {
      const lat = Number(b.latitude);
      const lng = Number(b.longitude);
      const inBBox = isFinite(lat) && isFinite(lng)
        && lat >= 35.9957 && lat <= 40.6136
        && lng >= -95.7747 && lng <= -89.0988; // Missouri bounding box
      const addr = JSON.stringify(b.address_info || '').toLowerCase();
      const addrMatch = addr.includes('missouri') || addr.includes('mo') || addr.includes('st. louis');
      return inBBox || addrMatch;
    });

    res.json({ success: true, data: { businesses: normalized, total: normalized.length, rawResponse: businessListings } });
  } catch (error: any) {
    console.error('Error getting business listings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Google My Business Info (Detailed profile)
 */
export const getGoogleMyBusinessInfo = async (req: Request, res: Response) => {
  try {
    const { businessName, location, placeId, cid } = req.body;

    if (!businessName || !location) {
      return res.status(400).json({
        success: false,
        message: 'Business name and location are required'
      });
    }

    const gmbInfo = await dataForSEOService.getGoogleMyBusinessInfo({
      businessName,
      location,
      placeId,
      cid
    });

    res.json({
      success: true,
      data: gmbInfo
    });
  } catch (error: any) {
    console.error('Error getting Google My Business info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get detailed ad performance analysis for a business
 */
async function getDetailedAdPerformance(domain: string, businessName: string, location: string) {
  try {
    console.log('Starting detailed ad performance analysis for:', domain);
    
    // Get paid traffic estimation
    const trafficData = await dataForSEOService.getBulkTrafficEstimation({
      domains: [domain],
      location
    });
    
    // Get ads search data
    const adsData = await dataForSEOService.getAdsSearch({
      keyword: businessName,
      location,
      device: 'desktop'
    });
    
    // Get ads advertisers data
    const advertisersData = await dataForSEOService.getAdsAdvertisers({
      keyword: businessName,
      locationName: location
    });

    // Extract metrics
    const paidETV = extractPaidTraffic(trafficData);
    const creativesData = extractAdCreatives(adsData);
    const advertiserInfo = extractAdvertiserInfo(advertisersData);
    
    // Calculate ad activity score
    const adActivityScore = calculateAdActivityScore({
      paidETV,
      creativesCount: creativesData.creativesCount,
      approxAdsCount: advertiserInfo.approxAdsCount,
      adRecency: creativesData.adRecency,
      verifiedAdvertiser: advertiserInfo.verified,
      platforms: creativesData.platforms
    });

    console.log('Ad performance analysis results:', {
      paidETV,
      creativesCount: creativesData.creativesCount,
      adActivityScore
    });

    return {
      paidETV,
      creativesCount: creativesData.creativesCount,
      approxAdsCount: advertiserInfo.approxAdsCount,
      adRecency: creativesData.adRecency,
      verifiedAdvertiser: advertiserInfo.verified,
      platforms: creativesData.platforms,
      creatives: creativesData.creatives,
      recentCreatives: creativesData.creatives.slice(0, 10),
      lastActiveDate: creativesData.lastActiveDate,
      adActivityScore,
      advertiserInfo
    };
  } catch (error) {
    console.error('Error in detailed ad performance analysis:', error);
    return {
      paidETV: 0,
      creativesCount: 0,
      approxAdsCount: 0,
      adRecency: 0,
      verifiedAdvertiser: false,
      platforms: [],
      creatives: [],
      recentCreatives: [],
      lastActiveDate: null,
      adActivityScore: 0,
      advertiserInfo: {}
    };
  }
}

/**
 * Extract paid traffic from traffic estimation data
 */
function extractPaidTraffic(trafficData: any): number {
  try {
    if (!trafficData?.tasks?.[0]?.result?.[0]?.items?.[0]?.metrics?.paid) return 0;
    return trafficData.tasks[0].result[0].items[0].metrics.paid.etv || 0;
  } catch (error) {
    console.error('Error extracting paid traffic:', error);
    return 0;
  }
}

/**
 * Extract ad creatives from ads search data
 */
function extractAdCreatives(adsData: any) {
  try {
    const items = adsData?.tasks?.[0]?.result?.[0]?.items || [];
    const creatives = items.filter((item: any) => item.type === 'ads_search');
    
    const platforms = [...new Set(creatives.map((c: any) => c.platform).filter(Boolean))] as string[];
    const creativesCount = creatives.length;
    
    // Calculate ad recency (days since last shown)
    const now = new Date();
    const lastShownDates = creatives
      .map((c: any) => c.last_shown ? new Date(c.last_shown) : null)
      .filter(Boolean);
    
    const adRecency = lastShownDates.length > 0 
      ? Math.max(...lastShownDates.map(d => Math.max(0, 100 - (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))))
      : 0;
    
    const lastActiveDate = lastShownDates.length > 0 
      ? new Date(Math.max(...lastShownDates.map(d => d.getTime()))).toISOString()
      : null;

    return {
      creatives,
      creativesCount,
      platforms,
      adRecency,
      lastActiveDate
    };
  } catch (error) {
    console.error('Error extracting ad creatives:', error);
    return {
      creatives: [],
      creativesCount: 0,
      platforms: [],
      adRecency: 0,
      lastActiveDate: null
    };
  }
}

/**
 * Extract advertiser information
 */
function extractAdvertiserInfo(advertisersData: any) {
  try {
    const items = advertisersData?.tasks?.[0]?.result?.[0]?.items || [];
    const advertiserItems = items.filter((item: any) => item.type === 'ads_advertiser');
    
    const totalAdsCount = advertiserItems.reduce((sum: number, item: any) => 
      sum + (item.approx_ads_count || 0), 0);
    
    const verified = advertiserItems.some((item: any) => item.verified);
    
    return {
      approxAdsCount: totalAdsCount,
      verified,
      advertiserCount: advertiserItems.length
    };
  } catch (error) {
    console.error('Error extracting advertiser info:', error);
    return {
      approxAdsCount: 0,
      verified: false,
      advertiserCount: 0
    };
  }
}

/**
 * Calculate ad activity score (0-100)
 */
function calculateAdActivityScore(metrics: {
  paidETV: number;
  creativesCount: number;
  approxAdsCount: number;
  adRecency: number;
  verifiedAdvertiser: boolean;
  platforms: string[];
}): number {
  try {
    // Normalize paid ETV (log scale, 0-100)
    const paidScore = Math.min(100, Math.log10(1 + metrics.paidETV) * 15);
    
    // Normalize creatives count (0-100)
    const creativesScore = Math.min(100, (metrics.creativesCount / 20) * 100);
    
    // Normalize ads count (0-100)
    const adsScore = Math.min(100, (metrics.approxAdsCount / 50) * 100);
    
    // Ad recency score (already 0-100)
    const recencyScore = metrics.adRecency;
    
    // Verified advertiser bonus
    const verifiedScore = metrics.verifiedAdvertiser ? 100 : 0;
    
    // Platform diversity bonus
    const platformScore = Math.min(100, metrics.platforms.length * 25);
    
    // Weighted calculation
    const adActivityScore = (
      paidScore * 0.30 +      // 30% - Paid traffic volume
      creativesScore * 0.25 + // 25% - Number of creatives
      adsScore * 0.20 +       // 20% - Total ads count
      recencyScore * 0.15 +   // 15% - Campaign freshness
      verifiedScore * 0.05 + // 5% - Verification status
      platformScore * 0.05   // 5% - Platform diversity
    );
    
    return Math.round(Math.max(0, Math.min(100, adActivityScore)));
  } catch (error) {
    console.error('Error calculating ad activity score:', error);
    return 0;
  }
}

// ============================================================================
// PROSPECT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Add a business to prospects
 */
export const addToProspects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { 
      businessProfileId, 
      serpJobId, 
      serpResultId, 
      name, 
      domain, 
      category, 
      location, 
      score, 
      rating,
      priority = 'medium',
      tags = [],
      notes = '',
      pitchingPoints = []
    } = req.body;

    if (!businessProfileId && !name) {
      return res.status(400).json({
        success: false,
        message: 'Business profile ID or name is required'
      });
    }

    // Resolve/ensure a valid BusinessProfile.id from given identifiers
    let resolvedBusinessProfileId = await ensureBusinessProfileIdFromAny(businessProfileId, serpResultId);

    // Final fallback: if still not resolved but we have a serpResult, try once more to create it explicitly
    if (!resolvedBusinessProfileId && serpResultId) {
      const sr = await prisma.serpResult.findFirst({
        where: { OR: [ { id: serpResultId }, { placeId: serpResultId }, { cid: serpResultId } ] }
      });
      if (sr) {
        const raw: any = sr.rawData || {};
        const created = await prisma.businessProfile.create({
          data: {
            serpResultId: sr.id,
            placeId: sr.placeId || raw.place_id || null,
            cid: sr.cid || raw.cid || null,
            name: raw.title || sr.title || 'Unknown Business',
            domain: raw.domain || sr.domain || null,
            websiteUrl: raw.url || sr.url || null,
            category: raw.category || null,
            address: raw.address || sr.address || null,
            city: raw.address_info?.city || sr.city || null,
            state: raw.address_info?.region || sr.state || null,
            zipCode: raw.address_info?.postal_code || sr.zipCode || null,
            phone: raw.phone || sr.phone || null,
            rating: (raw.rating && raw.rating.value) ? raw.rating.value : (sr.rating as any),
            reviewsCount: (raw.rating && raw.rating.votes_count) ? raw.rating.votes_count : (sr.reviewsCount as any),
            services: Array.isArray(raw.additional_categories) ? raw.additional_categories : [],
            specialties: Array.isArray(raw.category_ids) ? raw.category_ids : [],
            insuranceAccepted: [],
            languages: [],
            isActive: true,
          }
        });
        resolvedBusinessProfileId = created.id;
      }
    }

    const prospect = await (prisma as any).prospectItem.create({
      data: {
        userId,
        businessProfileId: resolvedBusinessProfileId || undefined,
        serpJobId: serpJobId || null,
        serpResultId: serpResultId || null,
        name: name || 'Unknown Business',
        domain,
        category,
        location,
        score,
        rating,
        priority,
        tags,
        notes,
        pitchingPoints,
        status: 'new'
      }
    });

    res.json({
      success: true,
      data: prospect,
      message: 'Business added to prospects successfully'
    });
  } catch (error) {
    console.error('Error adding to prospects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add business to prospects'
    });
  }
};

/**
 * Get all prospect items for a user
 */
export const getProspectItems = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, priority, search } = req.query;

    const where: any = { userId, isActive: true };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { domain: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const prospects = await (prisma as any).prospectItem.findMany({
      where,
      include: {
        businessProfile: {
          select: {
            id: true,
            name: true,
            domain: true,
            websiteUrl: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            rating: true,
            reviewsCount: true,
            category: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: prospects
    });
  } catch (error) {
    console.error('Error fetching prospect items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prospect items'
    });
  }
};

/**
 * Update a prospect item
 */
export const updateProspectItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { itemId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Whitelist of allowed updatable fields
    const allowedFields = new Set([
      'status',
      'priority',
      'notes',
      'lastContacted',
      'nextFollowUp'
    ]);

    // Map possible alternate client keys
    if (updateData.lastChecked && !updateData.lastContacted) {
      updateData.lastContacted = updateData.lastChecked;
      delete updateData.lastChecked;
    }

    // Build safe update object
    const safeUpdate: any = {};
    for (const key of Object.keys(updateData)) {
      if (allowedFields.has(key)) {
        safeUpdate[key] = updateData[key];
      }
    }

    // Coerce dates to JS Date objects for Prisma
    if (typeof safeUpdate.lastContacted === 'string') {
      const d = new Date(safeUpdate.lastContacted);
      if (!isNaN(d.getTime())) {
        safeUpdate.lastContacted = d;
      } else {
        delete safeUpdate.lastContacted;
      }
    }
    if (typeof safeUpdate.nextFollowUp === 'string') {
      const d2 = new Date(safeUpdate.nextFollowUp);
      if (!isNaN(d2.getTime())) {
        safeUpdate.nextFollowUp = d2;
      } else {
        delete safeUpdate.nextFollowUp;
      }
    }

    const prospect = await (prisma as any).prospectItem.updateMany({
      where: {
        id: itemId,
        userId
      },
      data: {
        ...safeUpdate,
        updatedAt: new Date()
      }
    });

    if (prospect.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prospect item not found'
      });
    }

    // Fetch the updated item
    const updatedProspect = await (prisma as any).prospectItem.findUnique({
      where: { id: itemId },
      include: {
        businessProfile: {
          select: {
            id: true,
            name: true,
            domain: true,
            websiteUrl: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            rating: true,
            reviewsCount: true,
            category: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedProspect,
      message: 'Prospect item updated successfully'
    });
  } catch (error) {
    console.error('Error updating prospect item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prospect item'
    });
  }
};

/**
 * Remove a prospect item
 */
export const removeFromProspects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { itemId } = req.params;

    const prospect = await (prisma as any).prospectItem.updateMany({
      where: {
        id: itemId,
        userId
      },
      data: {
        isActive: false
      }
    });

    if (prospect.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prospect item not found'
      });
    }

    res.json({
      success: true,
      message: 'Prospect item removed successfully'
    });
  } catch (error) {
    console.error('Error removing prospect item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove prospect item'
    });
  }
};

/**
 * Generate AI recommendations for a prospect
 */
export const generateAIRecommendations = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const userId = (req as any).userId;

    const prospect = await (prisma as any).prospectItem.findFirst({
      where: {
        id: itemId,
        userId,
        isActive: true
      },
      include: {
        businessProfile: {
          select: {
            name: true,
            domain: true,
            category: true,
            rating: true,
            reviewsCount: true,
            adPerformance: true
          }
        }
      }
    });

    if (!prospect) {
      return res.status(404).json({
        success: false,
        message: 'Prospect not found'
      });
    }

    // Generate AI recommendations based on business profile
    const recommendations = generateRecommendations(prospect);
    const emailTemplate = generateEmailTemplate(prospect);
    const pitchingPoints = generatePitchingPoints(prospect);

    // Update the prospect with AI-generated content
    const updatedProspect = await (prisma as any).prospectItem.update({
      where: { id: itemId },
      data: {
        aiRecommendations: recommendations,
        emailTemplate: emailTemplate,
        pitchingPoints: pitchingPoints
      }
    });

    res.json({
      success: true,
      data: {
        recommendations,
        emailTemplate,
        pitchingPoints
      },
      message: 'AI recommendations generated successfully'
    });
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations'
    });
  }
};

/**
 * Generate recommendations based on business profile
 */
function generateRecommendations(prospect: any): string {
  const business = prospect.businessProfile;
  const recommendations = [];

  // Website recommendations
  if (!business?.domain) {
    recommendations.push("🚀 **Website Development**: This business lacks a professional website - a major opportunity for digital marketing services.");
  }

  // SEO recommendations
  if (business?.comprehensiveScore?.seoScore < 50) {
    recommendations.push("📈 **SEO Optimization**: Low SEO score indicates need for search engine optimization services.");
  }

  // Review management
  if (business?.reviewsCount < 10) {
    recommendations.push("⭐ **Review Management**: Low review count - implement review generation strategy.");
  }

  // Ad performance
  if (business?.adPerformance?.adActivityScore < 30) {
    recommendations.push("💰 **Paid Advertising**: No active advertising detected - Google Ads opportunity.");
  }

  // Local SEO
  if (business?.comprehensiveScore?.presenceScore < 40) {
    recommendations.push("📍 **Local SEO**: Poor local presence - Google My Business optimization needed.");
  }

  return recommendations.join('\n\n');
}

/**
 * Generate email template
 */
function generateEmailTemplate(prospect: any): string {
  const business = prospect.businessProfile;
  const businessName = business?.name || prospect.name;
  
  return `Subject: Boost Your ${businessName}'s Online Presence - Free Digital Marketing Audit

Hi [Business Owner],

I noticed ${businessName} has significant potential to grow its online presence and attract more customers in your area.

Based on my analysis, I've identified several opportunities:

🎯 **Key Opportunities:**
• Website optimization for better search rankings
• Google My Business profile enhancement
• Local SEO strategy implementation
• Online review management system

I'd love to offer you a FREE digital marketing audit to show you exactly how we can help ${businessName} get more customers online.

Would you be available for a 15-minute call this week to discuss your current digital marketing goals?

Best regards,
[Your Name]
[Your Company]
[Phone Number]
[Email]`;
}

/**
 * Generate pitching points
 */
function generatePitchingPoints(prospect: any): string[] {
  const business = prospect.businessProfile;
  const points = [];

  if (!business?.domain) {
    points.push("No professional website - 97% of consumers search online for local businesses");
  }

  if (business?.comprehensiveScore?.seoScore < 50) {
    points.push("Poor search engine visibility - missing out on potential customers");
  }

  if (business?.reviewsCount < 10) {
    points.push("Low review count - reviews influence 88% of purchasing decisions");
  }

  if (business?.adPerformance?.adActivityScore < 30) {
    points.push("No paid advertising - competitors are capturing market share");
  }

  if (business?.comprehensiveScore?.presenceScore < 40) {
    points.push("Weak local presence - not showing up in local searches");
  }

  return points;
}
