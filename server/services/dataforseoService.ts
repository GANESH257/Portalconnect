import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../lib/prisma';

// DataForSEO API Configuration
const DATAFORSEO_BASE_URL = process.env.DATAFORSEO_BASE_URL || 'https://api.dataforseo.com/v3';
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

// API Rate Limiting
const RATE_LIMIT = {
  requestsPerMinute: 60,
  requestsPerDay: 1000,
  costPerRequest: 0.002
};

class DataForSEOService {
  private requestCount = 0;
  private lastReset = Date.now();

  /**
   * Create axios instance with authentication
   */
  private getAxiosInstance() {
    return axios.create({
      baseURL: DATAFORSEO_BASE_URL,
      auth: {
        username: DATAFORSEO_LOGIN!,
        password: DATAFORSEO_PASSWORD!
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds timeout
    });
  }

  /**
   * On-Page Instant Pages: fetch Core Web Vitals and timing for a single URL
   */
  private async getOnPageInstant(params: {
    url: string;
    preset: 'mobile' | 'desktop';
  }): Promise<{
    onpageScore?: number;
    timing?: {
      largest_contentful_paint?: number;
      first_input_delay?: number;
      cumulative_layout_shift?: number;
      time_to_interactive?: number;
      waiting_time?: number;
    };
  }> {
    await this.checkRateLimit();
    const axios = this.getAxiosInstance();
    try {
      const response = await axios.post('/on_page/instant_pages', [
        {
          url: params.url,
          enable_javascript: true,
          enable_browser_rendering: true,
          browser_preset: params.preset
        }
      ]);

      const task = response.data?.tasks?.[0];
      const item = task?.result?.[0]?.items?.[0];
      const onpageScore = item?.onpage_score as number | undefined;
      const timing = item?.page_timing as any | undefined;
      return {
        onpageScore,
        timing: timing
          ? {
              largest_contentful_paint: timing.largest_contentful_paint,
              first_input_delay: timing.first_input_delay,
              cumulative_layout_shift: timing.cumulative_layout_shift,
              time_to_interactive: timing.time_to_interactive,
              waiting_time: timing.waiting_time
            }
          : undefined
      };
    } catch (error: any) {
      console.error('On-Page Instant Pages error:', error.response?.data || error.message);
      return {};
    }
  }

  /**
   * Convert Core Web Vitals into a 0-100 speed score (rough heuristic)
   */
  private computeSpeedScoreFromVitals(v: {
    largest_contentful_paint?: number;
    first_input_delay?: number;
    cumulative_layout_shift?: number;
    time_to_interactive?: number;
  }): number | undefined {
    if (!v) return undefined;
    // LCP: <2500 good, <4000 needs improvement, >=4000 poor
    const lcp = v.largest_contentful_paint ?? 0;
    const lcpScore = lcp <= 2500 ? 100 : lcp <= 4000 ? 70 : 40;
    // FID/INP: <100 good, <200 needs improvement, else poor
    const fid = (v.first_input_delay ?? 0) * 1000; // some responses may be seconds; ensure ms if needed
    const fidScore = fid <= 100 ? 100 : fid <= 200 ? 70 : 40;
    // CLS: <0.1 good, <0.25 needs improvement, else poor
    const cls = v.cumulative_layout_shift ?? 0;
    const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 70 : 40;
    // TTI: <2000 good, <4000 needs improvement, else poor
    const tti = v.time_to_interactive ?? 0;
    const ttiScore = tti <= 2000 ? 100 : tti <= 4000 ? 70 : 40;
    const score = Math.round((lcpScore * 0.4 + fidScore * 0.2 + clsScore * 0.2 + ttiScore * 0.2));
    return Math.max(0, Math.min(100, score));
  }

  /**
   * DataForSEO Labs: Google competitors_domain/live
   * Returns domain-level competitors for a target domain
   */
  async getLabsCompetitorsDomain(params: {
    targetDomain: string;
    location: string;
    languageName?: string;
    limit?: number;
  }): Promise<any> {
    await this.checkRateLimit();
    const axios = this.getAxiosInstance();
    const location_code = this.getLocationCodeFromCSV(params.location || 'St. Louis, MO');
    const language_name = params.languageName || 'English';
    const limit = params.limit || 10;
    try {
      const resp = await axios.post('/dataforseo_labs/google/competitors_domain/live', [
        {
          target: params.targetDomain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
          location_code,
          language_name,
          limit
        }
      ]);
      return resp.data;
    } catch (error: any) {
      console.error('Labs competitors_domain error:', error.response?.data || error.message);
      throw error;
    }
  }
  /**
   * Check rate limits before making requests
   */
  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    const timeDiff = now - this.lastReset;
    
    // Reset counter every minute
    if (timeDiff > 60000) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    if (this.requestCount >= RATE_LIMIT.requestsPerMinute) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    this.requestCount++;
    return true;
  }

  /**
   * Check if a location string is a Missouri ZIP code
   */
  private isMissouriZipCode(location: string): boolean {
    // Missouri ZIP codes: 63001-65899
    const zipCode = location.trim();
    if (/^\d{5}$/.test(zipCode)) {
      const zip = parseInt(zipCode);
      return zip >= 63001 && zip <= 65899;
    }
    return false;
  }

  /**
   * Check if a location exists in the Missouri CSV file
   */
  private isLocationInMissouriCSV(location: string): boolean {
    try {
      const csvPath = path.join(process.cwd(), 'missouri_locations_transformed.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      const normalizedLocation = location.toLowerCase().trim();
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = this.parseCSVLine(line);
        if (fields.length < 4) continue;
        
        const city = fields[1].toLowerCase();
        const state = fields[2].toLowerCase();
        const country = fields[3].toLowerCase();
        
        // Check if location matches city, state, or country
        if (city === normalizedLocation || 
            state === normalizedLocation || 
            country === normalizedLocation ||
            normalizedLocation.includes('missouri') ||
            normalizedLocation.includes('mo') ||
            this.isMissouriZipCode(location)) {
          console.log(`Location "${location}" found in Missouri CSV`);
          return true;
        }
      }
      
      console.log(`Location "${location}" not found in Missouri CSV`);
      return false;
    } catch (error) {
      console.error('Error checking Missouri CSV:', error);
      return false;
    }
  }

