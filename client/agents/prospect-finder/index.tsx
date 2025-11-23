import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import MapComponent from '@/components/MapComponent';
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Globe, 
  Filter,
  Download,
  Eye,
  Plus,
  Users,
  Building,
  TrendingUp,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Map,
  Layers,
  Navigation,
  Circle,
  Square,
  Hexagon
} from 'lucide-react';

// Function to get map center coordinates based on location
const getMapCenter = (location: string) => {
  const locationMap: { [key: string]: { lat: number; lng: number } } = {
    'St. Louis, MO': { lat: 38.6270, lng: -90.1994 },
    'St. Louis, Missouri': { lat: 38.6270, lng: -90.1994 },
    'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
    'Chicago, Illinois': { lat: 41.8781, lng: -87.6298 },
    'New York, NY': { lat: 40.7128, lng: -74.0060 },
    'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
    'Las Vegas, NV': { lat: 36.1699, lng: -115.1398 },
    'Miami, FL': { lat: 25.7617, lng: -80.1918 },
    'Seattle, WA': { lat: 47.6062, lng: -122.3321 },
    'Boston, MA': { lat: 42.3601, lng: -71.0589 },
    'Denver, CO': { lat: 39.7392, lng: -104.9903 },
    'Phoenix, AZ': { lat: 33.4484, lng: -112.0740 },
    'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
    'Houston, TX': { lat: 29.7604, lng: -95.3698 },
    'San Antonio, TX': { lat: 29.4241, lng: -98.4936 },
    'Philadelphia, PA': { lat: 39.9526, lng: -75.1652 },
    'San Jose, CA': { lat: 37.3382, lng: -121.8863 },
    'San Francisco, CA': { lat: 37.7749, lng: -122.4194 },
    'San Diego, CA': { lat: 32.7157, lng: -117.1611 },
    'Austin, TX': { lat: 30.2672, lng: -97.7431 },
    'Nashville, TN': { lat: 36.1627, lng: -86.7816 },
    'Kansas City, MO': { lat: 39.0997, lng: -94.5786 },
    'Oklahoma City, OK': { lat: 35.4676, lng: -97.5164 },
    'Tulsa, OK': { lat: 36.1540, lng: -95.9928 },
    'Wichita, KS': { lat: 37.6872, lng: -97.3301 },
    'Springfield, MO': { lat: 37.2089, lng: -93.2923 },
    'Columbia, MO': { lat: 38.9517, lng: -92.3341 },
    'Jefferson City, MO': { lat: 38.5767, lng: -92.1735 }
  };

  // Try exact match first
  if (locationMap[location]) {
    return locationMap[location];
  }

  // Try partial matches
  const normalizedLocation = location.toLowerCase();
  for (const [key, coords] of Object.entries(locationMap)) {
    if (normalizedLocation.includes(key.toLowerCase().split(',')[0])) {
      return coords;
    }
  }

  // Default to St. Louis if no match found
  return { lat: 38.6270, lng: -90.1994 };
};

