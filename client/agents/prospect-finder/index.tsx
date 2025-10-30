import React, { useState, useEffect } from 'react';
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
    city: 'all'
  });
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'grid'>('list');

  // Load stored search results on component mount
  useEffect(() => {
    const loadStoredResults = () => {
      try {
        const storedResults = sessionStorage.getItem('pf_enriched_results');
        if (storedResults) {
          const results = JSON.parse(storedResults);
          console.log('Loading stored search results:', results.length);
          setActiveTab('current');
          
          // Load first page of results
          const pageSize = 20;
          const firstPage = results.slice(0, pageSize).map((business: any) => ({
            id: business.place_id || business.cid || `${business.title}-0`,
            name: business.title || business.name,
            address: business.address_info?.formatted_address || business.address,
            city: business.address_info?.city || business.city,
            state: business.address_info?.region || business.state,
            zipCode: business.address_info?.postal_code,
            phone: business.phone,
            website: business.url,
            rating: business.rating?.value || 0,
            reviewsCount: business.rating?.votes_count || 0,
            category: business.category || 'Business',
            businessProfileId: business.businessProfileId,
            databaseId: business.databaseId,
            type: business.type,
            rank: business.rank_absolute || business.position || 1
          }));
          setSearchResults(firstPage);
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
          
          // Show only the first page of results, but store all for pagination
          const firstPage = enrichedBusinesses.slice(0, pageSize);
          setSearchResults(firstPage);
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
  // page controls
  const totalRaw = (() => {
    try { return JSON.parse(sessionStorage.getItem('pf_enriched_results') || '[]').length; } catch { return searchResults.length; }
  })();
  const totalPages = Math.max(1, Math.ceil(totalRaw / pageSize));

  const displayResults = searchResults;
  console.log('Display results:', displayResults);
  
  const filteredProspects = displayResults.filter(prospect => {
    if (filters.category !== 'all' && prospect.category !== filters.category) return false;
    if (filters.rating !== 'all') {
      const rating = parseFloat(filters.rating);
      if (prospect.rating < rating) return false;
    }
    if (filters.score !== 'all') {
      const score = parseInt(filters.score);
      const leadScore = prospect.comprehensiveScore?.leadScore || 0;
      if (leadScore < score) return false;
    }
    if (filters.city !== 'all' && !prospect.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    return true;
  });
  
  console.log('Filtered prospects count:', filteredProspects.length);
  console.log('Current filters:', filters);

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
        {filteredProspects.length > 0 && (
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 mb-6 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-theme-dark-blue flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Missouri Map View
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-theme-blue-primary border-theme-blue-primary">
                      {mapView.toUpperCase()} View
                    </Badge>
                    <Badge variant="secondary">
                      {filteredProspects.length} Prospects
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
                  businesses={filteredProspects.map(prospect => ({
                    id: prospect.id,
                    name: prospect.title || prospect.clinic || prospect.name,
                    address: prospect.address || '',
                    city: prospect.city || searchLocation.split(',')[0],
                    state: searchLocation.split(',')[1]?.trim() || 'MO',
                    zipCode: prospect.zipCode,
                    phone: prospect.phone,
                    website: prospect.website || prospect.url,
                    rating: prospect.rating?.value || prospect.rating,
                    reviewsCount: prospect.rating?.votes_count || prospect.reviewsCount || prospect.reviews
                  }))}
                  center={getMapCenter(searchLocation)}
                  mapView={mapView}
                  radius={radius}
                  selectedZipCodes={selectedZipCodes}
                  selectedCounties={selectedCounties}
                />
              </div>
              
              {/* Map Legend */}
              <div className="mt-4 p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-theme-dark-blue">Map Controls</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        <Navigation className="w-3 h-3 mr-1" />
                        Pan
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Target className="w-3 h-3 mr-1" />
                        Zoom
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Layers className="w-3 h-3 mr-1" />
                        Layers
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-theme-dark-blue">Filter by ZIP</h4>
                    <div className="flex flex-wrap gap-1">
                      {['63101', '63102', '63103', '63104', '63105'].map(zip => (
                        <Button
                          key={zip}
                          size="sm"
                          variant={selectedZipCodes.includes(zip) ? 'default' : 'outline'}
                          onClick={() => setSelectedZipCodes(prev => 
                            prev.includes(zip) 
                              ? prev.filter(z => z !== zip)
                              : [...prev, zip]
                          )}
                          className="text-xs"
                        >
                          {zip}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-theme-dark-blue">Filter by County</h4>
                    <div className="flex flex-wrap gap-1">
                      {['St. Louis County', 'St. Charles County', 'Jefferson County'].map(county => (
                        <Button
                          key={county}
                          size="sm"
                          variant={selectedCounties.includes(county) ? 'default' : 'outline'}
                          onClick={() => setSelectedCounties(prev => 
                            prev.includes(county) 
                              ? prev.filter(c => c !== county)
                              : [...prev, county]
                          )}
                          className="text-xs"
                        >
                          {county}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
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
                <span className="text-theme-light-blue">{filteredProspects.length} results</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" disabled={page<=1} onClick={() => {
                      const raw = JSON.parse(sessionStorage.getItem('pf_enriched_results') || '[]');
                      const newPage = Math.max(1, page-1);
                      const start = (newPage-1)*pageSize;
                      const end = start+pageSize;
                      const slice = raw.slice(start,end).map((business:any)=>({
                        id: business.place_id || business.cid || `${business.title}-${start}`,
                        name: business.title || business.name,
                        address: business.address_info?.formatted_address || business.address,
                        city: business.address_info?.city || business.city,
                        state: business.address_info?.region || business.state,
                        zipCode: business.address_info?.postal_code,
                        phone: business.phone,
                        website: business.website || business.url,
                        domain: business.domain,
                        rating: business.rating?.value || business.rating || 0,
                        reviewsCount: business.rating?.votes_count || business.reviews_count || 0,
                        lat: business.latitude || business.gps_coordinates?.latitude,
                        lng: business.longitude || business.gps_coordinates?.longitude,
                        placeId: business.place_id,
                        cid: business.cid,
                        category: business.category,
                        mainImage: business.main_image,
                        businessProfileId: business.businessProfileId
                      }));
                      setPage(newPage);
                      setSearchResults(slice);
                    }}>Prev</Button>
                    <span className="text-theme-light-blue">Page {page}/{totalPages}</span>
                    <Button variant="outline" disabled={page>=totalPages} onClick={() => {
                      const raw = JSON.parse(sessionStorage.getItem('pf_enriched_results') || '[]');
                      const newPage = Math.min(totalPages, page+1);
                      const start = (newPage-1)*pageSize;
                      const end = start+pageSize;
                      const slice = raw.slice(start,end).map((business:any)=>({
                        id: business.place_id || business.cid || `${business.title}-${start}`,
                        name: business.title || business.name,
                        address: business.address_info?.formatted_address || business.address,
                        city: business.address_info?.city || business.city,
                        state: business.address_info?.region || business.state,
                        zipCode: business.address_info?.postal_code,
                        phone: business.phone,
                        website: business.website || business.url,
                        domain: business.domain,
                        rating: business.rating?.value || business.rating || 0,
                        reviewsCount: business.rating?.votes_count || business.reviews_count || 0,
                        lat: business.latitude || business.gps_coordinates?.latitude,
                        lng: business.longitude || business.gps_coordinates?.longitude,
                        placeId: business.place_id,
                        cid: business.cid,
                        category: business.category,
                        mainImage: business.main_image,
                        businessProfileId: business.businessProfileId
                      }));
                      setPage(newPage);
                      setSearchResults(slice);
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
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Spine Care">Spine Care</SelectItem>
                  <SelectItem value="Spine Surgery">Spine Surgery</SelectItem>
                  <SelectItem value="Chiropractic">Chiropractic</SelectItem>
                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.rating} onValueChange={(value) => setFilters(prev => ({...prev, rating: value}))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="4.0">4.0+ Stars</SelectItem>
                  <SelectItem value="3.5">3.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.score} onValueChange={(value) => setFilters(prev => ({...prev, score: value}))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="90">90+ Score</SelectItem>
                  <SelectItem value="80">80+ Score</SelectItem>
                  <SelectItem value="70">70+ Score</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Filter by city..."
                value={filters.city}
                onChange={(e) => setFilters(prev => ({...prev, city: e.target.value}))}
                className="w-48"
              />
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
