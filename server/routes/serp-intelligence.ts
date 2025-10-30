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

    console.log('Getting business profile for ID:', profileId);
    
    // 0) Try BusinessProfile by primary key first (most reliable for Watchlist/Prospects)
    const existingBusiness = await prisma.businessProfile.findUnique({
      where: { id: profileId },
      include: { serpResult: true }
    });
    if (existingBusiness) {
      const sr: any = existingBusiness.serpResult || null;
      const raw: any = sr?.rawData || {};
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
            email: '',
        rating: typeof existingBusiness.rating === 'number' ? existingBusiness.rating : (raw.rating?.value || sr?.rating || 0),
        reviewsCount: typeof existingBusiness.reviewsCount === 'number' ? existingBusiness.reviewsCount : (raw.rating?.votes_count || sr?.reviewsCount || 0),
        services: Array.isArray(existingBusiness.services) ? existingBusiness.services : (raw.additional_categories || []),
        specialties: Array.isArray(existingBusiness.specialties) ? existingBusiness.specialties : (raw.category_ids || []),
        insuranceAccepted: existingBusiness.insuranceAccepted || [],
        socialMedia: existingBusiness.socialMedia || { facebook: '', instagram: '' },
        businessHours: existingBusiness.businessHours || raw.work_hours || {},
            lastAnalyzed: new Date().toISOString(),
        isActive: existingBusiness.isActive,
        latitude: raw.latitude,
        longitude: raw.longitude,
        isClaimed: raw.is_claimed,
        totalPhotos: raw.total_photos,
        mainImage: raw.main_image,
        ratingDistribution: raw.rating_distribution
      };
      return res.json({ success: true, data: profile });
    }

    // First, try to find the business in our stored SERP results
    const serpResult = await prisma.serpResult.findFirst({
      where: {
        OR: [
          { id: profileId }, // Database record ID
          { placeId: profileId },
          { cid: profileId }
        ]
      }
    });

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
    const { businessName, domain, location, keywords } = req.body;

    if (!businessName || !domain || !location) {
      return res.status(400).json({
        success: false,
        message: 'Business name, domain, and location are required'
      });
    }

    const comprehensiveScore = await dataForSEOService.getComprehensiveBusinessScore({
      businessName,
      domain,
      location,
      keywords
    });

    res.json({
      success: true,
      data: comprehensiveScore
    });
  } catch (error: any) {
    console.error('Error getting comprehensive business score:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      include: { serpResult: true }
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

    try {
      console.log('[getBusinessAds] Starting ad fetch process...');
      // Use locationCode for Missouri locations
      const locationCode = (locationStr.includes('St. Louis') || locationStr.includes('Chesterfield') || locationStr.includes('Missouri')) ? 2840 : undefined;
      
      // First, try to get advertiser_id by calling ads_advertisers with business name
      let advertiserId: string | null = null;
      try {
        const advertisersData = await dataForSEOService.getAdsAdvertisers({
          keyword: businessName,
          locationCode: locationCode,
          locationName: locationCode ? undefined : locationStr
        });
        console.log(`[getBusinessAds] Checking domain "${domain}" for advertiser match`);
        advertiserId = dataForSEOService.findAdvertiserIdForDomain(advertisersData, domain);
        if (advertiserId) {
          console.log(`[getBusinessAds] ✅ Found advertiser ID: ${advertiserId} for domain: ${domain}`);
        } else {
          console.log(`[getBusinessAds] ⚠️ No advertiser ID found for domain: ${domain}, will try direct domain search`);
        }
      } catch (err) {
        console.log('[getBusinessAds] Could not get advertiser ID, will try domain directly:', err);
      }

      // Get ads using domain (fallback) or advertiser_id (preferred)
      let adsData;
      if (advertiserId) {
        console.log(`[getBusinessAds] Fetching ads using advertiser ID: ${advertiserId}`);
        adsData = await dataForSEOService.getAdsForAdvertisers({
          advertiserIds: [advertiserId],
          locationCode: locationCode,
          locationName: locationCode ? undefined : locationStr,
          depth: 100
        });
      } else {
        // Clean domain for request
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        console.log(`[getBusinessAds] Fetching ads directly for domain: ${cleanDomain}`);
        adsData = await dataForSEOService.getAdsForDomain({
          target: cleanDomain,
          locationCode: locationCode,
          locationName: locationCode ? undefined : locationStr,
          depth: 100
        });
      }

      // Extract ad creatives
      console.log('[getBusinessAds] Extracting ad creatives from response...');
      const creatives = extractAdCreativesFromResponse(adsData);
      console.log(`[getBusinessAds] ✅ Extracted ${creatives.length} ad creatives`);

      const responseData = {
        success: true,
        data: {
          ads: creatives,
          advertiserId,
          domain,
          businessName,
          totalAds: creatives.length,
          isRunningAds: creatives.length > 0
        }
      };
      
      console.log(`[getBusinessAds] Sending response: ${creatives.length} ads found`);
      res.json(responseData);
    } catch (error: any) {
      console.error('Error fetching ads for business:', error);
      // Return empty ads rather than failing completely
      res.json({
        success: true,
        data: {
          ads: [],
          advertiserId: null,
          domain,
          businessName,
          totalAds: 0,
          isRunningAds: false,
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
    let businessProfile = await prisma.businessProfile.findUnique({
      where: { id: profileId },
      include: { serpResult: true }
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
          include: { serpResult: true }
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
            include: { serpResult: true }
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

    try {
      console.log('[getBusinessSEOAndPPC] Starting SEO & PPC analysis...');
      
      // Get comprehensive SEO & PPC analysis
      const analysis = await dataForSEOService.getSEOAndPPCAnalysis({
        domain: domain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
        businessName,
        location: locationStr,
        // Include a category + location query to drive Local Finder competitors
        keywords: [
          businessName,
          `${businessProfile.category} ${locationStr}`,
          `${businessName} ${businessProfile.category}`,
          `${businessName} ${locationStr}`
        ]
      });

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
            ppcStatus: analysis.ppcStatus.runningAds ? 15 : 8
          },
          recommendations: generateSEORecommendations(analysis, normalizedScore)
        }
      };
      
      console.log(`[getBusinessSEOAndPPC] ✅ Analysis complete. Opportunity Score: ${normalizedScore}/100`);
      res.json(responseData);
    } catch (apiError: any) {
      console.error('[getBusinessSEOAndPPC] Error during analysis:', apiError);
      // Return partial data with error
      res.json({
        success: true,
        data: {
          serpPosition: null,
          schemas: { localBusiness: false, faq: false },
          analytics: { googleAnalytics: { found: false }, facebookPixel: { found: false } },
          ppcStatus: { runningAds: false, adCount: 0 },
          speedScores: { desktop: 72, mobile: 67 }, // Default fallback
          localCompetitors: null,
          opportunityScore: 78, // Default fallback
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
 */
function generateSEORecommendations(analysis: any, score: number): string[] {
  const recommendations: string[] = [];
  
  if (!analysis.schemas.localBusiness) {
    recommendations.push('Add LocalBusiness schema markup to improve local SEO visibility');
  }
  
  if (!analysis.schemas.faq) {
    recommendations.push('Implement FAQ schema to appear in rich snippets and answer boxes');
  }
  
  if (analysis.serpPosition && analysis.serpPosition > 10) {
    recommendations.push(`Improve SERP position (currently #${analysis.serpPosition}) through content optimization and link building`);
  }
  
  if (!analysis.analytics.googleAnalytics.found) {
    recommendations.push('Install Google Analytics 4 to track website performance and user behavior');
  }
  
  if (!analysis.analytics.facebookPixel.found) {
    recommendations.push('Add Facebook Pixel for better ad tracking and retargeting capabilities');
  }
  
  if (analysis.speedScores.desktop < 80 || analysis.speedScores.mobile < 70) {
    recommendations.push(`Optimize page speed (Desktop: ${analysis.speedScores.desktop}/100, Mobile: ${analysis.speedScores.mobile}/100) to improve user experience and rankings`);
  }
  
  if (!analysis.ppcStatus.runningAds) {
    recommendations.push('Start running Google Ads to capture paid traffic and compete for top positions');
  }
  
  if (score < 70) {
    recommendations.push(`Focus on improving overall SEO health (current score: ${score}/100) to unlock more growth opportunities`);
  }
  
  return recommendations;
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