export default function ProspectFinderAgent() {
  const [searchQuery, setSearchQuery] = useState('dental clinic');
  const [searchLocation, setSearchLocation] = useState('St. Louis, MO');
  const [locationType, setLocationType] = useState('City');
  const [locationValue, setLocationValue] = useState('');
  const [maxResults, setMaxResults] = useState('500');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [searchJobId, setSearchJobId] = useState<string | null>(null);
  const [mapView, setMapView] = useState<'standard' | 'zipcode' | 'county' | 'radius'>('standard');
  const [radius, setRadius] = useState<number | null>(null);
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    rating: 'all',
    score: 'all',
    city: 'all', // Changed from text input to select dropdown
    zip: 'all' // ZIP code filter
  });
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'grid'>('list');

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Load stored search results on component mount
  useEffect(() => {
    const loadStoredResults = () => {
      try {
        const storedResults = sessionStorage.getItem('pf_enriched_results');
        if (storedResults) {
          const results = JSON.parse(storedResults);
          console.log('Loading stored search results:', results.length);
          setActiveTab('current');
          
          // Don't set searchResults here - let the filtering and pagination handle it
          // The allEnrichedResults will pick it up from sessionStorage
        }
      } catch (error) {
        console.error('Error loading stored results:', error);
      }
    };

    loadStoredResults();
  }, []);

  // Load stored search form data
  useEffect(() => {
    try {
      const storedSearchData = sessionStorage.getItem('pf_search_data');
      if (storedSearchData) {
        const searchData = JSON.parse(storedSearchData);
        console.log('Loading stored search data:', searchData);
        setSearchQuery(searchData.query || '');
        setSearchLocation(searchData.location || '');
        setLocationType(searchData.locationType || 'City');
        setLocationValue(searchData.locationValue || '');
        setMaxResults(searchData.maxResults || '500');
        setMapView(searchData.mapView || 'standard');
        setRadius(searchData.radius || null);
        setSelectedZipCodes(searchData.selectedZipCodes || []);
        setSelectedCounties(searchData.selectedCounties || []);
      }
    } catch (error) {
      console.error('Error loading stored search data:', error);
    }
  }, []);

  // Missouri location types with counts
  const missouriLocationTypes = [
    { type: 'Postal Code', count: 1002, icon: Square },
    { type: 'City', count: 599, icon: Building },
    { type: 'County', count: 114, icon: Map },
    { type: 'Neighborhood', count: 62, icon: Navigation },
    { type: 'Municipality', count: 49, icon: Layers },
    { type: 'Congressional District', count: 8, icon: Hexagon },
    { type: 'US', count: 5, icon: Circle },
    { type: 'Airport', count: 4, icon: Target },
    { type: 'University', count: 3, icon: Users }
  ];

  // Enhanced API call for Missouri-specific search with comprehensive scoring
  const searchProspects = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      
      // Use the main search prospects API that sets businessProfileId
      const businessListingsResponse = await fetch('/api/serp/search-prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keyword: searchQuery,
          location: searchLocation,
          locationType: locationType,
          locationValue: locationValue,
          device: 'desktop',
          radius: radius,
          mapView: 'standard',
          selectedZipCodes: [],
          selectedCounties: []
        })
      });
      
      if (businessListingsResponse.ok) {
        const businessData = await businessListingsResponse.json();
        console.log('Business Listings response:', businessData);
        console.log('Business data structure:', JSON.stringify(businessData, null, 2));
        
        if (businessData.success && businessData.data?.businesses) {
          const businesses = businessData.data.businesses.slice(0, 100);
          console.log('Found businesses:', businesses.length);
          console.log('First business sample:', JSON.stringify(businesses[0], null, 2));
          
          // Store raw results immediately
          sessionStorage.setItem('pf_raw_results', JSON.stringify(businesses));
          console.log('Stored raw results:', businesses.length);

                // Create enriched businesses for ALL results (not just page slice)
                const enrichedBusinesses = businesses.map((business: any) => {
                  console.log('Processing business:', business.title, business);
                  
                  // Calculate basic lead score from available data
                  const rating = business.rating?.value || business.rating || business.rating_value || 0;
                  const reviewCount = business.reviews_count || business.reviews || business.votes_count || 0;
                  const hasWebsite = Boolean(business.website || business.domain || business.url);
                  const hasPhone = Boolean(business.phone || business.phone_number);
                  const hasAddress = Boolean(business.address || business.address_info);
                  
                  // Basic scoring algorithm (fast and practical)
                  const presenceScore = Math.round(
                    (rating - 1) / 4 * 100 * 0.4 +  // Rating (40%)
                    Math.min(100, Math.log10(1 + reviewCount) * 20) * 0.4 +  // Review count (40%)
                    (hasWebsite && hasPhone && hasAddress ? 20 : 0)  // NAP completeness (20%)
                  );
                  
                  const seoScore = Math.round(
                    (hasWebsite ? 60 : 0) +  // Basic SEO presence
                    (reviewCount > 10 ? 20 : 0) +  // Review signals
                    (rating > 4.0 ? 20 : 0)  // High rating bonus
                  );
                  
                  const adsScore = Math.round(
                    (business.ad_count || 0) * 10  // Ad presence
                  );
                  
                  const engagementScore = Math.round(
                    (rating - 1) / 4 * 100 * 0.5 +  // Rating (50%)
                    Math.min(100, reviewCount / 10) * 0.5  // Review volume (50%)
                  );
                  
                  // Overall lead score using your exact formula
                  const leadScore = Math.round(
                    0.30 * presenceScore +
                    0.35 * seoScore +
                    0.25 * adsScore +
                    0.10 * engagementScore
                  );
                  
                  // Generate basic recommendations
                  const recommendations = [];
                  if (presenceScore < 70) recommendations.push("Improve Google Business Profile completeness");
                  if (seoScore < 60) recommendations.push("Optimize website for local SEO");
                  if (adsScore < 30) recommendations.push("Consider local advertising opportunities");
                  if (engagementScore < 60) recommendations.push("Increase customer engagement and reviews");
                  
                  // Map DataForSEO business data to map component format
                  return {
                    id: business.place_id || business.cid || `${business.name}-${Date.now()}`,
                    name: business.title || business.name,
                    address: business.address_info?.formatted_address || business.address,
                    city: business.address_info?.city || business.city,
                    state: business.address_info?.region || business.state,
                    zipCode: business.address_info?.postal_code,
                    phone: business.phone,
                    website: business.website,
                    domain: business.domain,
                    rating: rating,
                    reviewsCount: business.rating?.votes_count || business.reviews_count || reviewCount,
                    // DataForSEO specific fields for map
                    lat: business.latitude,
                    lng: business.longitude,
                    placeId: business.place_id,
                    cid: business.cid,
                    bookOnlineUrl: business.book_online_url,
                    thumbnail: business.thumbnail || business.main_image,
                    mainImage: business.main_image,
                    category: business.category,
                    isOpen: business.is_open,
                    popularTimes: business.popular_times,
                    // Scoring data
                    comprehensiveScore: {
                      presenceScore,
                      seoScore,
                      adsActivityScore: adsScore,
                      engagementScore,
                      leadScore
                    },
                    recommendations,
                    businessProfileId: business.businessProfileId || business.databaseId || business.place_id || business.cid || `${business.name}-${Date.now()}`
                  };
                });
          
          console.log('Setting enriched search results:', enrichedBusinesses);
          // keep all raw results in session to support paging without re-calling API
          sessionStorage.setItem('pf_raw_results', JSON.stringify(businesses));
          // Also store enriched results with businessProfileId for navigation
          sessionStorage.setItem('pf_enriched_results', JSON.stringify(enrichedBusinesses));
          
          // Store search form data for restoration when navigating back
          const searchData = {
            query: searchQuery,
            location: searchLocation,
            locationType: locationType,
            locationValue: locationValue,
            maxResults: maxResults,
            mapView: mapView,
            radius: radius,
            selectedZipCodes: selectedZipCodes,
            selectedCounties: selectedCounties
          };
          sessionStorage.setItem('pf_search_data', JSON.stringify(searchData));
          console.log('Stored search form data:', searchData);
          
          // Store all results - filtering and pagination will handle display
          // Reset page to 1 for new search
          setPage(1);
          setSearchResults(enrichedBusinesses.slice(0, pageSize)); // Keep for backward compatibility
          setActiveTab('current');
        }
      } else {
        console.error('Business listings failed:', businessListingsResponse.statusText);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handler to add business to watchlist
  const handleAddToWatchlist = async (businessData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/serp/add-to-watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemType: 'prospect',
          businessProfileId: businessData.businessProfileId,
          name: businessData.name,
          domain: businessData.domain,
          category: businessData.category,
          location: businessData.address || businessData.city,
          score: businessData.comprehensiveScore?.leadScore,
          rating: businessData.rating
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Added to watchlist:', data);
        alert('Business added to watchlist successfully!');
      } else {
        console.error('Add to watchlist failed:', await response.text());
        alert('Failed to add to watchlist');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  // Handler to add business to prospects
  const handleAddToProspects = async (businessProfileId: string, businessData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/serp/add-to-prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessProfileId,
          name: businessData.name,
          domain: businessData.domain,
          category: businessData.category,
          location: businessData.address || businessData.city,
          score: businessData.comprehensiveScore?.leadScore,
          rating: businessData.rating
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Added to prospects:', data);
        alert('Business added to prospects successfully!');
      }
    } catch (error) {
      console.error('Error adding to prospects:', error);
      alert('Failed to add business to prospects');
    }
  };

  // Mock data for demonstration
  const mockProspects = [
    {
      id: '1',
      rank: 1,
      clinic: 'Las Vegas Spine Care Center',
      category: 'Spine Care',
      city: 'Las Vegas, NV',
      rating: 4.8,
      score: 92,
      highlights: ['Top Rated', 'Insurance Accepted', 'Same Day Appointments'],
      phone: '+1 (702) 555-0123',
      email: 'info@lasvegasspinecare.com',
      website: 'https://lasvegasspinecare.com',
      address: '1234 Main St, Las Vegas, NV 89101',
      socialMedia: {
        facebook: 'https://facebook.com/lasvegasspinecare',
        instagram: 'https://instagram.com/lasvegasspinecare',
        linkedin: 'https://linkedin.com/company/lasvegasspinecare'
      },
      specialties: ['Spinal Decompression', 'Chiropractic', 'Physical Therapy'],
      insurance: ['Blue Cross', 'Aetna', 'Cigna'],
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      rank: 2,
      clinic: 'Advanced Spine & Joint Institute',
      category: 'Spine Surgery',
      city: 'Las Vegas, NV',
      rating: 4.6,
      score: 88,
      highlights: ['Board Certified', 'Minimally Invasive', 'Advanced Technology'],
      phone: '+1 (702) 555-0456',
      email: 'contact@advancedspine.com',
      website: 'https://advancedspine.com',
      address: '5678 Medical Dr, Las Vegas, NV 89102',
      socialMedia: {
        facebook: 'https://facebook.com/advancedspine',
        instagram: 'https://instagram.com/advancedspine',
        linkedin: 'https://linkedin.com/company/advancedspine'
      },
      specialties: ['Spinal Fusion', 'Disc Replacement', 'Scoliosis Treatment'],
      insurance: ['Medicare', 'Medicaid', 'Blue Cross'],
      lastUpdated: '2024-01-14'
    },
    {
      id: '3',
      rank: 3,
      clinic: 'Desert Spine & Wellness',
      category: 'Chiropractic',
      city: 'Henderson, NV',
      rating: 4.7,
      score: 85,
      highlights: ['Holistic Approach', 'Pain Management', 'Wellness Focus'],
      phone: '+1 (702) 555-0789',
      email: 'hello@desertspine.com',
      website: 'https://desertspine.com',
      address: '9012 Wellness Way, Henderson, NV 89014',
      socialMedia: {
        facebook: 'https://facebook.com/desertspine',
        instagram: 'https://instagram.com/desertspine',
        linkedin: 'https://linkedin.com/company/desertspine'
      },
      specialties: ['Chiropractic Care', 'Massage Therapy', 'Nutrition Counseling'],
      insurance: ['Aetna', 'Cigna', 'UnitedHealth'],
      lastUpdated: '2024-01-13'
    },
    {
      id: '4',
      rank: 4,
      clinic: 'Nevada Spine Center',
      category: 'Spine Care',
      city: 'Las Vegas, NV',
      rating: 4.5,
      score: 82,
      highlights: ['Comprehensive Care', 'Multi-Specialty', 'Patient Education'],
      phone: '+1 (702) 555-0321',
      email: 'info@nevadaspine.com',
      website: 'https://nevadaspine.com',
      address: '3456 Health Blvd, Las Vegas, NV 89103',
      socialMedia: {
        facebook: 'https://facebook.com/nevadaspine',
        instagram: 'https://instagram.com/nevadaspine',
        linkedin: 'https://linkedin.com/company/nevadaspine'
      },
      specialties: ['Spine Surgery', 'Pain Management', 'Rehabilitation'],
      insurance: ['Blue Cross', 'Aetna', 'Medicare'],
      lastUpdated: '2024-01-12'
    },
    {
      id: '5',
      rank: 5,
      clinic: 'Sunrise Spine & Joint Clinic',
      category: 'Orthopedics',
      city: 'Las Vegas, NV',
      rating: 4.4,
      score: 79,
      highlights: ['Experienced Team', 'Modern Facility', 'Patient-Centered'],
      phone: '+1 (702) 555-0654',
      email: 'contact@sunrisespine.com',
      website: 'https://sunrisespine.com',
      address: '7890 Sunrise Ave, Las Vegas, NV 89104',
      socialMedia: {
        facebook: 'https://facebook.com/sunrisespine',
        instagram: 'https://instagram.com/sunrisespine',
        linkedin: 'https://linkedin.com/company/sunrisespine'
      },
      specialties: ['Joint Replacement', 'Sports Medicine', 'Spine Care'],
      insurance: ['Cigna', 'UnitedHealth', 'Aetna'],
      lastUpdated: '2024-01-11'
    }
  ];

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
    }, 2000);
  };

  const handleSelectProspect = (prospectId: string) => {
    setSelectedProspects(prev => 
      prev.includes(prospectId) 
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };


  // Use real search results only - no mock data fallback
  // Get ALL results from sessionStorage for filtering and map display
  const allEnrichedResults = React.useMemo(() => {
    try {
      const stored = sessionStorage.getItem('pf_enriched_results');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing enriched results:', e);
    }
    return searchResults;
  }, [searchResults]);

  // All results for filtering (not paginated yet)
  const allResultsForFiltering = allEnrichedResults;
  console.log('All results (total):', allResultsForFiltering.length);
  
  // Extract dynamic filter options from ALL search results (not just current page)
  const availableCategories = React.useMemo(() => {
    const categories = new Set<string>();
    allResultsForFiltering.forEach(prospect => {
      const cat = prospect.category || 'Business';
      if (cat && cat !== 'Business') categories.add(cat);
    });
    return Array.from(categories).sort();
  }, [allResultsForFiltering]);

  const availableRatings = React.useMemo(() => {
    const ratings = allResultsForFiltering
      .map(p => p.rating?.value || p.rating || 0)
      .filter(r => r > 0);
    if (ratings.length === 0) return [];
    
    const maxRating = Math.max(...ratings);
    const minRating = Math.min(...ratings);
    
    // Generate rating thresholds based on actual data
    const thresholds: number[] = [];
    if (maxRating >= 4.5) thresholds.push(4.5);
    if (maxRating >= 4.0) thresholds.push(4.0);
    if (maxRating >= 3.5) thresholds.push(3.5);
    if (maxRating >= 3.0) thresholds.push(3.0);
    if (minRating < 3.0) thresholds.push(2.5);
    
    return Array.from(new Set(thresholds)).sort((a, b) => b - a);
  }, [allResultsForFiltering]);

  const availableScores = React.useMemo(() => {
    const scores = allResultsForFiltering
      .map(p => p.comprehensiveScore?.leadScore || p.score || 0)
      .filter(s => s > 0);
    if (scores.length === 0) return [];
    
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    // Generate score thresholds based on actual data
    const thresholds: number[] = [];
    if (maxScore >= 90) thresholds.push(90);
    if (maxScore >= 80) thresholds.push(80);
    if (maxScore >= 70) thresholds.push(70);
    if (maxScore >= 60) thresholds.push(60);
    if (maxScore >= 50) thresholds.push(50);
    if (minScore < 50) thresholds.push(40);
    
    return Array.from(new Set(thresholds)).sort((a, b) => b - a);
  }, [allResultsForFiltering]);

  const availableCities = React.useMemo(() => {
    const cities = allResultsForFiltering
      .map(p => p.city || p.address?.split(',')[0] || '')
      .filter(c => c && c.trim())
      .map(c => c.trim());
    return Array.from(new Set(cities)).sort();
  }, [allResultsForFiltering]);

  const availableZipCodes = React.useMemo(() => {
    const zipCodes = allResultsForFiltering
      .map(p => {
        // Priority 1: Direct zipCode field (most reliable)
        if (p.zipCode) {
          const zip = p.zipCode.toString().trim();
          if (zip.length >= 5) return zip.split('-')[0]; // Take 5-digit part
        }
        
        // Priority 2: postal_code from address_info (most reliable structured data)
        if (p.address_info?.postal_code) {
          const zip = p.address_info.postal_code.toString().trim();
          if (zip.length >= 5) return zip.split('-')[0];
        }
        
        // Priority 3: Extract from address string (last resort - be smart about it)
        // ZIP codes typically appear after state abbreviation or at the end
        const address = (p.address || p.address_info?.formatted_address || '').trim();
        if (!address) return null;
        
        // Pattern 1: After state abbreviation (e.g., "MO 63017", "CA 90210")
        const stateZipMatch = address.match(/[A-Z]{2}\s+(\d{5})(-\d{4})?/i);
        if (stateZipMatch) return stateZipMatch[1];
        
        // Pattern 2: At the end of address (e.g., "...City, 63017" or "...63017")
        const endZipMatch = address.match(/,?\s+(\d{5})(-\d{4})?\s*$/);
        if (endZipMatch) return endZipMatch[1];
        
        // Pattern 3: After "Zip:" or "ZIP:" labels
        const labeledZipMatch = address.match(/(?:zip|zipcode|postal\s*code)[:\s]+(\d{5})(-\d{4})?/i);
        if (labeledZipMatch) return labeledZipMatch[1];
        
        return null;
      })
      .filter(zip => {
        // Validate ZIP: must be exactly 5 digits, not a street number
        if (!zip || zip.length !== 5) return false;
        // Exclude common invalid patterns (all zeros, all same digit, etc.)
        if (!/^\d{5}$/.test(zip)) return false;
        // Valid US ZIP codes start with 0-9, and have valid ranges
        // Basic validation: not all zeros and reasonable ranges
        const num = parseInt(zip);
        return num > 0 && num <= 99999;
      });
    return Array.from(new Set(zipCodes)).sort();
  }, [allResultsForFiltering]);
  
  // Filter ALL results first (this applies to all 100 results)
  const filteredAllResults = React.useMemo(() => {
    return allResultsForFiltering.filter(prospect => {
    if (filters.category !== 'all' && prospect.category !== filters.category) return false;
    if (filters.rating !== 'all') {
      const rating = parseFloat(filters.rating);
      const prospectRating = prospect.rating?.value || prospect.rating || 0;
      if (prospectRating < rating) return false;
    }
    if (filters.score !== 'all') {
      const score = parseInt(filters.score);
      const leadScore = prospect.comprehensiveScore?.leadScore || prospect.score || 0;
      if (leadScore < score) return false;
    }
    if (filters.city !== 'all' && filters.city !== '') {
      const prospectCity = (prospect.city || '').toLowerCase().trim();
      const filterCity = filters.city.toLowerCase().trim();
      // Exact match or contains match for city filtering
      if (prospectCity !== filterCity && !prospectCity.includes(filterCity) && !filterCity.includes(prospectCity)) return false;
    }
    if (filters.zip !== 'all' && filters.zip !== '') {
      // Extract ZIP from prospect using same logic as availableZipCodes
      let prospectZip: string | null = null;
      
      // Priority 1: Direct zipCode field
      if (prospect.zipCode) {
        const zip = prospect.zipCode.toString().trim();
        if (zip.length >= 5) prospectZip = zip.split('-')[0];
      }
      
      // Priority 2: postal_code from address_info
      if (!prospectZip && prospect.address_info?.postal_code) {
        const zip = prospect.address_info.postal_code.toString().trim();
        if (zip.length >= 5) prospectZip = zip.split('-')[0];
      }
      
      // Priority 3: Extract from address string (smart extraction)
      if (!prospectZip) {
        const address = (prospect.address || prospect.address_info?.formatted_address || '').trim();
        if (address) {
          // Pattern 1: After state abbreviation
          const stateZipMatch = address.match(/[A-Z]{2}\s+(\d{5})(-\d{4})?/i);
          if (stateZipMatch) {
            prospectZip = stateZipMatch[1];
          } else {
            // Pattern 2: At the end of address
            const endZipMatch = address.match(/,?\s+(\d{5})(-\d{4})?\s*$/);
            if (endZipMatch) prospectZip = endZipMatch[1];
          }
        }
      }
      
      const filterZip = filters.zip.trim().split('-')[0]; // 5-digit part
      if (!prospectZip || prospectZip !== filterZip) return false;
    }
    return true;
  });
  }, [allResultsForFiltering, filters]);
  
  // Paginate the FILTERED results (not the raw results)
  const totalFiltered = filteredAllResults.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  
  // Get current page from FILTERED results
  const filteredProspects = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredAllResults.slice(start, end);
  }, [filteredAllResults, page, pageSize]);
  
  // Map businesses for MapComponent (moved outside JSX to fix useMemo issue)
  const mappedBusinessesForMap = React.useMemo(() => {
    return filteredAllResults
      .map(prospect => {
        // Try multiple coordinate field locations and formats
        let lat: number | null = null;
        let lng: number | null = null;
        
        // Priority 1: Direct lat/lng fields (numbers or strings)
        const latVal = prospect.lat || prospect.latitude;
        const lngVal = prospect.lng || prospect.longitude;
        if (latVal != null && lngVal != null) {
          lat = typeof latVal === 'number' ? latVal : parseFloat(String(latVal));
          lng = typeof lngVal === 'number' ? lngVal : parseFloat(String(lngVal));
        }
        
        // Priority 2: GPS coordinates object
        if ((lat == null || lng == null || isNaN(lat) || isNaN(lng)) && prospect.gps_coordinates) {
          const gpsLat = prospect.gps_coordinates.latitude || prospect.gps_coordinates.lat;
          const gpsLng = prospect.gps_coordinates.longitude || prospect.gps_coordinates.lng;
          if (gpsLat != null && gpsLng != null) {
            lat = typeof gpsLat === 'number' ? gpsLat : parseFloat(String(gpsLat));
            lng = typeof gpsLng === 'number' ? gpsLng : parseFloat(String(gpsLng));
          }
        }
        
        // Priority 3: address_info coordinates
        if ((lat == null || lng == null || isNaN(lat) || isNaN(lng)) && prospect.address_info) {
          const addrLat = prospect.address_info.latitude || prospect.address_info.lat;
          const addrLng = prospect.address_info.longitude || prospect.address_info.lng;
          if (addrLat != null && addrLng != null) {
            lat = typeof addrLat === 'number' ? addrLat : parseFloat(String(addrLat));
            lng = typeof addrLng === 'number' ? addrLng : parseFloat(String(addrLng));
          }
        }
        
        // Validate coordinates are valid numbers and within reasonable ranges
        const isValidLat = lat != null && !isNaN(lat) && lat >= -90 && lat <= 90;
        const isValidLng = lng != null && !isNaN(lng) && lng >= -180 && lng <= 180;
        
        if (!isValidLat || !isValidLng) {
          console.warn(`Invalid coordinates for ${prospect.title || prospect.name}: lat=${lat}, lng=${lng}`, prospect);
          return null;
        }
        
        return {
          id: prospect.id || prospect.businessProfileId,
          name: prospect.title || prospect.name,
          lat,
          lng,
          address: prospect.address,
          city: prospect.city,
          state: prospect.state,
          zipCode: prospect.zipCode
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);
  }, [filteredAllResults]);
  
  console.log('Filtered all results count (for map & list):', filteredAllResults.length);
  console.log('Filtered prospects count (current page):', filteredProspects.length);
  console.log('Total pages:', totalPages);
  console.log('Current filters:', filters);
  console.log('Available categories:', availableCategories);
  console.log('Available ratings:', availableRatings);
  console.log('Available scores:', availableScores);
  console.log('Available cities:', availableCities);
  console.log('Available ZIP codes:', availableZipCodes);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #F1C40F 0%, #F39C12 50%, #3498DB 50%, #2980B9 100%)'
    }}>
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-white/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-white/15 rounded-full animate-pulse delay-3000"></div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-theme-light-blue/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-theme-blue-primary to-theme-yellow-primary rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-theme-dark-blue">Prospect Finder</h1>
                <p className="text-theme-light-blue">AI-powered lead identification and management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-theme-light-blue">
                Credits: <span className="font-semibold text-theme-blue-primary">48,712</span>
              </div>
              <Button className="bg-theme-blue-primary hover:bg-theme-dark-blue text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Enhanced Missouri Search Section */}
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-theme-dark-blue flex items-center gap-2">
              <Map className="w-5 h-5" />
              Missouri Prospect Finder
            </CardTitle>
            <CardDescription className="text-theme-light-blue">
              Advanced search with location type filtering and map visualization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Dual Search Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Business Name Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-theme-dark-blue">Business Name Search</label>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter business name or category (e.g., dental clinic, spine care, etc.)"
                  className="text-lg"
                />
              </div>
              
              {/* Location Type Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-theme-dark-blue">Location Type & Value</label>
                <div className="flex gap-2">
                  <Select value={locationType} onValueChange={setLocationType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {missouriLocationTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.type} value={type.type}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.type} ({type.count})
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Input
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder={`Enter ${locationType.toLowerCase()}...`}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Search Options */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-theme-dark-blue">Search Location</label>
                <Input
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="St. Louis, MO"
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-theme-dark-blue">Max Results</label>
                <Select value={maxResults} onValueChange={setMaxResults}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 results</SelectItem>
                    <SelectItem value="500">500 results</SelectItem>
                    <SelectItem value="1000">1000 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-theme-dark-blue">Map View</label>
                <Select value={mapView} onValueChange={(value) => setMapView(value as 'standard' | 'zipcode' | 'county' | 'radius')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="zipcode">ZIP Code</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="radius">Radius</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-theme-dark-blue">
                  Search Radius: {radius ? `${radius} miles` : 'Not set (optional)'}
                </label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={radius ? [radius] : [0]}
                    onValueChange={(value) => setRadius(value[0] > 0 ? value[0] : null)}
                    max={100}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRadius(null)}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex justify-center">
              <Button 
                onClick={searchProspects}
                disabled={isSearching}
                className="bg-theme-blue-primary hover:bg-theme-dark-blue text-white px-12 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                {isSearching ? 'Searching Missouri...' : 'Search Missouri Prospects'}
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Current Results
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Search History
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Enhanced Missouri Map View */}
        {filteredAllResults.length > 0 && (
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 mb-6 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-theme-dark-blue flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Map View - {filteredAllResults.length} {filteredAllResults.length === 1 ? 'Location' : 'Locations'}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-theme-blue-primary border-theme-blue-primary">
                      {mapView.toUpperCase()} View
                    </Badge>
                    <Badge variant="secondary">
                      {filteredAllResults.length} {filteredAllResults.length === 1 ? 'Location' : 'Locations'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={mapView === 'zipcode' ? 'default' : 'outline'}
                      onClick={() => setMapView('zipcode')}
                      className="text-xs"
                    >
                      <Square className="w-3 h-3 mr-1" />
                      ZIP
                    </Button>
                    <Button
                      size="sm"
                      variant={mapView === 'county' ? 'default' : 'outline'}
                      onClick={() => setMapView('county')}
                      className="text-xs"
                    >
                      <Map className="w-3 h-3 mr-1" />
                      County
                    </Button>
                    <Button
                      size="sm"
                      variant={mapView === 'radius' ? 'default' : 'outline'}
                      onClick={() => setMapView('radius')}
                      className="text-xs"
                    >
                      <Circle className="w-3 h-3 mr-1" />
                      Radius
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapComponent 
                  businesses={mappedBusinessesForMap}
                  center={getMapCenter(searchLocation)}
                  mapView={mapView}
                  radius={radius}
                  selectedZipCodes={selectedZipCodes}
                  selectedCounties={selectedCounties}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-theme-dark-blue">Search Results</CardTitle>
                <div className="flex items-center gap-4">
                <span className="text-theme-light-blue">{filteredAllResults.length} results</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" disabled={page<=1} onClick={() => {
                      setPage(Math.max(1, page-1));
                    }}>Prev</Button>
                    <span className="text-theme-light-blue">Page {page}/{totalPages} (showing {filteredProspects.length} of {filteredAllResults.length})</span>
                    <Button variant="outline" disabled={page>=totalPages} onClick={() => {
                      setPage(Math.min(totalPages, page+1));
                    }}>Next</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      List
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      Table
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      Grid
                    </Button>
                  </div>
                <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <Download className="w-4 h-4 mr-2" />
                  Scrape All Websites
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-theme-light-blue" />
                <span className="text-sm font-medium text-theme-dark-blue">Filters:</span>
              </div>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({...prev, category: value}))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories ({filteredAllResults.length})</SelectItem>
                  {availableCategories.map(category => {
                    const count = filteredAllResults.filter(p => p.category === category).length;
                    return (
                      <SelectItem key={category} value={category}>
                        {category} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={filters.rating} onValueChange={(value) => setFilters(prev => ({...prev, rating: value}))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  {availableRatings.map(rating => {
                    const count = filteredAllResults.filter(p => {
                      const prospectRating = p.rating?.value || p.rating || 0;
                      return prospectRating >= rating;
                    }).length;
                    return (
                      <SelectItem key={rating.toString()} value={rating.toString()}>
                        {rating.toFixed(1)}+ Stars ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={filters.score} onValueChange={(value) => setFilters(prev => ({...prev, score: value}))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  {availableScores.map(score => {
                    const count = filteredAllResults.filter(p => {
                      const leadScore = p.comprehensiveScore?.leadScore || p.score || 0;
                      return leadScore >= score;
                    }).length;
                    return (
                      <SelectItem key={score.toString()} value={score.toString()}>
                        {score}+ Score ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={filters.city === 'all' || filters.city === '' ? 'all' : filters.city} onValueChange={(value) => setFilters(prev => ({...prev, city: value}))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities ({filteredAllResults.length})</SelectItem>
                  {availableCities.map((city: string) => {
                    const count = filteredAllResults.filter(p => {
                      const prospectCity = (p.city || '').toLowerCase();
                      return prospectCity === city.toLowerCase() || prospectCity.includes(city.toLowerCase());
                    }).length;
                    return (
                      <SelectItem key={city} value={city}>
                        {String(city)} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={filters.zip === 'all' || filters.zip === '' ? 'all' : filters.zip} onValueChange={(value) => setFilters(prev => ({...prev, zip: value}))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="ZIP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ZIPs ({filteredAllResults.length})</SelectItem>
                  {availableZipCodes.map((zip: string) => {
                    const count = filteredAllResults.filter(p => {
                      // Use same extraction logic as availableZipCodes
                      let prospectZip: string | null = null;
                      
                      if (p.zipCode) {
                        const z = p.zipCode.toString().trim();
                        if (z.length >= 5) prospectZip = z.split('-')[0];
                      } else if (p.address_info?.postal_code) {
                        const z = p.address_info.postal_code.toString().trim();
                        if (z.length >= 5) prospectZip = z.split('-')[0];
                      } else {
                        const address = (p.address || p.address_info?.formatted_address || '').trim();
                        if (address) {
                          const stateZipMatch = address.match(/[A-Z]{2}\s+(\d{5})(-\d{4})?/i);
                          if (stateZipMatch) {
                            prospectZip = stateZipMatch[1];
                          } else {
                            const endZipMatch = address.match(/,?\s+(\d{5})(-\d{4})?\s*$/);
                            if (endZipMatch) prospectZip = endZipMatch[1];
                          }
                        }
                      }
                      
                      return prospectZip === zip;
                    }).length;
                    return (
                      <SelectItem key={String(zip)} value={String(zip)}>
                        {String(zip)} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Results */}
            {viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredProspects.map((prospect, index) => (
                <Link key={prospect.businessProfileId || index} to={`/business/${prospect.businessProfileId}`} className="block">
                  <Card className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                    <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <Checkbox
                            checked={selectedProspects.includes(prospect.businessProfileId)}
                            onCheckedChange={() => handleSelectProspect(prospect.businessProfileId)}
                          />
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-theme-blue-primary border-theme-blue-primary">
                              #{prospect.rank || index + 1}
                            </Badge>
                            <div className="flex items-center gap-2 flex-1">
                            <h3 className="text-lg font-semibold text-theme-dark-blue">{prospect.title || prospect.clinic || prospect.name}</h3>
                              {prospect.isRunningAds && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs border-purple-300">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Running Ads
                                  {prospect.approxAdsCount && (
                                    <span className="ml-1">({prospect.approxAdsCount})</span>
                                  )}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-theme-light-blue" />
                            <span className="text-sm text-theme-dark-blue">{prospect.category || 'Business'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-theme-light-blue" />
                            <span className="text-sm text-theme-dark-blue">{prospect.city || prospect.address || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-theme-dark-blue">{(prospect.rating?.value || prospect.rating || 0).toFixed(1)} ({(prospect.rating?.votes_count || prospect.reviewsCount || prospect.reviews || 0)})</span>
                          </div>
                          
                          {/* Comprehensive Score Display */}
                          {prospect.comprehensiveScore ? (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-semibold text-green-600">
                                Lead Score: {prospect.comprehensiveScore.leadScore || 0}/100
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-semibold text-green-600">{prospect.score || 85} Score</span>
                            </div>
                          )}
                        </div>

                        {/* Comprehensive Score Breakdown */}
                        {prospect.comprehensiveScore && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-700 mb-2">Score Breakdown:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Presence:</span>
                                <span className="font-medium text-blue-600">{prospect.comprehensiveScore.presenceScore || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">SEO:</span>
                                <span className="font-medium text-blue-600">{prospect.comprehensiveScore.seoScore || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Ads:</span>
                                <span className="font-medium text-blue-600">{prospect.comprehensiveScore.adsActivityScore || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Engagement:</span>
                                <span className="font-medium text-blue-600">{prospect.comprehensiveScore.engagementScore || 0}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {prospect.recommendations && prospect.recommendations.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm text-theme-light-blue mb-2">Improvement Opportunities:</p>
                            <div className="space-y-1">
                              {prospect.recommendations.slice(0, 3).map((rec: string, index: number) => (
                                <div key={index} className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                                  • {rec}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mb-4">
                          <p className="text-sm text-theme-light-blue mb-2">Highlights:</p>
                          <div className="flex flex-wrap gap-2">
                            {(prospect.highlights || []).map((highlight, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                            {(!prospect.highlights || prospect.highlights.length === 0) && (
                              <Badge variant="secondary" className="text-xs">
                                High Rating
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-theme-dark-blue mb-2">Contact Information</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 text-theme-light-blue" />
                                <span className="text-sm text-theme-dark-blue">{prospect.phone || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-theme-light-blue" />
                                <span className="text-sm text-theme-dark-blue">{prospect.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Globe className="w-3 h-3 text-theme-light-blue" />
                                <span className="text-sm text-theme-dark-blue">{prospect.website || prospect.url || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-theme-dark-blue mb-2">Specialties</p>
                            <div className="flex flex-wrap gap-1">
                              {(prospect.specialties || []).map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {(!prospect.specialties || prospect.specialties.length === 0) && (
                                <Badge variant="outline" className="text-xs">
                                  General Practice
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-theme-dark-blue mb-2">Insurance Accepted</p>
                            <div className="flex flex-wrap gap-1">
                              {(prospect.insurance || []).map((ins, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {ins}
                                </Badge>
                              ))}
                              {(!prospect.insurance || prospect.insurance.length === 0) && (
                                <Badge variant="outline" className="text-xs">
                                  Most Insurance
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-theme-blue-primary border-theme-blue-primary hover:bg-theme-blue-primary hover:text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                            onClick={(e) => { e.stopPropagation?.(); handleAddToWatchlist(prospect); }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add to Watchlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.stopPropagation?.();
                              handleAddToProspects(prospect.businessProfileId, prospect);
                            }}
                          >
                            <Target className="w-4 h-4 mr-1" />
                            Add to Prospects
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Scrape
                          </Button>
                          <span className="text-xs text-theme-light-blue">
                            Last updated: {prospect.lastUpdated}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                </Link>
              ))}
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-theme-dark-blue">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Address</th>
                      <th className="px-3 py-2">City</th>
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2">ZIP</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Website</th>
                      <th className="px-3 py-2">Domain</th>
                      <th className="px-3 py-2">Rating</th>
                      <th className="px-3 py-2">Reviews</th>
                      <th className="px-3 py-2">Lead Score</th>
                      <th className="px-3 py-2">Place ID</th>
                      <th className="px-3 py-2">CID</th>
                      <th className="px-3 py-2">Lat</th>
                      <th className="px-3 py-2">Lng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProspects.map((p, idx) => (
                      <tr key={p.businessProfileId || idx} className="border-b last:border-0">
                        <td className="px-3 py-2">{p.rank || idx + 1}</td>
                        <td className="px-3 py-2">
                          <Link className="text-theme-blue-primary hover:underline" to={`/business/${p.businessProfileId}`}>{p.title || p.clinic || p.name}</Link>
                        </td>
                        <td className="px-3 py-2">{p.category || 'Business'}</td>
                        <td className="px-3 py-2">{p.address || ''}</td>
                        <td className="px-3 py-2">{p.city || ''}</td>
                        <td className="px-3 py-2">{p.state || ''}</td>
                        <td className="px-3 py-2">{p.zipCode || ''}</td>
                        <td className="px-3 py-2">{p.phone || ''}</td>
                        <td className="px-3 py-2 truncate max-w-[240px]"><a className="text-theme-blue-primary hover:underline" href={p.website || p.url} target="_blank" rel="noreferrer">{p.website || p.url || ''}</a></td>
                        <td className="px-3 py-2">{p.domain || ''}</td>
                        <td className="px-3 py-2">{(p.rating?.value || p.rating || 0).toFixed ? (p.rating?.value || p.rating || 0).toFixed(1) : p.rating}</td>
                        <td className="px-3 py-2">{p.rating?.votes_count || p.reviewsCount || p.reviews || 0}</td>
                        <td className="px-3 py-2">{p.comprehensiveScore?.leadScore ?? p.score ?? ''}</td>
                        <td className="px-3 py-2">{p.placeId || ''}</td>
                        <td className="px-3 py-2">{p.cid || ''}</td>
                        <td className="px-3 py-2">{p.lat ?? ''}</td>
                        <td className="px-3 py-2">{p.lng ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProspects.map((p, idx) => (
                  <Card key={p.businessProfileId || idx} className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-theme-blue-primary border-theme-blue-primary">#{p.rank || idx + 1}</Badge>
                        {p.comprehensiveScore?.leadScore != null && (
                          <span className="text-xs font-semibold text-green-600">Lead {p.comprehensiveScore.leadScore}/100</span>
                        )}
                      </div>
                      <Link to={`/business/${p.businessProfileId}`} className="block">
                        <h3 className="text-base font-semibold text-theme-dark-blue truncate">{p.title || p.clinic || p.name}</h3>
                      </Link>
                      <div className="mt-2 space-y-1 text-xs text-theme-dark-blue/80">
                        <div className="truncate"><span className="font-medium">Category:</span> {p.category || 'Business'}</div>
                        <div className="truncate"><span className="font-medium">Address:</span> {p.address || ''}</div>
                        <div className="truncate"><span className="font-medium">City:</span> {p.city || ''}</div>
                        <div className="truncate"><span className="font-medium">Phone:</span> {p.phone || ''}</div>
                        <div className="truncate"><span className="font-medium">Website:</span> {(p.website || p.url) ? <a href={p.website || p.url} target="_blank" rel="noreferrer" className="text-theme-blue-primary hover:underline">{p.website || p.url}</a> : 'N/A'}</div>
                        <div className="truncate"><span className="font-medium">Rating:</span> {(p.rating?.value || p.rating || 0).toFixed ? (p.rating?.value || p.rating || 0).toFixed(1) : p.rating} ({p.rating?.votes_count || p.reviewsCount || p.reviews || 0})</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(p.highlights || []).slice(0, 3).map((h: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{h}</Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="outline" className="text-theme-blue-primary border-theme-blue-primary" onClick={() => handleAddToWatchlist(p)}>Watchlist</Button>
                        <Button size="sm" variant="outline" className="text-purple-600 border-purple-600" onClick={() => handleAddToProspects(p.businessProfileId, p)}>Prospect</Button>
            </div>
          </CardContent>
        </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