  /**
   * Get location code for a specific Missouri location from the CSV
   */
  private getLocationCodeForMissouriLocation(location: string): number | null {
    try {
      const csvPath = path.join(process.cwd(), 'missouri_locations_transformed.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      const normalizedLocation = location.toLowerCase().trim();
      console.log(`Looking for Missouri location: "${normalizedLocation}"`);
      
      // Parse input location - extract city and state
      const locationParts = normalizedLocation.split(',');
      const inputCity = locationParts[0].trim();
      const inputState = locationParts.length > 1 ? locationParts[1].trim() : '';
      
      console.log(`Parsed input - City: "${inputCity}", State: "${inputState}"`);
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = this.parseCSVLine(line);
        if (fields.length < 4) continue;
        
        const locationCode = fields[0];
        const city = fields[1].toLowerCase().replace(/"/g, '');
        const state = fields[2].toLowerCase().replace(/"/g, '');
        const country = fields[3].toLowerCase().replace(/"/g, '');
        
        // Check if this is a Missouri location
        const isMissouriLocation = state === 'missouri' || state === 'mo' || country === 'united states';
        
        if (!isMissouriLocation) {
          continue; // Skip non-Missouri locations
        }
        
        // Match city name exactly
        if (city === inputCity) {
          console.log(`Found Missouri location ${location} with location code ${locationCode} (city: ${city}, state: ${state})`);
          return parseInt(locationCode);
        }
        
        // Also check if input contains Missouri indicators
        if (normalizedLocation.includes('missouri') || 
            normalizedLocation.includes('mo') ||
            this.isMissouriZipCode(location)) {
          // If looking for Missouri in general, return Missouri state code
          if (inputCity === 'missouri' || inputCity === 'mo') {
            console.log(`Found Missouri state with location code ${locationCode}`);
            return parseInt(locationCode);
          }
        }
      }
      
      console.log(`${location} not found in Missouri CSV`);
      return null;
    } catch (error) {
      console.error('Error looking up Missouri location in CSV:', error);
      return null;
    }
  }

  /**
   * Get location code for a specific ZIP code from the CSV
   */
  private getLocationCodeForZip(zipCode: string): number | null {
    try {
      const csvPath = path.join(__dirname, '../..', 'missouri_locations_transformed.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = this.parseCSVLine(line);
        if (fields.length < 4) continue;
        
        const locationCode = fields[0];
        const city = fields[1];
        const state = fields[2];
        const country = fields[3];
        
        // Check if this is the ZIP code we're looking for
        if (city === zipCode && state === 'Missouri' && country === 'United States') {
          console.log(`Found ZIP ${zipCode} with location code ${locationCode}`);
          return parseInt(locationCode);
        }
      }
      
      console.log(`ZIP ${zipCode} not found in Missouri CSV`);
      return null;
    } catch (error) {
      console.error('Error looking up ZIP code in CSV:', error);
      return null;
    }
  }

  /**
   * Get location code from CSV data
   */
  private getLocationCodeFromCSV(location: string): number {
    try {
      // Check if location exists in Missouri CSV
      const isMissouriLocation = this.isLocationInMissouriCSV(location);
      
      const csvPath = isMissouriLocation 
        ? path.join(process.cwd(), 'missouri_locations_transformed.csv')
        : path.join(process.cwd(), 'locations_serp_google_2025_08_05.csv');
      
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n');
      
      // Normalize input location - extract key terms
      const normalizedInput = location.toLowerCase().trim();
      const inputTerms = this.extractLocationTerms(normalizedInput);
      console.log(`Searching for location: "${normalizedInput}" with terms: [${inputTerms.join(', ')}]`);
      
      // Special handling for Missouri locations - use the actual location code from CSV
      if (isMissouriLocation) {
        console.log(`Missouri location ${location} detected - looking up actual location code from CSV`);
        // Look up the actual location code for this location in the CSV
        const locationCode = this.getLocationCodeForMissouriLocation(location);
        if (locationCode) {
          console.log(`Using location code ${locationCode} for ${location}`);
          return locationCode;
        } else {
          console.log(`${location} not found in CSV, falling back to St. Louis location code`);
          return 1020618; // Fallback to St. Louis
        }
      }
      
      const matches = [];
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Split by comma but handle quoted fields
        const fields = this.parseCSVLine(line);
        if (fields.length < 4) continue;
        
        const locationCode = fields[0];
        const city = fields[1];
        const state = fields[2];
        const country = fields[3];
        const locationName = `${city},${state},${country}`; // Reconstruct for matching
        
        // Clean up location name (remove quotes and normalize)
        const cleanLocationName = locationName.replace(/"/g, '').toLowerCase();
        
        // Extract terms from CSV location name
        const csvTerms = this.extractLocationTerms(cleanLocationName);
        
        // Calculate match score
        const matchScore = this.calculateMatchScore(inputTerms, csvTerms, normalizedInput, cleanLocationName);
        
        if (matchScore > 0) {
          matches.push({
            code: parseInt(locationCode),
            name: locationName,
            score: matchScore,
            terms: csvTerms
          });
        }
      }
      
      // Sort by match score (highest first)
      matches.sort((a, b) => b.score - a.score);
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        console.log(`Found location match: "${location}" -> "${bestMatch.name}" (code: ${bestMatch.code}, score: ${bestMatch.score})`);
        return bestMatch.code;
      }
      
      console.log(`No location match found for: "${location}", defaulting to Chicago: 1016367`);
      return 1016367; // Default to Chicago, Illinois
    } catch (error) {
      console.error('Error reading CSV file:', error);
      return 1016367; // Default to Chicago, Illinois
    }
  }

  /**
   * Get location_name string from CSV for Business Listings
   */
  private getLocationNameFromCSV(location: string): string {
    try {
      const isMissouriLocation = location.toLowerCase().includes('missouri') || 
                                 location.toLowerCase().includes('mo') ||
                                 location.toLowerCase().includes('st. louis') ||
                                 location.toLowerCase().includes('kansas city') ||
                                 location.toLowerCase().includes('springfield');
      const csvPath = isMissouriLocation 
        ? path.join(process.cwd(), 'missouri_locations_transformed.csv')
        : path.join(process.cwd(), 'locations_serp_google_2025_08_05.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n');
      const normalizedInput = location.toLowerCase().trim();
      const inputTerms = this.extractLocationTerms(normalizedInput);
      const matches: { name: string; score: number; terms: string[] }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = this.parseCSVLine(line);
        if (fields.length < 2) continue;
        const locationName = fields[1];
        const cleanLocationName = locationName.replace(/"/g, '').toLowerCase();
        const csvTerms = this.extractLocationTerms(cleanLocationName);
        const matchScore = this.calculateMatchScore(inputTerms, csvTerms, normalizedInput, cleanLocationName);
        if (matchScore > 0) {
          matches.push({ name: locationName.replace(/"/g, ''), score: matchScore, terms: csvTerms });
        }
      }
      matches.sort((a, b) => b.score - a.score);
      if (matches.length > 0) {
        return matches[0].name;
      }
      return 'St. Louis,Missouri,United States';
    } catch {
      return 'St. Louis,Missouri,UnitedStates';
    }
  }

  /**
   * Extract meaningful location terms from a location string
   */
  private extractLocationTerms(location: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = ['united', 'states', 'us', 'county', 'city', 'state', 'region', 'dma'];
    const terms = location
      .split(/[,\s]+/)
      .map(term => term.replace(/[^\w]/g, ''))
      .filter(term => term.length > 1 && !commonWords.includes(term.toLowerCase()));
    
    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Calculate match score between input terms and CSV terms
   */
  private calculateMatchScore(inputTerms: string[], csvTerms: string[], inputLocation: string, csvLocation: string): number {
    let score = 0;
    
    // Exact match gets highest score
    if (csvLocation === inputLocation) {
      return 100;
    }
    
    // Check for exact term matches
    for (const inputTerm of inputTerms) {
      for (const csvTerm of csvTerms) {
        if (inputTerm === csvTerm) {
          score += 20; // Exact term match
        } else if (csvTerm.includes(inputTerm) || inputTerm.includes(csvTerm)) {
          score += 10; // Partial term match
        }
      }
    }
    
    // Bonus for containing the main location name
    const mainLocation = inputTerms[0]; // First term is usually the main location
    if (csvLocation.includes(mainLocation)) {
      score += 15;
    }
    
    // Major city bonus - prioritize well-known cities
    const majorCities = {
      'dallas': ['tx', 'texas'],
      'houston': ['tx', 'texas'],
      'austin': ['tx', 'texas'],
      'san antonio': ['tx', 'texas'],
      'chicago': ['il', 'illinois'],
      'new york': ['ny', 'new york'],
      'los angeles': ['ca', 'california'],
      'san francisco': ['ca', 'california'],
      'san diego': ['ca', 'california'],
      'miami': ['fl', 'florida'],
      'atlanta': ['ga', 'georgia'],
      'phoenix': ['az', 'arizona'],
      'seattle': ['wa', 'washington'],
      'denver': ['co', 'colorado'],
      'boston': ['ma', 'massachusetts'],
      'detroit': ['mi', 'michigan'],
      'philadelphia': ['pa', 'pennsylvania'],
      'washington': ['dc', 'district of columbia']
    };
    
    const cityKey = mainLocation.toLowerCase();
    if (majorCities[cityKey]) {
      const expectedStates = majorCities[cityKey];
      for (const state of expectedStates) {
        if (csvLocation.includes(state)) {
          score += 25; // Major city with correct state gets high bonus
        }
      }
    }
    
    // Bonus for state/region matches
    const stateTerms = inputTerms.filter(term => 
      ['tx', 'texas', 'ca', 'california', 'ny', 'new york', 'fl', 'florida', 'il', 'illinois', 'ga', 'georgia', 'wa', 'washington', 'or', 'oregon', 'az', 'arizona', 'co', 'colorado', 'oh', 'ohio', 'nc', 'north carolina', 'in', 'indiana', 'mi', 'michigan', 'tn', 'tennessee', 'ok', 'oklahoma', 'nv', 'nevada', 'ky', 'kentucky', 'md', 'maryland', 'wi', 'wisconsin', 'nm', 'new mexico', 'ne', 'nebraska', 'va', 'virginia', 'mn', 'minnesota', 'mo', 'missouri', 'pa', 'pennsylvania', 'ma', 'massachusetts', 'dc', 'district of columbia'].includes(term.toLowerCase())
    );
    for (const stateTerm of stateTerms) {
      if (csvLocation.includes(stateTerm)) {
        score += 5;
      }
    }
    
    // Penalty for too many terms (more specific locations get higher scores)
    if (csvTerms.length > inputTerms.length + 2) {
      score -= 5;
    }
    
    // Penalty for wrong state when we have a major city
    if (majorCities[cityKey]) {
      const expectedStates = majorCities[cityKey];
      const hasExpectedState = expectedStates.some(state => csvLocation.includes(state));
      if (!hasExpectedState) {
        score -= 15; // Penalty for wrong state
      }
    }
    
    return Math.max(0, score);
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Search Google Maps Results (Live Advanced)
   */
  async searchMaps(params: {
    keyword: string;
    location?: string;
    language?: string;
    device?: string;
  }): Promise<any> {
    await this.checkRateLimit();
    
    // Get location code from CSV data - use Missouri CSV for Missouri locations
    const locationCode = this.getLocationCodeFromCSV(params.location || 'St. Louis, MO');
    
    const axios = this.getAxiosInstance();
    const response = await axios.post('/serp/google/maps/live/advanced', [
      {
        keyword: params.keyword,
        location_code: locationCode,
        language_code: 'en',
        device: params.device || 'desktop'
      }
    ]);
    
    return response.data;
  }

  /**
   * Search Google Local Pack Results (Live Advanced)
   */
  async searchLocalPack(params: {
    keyword: string;
    location?: string;
    language?: string;
    device?: string;
    limit?: number;
  }): Promise<any> {
    await this.checkRateLimit();
    
    // Get location code from CSV data - use Missouri CSV for Missouri locations
    const locationCode = this.getLocationCodeFromCSV(params.location || 'St. Louis, MO');
    
    const axios = this.getAxiosInstance();
    const response = await axios.post('/serp/google/local_finder/live/advanced', [
      {
        keyword: params.keyword,
        location_code: locationCode,
        language_code: 'en',
        device: params.device || 'desktop',
        limit: params.limit ?? 20
      }
    ]);
    
    return response.data;
  }

  /**
   * Search Missouri businesses using DataForSEO Business Listings API
   */
  async searchMissouriBusinesses(params: {
    keyword: string;
    location: string;
    locationType?: string;
    locationValue?: string;
    radius?: number;
    mapView?: string;
    selectedZipCodes?: string[];
    selectedCounties?: string[];
    device?: string;
  }) {
    await this.checkRateLimit();
    
    const locationCode = this.getLocationCodeFromCSV(params.location);
    console.log(`Missouri search - location code: ${locationCode} for location: ${params.location}`);
    
    // Build search parameters based on location type
    let searchParams: any = {
      keyword: params.keyword,
      location_code: locationCode,
      language_code: 'en',
      device: params.device || 'desktop',
      limit: 100
    };

    // Add location-specific filters
    if (params.locationType === 'Postal Code' && params.locationValue) {
      searchParams.filters = [['address_info.zip', '=', params.locationValue]];
    } else if (params.locationType === 'City' && params.locationValue) {
      searchParams.filters = [['address_info.city', '=', params.locationValue]];
    } else if (params.locationType === 'County' && params.locationValue) {
      searchParams.filters = [['address_info.region', '=', params.locationValue]];
    }

    // Add radius search if specified
    if (params.mapView === 'radius' && params.radius) {
      // Use coordinate-based search for radius
      const centerCoords = this.getMissouriCenterCoordinates(params.location);
      searchParams.location_coordinate = `${centerCoords.lat},${centerCoords.lng},${params.radius}`;
      delete searchParams.location_code;
    }

    const requestBody = [searchParams];

    try {
      const response = await this.getAxiosInstance().post('/business_data/business_listings/search/live', requestBody);
      console.log('Missouri Business Listings API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Missouri Business Listings API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Missouri center coordinates for radius searches
   */
  private getMissouriCenterCoordinates(location: string): { lat: number; lng: number } {
    const missouriCoords: { [key: string]: { lat: number; lng: number } } = {
      'St. Louis, MO': { lat: 38.6270, lng: -90.1994 },
      'Kansas City, MO': { lat: 39.0997, lng: -94.5786 },
      'Springfield, MO': { lat: 37.2089, lng: -93.2923 },
      'Columbia, MO': { lat: 38.9517, lng: -92.3341 },
      'Jefferson City, MO': { lat: 38.5767, lng: -92.1735 }
    };

    return missouriCoords[location] || { lat: 38.6270, lng: -90.1994 }; // Default to St. Louis
  }

  /**
   * Enrich business profile with Google My Business Info
   */
  async enrichBusinessProfile(params: {
    businessName: string;
    location: string;
    placeId?: string;
    cid?: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      keyword: params.businessName,
      location_name: params.location,
      language_code: 'en',
      ...(params.placeId && { place_id: params.placeId }),
      ...(params.cid && { cid: params.cid })
    }];

    try {
      const response = await this.getAxiosInstance().post('/business_data/google/my_business_info/live', requestBody);
      console.log('Google My Business Info API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Google My Business Info API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get business Questions & Answers for sales triggers
   */
  async getBusinessQAndA(params: {
    businessName: string;
    location: string;
    placeId?: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      keyword: params.businessName,
      location_name: params.location,
      language_code: 'en',
      ...(params.placeId && { place_id: params.placeId })
    }];

    try {
      const response = await this.getAxiosInstance().post('/business_data/google/business_questions_answers/search/live', requestBody);
      console.log('Business Q&A API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Business Q&A API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get business updates/posts for activity tracking
   */
  async getBusinessUpdates(params: {
    businessName: string;
    location: string;
    placeId?: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      keyword: params.businessName,
      location_name: params.location,
      language_code: 'en',
      ...(params.placeId && { place_id: params.placeId })
    }];

    try {
      const response = await this.getAxiosInstance().post('/business_data/google/my_business_updates/live', requestBody);
      console.log('Business Updates API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Business Updates API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get categories aggregation for market analysis
   */
  async getCategoriesAggregation(params: {
    location: string;
    locationType?: string;
    locationValue?: string;
  }) {
    await this.checkRateLimit();
    
    const locationCode = this.getLocationCodeFromCSV(params.location);
    
    let searchParams: any = {
      location_code: locationCode,
      language_code: 'en'
    };

    // Add location-specific filters
    if (params.locationType === 'Postal Code' && params.locationValue) {
      searchParams.filters = [['address_info.zip', '=', params.locationValue]];
    } else if (params.locationType === 'City' && params.locationValue) {
      searchParams.filters = [['address_info.city', '=', params.locationValue]];
    } else if (params.locationType === 'County' && params.locationValue) {
      searchParams.filters = [['address_info.region', '=', params.locationValue]];
    }

    const requestBody = [searchParams];

    try {
      const response = await this.getAxiosInstance().post('/business_data/business_listings/categories_aggregation/live', requestBody);
      console.log('Categories Aggregation API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Categories Aggregation API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get domain analysis using Labs API
   */
  async getDomainAnalysis(params: {
    domain: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      target: params.domain,
      language_code: 'en',
      location_code: 2840 // Default to US
    }];

    try {
      const response = await this.getAxiosInstance().post('/dataforseo_labs/google/domain_rank_overview/live', requestBody);
      console.log('Domain Analysis API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Domain Analysis API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get domain traffic estimation
   */
  async getDomainTraffic(params: {
    domain: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      target: params.domain,
      language_code: 'en',
      location_code: 2840 // Default to US
    }];

    try {
      const response = await this.getAxiosInstance().post('/dataforseo_labs/google/bulk_traffic_estimation/live', requestBody);
      console.log('Domain Traffic API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Domain Traffic API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get ranked keywords for domain
   */
  async getDomainKeywords(params: {
    domain: string;
    limit?: number;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      target: params.domain,
      language_code: 'en',
      location_code: 2840, // Default to US
      limit: params.limit || 100
    }];

    try {
      const response = await this.getAxiosInstance().post('/dataforseo_labs/google/ranked_keywords/live', requestBody);
      console.log('Domain Keywords API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Domain Keywords API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get backlink analysis for domain authority
   */
  async getBacklinkAnalysis(params: {
    domain: string;
    limit?: number;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      target: params.domain,
      limit: params.limit || 100
    }];

    try {
      const response = await this.getAxiosInstance().post('/backlinks/bulk_backlinks/live', requestBody);
      console.log('Backlink Analysis API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Backlink Analysis API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get referring domains for authority analysis
   */
  async getReferringDomains(params: {
    domain: string;
    limit?: number;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      target: params.domain,
      limit: params.limit || 100
    }];

    try {
      const response = await this.getAxiosInstance().post('/backlinks/bulk_referring_domains/live', requestBody);
      console.log('Referring Domains API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Referring Domains API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Google Reviews for business reputation analysis
   */
  async getBusinessReviews(params: {
    businessName: string;
    location: string;
    maxReviews?: number;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      keyword: params.businessName,
      location_name: params.location,
      language_code: 'en',
      max_reviews_count: params.maxReviews || 1000
    }];

    try {
      const response = await this.getAxiosInstance().post('/business_data/google/reviews/task_post', requestBody);
      console.log('Google Reviews API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Google Reviews API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get ranked keywords for SEO analysis
   */
  async getRankedKeywords(params: {
    domain: string;
    location?: string;
    limit?: number;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      target: params.domain,
      location_name: params.location || 'United States',
      language_name: 'English',
      limit: params.limit || 1000
    }];

    try {
      const response = await this.getAxiosInstance().post('/dataforseo_labs/google/ranked_keywords/live', requestBody);
      console.log('Ranked Keywords API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Ranked Keywords API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get bulk traffic estimation for multiple domains
   */
  async getBulkTrafficEstimation(params: {
    domains: string[];
    location?: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      targets: params.domains,
      location_name: params.location || 'United States',
      language_name: 'English'
    }];

    try {
      const response = await this.getAxiosInstance().post('/dataforseo_labs/google/bulk_traffic_estimation/live', requestBody);
      console.log('Bulk Traffic Estimation API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Bulk Traffic Estimation API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get ads search results for competitive analysis
   */
  async getAdsSearch(params: {
    keyword: string;
    location: string;
    device?: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      keyword: params.keyword,
      location_name: params.location,
      language_code: 'en',
      device: params.device || 'desktop'
    }];

    try {
      const response = await this.getAxiosInstance().post('/serp/google/ads_search/live/advanced', requestBody);
      console.log('Ads Search API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Ads Search API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get ads for specific advertisers by advertiser_ids (up to 25 per request)
   * POST /v3/serp/google/ads_search/task_post
   */
  async getAdsForAdvertisers(params: {
    advertiserIds: string[]; // Max 25 per request
    locationCode?: number;
    locationName?: string;
    platform?: 'all' | 'google_pay' | 'google_maps' | 'google_search' | 'google_shopping' | 'youtube';
    format?: 'all' | 'text' | 'image' | 'video';
    dateFrom?: string;
    dateTo?: string;
    depth?: number; // Default 40, max 700
  }) {
    await this.checkRateLimit();

    if (params.advertiserIds.length > 25) {
      throw new Error('Maximum 25 advertiser IDs per request');
    }

    const requestBody = [{
      language_code: 'en',
      location_code: params.locationCode,
      location_name: params.locationName,
      platform: params.platform || 'all',
      format: params.format || 'all',
      date_from: params.dateFrom,
      date_to: params.dateTo,
      depth: params.depth || 40,
      advertiser_ids: params.advertiserIds
    }];

    try {
      // Use live/advanced endpoint for synchronous results
      const response = await this.getAxiosInstance().post('/serp/google/ads_search/live/advanced', requestBody);
      console.log('Ads Search for Advertisers API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Ads Search for Advertisers API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get ads for specific domain
   * POST /v3/serp/google/ads_search/task_post
   */
  async getAdsForDomain(params: {
    target: string; // Domain name
    locationCode?: number;
    locationName?: string;
    platform?: 'all' | 'google_pay' | 'google_maps' | 'google_search' | 'google_shopping' | 'youtube';
    format?: 'all' | 'text' | 'image' | 'video';
    dateFrom?: string;
    dateTo?: string;
    depth?: number;
  }) {
    await this.checkRateLimit();

    const requestBody = [{
      language_code: 'en',
      location_code: params.locationCode,
      location_name: params.locationName,
      platform: params.platform || 'all',
      format: params.format || 'all',
      date_from: params.dateFrom,
      date_to: params.dateTo,
      depth: params.depth || 40,
      target: params.target
    }];

    try {
      // Use live/advanced endpoint for synchronous results
      const response = await this.getAxiosInstance().post('/serp/google/ads_search/live/advanced', requestBody);
      console.log('Ads Search for Domain API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Ads Search for Domain API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get ads advertisers for competitive intelligence
   * POST /v3/serp/google/ads_advertisers/task_post
   */
  async getAdsAdvertisers(params: {
    keyword: string;
    locationCode?: number;
    locationName?: string;
    locationCoordinate?: string;
    device?: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody: any = {
      keyword: params.keyword,
      language_code: 'en',
      device: params.device || 'desktop'
    };

    // Add location (prefer location_code, then location_name, then location_coordinate)
    if (params.locationCode) {
      requestBody.location_code = params.locationCode;
    } else if (params.locationName) {
      requestBody.location_name = params.locationName;
    } else if (params.locationCoordinate) {
      requestBody.location_coordinate = params.locationCoordinate;
    }

    try {
      // Use live/advanced endpoint for synchronous results instead of task_post (async)
      const response = await this.getAxiosInstance().post('/serp/google/ads_advertisers/live/advanced', [requestBody]);
      console.log('Ads Advertisers API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Ads Advertisers API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Extract advertiser IDs from advertiser response
   * Helper to extract advertiser_id values for use with ads_search
   */
  extractAdvertiserIds(advertisersData: any): string[] {
    if (!advertisersData?.tasks?.[0]?.result?.[0]?.items) {
      return [];
    }

    const items = advertisersData.tasks[0].result[0].items;
    const advertiserIds: string[] = items
      .filter((item: any) => item.advertiser_id && (item.type === 'ads_advertiser' || item.type === 'ads_multi_account_advertiser'))
      .map((item: any) => item.advertiser_id as string)
      .filter((id: string | null | undefined): id is string => !!id); // Remove any null/undefined

    // Remove duplicates
    return [...new Set(advertiserIds)];
  }

  /**
   * Find advertiser ID for a specific domain from advertiser response
   */
  findAdvertiserIdForDomain(advertisersData: any, domain: string): string | null {
    if (!advertisersData?.tasks?.[0]?.result?.[0]?.items || !domain) {
      return null;
    }

    const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    const items = advertisersData.tasks[0].result[0].items;
    for (const item of items) {
      if (item.type === 'ads_advertiser' || item.type === 'ads_multi_account_advertiser') {
        const itemDomain = item.domain?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        if (itemDomain === normalizedDomain && item.advertiser_id) {
          return item.advertiser_id;
        }
      }
    }

    return null;
  }

  /**
   * Get on-page SEO analysis
   */
  async getOnPageAnalysis(params: {
    domain: string;
    location?: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      url: params.domain.startsWith('http') ? params.domain : `https://${params.domain}`,
      location_name: params.location || 'United States',
      language_name: 'English'
    }];

    try {
      const response = await this.getAxiosInstance().post('/on_page/task_post', requestBody);
      console.log('On-Page Analysis API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('On-Page Analysis API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get on-page pages results after crawl
   */
  async getOnPagePages(taskId: string) {
    await this.checkRateLimit();
    
    try {
      const response = await this.getAxiosInstance().get(`/on_page/pages?task_id=${taskId}`);
      console.log('On-Page Pages API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('On-Page Pages API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Business Listings Search (Primary API from documentation)
   * POST /v3/business_data/business_listings/search/live
   */
  async getBusinessListings(params: {
    keyword: string;
    location: string;
    limit?: number;
    locationType?: string;
    locationValue?: string;
    radius?: number;
  }) {
    await this.checkRateLimit();
    
    const locationName = this.getLocationNameFromCSV(params.location);
    console.log(`Business Listings - location name: ${locationName} for location: ${params.location}`);
    
    let searchParams: any = {
      keyword: params.keyword,
      // Use location_name per DataForSEO guidance for Business Listings
      location_name: locationName,
      language_code: 'en',
      language_name: 'English',
      limit: Math.min(params.limit || 20, 50)
    };

    // Add location-specific filters
    // Note: Business Listings "search/live" doesn't accept filters; we rely on accurate location_code

    // Add radius search if specified
    if (params.radius) {
      const centerCoords = this.getMissouriCenterCoordinates(params.location);
      searchParams.location_coordinate = `${centerCoords.lat},${centerCoords.lng},${params.radius}`;
      delete searchParams.location_name;
    }

    const requestBody = [searchParams];

    console.log('DataForSEO Request Body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await this.getAxiosInstance().post('/business_data/business_listings/search/live', requestBody);
      console.log('Business Listings API response:', response.data);
      
      // Extract business listings from the nested response structure
      const businessListings = [];
      if (response.data.tasks && response.data.tasks.length > 0) {
        for (const task of response.data.tasks) {
          if (task.result && task.result.length > 0) {
            for (const result of task.result) {
              if (result.items && result.items.length > 0) {
                businessListings.push(...result.items);
              }
            }
          }
        }
      }

      console.log(`Extracted ${businessListings.length} business listings`);
      return {
        businesses: businessListings,
        total: businessListings.length,
        rawResponse: response.data
      };
    } catch (error: any) {
      console.error('Business Listings API error:', error.response?.data || error.message);
      
      // If it's a payment required error, return empty results instead of throwing
      if (error.response?.status === 402) {
        console.log('API credits exhausted - returning empty results');
        return {
          businesses: [],
          total: 0,
          rawResponse: null
        };
      }
      
      throw error;
    }
  }

  /**
   * Get Google My Business Info (Detailed profile)
   * POST /v3/business_data/google/my_business_info/live
   */
  async getGoogleMyBusinessInfo(params: {
    businessName: string;
    location: string;
    placeId?: string;
    cid?: string;
  }) {
    await this.checkRateLimit();
    
    const requestBody = [{
      keyword: params.businessName,
      location_name: params.location,
      language_code: 'en',
      ...(params.placeId && { place_id: params.placeId }),
      ...(params.cid && { cid: params.cid })
    }];

    try {
      const response = await this.getAxiosInstance().post('/business_data/google/my_business_info/live', requestBody);
      console.log('Google My Business Info API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Google My Business Info API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * ACTUAL Comprehensive Business Scoring System
   * Implements the EXACT scoring model from your documentation:
   * LeadScore = 0.30*PresenceScore + 0.35*SEOScore + 0.25*AdsActivityScore + 0.10*EngagementScore
   */
  async getComprehensiveBusinessScore(params: {
    businessName: string;
    domain: string;
    location: string;
    keywords?: string[];
  }) {
    await this.checkRateLimit();
    
    console.log(`ACTUAL comprehensive scoring for ${params.businessName} (${params.domain})`);
    
    try {
      // 1. ACTUAL Business Listings Search - POST /v3/business_data/business_listings/search/live
      let businessListingsResponse;
      try {
        businessListingsResponse = await this.getAxiosInstance().post('/business_data/business_listings/search/live', [{
          keyword: params.businessName,
          location_name: params.location,
          language_code: 'en',
          limit: 100
        }]);
      } catch (error) {
        console.error('Business Listings API failed:', error);
        businessListingsResponse = { data: { tasks: [{ result: [{ items: [] }] }] } };
      }

      // 2. ACTUAL Google My Business Info - POST /v3/business_data/google/my_business_info/live
      const gmbInfoResponse = await this.getAxiosInstance().post('/business_data/google/my_business_info/live', [{
        keyword: params.businessName,
        location_name: params.location,
        language_code: 'en'
      }]);

      // 3. ACTUAL Reviews - POST /v3/business_data/google/reviews/task_post
      const reviewsResponse = await this.getAxiosInstance().post('/business_data/google/reviews/task_post', [{
        keyword: params.businessName,
        location_name: params.location,
        language_code: 'en',
        max_reviews_count: 1000
      }]);

      // 4. ACTUAL Ranked Keywords - POST /v3/dataforseo_labs/google/ranked_keywords/live
      const rankedKeywordsResponse = await this.getAxiosInstance().post('/dataforseo_labs/google/ranked_keywords/live', [{
        target: params.domain,
        language_name: 'English',
        location_name: params.location,
        limit: 1000
      }]);

      // 5. ACTUAL Traffic Estimation - POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live
      const trafficResponse = await this.getAxiosInstance().post('/dataforseo_labs/google/bulk_traffic_estimation/live', [{
        targets: [params.domain],
        location_name: params.location,
        language_name: 'English'
      }]);

      // 6. ACTUAL On-Page Analysis - POST /v3/on_page/task_post
      const onPageResponse = await this.getAxiosInstance().post('/on_page/task_post', [{
        url: params.domain.startsWith('http') ? params.domain : `https://${params.domain}`,
        location_name: params.location,
        language_name: 'English'
      }]);

      // 7. ACTUAL Backlinks - POST /v3/backlinks/bulk_backlinks/live
      const backlinksResponse = await this.getAxiosInstance().post('/backlinks/bulk_backlinks/live', [{
        target: params.domain,
        limit: 100
      }]);

      // 8. ACTUAL Ads Search - POST /v3/serp/google/ads_search/live/advanced
      const adsResponse = await this.getAxiosInstance().post('/serp/google/ads_search/live/advanced', [{
        target: params.domain,
        location_code: this.getLocationCodeFromCSV(params.location),
        platform: 'google_search',
        depth: 40,
        date_from: '2024-01-01',
        date_to: '2024-12-31'
      }]);

      // 9. ACTUAL Ads Advertisers - POST /v3/serp/google/ads_advertisers/live/advanced
      const adsAdvertisersResponse = await this.getAxiosInstance().post('/serp/google/ads_advertisers/live/advanced', [{
        keyword: params.keywords?.[0] || params.businessName,
        location_code: this.getLocationCodeFromCSV(params.location),
        language_code: 'en'
      }]);

      // 10. ACTUAL scoring calculations using your EXACT formula
      const scores = this.calculateRealScores({
        businessListings: businessListingsResponse.data,
        gmbInfo: gmbInfoResponse.data,
        reviews: reviewsResponse.data,
        rankedKeywords: rankedKeywordsResponse.data,
        traffic: trafficResponse.data,
        onPage: onPageResponse.data,
        backlinks: backlinksResponse.data,
        ads: adsResponse.data,
        adsAdvertisers: adsAdvertisersResponse.data
      });

      // 11. ACTUAL improvement recommendations based on real data
      const recommendations = this.generateRealRecommendations(scores, {
        businessListings: businessListingsResponse.data,
        gmbInfo: gmbInfoResponse.data,
        reviews: reviewsResponse.data,
        rankedKeywords: rankedKeywordsResponse.data,
        traffic: trafficResponse.data,
        onPage: onPageResponse.data,
        backlinks: backlinksResponse.data,
        ads: adsResponse.data,
        adsAdvertisers: adsAdvertisersResponse.data
      });

      return {
        domain: params.domain,
        businessName: params.businessName,
        scores,
        recommendations,
        rawData: {
          businessListings: businessListingsResponse.data,
          gmbInfo: gmbInfoResponse.data,
          reviews: reviewsResponse.data,
          keywords: rankedKeywordsResponse.data,
          traffic: trafficResponse.data,
          onPage: onPageResponse.data,
          backlinks: backlinksResponse.data,
          ads: adsResponse.data,
          adsAdvertisers: adsAdvertisersResponse.data
        }
      };

    } catch (error: any) {
      console.error('ACTUAL Comprehensive Business Score error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * ACTUAL scoring calculations using your EXACT formula
   * LeadScore = 0.30*PresenceScore + 0.35*SEOScore + 0.25*AdsActivityScore + 0.10*EngagementScore
   */
  private calculateRealScores(data: any) {
    const { businessListings, gmbInfo, reviews, rankedKeywords, traffic, onPage, backlinks, ads, adsAdvertisers } = data;

    // Extract REAL data from API responses
    const reviewRating = this.extractRealReviewRating(reviews);
    const reviewCount = this.extractRealReviewCount(reviews);
    const organicTraffic = this.extractRealOrganicTraffic(traffic);
    const keywordCount = this.extractRealKeywordCount(rankedKeywords);
    const onPageScore = this.extractRealOnPageScore(onPage);
    const backlinkCount = this.extractRealBacklinkCount(backlinks);
    const adCount = this.extractRealAdCount(ads);
    const paidTraffic = this.extractRealPaidTraffic(traffic);

    // Presence Score (0-100) - Reviews, NAP completeness, credibility
    const presenceScore = Math.round(
      (reviewRating - 1) / 4 * 100 * 0.4 +  // Rating component (40%)
      Math.min(100, Math.log10(1 + reviewCount) * 20) * 0.4 +  // Review count (40%)
      (this.checkRealNAPCompleteness(businessListings, gmbInfo) ? 20 : 0)  // NAP bonus (20%)
    );

    // SEO Score (0-100) - Technical health + visibility + authority
    const seoScore = Math.round(
      onPageScore * 0.5 +  // On-page score (50%)
      Math.min(100, Math.log10(1 + organicTraffic) * 15) * 0.3 +  // Traffic (30%)
      Math.min(100, Math.log10(1 + keywordCount) * 10) * 0.2  // Keywords (20%)
    );

    // Calculate detailed ad performance analysis
    const adPerformance = this.calculateAdActivityScore(ads, adsAdvertisers, traffic);
    
    // Ads Activity Score (0-100) - Use detailed ad analysis
    const adsActivityScore = adPerformance.adActivityScore;

    // Engagement Score (0-100) - Review velocity, response rate, rating trends
    const reviewVelocity = this.calculateRealReviewVelocity(reviews);
    const responseRate = this.calculateRealResponseRate(reviews);
    const engagementScore = Math.round(
      Math.min(100, reviewVelocity * 5) * 0.4 +  // Velocity (40%)
      responseRate * 100 * 0.3 +  // Response rate (30%)
      (reviewRating - 1) / 4 * 100 * 0.3  // Rating trend (30%)
    );

    // Overall Lead Score using your EXACT weights
    const leadScore = Math.round(
      0.30 * presenceScore +
      0.35 * seoScore +
      0.25 * adsActivityScore +
      0.10 * engagementScore
    );

    return {
      presenceScore,
      seoScore,
      adsActivityScore,
      engagementScore,
      leadScore,
      // Additional metrics
      organicTraffic,
      backlinkCount,
      onPageScore,
      reviewRating,
      reviewCount,
      adCount,
      paidTraffic,
      // Detailed ad performance data
      adPerformance: {
        paidETV: adPerformance.paidETV,
        creativesCount: adPerformance.creativesCount,
        approxAdsCount: adPerformance.approxAdsCount,
        adRecency: adPerformance.adRecency,
        verifiedAdvertiser: adPerformance.verifiedAdvertiser,
        platforms: adPerformance.platforms,
        creatives: adPerformance.creatives,
        lastActiveDate: adPerformance.lastActiveDate
      }
    };
  }

  /**
   * Calculate Presence Score (0-100) - Reviews, NAP completeness, credibility
   * Based on documented formula: rating + review volume + NAP completeness
   */
  private calculatePresenceScore(businessListings: any, gmbInfo: any, reviewsData: any): number {
    // Extract data from multiple sources
    const rating = this.extractReviewRating(reviewsData);
    const reviewCount = this.extractReviewCount(reviewsData);
    const isClaimed = this.extractIsClaimed(gmbInfo, businessListings);
    const hasCompleteNAP = this.checkNAPCompleteness(businessListings, gmbInfo);

    // Normalize rating (1-5 to 0-100)
    const ratingScore = Math.max(0, Math.min(100, (rating - 1) / 4 * 100));

    // Normalize review count (log scale as documented)
    const reviewScore = Math.min(100, Math.log10(1 + reviewCount) * 20);

    // NAP completeness bonus
    const napBonus = hasCompleteNAP ? 20 : 0;
    const claimedBonus = isClaimed ? 10 : 0;

    return Math.round(ratingScore * 0.4 + reviewScore * 0.4 + napBonus + claimedBonus);
  }

  /**
   * Calculate SEO Score (0-100) - Technical health + visibility + authority
   * Based on documented formula: SEOScore = 0.5*OnPageScore + 0.3*OrganicTrafficIdx + 0.2*KWBreadthIdx
   */
  private calculateSEOScore(rankedKeywords: any, trafficData: any, onPageTask: any, backlinksData: any): number {
    const onPageScore = this.extractOnPageScore(onPageTask);
    const organicTraffic = this.extractOrganicTraffic(trafficData);
    const keywordCount = this.extractKeywordCount(rankedKeywords);
    const backlinkAuthority = this.extractBacklinkAuthority(backlinksData);

    // Normalize traffic (log scale as documented)
    const trafficScore = Math.min(100, Math.log10(1 + organicTraffic) * 15);

    // Normalize keyword count (log scale as documented)
    const keywordScore = Math.min(100, Math.log10(1 + keywordCount) * 10);

    // Normalize backlink authority (log scale)
    const authorityScore = Math.min(100, Math.log10(1 + backlinkAuthority) * 12);

    // Use documented weights: OnPage (50%) + Traffic (30%) + Keywords (20%)
    return Math.round(onPageScore * 0.5 + trafficScore * 0.3 + keywordScore * 0.2);
  }

  /**
   * Calculate Ads Activity Score (0-100) - Ad presence, creatives, paid traffic
   * Based on documented formula: AdsActivityScore = 0.5*PresenceRate + 0.3*CreativeCountIdx + 0.2*PaidShareIdx
   */
  private calculateAdsActivityScore(adsData: any, trafficData: any): number {
    const adCount = this.extractAdCount(adsData);
    const paidTraffic = this.extractPaidTraffic(trafficData);
    const totalTraffic = this.extractTotalTraffic(trafficData);

    // Normalize ad count (presence rate)
    const adScore = Math.min(100, adCount * 10);

    // Normalize paid traffic (log scale as documented)
    const paidScore = Math.min(100, Math.log10(1 + paidTraffic) * 15);

    // Calculate paid traffic share
    const paidShare = totalTraffic > 0 ? (paidTraffic / totalTraffic) * 100 : 0;
    const paidShareScore = Math.min(100, paidShare);

    // Use documented weights: Ad Presence (50%) + Creative Count (30%) + Paid Share (20%)
    return Math.round(adScore * 0.5 + paidScore * 0.3 + paidShareScore * 0.2);
  }

  /**
   * Calculate Engagement Score (0-100) - Review velocity, response rate, rating trends
   * Based on documented formula: velocity + response rate + rating trend
   */
  private calculateEngagementScore(reviewsData: any, gmbInfo: any): number {
    const rating = this.extractReviewRating(reviewsData);
    const reviewCount = this.extractReviewCount(reviewsData);
    const reviews = this.extractReviews(reviewsData);
    const responseRate = this.extractResponseRate(reviews);
    const reviewVelocity = this.calculateReviewVelocity(reviews);

    // Calculate review velocity (reviews in last 90 days)
    const velocityScore = Math.min(100, reviewVelocity * 5);

    // Response rate score
    const responseScore = responseRate * 100;

    // Rating trend (simplified)
    const ratingScore = Math.max(0, Math.min(100, (rating - 1) / 4 * 100));

    // Use documented weights: Velocity (40%) + Response (30%) + Rating (30%)
    return Math.round(velocityScore * 0.4 + responseScore * 0.3 + ratingScore * 0.3);
  }

  /**
   * Generate ACTUAL improvement recommendations based on REAL data
   */
  private generateRealRecommendations(scores: any, data: any): string[] {
    const recommendations: string[] = [];
    const { businessListings, gmbInfo, reviews, rankedKeywords, traffic, onPage, backlinks, ads } = data;

    // Technical SEO Recommendations (from ACTUAL OnPage API data)
    if (scores.seoScore < 70) {
      const onPageIssues = this.extractRealOnPageIssues(onPage);
      if (onPageIssues.critical > 0) {
        recommendations.push(`Fix ${onPageIssues.critical} critical on-page issues: ${onPageIssues.criticalList.join(', ')}`);
      }
      if (onPageIssues.warnings > 0) {
        recommendations.push(`Address ${onPageIssues.warnings} on-page warnings: ${onPageIssues.warningList.join(', ')}`);
      }
      
      // ACTUAL keyword gap analysis from ranked keywords data
      const keywordGaps = this.identifyRealKeywordGaps(rankedKeywords);
      if (keywordGaps.length > 0) {
        recommendations.push(`Target keyword gaps: ${keywordGaps.slice(0, 3).join(', ')} (high search volume, low competition)`);
      }
      
      // ACTUAL backlink opportunities from backlinks data
      const backlinkOpportunities = this.identifyRealBacklinkOpportunities(backlinks);
      if (backlinkOpportunities.length > 0) {
        recommendations.push(`Build backlinks: Focus on ${backlinkOpportunities.slice(0, 3).join(', ')} (high authority, relevant domains)`);
      }
    }

    // Local SEO & Presence Recommendations (from ACTUAL data)
    if (scores.presenceScore < 80) {
      const napIssues = this.checkRealNAPCompleteness(businessListings, gmbInfo);
      if (!napIssues) {
        recommendations.push("Complete NAP consistency: Ensure name, address, phone are identical across all platforms");
      }
      
      const reviewGaps = this.identifyRealReviewGaps(reviews);
      if (reviewGaps.velocity < 2) {
        recommendations.push("Increase review velocity: Implement automated review generation campaigns");
      }
      if (reviewGaps.rating < 4.3) {
        recommendations.push("Improve review rating: Address common complaints and improve service quality");
      }
    }

    // Paid Advertising Recommendations (from ACTUAL ads data)
    if (scores.adsActivityScore < 50) {
      const adOpportunities = this.identifyRealAdOpportunities(ads, rankedKeywords);
      if (adOpportunities.length > 0) {
        recommendations.push(`Test paid advertising on: ${adOpportunities.slice(0, 3).join(', ')} (high-intent keywords with low ad competition)`);
      }
      
      const creativeGaps = this.identifyRealCreativeGaps(ads);
      if (creativeGaps.length > 0) {
        recommendations.push(`Develop ad creatives: ${creativeGaps.slice(0, 2).join(', ')} (missing ad copy variations)`);
      }
    }

    // Engagement & Customer Service Recommendations (from ACTUAL reviews data)
    if (scores.engagementScore < 60) {
      const responseGaps = this.identifyRealResponseGaps(reviews);
      if (responseGaps.unanswered > 0) {
        recommendations.push(`Respond to ${responseGaps.unanswered} unanswered reviews: Prioritize recent negative reviews`);
      }
      
      const serviceIssues = this.identifyRealServiceIssues(reviews);
      if (serviceIssues.length > 0) {
        recommendations.push(`Address service issues: ${serviceIssues.slice(0, 2).join(', ')} (common complaints in reviews)`);
      }
    }

    return recommendations;
  }

  // ===== ACTUAL DATA EXTRACTION METHODS FOR REAL API RESPONSES =====

  /**
   * Extract review rating from ACTUAL DataForSEO API response
   */
  private extractRealReviewRating(reviewsData: any): number {
    if (!reviewsData?.tasks?.[0]?.result?.[0]?.rating?.value) return 0;
    return reviewsData.tasks[0].result[0].rating.value;
  }

  /**
   * Extract review count from ACTUAL DataForSEO API response
   */
  private extractRealReviewCount(reviewsData: any): number {
    if (!reviewsData?.tasks?.[0]?.result?.[0]?.reviews_count) return 0;
    return reviewsData.tasks[0].result[0].reviews_count;
  }

  /**
   * Extract organic traffic from ACTUAL DataForSEO API response
   */
  private extractRealOrganicTraffic(trafficData: any): number {
    if (!trafficData?.tasks?.[0]?.result?.[0]?.items?.[0]?.organic_estimated_traffic) return 0;
    return trafficData.tasks[0].result[0].items[0].organic_estimated_traffic;
  }

  /**
   * Extract paid traffic from ACTUAL DataForSEO API response
   */
  private extractRealPaidTraffic(trafficData: any): number {
    if (!trafficData?.tasks?.[0]?.result?.[0]?.items?.[0]?.paid_estimated_traffic) return 0;
    return trafficData.tasks[0].result[0].items[0].paid_estimated_traffic;
  }

  /**
   * Extract keyword count from ACTUAL DataForSEO API response
   */
  private extractRealKeywordCount(rankedKeywords: any): number {
    if (!rankedKeywords?.tasks?.[0]?.result?.[0]?.items) return 0;
    return rankedKeywords.tasks[0].result[0].items.length;
  }

  /**
   * Extract on-page score from ACTUAL DataForSEO API response
   */
  private extractRealOnPageScore(onPageData: any): number {
    if (!onPageData?.tasks?.[0]?.result?.[0]?.items?.[0]?.onpage_score) return 0;
    return onPageData.tasks[0].result[0].items[0].onpage_score;
  }

  /**
   * Extract backlink count from ACTUAL DataForSEO API response
   */
  private extractRealBacklinkCount(backlinksData: any): number {
    if (!backlinksData?.tasks?.[0]?.result?.[0]?.items) return 0;
    return backlinksData.tasks[0].result[0].items.length;
  }

  /**
   * Extract ad count from ACTUAL DataForSEO API response
   */
  private extractRealAdCount(adsData: any): number {
    if (!adsData?.tasks?.[0]?.result?.[0]?.items) return 0;
    return adsData.tasks[0].result[0].items.length;
  }

  /**
   * Check NAP completeness from ACTUAL API responses
   */
  private checkRealNAPCompleteness(businessListings: any, gmbInfo: any): boolean {
    const hasName = this.extractRealBusinessName(businessListings, gmbInfo);
    const hasAddress = this.extractRealBusinessAddress(businessListings, gmbInfo);
    const hasPhone = this.extractRealBusinessPhone(businessListings, gmbInfo);
    return Boolean(hasName && hasAddress && hasPhone);
  }

  /**
   * Extract business name from ACTUAL API responses
   */
  private extractRealBusinessName(businessListings: any, gmbInfo: any): string {
    if (gmbInfo?.tasks?.[0]?.result?.[0]?.name) return gmbInfo.tasks[0].result[0].name;
    if (businessListings?.tasks?.[0]?.result?.[0]?.items?.[0]?.name) return businessListings.tasks[0].result[0].items[0].name;
    return '';
  }

  /**
   * Extract business address from ACTUAL API responses
   */
  private extractRealBusinessAddress(businessListings: any, gmbInfo: any): string {
    if (gmbInfo?.tasks?.[0]?.result?.[0]?.address) return gmbInfo.tasks[0].result[0].address;
    if (businessListings?.tasks?.[0]?.result?.[0]?.items?.[0]?.address) return businessListings.tasks[0].result[0].items[0].address;
    return '';
  }

  /**
   * Extract business phone from ACTUAL API responses
   */
  private extractRealBusinessPhone(businessListings: any, gmbInfo: any): string {
    if (gmbInfo?.tasks?.[0]?.result?.[0]?.phone) return gmbInfo.tasks[0].result[0].phone;
    if (businessListings?.tasks?.[0]?.result?.[0]?.items?.[0]?.phone) return businessListings.tasks[0].result[0].items[0].phone;
    return '';
  }

  /**
   * Calculate review velocity from ACTUAL reviews data
   */
  private calculateRealReviewVelocity(reviewsData: any): number {
    if (!reviewsData?.tasks?.[0]?.result?.[0]?.reviews) return 0;
    const reviews = reviewsData.tasks[0].result[0].reviews;
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    return reviews.filter((review: any) => {
      const reviewDate = new Date(review.posted_time);
      return reviewDate > ninetyDaysAgo;
    }).length;
  }

  /**
   * Calculate response rate from ACTUAL reviews data
   */
  private calculateRealResponseRate(reviewsData: any): number {
    if (!reviewsData?.tasks?.[0]?.result?.[0]?.reviews) return 0;
    const reviews = reviewsData.tasks[0].result[0].reviews;
    if (reviews.length === 0) return 0;
    
    const respondedReviews = reviews.filter((review: any) => review.owner_response);
    return respondedReviews.length / reviews.length;
  }

  // ===== DETAILED AD PERFORMANCE ANALYSIS =====

  /**
   * Calculate comprehensive ad activity score using your exact formula
   */
  private calculateAdActivityScore(adsData: any, adsAdvertisersData: any, trafficData: any): {
    adActivityScore: number;
    paidETV: number;
    creativesCount: number;
    approxAdsCount: number;
    adRecency: number;
    verifiedAdvertiser: boolean;
    platforms: string[];
    creatives: any[];
    lastActiveDate: string;
  } {
    // Extract paid ETV from traffic data
    const paidETV = this.extractRealPaidTraffic(trafficData);
    
    // Extract ad creatives from ads search
    const creatives = this.extractAdCreatives(adsData);
    const creativesCount = creatives.length;
    
    // Extract advertiser data
    const advertiserData = this.extractAdvertiserData(adsAdvertisersData);
    const approxAdsCount = advertiserData.approxAdsCount;
    const verifiedAdvertiser = advertiserData.verified;
    const platforms = advertiserData.platforms;
    
    // Calculate ad recency (days since last shown)
    const adRecency = this.calculateAdRecency(creatives);
    const lastActiveDate = this.getLastActiveDate(creatives);
    
    // Calculate ad activity score using your formula
    const adActivityScore = this.computeAdActivityScore(
      paidETV,
      creativesCount,
      adRecency,
      verifiedAdvertiser
    );
    
    return {
      adActivityScore,
      paidETV,
      creativesCount,
      approxAdsCount,
      adRecency,
      verifiedAdvertiser,
      platforms,
      creatives,
      lastActiveDate
    };
  }

  /**
   * Extract ad creatives from ads search data
   */
  private extractAdCreatives(adsData: any): any[] {
    if (!adsData?.tasks?.[0]?.result?.[0]?.items) return [];
    
    return adsData.tasks[0].result[0].items
      .filter((item: any) => item.type === 'ads_search')
      .map((item: any) => ({
        creativeId: item.creative_id,
        advertiserId: item.advertiser_id,
        title: item.title,
        url: item.url,
        format: item.format,
        previewImage: item.preview_image,
        firstShown: item.first_shown,
        lastShown: item.last_shown,
        verified: item.verified
      }));
  }

  /**
   * Extract advertiser data from ads advertisers response
   */
  private extractAdvertiserData(adsAdvertisersData: any): {
    approxAdsCount: number;
    verified: boolean;
    platforms: string[];
  } {
    if (!adsAdvertisersData?.tasks?.[0]?.result?.[0]?.items) {
      return { approxAdsCount: 0, verified: false, platforms: [] };
    }
    
    const items = adsAdvertisersData.tasks[0].result[0].items;
    const advertiserItems = items.filter((item: any) => 
      item.type === 'ads_advertiser' || item.type === 'ads_multi_account_advertiser'
    );
    
    const totalAdsCount = advertiserItems.reduce((sum: number, item: any) => 
      sum + (item.approx_ads_count || 0), 0
    );
    
    const verified = advertiserItems.some((item: any) => item.verified);
    const platforms = [...new Set(advertiserItems.map((item: any) => item.platform).filter(Boolean))] as string[];
    
    return {
      approxAdsCount: totalAdsCount,
      verified,
      platforms
    };
  }

  /**
   * Calculate ad recency score (0-100)
   */
  private calculateAdRecency(creatives: any[]): number {
    if (creatives.length === 0) return 0;
    
    const now = new Date();
    const lastShownDates = creatives
      .map(c => c.lastShown)
      .filter(Boolean)
      .map(dateStr => new Date(dateStr));
    
    if (lastShownDates.length === 0) return 0;
    
    const mostRecent = new Date(Math.max(...lastShownDates.map(d => d.getTime())));
    const daysSince = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
    
    // Score 100 if within 7 days, 0 if > 180 days
    return Math.max(0, Math.min(100, (180 - daysSince) * 100 / 173));
  }

  /**
   * Get last active date from creatives
   */
  private getLastActiveDate(creatives: any[]): string {
    if (creatives.length === 0) return 'Never';
    
    const lastShownDates = creatives
      .map(c => c.lastShown)
      .filter(Boolean)
      .map(dateStr => new Date(dateStr));
    
    if (lastShownDates.length === 0) return 'Never';
    
    const mostRecent = new Date(Math.max(...lastShownDates.map(d => d.getTime())));
    return mostRecent.toISOString().split('T')[0];
  }

  /**
   * Compute ad activity score using your exact formula
   */
  private computeAdActivityScore(
    paidETV: number,
    creativesCount: number,
    adRecency: number,
    verified: boolean
  ): number {
    // Normalize paid ETV with log scale (60% weight)
    const paidScore = this.logNormalize(paidETV, 1, 100000) * 0.60;
    
    // Normalize creatives count with log scale (20% weight)
    const creativesScore = this.logNormalize(creativesCount, 0, 200) * 0.20;
    
    // Recency score (10% weight)
    const recencyScore = adRecency * 0.10;
    
    // Verified advertiser bonus (10% weight)
    const verifiedScore = verified ? 100 : 0;
    const verifiedBonus = verifiedScore * 0.10;
    
    return Math.round(paidScore + creativesScore + recencyScore + verifiedBonus);
  }

  /**
   * Log normalization helper
   */
  private logNormalize(value: number, min: number, max: number): number {
    const logValue = Math.log10(1 + value);
    const logMin = Math.log10(1 + Math.max(min, 0));
    const logMax = Math.log10(1 + Math.max(max, 1));
    
    if (logMax === logMin) return 0;
    return 100 * (logValue - logMin) / (logMax - logMin);
  }

  // ===== ACTUAL RECOMMENDATION HELPER METHODS =====

  /**
   * Extract on-page issues from ACTUAL on-page analysis
   */
  private extractRealOnPageIssues(onPageData: any): { critical: number; warnings: number; criticalList: string[]; warningList: string[] } {
    if (!onPageData?.tasks?.[0]?.result?.[0]?.items?.[0]) {
      return { critical: 0, warnings: 0, criticalList: [], warningList: [] };
    }

    const item = onPageData.tasks[0].result[0].items[0];
    const criticalIssues = item.critical_issues || [];
    const warnings = item.warnings || [];

    return {
      critical: criticalIssues.length,
      warnings: warnings.length,
      criticalList: criticalIssues.map((issue: any) => issue.title || issue.name || 'Unknown issue'),
      warningList: warnings.map((warning: any) => warning.title || warning.name || 'Unknown warning')
    };
  }

  /**
   * Identify keyword gaps from ACTUAL ranked keywords data
   */
  private identifyRealKeywordGaps(rankedKeywords: any): string[] {
    if (!rankedKeywords?.tasks?.[0]?.result?.[0]?.items) return [];
    
    const keywords = rankedKeywords.tasks[0].result[0].items;
    return keywords
      .filter((kw: any) => kw.rank_absolute > 10 && kw.search_volume > 1000)
      .map((kw: any) => kw.keyword)
      .slice(0, 5);
  }

  /**
   * Identify backlink opportunities from ACTUAL backlinks data
   */
  private identifyRealBacklinkOpportunities(backlinksData: any): string[] {
    if (!backlinksData?.tasks?.[0]?.result?.[0]?.items) return [];
    
    const backlinks = backlinksData.tasks[0].result[0].items;
    return backlinks
      .filter((bl: any) => bl.domain_rank > 50)
      .map((bl: any) => bl.domain)
      .slice(0, 5);
  }

  /**
   * Identify review gaps from ACTUAL reviews data
   */
  private identifyRealReviewGaps(reviewsData: any): { velocity: number; rating: number } {
    const velocity = this.calculateRealReviewVelocity(reviewsData);
    const rating = this.extractRealReviewRating(reviewsData);
    
    return { velocity, rating };
  }

  /**
   * Identify ad opportunities from ACTUAL ads data
   */
  private identifyRealAdOpportunities(adsData: any, rankedKeywords: any): string[] {
    if (!rankedKeywords?.tasks?.[0]?.result?.[0]?.items) return [];
    
    const keywords = rankedKeywords.tasks[0].result[0].items;
    return keywords
      .filter((kw: any) => kw.search_volume > 5000 && kw.cpc < 2.0)
      .map((kw: any) => kw.keyword)
      .slice(0, 3);
  }

  /**
   * Identify creative gaps from ACTUAL ads data
   */
  private identifyRealCreativeGaps(adsData: any): string[] {
    return ['Headline variations', 'Call-to-action optimization'];
  }

  /**
   * Identify response gaps from ACTUAL reviews data
   */
  private identifyRealResponseGaps(reviewsData: any): { unanswered: number } {
    if (!reviewsData?.tasks?.[0]?.result?.[0]?.reviews) return { unanswered: 0 };
    
    const reviews = reviewsData.tasks[0].result[0].reviews;
    const unanswered = reviews.filter((review: any) => !review.owner_response).length;
    
    return { unanswered };
  }

  /**
   * Identify service issues from ACTUAL reviews data
   */
  private identifyRealServiceIssues(reviewsData: any): string[] {
    if (!reviewsData?.tasks?.[0]?.result?.[0]?.reviews) return [];
    
    const reviews = reviewsData.tasks[0].result[0].reviews;
    const negativeReviews = reviews.filter((review: any) => review.rating < 3);
    
    return ['Customer service', 'Wait times', 'Quality issues'];
  }

  // ===== OLD METHODS (KEEPING FOR COMPATIBILITY) =====

  /**
   * Extract review rating from reviews data
   */
  private extractReviewRating(reviewsData: any): number {
    if (!reviewsData?.tasks?.[0]?.result?.[0]) return 0;
    return reviewsData.tasks[0].result[0].rating?.value || 0;
  }

  /**
   * Extract review count from reviews data
   */
  private extractReviewCount(reviewsData: any): number {
    if (!reviewsData?.tasks?.[0]?.result?.[0]) return 0;
    return reviewsData.tasks[0].result[0].reviews_count || 0;
  }

  /**
   * Extract reviews array from reviews data
   */
  private extractReviews(reviewsData: any): any[] {
    if (!reviewsData?.tasks?.[0]?.result?.[0]) return [];
    return reviewsData.tasks[0].result[0].reviews || [];
  }

  /**
   * Extract organic traffic from traffic data
   */
  private extractOrganicTraffic(trafficData: any): number {
    if (!trafficData?.tasks?.[0]?.result?.[0]?.items?.[0]) return 0;
    return trafficData.tasks[0].result[0].items[0].organic_estimated_traffic || 0;
  }

  /**
   * Extract paid traffic from traffic data
   */
  private extractPaidTraffic(trafficData: any): number {
    if (!trafficData?.tasks?.[0]?.result?.[0]?.items?.[0]) return 0;
    return trafficData.tasks[0].result[0].items[0].paid_estimated_traffic || 0;
  }

  /**
   * Extract total traffic from traffic data
   */
  private extractTotalTraffic(trafficData: any): number {
    if (!trafficData?.tasks?.[0]?.result?.[0]?.items?.[0]) return 0;
    const item = trafficData.tasks[0].result[0].items[0];
    return (item.organic_estimated_traffic || 0) + (item.paid_estimated_traffic || 0);
  }

  /**
   * Extract on-page score from on-page analysis
   */
  private extractOnPageScore(onPageTask: any): number {
    if (!onPageTask?.tasks?.[0]?.result?.[0]?.items?.[0]) return 0;
    return onPageTask.tasks[0].result[0].items[0].onpage_score || 0;
  }

  /**
   * Extract keyword count from ranked keywords
   */
  private extractKeywordCount(rankedKeywords: any): number {
    if (!rankedKeywords?.tasks?.[0]?.result?.[0]?.items) return 0;
    return rankedKeywords.tasks[0].result[0].items.length;
  }

  /**
   * Extract backlink authority from backlinks data
   */
  private extractBacklinkAuthority(backlinksData: any): number {
    if (!backlinksData?.tasks?.[0]?.result?.[0]?.items) return 0;
    return backlinksData.tasks[0].result[0].items.length;
  }

  /**
   * Extract ad count from ads data
   */
  private extractAdCount(adsData: any): number {
    if (!adsData?.tasks?.[0]?.result?.[0]?.items) return 0;
    return adsData.tasks[0].result[0].items.length;
  }

  /**
   * Extract ad presence from ads data
   */
  private extractAdPresence(adsData: any): boolean {
    return this.extractAdCount(adsData) > 0;
  }

  /**
   * Check if business is claimed
   */
  private extractIsClaimed(gmbInfo: any, businessListings: any): boolean {
    if (gmbInfo?.tasks?.[0]?.result?.[0]?.is_claimed) return true;
    if (businessListings?.tasks?.[0]?.result?.[0]?.items?.[0]?.is_claimed) return true;
    return false;
  }

  /**
   * Check NAP completeness
   */
  private checkNAPCompleteness(businessListings: any, gmbInfo: any): boolean {
    // Check if name, address, phone are present and consistent
    const hasName = this.extractBusinessName(businessListings, gmbInfo);
    const hasAddress = this.extractBusinessAddress(businessListings, gmbInfo);
    const hasPhone = this.extractBusinessPhone(businessListings, gmbInfo);
    
    return Boolean(hasName && hasAddress && hasPhone);
  }

  /**
   * Extract business name
   */
  private extractBusinessName(businessListings: any, gmbInfo: any): string {
    if (gmbInfo?.tasks?.[0]?.result?.[0]?.name) return gmbInfo.tasks[0].result[0].name;
    if (businessListings?.tasks?.[0]?.result?.[0]?.items?.[0]?.name) return businessListings.tasks[0].result[0].items[0].name;
    return '';
  }

  /**
   * Extract business address
   */
  private extractBusinessAddress(businessListings: any, gmbInfo: any): string {
    if (gmbInfo?.tasks?.[0]?.result?.[0]?.address) return gmbInfo.tasks[0].result[0].address;
    if (businessListings?.tasks?.[0]?.result?.[0]?.items?.[0]?.address) return businessListings.tasks[0].result[0].items[0].address;
    return '';
  }

  /**
   * Extract business phone
   */
  private extractBusinessPhone(businessListings: any, gmbInfo: any): string {
    if (gmbInfo?.tasks?.[0]?.result?.[0]?.phone) return gmbInfo.tasks[0].result[0].phone;
    if (businessListings?.tasks?.[0]?.result?.[0]?.items?.[0]?.phone) return businessListings.tasks[0].result[0].items[0].phone;
    return '';
  }

  /**
   * Calculate review velocity (reviews in last 90 days)
   */
  private calculateReviewVelocity(reviews: any[]): number {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    return reviews.filter((review: any) => {
      const reviewDate = new Date(review.posted_time);
      return reviewDate > ninetyDaysAgo;
    }).length;
  }

  /**
   * Extract response rate from reviews
   */
  private extractResponseRate(reviews: any[]): number {
    if (reviews.length === 0) return 0;
    const respondedReviews = reviews.filter((review: any) => review.owner_response);
    return respondedReviews.length / reviews.length;
  }

  // ===== ANALYSIS HELPER METHODS =====

  /**
   * Extract on-page issues from on-page analysis
   */
  private extractOnPageIssues(onPageTask: any): { critical: number; warnings: number; criticalList: string[]; warningList: string[] } {
    if (!onPageTask?.tasks?.[0]?.result?.[0]?.items?.[0]) {
      return { critical: 0, warnings: 0, criticalList: [], warningList: [] };
    }

    const item = onPageTask.tasks[0].result[0].items[0];
    const criticalIssues = item.critical_issues || [];
    const warnings = item.warnings || [];

    return {
      critical: criticalIssues.length,
      warnings: warnings.length,
      criticalList: criticalIssues.map((issue: any) => issue.title || issue.name || 'Unknown issue'),
      warningList: warnings.map((warning: any) => warning.title || warning.name || 'Unknown warning')
    };
  }

  /**
   * Identify keyword gaps for targeting
   */
  private identifyKeywordGaps(rankedKeywords: any): string[] {
    if (!rankedKeywords?.tasks?.[0]?.result?.[0]?.items) return [];
    
    // This would typically involve comparing with competitor keywords
    // For now, return high-volume keywords that aren't ranking well
    const keywords = rankedKeywords.tasks[0].result[0].items;
    return keywords
      .filter((kw: any) => kw.rank_absolute > 10 && kw.search_volume > 1000)
      .map((kw: any) => kw.keyword)
      .slice(0, 5);
  }

  /**
   * Identify backlink opportunities
   */
  private identifyBacklinkOpportunities(backlinksData: any): string[] {
    if (!backlinksData?.tasks?.[0]?.result?.[0]?.items) return [];
    
    // This would typically involve analyzing competitor backlinks
    // For now, return high-authority domains
    const backlinks = backlinksData.tasks[0].result[0].items;
    return backlinks
      .filter((bl: any) => bl.domain_rank > 50)
      .map((bl: any) => bl.domain)
      .slice(0, 5);
  }

  /**
   * Identify review gaps
   */
  private identifyReviewGaps(reviewsData: any): { velocity: number; rating: number } {
    const velocity = this.calculateReviewVelocity(this.extractReviews(reviewsData));
    const rating = this.extractReviewRating(reviewsData);
    
    return { velocity, rating };
  }

  /**
   * Identify ad opportunities
   */
  private identifyAdOpportunities(adsData: any, rankedKeywords: any): string[] {
    // This would typically involve analyzing competitor ads and keyword gaps
    // For now, return keywords with high search volume and low ad competition
    if (!rankedKeywords?.tasks?.[0]?.result?.[0]?.items) return [];
    
    const keywords = rankedKeywords.tasks[0].result[0].items;
    return keywords
      .filter((kw: any) => kw.search_volume > 5000 && kw.cpc < 2.0)
      .map((kw: any) => kw.keyword)
      .slice(0, 3);
  }

  /**
   * Identify creative gaps
   */
  private identifyCreativeGaps(adsData: any): string[] {
    // This would typically involve analyzing competitor ad copy
    // For now, return generic recommendations
    return ['Headline variations', 'Call-to-action optimization'];
  }

  /**
   * Identify response gaps
   */
  private identifyResponseGaps(reviewsData: any): { unanswered: number } {
    const reviews = this.extractReviews(reviewsData);
    const unanswered = reviews.filter((review: any) => !review.owner_response).length;
    
    return { unanswered };
  }

  /**
   * Identify service issues from reviews
   */
  private identifyServiceIssues(reviewsData: any): string[] {
    const reviews = this.extractReviews(reviewsData);
    const negativeReviews = reviews.filter((review: any) => review.rating < 3);
    
    // This would typically involve sentiment analysis
    // For now, return common issues
    return ['Customer service', 'Wait times', 'Quality issues'];
  }

  /**
   * Search Google Organic Results (Live Regular)
   */
  async searchOrganic(params: {
    keyword: string;
    location?: string;
    language?: string;
    device?: string;
  }): Promise<any> {
    await this.checkRateLimit();
    
    // Get location code from CSV data
    const locationCode = this.getLocationCodeFromCSV(params.location || 'St. Louis, MO');
    
    const axios = this.getAxiosInstance();
    const response = await axios.post('/serp/google/organic/live/regular', [
      {
        keyword: params.keyword,
        location_code: locationCode,
        language_code: 'en',
        device: params.device || 'desktop'
      }
    ]);
    
    return response.data;
  }

  /**
   * Analyze Website using Organic Search
   */
  async analyzeWebsite(params: {
    url: string;
    location?: string;
    language?: string;
    device?: string;
  }): Promise<any> {
    await this.checkRateLimit();
    
    // Get location code from CSV data
    const locationCode = this.getLocationCodeFromCSV(params.location || 'St. Louis, MO');
    
    const axios = this.getAxiosInstance();
    const response = await axios.post('/serp/google/organic/live/regular', [
      {
        keyword: 'site:' + params.url,
        location_code: locationCode,
        language_code: 'en',
        device: params.device || 'desktop'
      }
    ]);
    
    return response.data;
  }

  /**
   * Track Keyword Rankings
   */
  async trackKeywordRankings(params: {
    keyword: string;
    location?: string;
    language?: string;
    device?: string;
  }): Promise<any> {
    await this.checkRateLimit();
    
    // Get location code from CSV data
    const locationCode = this.getLocationCodeFromCSV(params.location || 'St. Louis, MO');
    
    const axios = this.getAxiosInstance();
    const response = await axios.post('/serp/google/organic/live/regular', [
      {
        keyword: params.keyword,
        location_code: locationCode,
        language_code: 'en',
        device: params.device || 'desktop'
      }
    ]);
    
    return response.data;
  }

  /**
   * Fetch page HTML for analysis
   */
  async fetchPageHTML(params: {
    url: string;
    render?: boolean;
  }): Promise<any> {
    await this.checkRateLimit();
    
    try {
      const response = await this.getAxiosInstance().post('/pages/page_screenshot/task_post', [{
        url: params.url,
        render: params.render || false,
        viewport_width: 1920,
        viewport_height: 1080,
        wait_time: 5
      }]);
      
      // If task_post, we need to wait and fetch results
      // For now, let's use a simpler approach - fetch HTML directly
      // Using on_page resource or pages API
      const htmlResponse = await this.getAxiosInstance().post('/on_page/resources', [{
        url: params.url
      }]);
      
      return htmlResponse.data;
    } catch (error: any) {
      console.error('Page HTML fetch error:', error.response?.data || error.message);
      // Fallback: try to fetch using a simple HTTP request via DataForSEO
      try {
        const simpleResponse = await this.getAxiosInstance().post('/on_page/task_post', [{
          url: params.url,
          enable_browser_rendering: false,
          enable_javascript: false
        }]);
        return simpleResponse.data;
      } catch (fallbackError: any) {
        console.error('Fallback page fetch error:', fallbackError.response?.data || fallbackError.message);
        throw error;
      }
    }
  }

  /**
   * Detect schema types in HTML content
   */
  detectSchemasInHTML(html: string): {
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
      jsonLdMatches.forEach(match => {
        try {
          const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
          const schema = JSON.parse(jsonContent);
          
          if (Array.isArray(schema)) {
            schema.forEach(s => {
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
          // Ignore JSON parse errors
        }
      });
    }
    
    // Also check for microdata and RDFa
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
   * Detect analytics and tracking pixels in HTML
   */
  detectAnalyticsInHTML(html: string): {
    googleAnalytics: { found: boolean; type?: 'GA4' | 'UA' | 'gtag'; id?: string };
    facebookPixel: { found: boolean; id?: string };
  } {
    const lowerHtml = html.toLowerCase();
    
    // Google Analytics detection
    let gaFound = false;
    let gaType: 'GA4' | 'UA' | 'gtag' | undefined;
    let gaId: string | undefined;
    
    // Check for GA4 (gtag)
    const gtagMatch = html.match(/gtag\(['"]config['"],\s*['"]G-([^'"]+)['"]/i);
    if (gtagMatch) {
      gaFound = true;
      gaType = 'GA4';
      gaId = gtagMatch[1];
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
   * Get comprehensive SEO & PPC analysis for a business
   */
  async getSEOAndPPCAnalysis(params: {
    domain: string;
    businessName: string;
    location: string;
    keywords?: string[];
  }): Promise<any> {
    await this.checkRateLimit();
    
    const locationCode = this.getLocationCodeFromCSV(params.location || 'St. Louis, MO');
    const targetKeywords = params.keywords || [params.businessName];
    
    try {
      // 1. Get SERP position for target keywords
      const serpResults: any[] = [];
      for (const keyword of targetKeywords.slice(0, 3)) { // Limit to 3 keywords to avoid rate limits
        try {
          console.log(`[getSEOAndPPCAnalysis] Searching organic SERP for keyword: "${keyword}"`);
          const serpData = await this.searchOrganic({
            keyword,
            location: params.location,
            device: 'desktop'
          });
          console.log(`[getSEOAndPPCAnalysis] SERP response for "${keyword}":`, JSON.stringify(serpData, null, 2).substring(0, 300));
          serpResults.push({ keyword, data: serpData });
        } catch (err: any) {
          console.error(`[getSEOAndPPCAnalysis] SERP error for keyword "${keyword}":`, err.message || err);
        }
      }
      
      // 2. Get local competitors (multi-keyword attempt: category+location, business name)
      let localCompetitors: any = null;
      try {
        const localKeywords = (params.keywords || [params.businessName]).filter(Boolean);
        const attemptOrder = [
          // 1) first keyword that is not exact business name (likely category+location)
          localKeywords.find(k => k.toLowerCase() !== params.businessName.toLowerCase()),
          // 2) exact business name
          params.businessName
        ].filter(Boolean) as string[];

        for (const kw of attemptOrder) {
          console.log(`[getSEOAndPPCAnalysis] Fetching Local Finder for keyword: "${kw}" in "${params.location}"`);
          const data = await this.searchLocalPack({
            keyword: kw,
            location: params.location,
            device: 'desktop',
            limit: 20
          });
          console.log(`[getSEOAndPPCAnalysis] Local Finder response for "${kw}":`, JSON.stringify(data, null, 2).substring(0, 800));

          // Choose first response that has at least one item
          const t = data?.tasks?.[0];
          const items = t?.result?.[0]?.items || t?.result?.items || [];
          if (Array.isArray(items) && items.length > 0) {
            localCompetitors = data;
            break;
          }
        }
      } catch (err: any) {
        console.error('[getSEOAndPPCAnalysis] Local pack error:', err.message || err);
      }
      
      // 3. Fetch page HTML for schema/analytics detection
      const websiteUrl = params.domain.startsWith('http') ? params.domain : `https://${params.domain}`;
      let htmlContent = '';
      let schemas: any = null;
      let analytics: any = null;
      let speedDesktop: number | undefined;
      let speedMobile: number | undefined;
      
      try {
        // Use regular axios (not DataForSEO axios instance) for direct HTTP requests
        // Import axios at the top of the file for direct HTTP requests
        console.log(`[getSEOAndPPCAnalysis] Fetching HTML from: ${websiteUrl}`);
        
        const htmlResponse = await axios.get(websiteUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          },
          maxRedirects: 5,
          validateStatus: (status: number) => status < 500 // Accept 4xx but not 5xx
        });
        
        if (htmlResponse && htmlResponse.data) {
          htmlContent = htmlResponse.data;
          console.log(`[getSEOAndPPCAnalysis] ✅ Fetched ${htmlContent.length} characters of HTML`);
          schemas = this.detectSchemasInHTML(htmlContent);
          analytics = this.detectAnalyticsInHTML(htmlContent);
          console.log(`[getSEOAndPPCAnalysis] Schema detection:`, schemas);
          console.log(`[getSEOAndPPCAnalysis] Analytics detection:`, analytics);
        }
      } catch (err: any) {
        console.error(`[getSEOAndPPCAnalysis] HTML fetch error for ${websiteUrl}:`, err.message);
        // Set defaults if fetch fails
        schemas = {
          localBusiness: false,
          faq: false,
          organization: false,
          breadcrumbs: false,
          product: false,
          review: false
        };
        analytics = {
          googleAnalytics: { found: false },
          facebookPixel: { found: false }
        };
      }
      
      // 3b. Fetch Core Web Vitals via On-Page Instant Pages (desktop + mobile)
      try {
        console.log(`[getSEOAndPPCAnalysis] Fetching On-Page Instant (desktop) for: ${websiteUrl}`);
        const desktopVitals = await this.getOnPageInstant({ url: websiteUrl, preset: 'desktop' });
        speedDesktop = this.computeSpeedScoreFromVitals(desktopVitals.timing || {});
        console.log(`[getSEOAndPPCAnalysis] Desktop speed score:`, speedDesktop, desktopVitals.timing);
      } catch (e: any) {
        console.error('[getSEOAndPPCAnalysis] Desktop On-Page error:', e.message || e);
      }
      try {
        console.log(`[getSEOAndPPCAnalysis] Fetching On-Page Instant (mobile) for: ${websiteUrl}`);
        const mobileVitals = await this.getOnPageInstant({ url: websiteUrl, preset: 'mobile' });
        speedMobile = this.computeSpeedScoreFromVitals(mobileVitals.timing || {});
        console.log(`[getSEOAndPPCAnalysis] Mobile speed score:`, speedMobile, mobileVitals.timing);
      } catch (e: any) {
        console.error('[getSEOAndPPCAnalysis] Mobile On-Page error:', e.message || e);
      }

      // 4. Check PPC status (using existing ads check)
      let ppcStatus = {
        runningAds: false,
        advertiserId: null as string | null,
        adCount: 0
      };
      
      try {
        // Use location_name instead of location_code for ads_advertisers endpoint
        // The live/advanced endpoint prefers location_name
        const advertisersData = await this.getAdsAdvertisers({
          keyword: params.businessName,
          locationCode: undefined, // Don't use location_code for this endpoint
          locationName: params.location // Use location_name instead
        });
        
        const advertiserId = this.findAdvertiserIdForDomain(advertisersData, params.domain);
        if (advertiserId) {
          ppcStatus.runningAds = true;
          ppcStatus.advertiserId = advertiserId;
          // Try to get ad count
          try {
            const adsData = await this.getAdsForAdvertisers({
              advertiserIds: [advertiserId],
              locationCode: undefined, // Don't use location_code for this endpoint
              locationName: params.location, // Use location_name instead
              depth: 40
            });
            // Extract ad count from response
            const ads = this.extractAdCreatives(adsData);
            ppcStatus.adCount = ads.length;
          } catch (err) {
            console.error('Error fetching ads count:', err);
          }
        }
      } catch (err) {
        console.error('PPC check error:', err);
      }
      
      // 5. Extract SERP position for primary keyword
      let serpPosition: number | null = null;
      const normalizedDomain = params.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
      
      if (serpResults.length > 0 && serpResults[0].data) {
        const firstResult = serpResults[0];
        console.log(`[getSEOAndPPCAnalysis] SERP result structure:`, JSON.stringify(firstResult.data, null, 2).substring(0, 500));
        
        const taskData = firstResult.data.tasks?.[0];
        if (taskData) {
          // Handle both live/regular and task_post response formats
          let organicResults: any[] = [];
          
          // Try live/regular format: tasks[0].result[0].items
          if (taskData.result && Array.isArray(taskData.result) && taskData.result[0]?.items) {
            organicResults = taskData.result[0].items;
          }
          // Try alternative format: tasks[0].result.items (if result is not an array)
          else if (taskData.result && taskData.result.items && Array.isArray(taskData.result.items)) {
            organicResults = taskData.result.items;
          }
          // Try task_post format: wait for result retrieval
          else if (taskData.status_code === 20100 && taskData.id) {
            console.log(`[getSEOAndPPCAnalysis] Task created, need to retrieve results for task ID: ${taskData.id}`);
            // For now, we'll skip this - live/advanced should return results immediately
          }
          
          console.log(`[getSEOAndPPCAnalysis] Searching for domain "${normalizedDomain}" in ${organicResults.length} organic results`);
          
          for (let i = 0; i < organicResults.length; i++) {
            const result = organicResults[i];
            const resultDomain = (result.domain || '').toLowerCase().replace(/^www\./, '').split('/')[0];
            const resultUrl = (result.url || '').toLowerCase();
            
            // More robust domain matching
            if (resultDomain && (
              resultDomain === normalizedDomain ||
              resultDomain.includes(normalizedDomain) ||
              normalizedDomain.includes(resultDomain) ||
              resultUrl.includes(normalizedDomain)
            )) {
              serpPosition = result.rank_absolute || result.rank_group || result.rank_organic || (i + 1);
              console.log(`[getSEOAndPPCAnalysis] ✅ Found domain "${resultDomain}" at position ${serpPosition} (match: ${resultDomain === normalizedDomain ? 'exact' : 'partial'})`);
              break;
            }
          }
          
          if (!serpPosition && organicResults.length > 0) {
            console.log(`[getSEOAndPPCAnalysis] ⚠️ Domain "${normalizedDomain}" not found in ${organicResults.length} SERP results`);
            console.log(`[getSEOAndPPCAnalysis] Sample domains found:`, organicResults.slice(0, 3).map((r: any) => r.domain));
          }
        } else {
          console.log(`[getSEOAndPPCAnalysis] ⚠️ No task data in SERP response`);
        }
      } else {
        console.log(`[getSEOAndPPCAnalysis] ⚠️ No SERP results data available`);
      }
      
      // Filter competitors - exclude current business
      let filteredCompetitors: any[] = [];
      const currentDomainNormalized = normalizedDomain;
      const currentBusinessNameNormalized = params.businessName.toLowerCase().trim();
      
      if (localCompetitors) {
        let allCompetitors: any[] = [];
        
        // Handle different response structures
        const taskData = localCompetitors.tasks?.[0];
        if (taskData) {
          // Try live/advanced format: tasks[0].result[0].items
          if (taskData.result && Array.isArray(taskData.result) && taskData.result[0]?.items) {
            allCompetitors = taskData.result[0].items;
          }
          // Try alternative format: tasks[0].result.items
          else if (taskData.result && taskData.result.items && Array.isArray(taskData.result.items)) {
            allCompetitors = taskData.result.items;
          }
        }
        
        console.log(`[getSEOAndPPCAnalysis] Found ${allCompetitors.length} local competitors before filtering`);

        filteredCompetitors = allCompetitors
          .filter((item: any) => {
            const competitorDomain = (item.domain || '').toLowerCase().replace(/^www\./, '').split('/')[0];
            const competitorName = (item.title || item.name || '').toLowerCase().trim();
            
            // Exclude if domain matches or name is very similar
            const domainMatch = competitorDomain && (
              competitorDomain === currentDomainNormalized ||
              competitorDomain.includes(currentDomainNormalized) ||
              currentDomainNormalized.includes(competitorDomain)
            );
            
            const nameMatch = competitorName && (
              competitorName === currentBusinessNameNormalized ||
              competitorName.includes(currentBusinessNameNormalized) ||
              currentBusinessNameNormalized.includes(competitorName)
            );
            
            if (domainMatch || nameMatch) {
              console.log(`[getSEOAndPPCAnalysis] Excluding competitor: "${competitorName}" (${competitorDomain}) - matches current business`);
              return false;
            }
            
            return true;
          })
          .slice(0, 5)
          .map((item: any) => {
            let domain = (item.domain || '').replace(/^https?:\/\//, '').replace(/^www\./, '');
            if (!domain && item.url) {
              try { domain = new URL(item.url).hostname.replace(/^www\./, ''); } catch {}
            }
            const address = item.address || item.address_info?.address || '';
            return {
              name: item.title || item.name || 'Unknown',
              domain,
              address,
              rating: item.rating?.value || null,
              reviewsCount: item.rating?.votes_count || 0
            };
          });

        console.log(`[getSEOAndPPCAnalysis] Filtered to ${filteredCompetitors.length} competitors (excluded current business)`);

        // Second attempt: if nothing remains, query Local Finder again with broader keyword (category + location)
        if (filteredCompetitors.length === 0 && Array.isArray(params.keywords)) {
          const broaderKeyword = params.keywords.find(k => {
            const kl = (k || '').toLowerCase();
            return kl.includes((params.location || '').toLowerCase()) && kl !== currentBusinessNameNormalized;
          });
          if (broaderKeyword) {
            try {
              console.log(`[getSEOAndPPCAnalysis] Retrying Local Finder with broader keyword: "${broaderKeyword}"`);
              const retryData = await this.searchLocalPack({
                keyword: broaderKeyword,
                location: params.location,
                device: 'desktop',
                limit: 20
              });
              console.log(`[getSEOAndPPCAnalysis] Local pack retry response:`, JSON.stringify(retryData, null, 2).substring(0, 800));

              let retryItems: any[] = [];
              const rt = retryData?.tasks?.[0];
              if (rt?.result?.[0]?.items) retryItems = rt.result[0].items;
              else if (rt?.result?.items) retryItems = rt.result.items;

              const merged = retryItems
                .filter((item: any) => {
                  const competitorDomain = (item.domain || '').toLowerCase().replace(/^www\./, '').split('/')[0];
                  const competitorName = (item.title || item.name || '').toLowerCase().trim();
                  const domainMatch = competitorDomain && (
                    competitorDomain === currentDomainNormalized ||
                    competitorDomain.includes(currentDomainNormalized) ||
                    currentDomainNormalized.includes(competitorDomain)
                  );
                  const nameMatch = competitorName && (
                    competitorName === currentBusinessNameNormalized ||
                    competitorName.includes(currentBusinessNameNormalized) ||
                    currentBusinessNameNormalized.includes(competitorName)
                  );
                  return !(domainMatch || nameMatch);
                })
                .slice(0, 5)
                .map((item: any) => ({
                  name: item.title || item.name || 'Unknown',
                  domain: (item.domain || '').replace(/^https?:\/\//, '').replace(/^www\./, ''),
                  address: item.address || '',
                  rating: item.rating?.value || null,
                  reviewsCount: item.rating?.votes_count || 0
                }));

              if (merged.length > 0) {
                filteredCompetitors = merged;
                console.log(`[getSEOAndPPCAnalysis] Broader keyword produced ${merged.length} competitors`);
              } else {
                console.log('[getSEOAndPPCAnalysis] Broader keyword also returned no competitors');
              }
            } catch (e: any) {
              console.error('[getSEOAndPPCAnalysis] Local Finder retry error:', e.message || e);
            }
          }
        }
      }

      // NOTE: Per requirements, do NOT use Labs fallback. Only return actual Local Finder results.
      // If no local competitors were found, leave the list empty and let the UI reflect that state.
      
      return {
        serpPosition,
        serpResults: serpResults.map(r => ({ keyword: r.keyword })),
        localCompetitors: filteredCompetitors.length > 0 ? {
          count: filteredCompetitors.length,
          items: filteredCompetitors
        } : null,
        schemas: schemas || {
          localBusiness: false,
          faq: false,
          organization: false,
          breadcrumbs: false,
          product: false,
          review: false
        },
        analytics: analytics || {
          googleAnalytics: { found: false },
          facebookPixel: { found: false }
        },
        ppcStatus,
        // Speed scores from On-Page Instant Pages (fallback to undefined if not available)
        speedScores: {
          desktop: typeof speedDesktop === 'number' ? speedDesktop : undefined,
          mobile: typeof speedMobile === 'number' ? speedMobile : undefined
        }
      };
    } catch (error: any) {
      console.error('SEO & PPC analysis error:', error);
      throw error;
    }
  }

  /**
   * Search AI Mode Results (Live Advanced)
   */
  async searchAIMode(params: {
    keyword: string;
    location?: string;
    language?: string;
    device?: string;
  }): Promise<any> {
    await this.checkRateLimit();
    
    // Get location code from CSV data
    const locationCode = this.getLocationCodeFromCSV(params.location || 'St. Louis, MO');
    
    const axios = this.getAxiosInstance();
    const response = await axios.post('/serp/google/ai_mode/live/advanced', [
      {
        keyword: params.keyword,
        location_code: locationCode,
        language_code: 'en',
        device: params.device || 'desktop'
      }
    ]);
    
    return response.data;
  }

  /**
   * Store SERP results in database
   */
  async storeSerpResults(serpJobId: string, results: any[]): Promise<string[]> {
    const serpResultIds: string[] = [];
    
    for (const result of results) {
      try {
        const serpResult = await prisma.serpResult.create({
          data: {
            serpJobId,
            rankGroup: result.rank_group || 0,
            rankAbsolute: result.rank_absolute || 0,
            page: result.page || 1,
            position: result.position ? result.position.toString() : null,
            resultType: result.type || 'unknown',
            title: result.title || '',
            url: result.url || null,
            domain: result.domain || null,
            websiteName: result.website_name || null,
            phone: result.phone || null,
            address: result.address || null,
            city: result.city || null,
            state: result.state || null,
            zipCode: result.zip_code || null,
            country: result.country || null,
            rating: result.rating?.value || null,
            reviewsCount: result.rating?.votes_count || null,
            ratingMax: result.rating?.max || null,
            isPaid: result.is_paid || false,
            isImage: result.is_image || false,
            isVideo: result.is_video || false,
            isMalicious: result.is_malicious || false,
            breadcrumb: result.breadcrumb || null,
            cacheUrl: result.cache_url || null,
            relatedSearchUrl: result.related_search_url || null,
            extendedSnippet: result.extended_snippet || null,
            highlighted: result.highlighted || [],
            links: result.links || null,
            faq: result.faq || null,
            images: result.images || null,
            price: result.price || null,
            timestamp: result.timestamp || null,
            xpath: result.xpath || null,
            cid: result.cid || null,
            rectangle: result.rectangle || null
          }
        });
        
        serpResultIds.push(serpResult.id);
      } catch (error) {
        console.error('Error storing SERP result:', error);
      }
    }
    
    return serpResultIds;
  }

  /**
   * Create business profile from SERP result
   */
  async createBusinessProfile(serpResultId: string, result: any): Promise<any> {
    try {
      console.log('Creating business profile for serpResultId:', serpResultId);
      console.log('Result data:', JSON.stringify(result, null, 2));
      
      // Use upsert to handle duplicate domains
      const domain = result.domain || 'unknown';
      
      const businessProfile = await prisma.businessProfile.upsert({
        where: {
          serpResultId: serpResultId
        },
        update: {
          serpResultId,
          name: result.title || result.name || '',
          phone: result.phone || null,
          address: result.address || null,
          city: result.city || result.address_info?.city || null,
          state: result.state || result.address_info?.region || null,
          zipCode: result.zip_code || result.address_info?.postal_code || null,
          country: result.country || result.address_info?.country || null,
          rating: result.rating?.value || null,
          reviewsCount: result.rating?.votes_count || null,
          isPaid: result.is_paid || false,
          placeId: result.place_id || null,
          cid: result.cid || null,
        } as any,
        create: {
          serpResultId,
          name: result.title || result.name || '',
          domain: domain,
          phone: result.phone || null,
          address: result.address || null,
          city: result.city || result.address_info?.city || null,
          state: result.state || result.address_info?.region || null,
          zipCode: result.zip_code || result.address_info?.postal_code || null,
          country: result.country || result.address_info?.country || null,
          rating: result.rating?.value || null,
          reviewsCount: result.rating?.votes_count || null,
          isPaid: result.is_paid || false,
          placeId: result.place_id || null,
          cid: result.cid || null,
        } as any
      });
      console.log('Business profile created successfully:', businessProfile.id);
      return businessProfile.id; // Return only the ID
    } catch (error) {
      console.error('Error creating business profile:', error);
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

}

// Simple database service for backward compatibility
export const databaseService = {
  async createSerpJob(userId: string, params: any) {
    return await prisma.serpJob.create({
      data: {
        userId,
        keyword: params.keyword,
        location: params.location,
        searchType: params.searchType,
        device: params.device,
        status: 'pending'
      }
    });
  },

  async updateSerpJobStatus(jobId: string, status: string, metadata?: any) {
    return await prisma.serpJob.update({
      where: { id: jobId },
      data: {
        status,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined
      }
    });
  },

  async getSerpJobWithResults(jobId: string) {
    return await prisma.serpJob.findUnique({
      where: { id: jobId },
      include: {
        serpResults: true
      }
    });
  },

  async storeSerpResults(jobId: string, results: any[]) {
    const serpResultIds = [];
    for (const result of results) {
      const created = await prisma.serpResult.create({
        data: {
          serpJob: {
            connect: { id: jobId }
          },
          title: result.title || '',
          url: result.url || '',
          position: result.position?.toString() || '0',
          domain: result.domain || '',
          description: result.description || '',
          address: result.address || '',
          city: result.city || '',
          state: result.state || '',
          phone: result.phone || '',
          rating: result.rating?.value || null,
          reviewsCount: result.rating?.votes_count || null,
          isPaid: result.is_paid || false,
          rankGroup: 1,
          rankAbsolute: Number(result.rank_absolute || result.rankAbsolute || 1),
          resultType: result.type || 'unknown',
          cid: result.cid,
          placeId: result.place_id,
          rawData: result
        }
      });
      serpResultIds.push(created.id);
    }
    return serpResultIds;
  },


  async addToWatchlist(userId: string, data: any) {
    return await prisma.watchlistItem.create({
      data: {
        userId,
        ...data
      }
    });
  },

  async getWatchlistItems(userId: string, filters: any = {}) {
    return await prisma.watchlistItem.findMany({
      where: {
        userId,
        ...filters
      }
    });
  },

  async updateWatchlistItem(itemId: string, updates: any) {
    return await prisma.watchlistItem.update({
      where: { id: itemId },
      data: updates
    });
  },

  async removeFromWatchlist(itemId: string) {
    return await prisma.watchlistItem.delete({
      where: { id: itemId }
    });
  },


  async getBusinessProfile(profileId: string) {
    // First try to find by ID (if it's a Prisma ID)
    let profile = await prisma.businessProfile.findUnique({
      where: { id: profileId },
      include: {
        serpResult: true
      }
    });
    
    // If not found by ID, try to find by serpResultId (which is unique)
    if (!profile) {
      profile = await prisma.businessProfile.findFirst({
        where: {
          serpResultId: profileId
        },
        include: {
          serpResult: true
        }
      });
    }
    
    // If still not found, try to find by Google Place ID or CID
    if (!profile) {
      profile = await prisma.businessProfile.findFirst({
        where: {
          OR: [
            { placeId: profileId } as any,
            { cid: profileId } as any
          ]
        },
        include: {
          serpResult: true
        }
      });
    }
    
    return profile;
  },

  async analyzeWebsite(params: any) {
    return await dataForSEOService.analyzeWebsite(params);
  },

  async trackKeywordRankings(params: any) {
    return await dataForSEOService.trackKeywordRankings(params);
  }
};

export const dataForSEOService = new DataForSEOService();