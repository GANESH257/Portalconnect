import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  DollarSign,
  Users,
  BarChart,
  Zap,
  Shield,
  MessageSquare,
  Search,
  Eye,
  Clock,
  Award,
  ExternalLink,
  Plus,
  Heart,
  ArrowLeft,
  Star as StarIcon,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Bookmark,
  Loader2
} from 'lucide-react';

interface BusinessProfile {
  id: string;
  name: string;
  domain?: string;
  websiteUrl?: string;
  category: string;
  subcategory?: string;
  location: string;
  address: string;
  // Comprehensive scoring data
  comprehensiveScore?: {
    presenceScore: number;
    seoScore: number;
    adsActivityScore: number;
    engagementScore: number;
    leadScore: number;
    organicTraffic?: number;
    backlinkCount?: number;
    onPageScore?: number;
    reviewRating?: number;
    reviewCount?: number;
    adCount?: number;
    paidTraffic?: number;
  };
  recommendations?: string[];
  rawData?: any;
  // Detailed analysis
  seoAnalysis?: {
    onPageIssues: any[];
    keywordRankings: any[];
    backlinkAnalysis: any[];
  };
  adsAnalysis?: {
    adPresence: any[];
    competitorAds: any[];
  };
  reviewsAnalysis?: {
    recentReviews: any[];
    responseRate: number;
    reviewVelocity: number;
  };
  // Detailed ad performance data
  adPerformance?: {
    paidETV: number;
    creativesCount: number;
    approxAdsCount: number;
    adRecency: number;
    verifiedAdvertiser: boolean;
    platforms: string[];
    creatives: any[];
    lastActiveDate: string;
    adActivityScore: number;
    recentCreatives: any[];
    advertiserInfo: any;
  };
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  rating: number;
  reviewsCount: number;
  seoScore?: number;
  domainAuthority?: number;
  backlinks?: number;
  monthlyTraffic?: number;
  pageSpeed?: number;
  mobileScore?: number;
  accessibilityScore?: number;
  services: string[];
  specialties: string[];
  insuranceAccepted: string[];
  socialMedia: any;
  businessHours: any;
  lastAnalyzed: string;
  isActive: boolean;
}

interface SolutionRecommendation {
  id: string;
  name: string;
  priority: number;
  description: string;
  setupCost: number;
  monthlyCost: number;
  reason: string;
  icon: string;
}

interface ROIData {
  currentTraffic: number;
  currentLeads: number;
  currentRevenue: number;
  projectedTraffic: number;
  projectedLeads: number;
  projectedRevenue: number;
  monthlyIncrease: number;
  roi: number;
}

interface CompetitorData {
  name: string;
  domain: string;
  rating: number;
  reviewsCount: number;
  seoScore: number;
  backlinks: number;
  monthlyTraffic: number;
  comparison: string;
}

export default function BusinessProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roiData, setRoiData] = useState<ROIData | null>(null);
  const [solutions, setSolutions] = useState<SolutionRecommendation[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [adsData, setAdsData] = useState<any>(null);
  const [adsLoading, setAdsLoading] = useState(false);
  const [seoPpcData, setSeoPpcData] = useState<any>(null);
  const [seoPpcLoading, setSeoPpcLoading] = useState(false);
  // ROI Calculator user inputs (only top fields editable)
  const [roiInputs, setRoiInputs] = useState({
    currentTraffic: 500,
    conversionRate: 5, // percent
    avgServiceValue: 200
  });

  useEffect(() => {
    if (profileId) {
      fetchBusinessProfile();
    }
  }, [profileId]);

  const fetchBusinessProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/serp/business/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Business profile data:', data);
        setProfile(data.data);
        generateROIData(data.data);
        generateSolutions(data.data);
        // Competitors will be generated automatically when SEO & PPC data loads
        
        // Check if business is in watchlist
        if (data.data.watchlistStatus) {
          setIsInWatchlist(true);
        }

        // Fetch ads data for this business
        fetchBusinessAds(data.data);
        // Fetch SEO & PPC data for this business
        fetchBusinessSEOAndPPC(data.data);
      } else {
        console.error('Failed to fetch business profile:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessAds = async (profileData?: BusinessProfile) => {
    try {
      setAdsLoading(true);
      const token = localStorage.getItem('token');
      const businessProfile = profileData || profile;
      const location = businessProfile?.city && businessProfile?.state 
        ? `${businessProfile.city}, ${businessProfile.state}` 
        : 'Missouri';
      const url = `/api/serp/business/${profileId}/ads?location=${encodeURIComponent(location)}`;
      console.log('[BusinessProfile] Fetching Ads (single-port):', { url, profileId, location });
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdsData(data.data);
      } else {
        let body: any = undefined;
        try { body = await response.json(); } catch (_) {}
        console.error('Failed to fetch ads:', response.status, body);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setAdsLoading(false);
    }
  };

  const fetchBusinessSEOAndPPC = async (profileData?: BusinessProfile) => {
    try {
      setSeoPpcLoading(true);
      const token = localStorage.getItem('token');
      const businessProfile = profileData || profile;
      const location = businessProfile?.city && businessProfile?.state 
        ? `${businessProfile.city}, ${businessProfile.state}` 
        : 'Missouri';
      const url = `/api/serp/business/${profileId}/seo-ppc?location=${encodeURIComponent(location)}`;
      console.log('[BusinessProfile] Fetching SEO & PPC:', { url, profileId, location });
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[BusinessProfile] SEO & PPC data received:', data);
        if (data.success && data.data) {
          console.log('[BusinessProfile] SEO & PPC analysis:', {
            opportunityScore: data.data.opportunityScore,
            serpPosition: data.data.serpPosition,
            schemas: data.data.schemas,
            analytics: data.data.analytics,
            localCompetitors: data.data.localCompetitors?.items?.length || 0,
            error: data.data.error
          });
          setSeoPpcData(data.data);
        } else {
          console.warn('[BusinessProfile] SEO & PPC response missing data:', data);
        }
      } else {
        let body: any = undefined;
        try { body = await response.json(); } catch (_) {}
        console.error('[BusinessProfile] Failed to fetch SEO & PPC:', {
          status: response.status,
          statusText: response.statusText,
          body
        });
        // Set null data so UI shows appropriate message
        setSeoPpcData(null);
      }
    } catch (error) {
      console.error('[BusinessProfile] Error fetching SEO & PPC:', error);
      setSeoPpcData(null);
    } finally {
      setSeoPpcLoading(false);
    }
  };

  const generateROIData = (profile: BusinessProfile) => {
    const currentTraffic = profile.monthlyTraffic || 500;
    const conversionRate = 5; // % default
    const avgServiceValue = 200; // $ default

    setRoiInputs({ currentTraffic, conversionRate, avgServiceValue });

    calculateROI({ currentTraffic, conversionRate, avgServiceValue } as any);
  };

  const calculateROI = (inputs: typeof roiInputs) => {
    const currentLeads = Math.round((inputs.currentTraffic || 0) * ((inputs.conversionRate || 0) / 100));
    const currentRevenue = currentLeads * (inputs.avgServiceValue || 0);
    const projectedTraffic = Math.round((inputs.currentTraffic || 0) * 3);
    const projectedLeads = Math.round(projectedTraffic * 0.06); // assume 6%
    const projectedRevenue = projectedLeads * (inputs.avgServiceValue || 0);
    const monthlyIncrease = projectedRevenue - currentRevenue;
    const roi = currentRevenue > 0 ? Math.round((monthlyIncrease / currentRevenue) * 100) : 0;

    setRoiData({
      currentTraffic: inputs.currentTraffic,
      currentLeads,
      currentRevenue,
      projectedTraffic,
      projectedLeads,
      projectedRevenue,
      monthlyIncrease,
      roi
    });
  };

  const handleRoiInputChange = (field: keyof typeof roiInputs, value: string) => {
    const numValue = parseInt(value) || 0;
    const newInputs = { ...roiInputs, [field]: numValue };
    setRoiInputs(newInputs);
    calculateROI(newInputs);
  };

  // Initialize ROI with default values on mount
  useEffect(() => {
    calculateROI(roiInputs);
  }, []);

  const generateSolutions = (profile: BusinessProfile) => {
    const solutions: SolutionRecommendation[] = [];

    // PPC Analysis (use live PPC status; reconcile with Ads tab if present)
    const runningAdsFromSeo = seoPpcData?.ppcStatus?.runningAds;
    const runningAdsFromAdsTab = adsData?.isRunningAds;
    const runningAds: boolean | undefined =
      typeof runningAdsFromAdsTab === 'boolean' ? runningAdsFromAdsTab : runningAdsFromSeo;
    const hasSeoPpc = !!seoPpcData;
    const adCount = seoPpcData?.ppcStatus?.adCount ?? adsData?.totalAds ?? 0;
    const showPpcOpportunity = hasSeoPpc && runningAds === false && adCount === 0;
    if (showPpcOpportunity) {
      solutions.push({
        id: 'ppc',
        name: 'PPC Management',
        priority: 2,
        description: 'Not running ads - missing paid traffic opportunity',
        setupCost: 1000,
        monthlyCost: 1000,
        reason: 'Low paid presence detected in current market',
        icon: 'Target'
      });
    }

    // Reputation Management (use rating and reviews thresholds)
    const lowReviews = (profile.reviewsCount ?? 0) < 50;
    const lowRating = (profile.rating ?? 0) < 4.0;
    if (lowReviews || lowRating) {
      solutions.push({
        id: 'reputation',
        name: 'Reputation Management',
        priority: 1,
        description: lowReviews ? 'Low review count hurting credibility' : 'Low rating - reputation improvement needed',
        setupCost: 500,
        monthlyCost: 1000,
        reason: lowReviews ? 'Low review count - Reputation management recommended' : 'Rating below target threshold',
        icon: 'Star'
      });
    }
    
    // AI Chatbot
    solutions.push({
      id: 'chatbot',
      name: 'AI Chatbot',
      priority: 3,
      description: '24/7 patient support and lead capture',
      setupCost: 1500,
      monthlyCost: 300,
      reason: 'Automated patient support and lead generation',
      icon: 'MessageSquare'
    });
    
    setSolutions(solutions);
  };

  // Recompute solutions when SEO & PPC data arrives or profile changes
  useEffect(() => {
    if (profile) {
      generateSolutions(profile);
    }
  }, [seoPpcData, profile]);

  const generateCompetitors = (profile: BusinessProfile) => {
    // Use real competitors data from SEO & PPC if available, otherwise use mock data as fallback
    if (seoPpcData?.localCompetitors?.items && seoPpcData.localCompetitors.items.length > 0) {
      // Additional safety check: filter out current business by domain and name
      const currentDomain = (profile.domain || profile.websiteUrl || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const currentName = (profile.name || '').toLowerCase().trim();
      
      const filteredCompetitors = seoPpcData.localCompetitors.items.filter((competitor: any) => {
        const competitorDomain = (competitor.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const competitorName = (competitor.name || '').toLowerCase().trim();
        
        // Exclude if domain or name matches current business
        return competitorDomain !== currentDomain && 
               competitorName !== currentName &&
               !competitorDomain.includes(currentDomain) &&
               !currentDomain.includes(competitorDomain) &&
               !competitorName.includes(currentName) &&
               !currentName.includes(competitorName);
      });
      
      const competitorData: CompetitorData[] = filteredCompetitors.slice(0, 5).map((competitor: any, index: number) => {
        // Compare with current business profile
        const profileRating = profile.rating || 0;
        const profileReviews = profile.reviewsCount || 0;
        const competitorRating = competitor.rating || 0;
        const competitorReviews = competitor.reviewsCount || 0;

        let comparison: 'better' | 'worse' | 'equal' = 'equal';
        if (competitorRating > profileRating || competitorReviews > profileReviews) {
          comparison = 'better';
        } else if (competitorRating < profileRating || competitorReviews < profileReviews) {
          comparison = 'worse';
        }

        return {
          name: competitor.name || `Competitor ${index + 1}`,
          domain: competitor.domain || `competitor${index + 1}.com`,
          rating: competitorRating,
          reviewsCount: competitorReviews,
          seoScore: 75, // Default since we don't have SEO score for competitors
          backlinks: 0, // Not available from local pack data
          monthlyTraffic: 0, // Not available from local pack data
          comparison
        };
      });
      
      setCompetitors(competitorData);
    } else {
      // Fallback to empty array or show message that no competitors data is available yet
      setCompetitors([]);
    }
  };

  // Update competitors when SEO & PPC data is loaded
  useEffect(() => {
    if (seoPpcData?.localCompetitors && profile) {
      generateCompetitors(profile);
    }
  }, [seoPpcData, profile]);

  const addToWatchlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/serp/add-to-watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessProfileId: profileId,
          itemType: 'prospect',
          name: profile?.name,
          domain: profile?.domain,
          category: profile?.category,
          location: profile?.location,
          score: profile?.seoScore,
          rating: profile?.rating,
          status: 'active',
          priority: 'high'
        })
      });
      
      if (response.ok) {
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-theme-blue-primary to-theme-dark-blue flex items-center justify-center">
        <div className="text-white text-xl">Loading business profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-theme-blue-primary to-theme-dark-blue flex items-center justify-center">
        <div className="text-white text-xl">Business profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-blue-primary to-theme-dark-blue">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="flex items-center text-white hover:text-theme-yellow-primary transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={addToWatchlist}
                disabled={isInWatchlist}
                className="bg-theme-yellow-primary hover:bg-theme-orange text-theme-dark-blue font-bold"
              >
                {isInWatchlist ? (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Watchlist
                  </>
                )}
              </Button>
              <Button
                className="bg-theme-blue-primary hover:bg-theme-blue-secondary text-white"
              >
                <Target className="w-4 h-4 mr-2" />
                Add to Prospects
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Scoring Section */}
      {profile.comprehensiveScore && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Comprehensive Lead Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {profile.comprehensiveScore.leadScore}%
                </div>
                <Progress value={profile.comprehensiveScore.leadScore} className="mb-4" />
                <p className="text-sm text-blue-700">
                  {profile.comprehensiveScore.leadScore > 80 ? 'High potential for digital marketing growth' : 
                   profile.comprehensiveScore.leadScore > 60 ? 'Moderate potential with room for improvement' :
                   'Low potential - significant improvements needed'}
                </p>
              </div>
              
              {/* Detailed Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{profile.comprehensiveScore.presenceScore}</div>
                  <div className="text-sm text-gray-600">Presence Score</div>
                  <div className="text-xs text-gray-500">Reviews, NAP, Credibility</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{profile.comprehensiveScore.seoScore}</div>
                  <div className="text-sm text-gray-600">SEO Score</div>
                  <div className="text-xs text-gray-500">Technical + Visibility</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{profile.comprehensiveScore.adsActivityScore}</div>
                  <div className="text-sm text-gray-600">Ads Score</div>
                  <div className="text-xs text-gray-500">Ad Presence + Performance</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{profile.comprehensiveScore.engagementScore}</div>
                  <div className="text-sm text-gray-600">Engagement Score</div>
                  <div className="text-xs text-gray-500">Reviews + Response Rate</div>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-800">{profile.comprehensiveScore.organicTraffic?.toLocaleString() || 'N/A'}</div>
                  <div className="text-xs text-gray-600">Monthly Traffic</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-800">{profile.comprehensiveScore.backlinkCount || 'N/A'}</div>
                  <div className="text-xs text-gray-600">Backlinks</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-800">{profile.comprehensiveScore.reviewCount || 'N/A'}</div>
                  <div className="text-xs text-gray-600">Reviews</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-800">{profile.comprehensiveScore.adCount || 'N/A'}</div>
                  <div className="text-xs text-gray-600">Active Ads</div>
                </div>
              </div>
              
              {/* Detailed Recommendations */}
              {profile.recommendations && profile.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Improvement Recommendations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Detailed Ad Performance Analysis */}
              {profile.adPerformance && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Detailed Ad Performance Analysis</h4>
                  
                  {/* Ad Activity Score */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-lg font-semibold text-gray-800">Ad Activity Score</h5>
                      <div className="text-3xl font-bold text-purple-600">{profile.adPerformance.adActivityScore || 0}/100</div>
                    </div>
                    <Progress value={profile.adPerformance.adActivityScore || 0} className="mb-2" />
                    <p className="text-sm text-gray-600">
                      {profile.adPerformance.adActivityScore > 80 ? 'High ad activity - strong paid presence' :
                       profile.adPerformance.adActivityScore > 60 ? 'Moderate ad activity - room for growth' :
                       profile.adPerformance.adActivityScore > 40 ? 'Low ad activity - significant opportunity' :
                       'Minimal ad activity - major PPC opportunity'}
                    </p>
                  </div>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{profile.adPerformance.paidETV?.toLocaleString() || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Paid ETV (Monthly)</div>
                      <div className="text-xs text-gray-500">Estimated paid traffic</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{profile.adPerformance.creativesCount || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Active Creatives</div>
                      <div className="text-xs text-gray-500">Unique ad creatives</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{profile.adPerformance.approxAdsCount || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Approx Ads Count</div>
                      <div className="text-xs text-gray-500">Total ad campaigns</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{profile.adPerformance.adRecency || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Ad Recency Score</div>
                      <div className="text-xs text-gray-500">Campaign freshness</div>
                    </div>
                  </div>
                  
                  {/* Ad Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold text-gray-800 mb-3">Advertiser Information</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Verified Advertiser:</span>
                          <span className={`text-sm font-medium ${profile.adPerformance.verifiedAdvertiser ? 'text-green-600' : 'text-red-600'}`}>
                            {profile.adPerformance.verifiedAdvertiser ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Platforms:</span>
                          <span className="text-sm text-gray-800">
                            {profile.adPerformance.platforms?.join(', ') || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Last Active:</span>
                          <span className="text-sm text-gray-800">
                            {profile.adPerformance.lastActiveDate || 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Ad Activity Score:</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {profile.adPerformance.adActivityScore || 0}/100
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold text-gray-800 mb-3">Recent Ad Creatives</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {profile.adPerformance.recentCreatives?.slice(0, 5).map((creative: any, index: number) => (
                          <div key={index} className="p-2 bg-white rounded border">
                            <div className="text-sm font-medium text-gray-800 truncate">{creative.title}</div>
                            <div className="text-xs text-gray-500">
                              {creative.format} • {creative.lastShown ? new Date(creative.lastShown).toLocaleDateString() : 'Unknown date'}
                            </div>
                            {creative.verified && (
                              <div className="text-xs text-green-600 font-medium">✓ Verified</div>
                            )}
                          </div>
                        )) || (
                          <div className="text-sm text-gray-500">No ad creatives found</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ad Improvement Recommendations */}
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-3">Ad Performance Recommendations</h5>
                    <div className="space-y-2">
                      {profile.adPerformance.adActivityScore < 50 && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            Low ad activity detected - Consider launching targeted PPC campaigns for high-intent keywords
                          </span>
                        </div>
                      )}
                      {profile.adPerformance.creativesCount < 5 && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            Limited ad creatives - Diversify ad formats and test different messaging approaches
                          </span>
                        </div>
                      )}
                      {profile.adPerformance.adRecency < 30 && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            Stale ad campaigns - Refresh creatives and optimize for current market conditions
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Business Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Business Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-alata text-theme-dark-blue mb-2">{profile.name}</h1>
                  <div className="flex items-center gap-4 text-theme-blue-primary">
                    <Badge variant="secondary" className="bg-theme-yellow-primary/20 text-theme-dark-blue">
                      {profile.category}
                    </Badge>
                    {profile.subcategory && (
                      <Badge variant="outline" className="border-theme-blue-primary text-theme-blue-primary">
                        {profile.subcategory}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {seoPpcLoading || !seoPpcData ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center text-theme-blue-primary">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-sm">Analyzing SEO & PPC…</span>
                      </div>
                      <div className="text-sm text-theme-dark-blue/60">Opportunity Score</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-theme-blue-primary mb-1">
                        {seoPpcData.opportunityScore}/100
                      </div>
                      <div className="text-sm text-theme-dark-blue/70">Opportunity Score</div>
                      <div className={`flex items-center font-bold ${
                        (seoPpcData.opportunityScore ?? 0) >= 70
                          ? 'text-green-600'
                          : (seoPpcData.opportunityScore ?? 0) >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        <Zap className="w-4 h-4 mr-1" />
                        {(seoPpcData.opportunityScore ?? 0) >= 70
                          ? 'High Potential'
                          : (seoPpcData.opportunityScore ?? 0) >= 50
                          ? 'Medium Potential'
                          : 'Low Potential'}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-theme-dark-blue">
                    <MapPin className="w-5 h-5 mr-3 text-theme-blue-primary" />
                    <div>
                      <div className="font-semibold">{profile.address}</div>
                      <div>{profile.city}, {profile.state} {profile.zipCode}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-theme-dark-blue">
                    <Phone className="w-5 h-5 mr-3 text-theme-blue-primary" />
                    <div>{profile.phone}</div>
                  </div>
                  <div className="flex items-center text-theme-dark-blue">
                    <Mail className="w-5 h-5 mr-3 text-theme-blue-primary" />
                    <div>{profile.email}</div>
                  </div>
                  {profile.websiteUrl && (
                    <div className="flex items-center text-theme-dark-blue">
                      <Globe className="w-5 h-5 mr-3 text-theme-blue-primary" />
                      <a 
                        href={profile.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-theme-blue-primary hover:underline flex items-center"
                      >
                        {profile.domain || profile.websiteUrl}
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-3 text-theme-yellow-primary" />
                    <div>
                      <div className="font-semibold text-theme-dark-blue">
                        ⭐ {profile.rating.toFixed(1)} out of 5.0
                      </div>
                      <div className="text-sm text-theme-dark-blue/70">
                        {profile.reviewsCount} reviews
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Search className="w-5 h-5 mr-3 text-theme-blue-primary" />
                    <div>
                      <div className="font-semibold text-theme-dark-blue">SERP Position</div>
                      {seoPpcLoading || !seoPpcData ? (
                        <div className="flex items-center text-theme-blue-primary text-sm">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Loading…</span>
                        </div>
                      ) : (
                        <div className="text-sm text-theme-dark-blue/70">
                          {seoPpcData.serpPosition ? `#${seoPpcData.serpPosition}` : 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                    <div className="text-theme-dark-blue">Has Website</div>
                  </div>
                </div>
              </div>

              {/* Opportunity Highlights */}
              <div className="bg-theme-light-blue/10 rounded-lg p-4">
                <h3 className="font-semibold text-theme-dark-blue mb-3">Opportunity Highlights</h3>
                {seoPpcLoading && (
                  <div className="flex items-center text-theme-dark-blue/60">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Analyzing opportunities…</span>
                  </div>
                )}
                {!seoPpcLoading && solutions.length === 0 && (
                  <div className="text-theme-dark-blue/60">All good — no immediate gaps detected.</div>
                )}
                {!seoPpcLoading && solutions.length > 0 && (
                  <div className="space-y-2">
                    {solutions.map((s) => (
                      <div key={s.id} className="flex items-center text-orange-600">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <span>{s.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-white/20 backdrop-blur-sm rounded-lg p-1 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-theme-blue-primary data-[state=active]:text-white text-white font-semibold">
              Overview
            </TabsTrigger>
            <TabsTrigger value="solutions" className="data-[state=active]:bg-theme-blue-primary data-[state=active]:text-white text-white font-semibold">
              Solutions
            </TabsTrigger>
            <TabsTrigger value="roi" className="data-[state=active]:bg-theme-blue-primary data-[state=active]:text-white text-white font-semibold">
              ROI
            </TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-theme-blue-primary data-[state=active]:text-white text-white font-semibold">
              SEO & PPC
            </TabsTrigger>
            <TabsTrigger value="reputation" className="data-[state=active]:bg-theme-blue-primary data-[state=active]:text-white text-white font-semibold">
              Reputation
            </TabsTrigger>
            <TabsTrigger value="competitors" className="data-[state=active]:bg-theme-blue-primary data-[state=active]:text-white text-white font-semibold">
              Competitors
            </TabsTrigger>
            <TabsTrigger value="ads" className="data-[state=active]:bg-theme-blue-primary data-[state=active]:text-white text-white font-semibold">
              Ads
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Business Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-theme-dark-blue/70">Category</span>
                    <span className="font-semibold text-theme-dark-blue">{profile.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-dark-blue/70">Specialty</span>
                    <span className="font-semibold text-theme-dark-blue">{profile.subcategory || 'General Practice'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-dark-blue/70">Rating</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-theme-yellow-primary mr-1" />
                      <span className="font-semibold text-theme-dark-blue">{profile.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-dark-blue/70">Reviews</span>
                    <span className="font-semibold text-theme-dark-blue">{profile.reviewsCount} reviews</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-dark-blue/70">SERP Position</span>
                    {seoPpcLoading || !seoPpcData ? (
                      <span className="text-theme-blue-primary text-sm flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading…
                      </span>
                    ) : (
                      <span className="font-semibold text-theme-dark-blue">
                        {seoPpcData.serpPosition ? `#${seoPpcData.serpPosition}` : 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-dark-blue/70">Has Website</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.services.map((service, index) => (
                      <Badge key={index} variant="secondary" className="bg-theme-yellow-primary/20 text-theme-dark-blue">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Solutions Tab */}
          <TabsContent value="solutions" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-theme-dark-blue">Solution Recommendations</CardTitle>
                <CardDescription>Based on analysis of their digital presence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-theme-dark-blue mb-3">Identified Gaps</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="destructive">PPC</Badge>
                      <Badge variant="destructive">Reputation</Badge>
                      <Badge variant="destructive">Schema</Badge>
                      <Badge variant="destructive">Analytics</Badge>
                      <Badge variant="destructive">Social</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-theme-dark-blue mb-4">Recommended Solutions</h3>
                    <div className="space-y-4">
                      {solutions.map((solution) => (
                        <div key={solution.id} className="border border-theme-light-blue/30 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <Target className="w-5 h-5 text-theme-blue-primary mr-2" />
                              <h4 className="font-semibold text-theme-dark-blue">{solution.name}</h4>
                              <Badge 
                                variant={solution.priority === 1 ? "destructive" : solution.priority === 2 ? "default" : "secondary"}
                                className="ml-2"
                              >
                                Priority {solution.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-theme-dark-blue/70 mb-3">{solution.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-theme-dark-blue/70">
                              Setup: ${solution.setupCost.toLocaleString()} | Monthly: ${solution.monthlyCost.toLocaleString()}
                            </div>
                            <Button size="sm" className="bg-theme-blue-primary hover:bg-theme-blue-secondary text-white">
                              Learn More
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI Tab */}
          <TabsContent value="roi" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-theme-dark-blue">ROI Calculator</CardTitle>
                <CardDescription>Estimate potential revenue increase with our services</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Top editable inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-2">
                    <Label htmlFor="roiCurrentTraffic" className="text-theme-dark-blue/70">Current Monthly Traffic</Label>
                    <Input
                      id="roiCurrentTraffic"
                      type="number"
                      value={roiInputs.currentTraffic}
                      onChange={(e) => handleRoiInputChange('currentTraffic', e.target.value)}
                      className="text-theme-dark-blue font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roiConversionRate" className="text-theme-dark-blue/70">Conversion Rate (%)</Label>
                    <Input
                      id="roiConversionRate"
                      type="number"
                      value={roiInputs.conversionRate}
                      onChange={(e) => handleRoiInputChange('conversionRate', e.target.value)}
                      className="text-theme-dark-blue font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roiAvgValue" className="text-theme-dark-blue/70">Avg Service Value ($)</Label>
                    <Input
                      id="roiAvgValue"
                      type="number"
                      value={roiInputs.avgServiceValue}
                      onChange={(e) => handleRoiInputChange('avgServiceValue', e.target.value)}
                      className="text-theme-dark-blue font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Current Performance (computed) */}
                  <div>
                    <h3 className="font-semibold text-theme-dark-blue mb-6 text-lg">Current Performance</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-theme-dark-blue/70">Monthly Traffic:</span>
                        <span className="text-theme-dark-blue font-semibold">{roiData?.currentTraffic?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-dark-blue/70">Monthly Leads:</span>
                        <span className="text-theme-dark-blue font-semibold">{roiData?.currentLeads?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-dark-blue/70">Monthly Revenue:</span>
                        <span className="text-theme-dark-blue font-semibold">${roiData?.currentRevenue?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* With Our Services (computed) */}
                  <div>
                    <h3 className="font-semibold text-theme-dark-blue mb-6 text-lg">With Our Services</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-theme-dark-blue/70">Monthly Traffic:</span>
                        <span className="text-theme-dark-blue font-semibold">{roiData?.projectedTraffic?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-dark-blue/70">Monthly Leads:</span>
                        <span className="text-theme-dark-blue font-semibold">{roiData?.projectedLeads?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-dark-blue/70">Monthly Revenue:</span>
                        <span className="text-theme-dark-blue font-semibold">${roiData?.projectedRevenue?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {roiData && (
                  <div className="mt-8 p-6 bg-theme-yellow-primary/10 rounded-lg border-2 border-theme-yellow-primary/20">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-theme-dark-blue mb-2">
                        Projected Monthly Increase
                      </h3>
                      <div className="text-4xl font-bold text-theme-blue-primary mb-4">
                        ${roiData.monthlyIncrease.toLocaleString()}
                      </div>
                      <div className="text-xl font-semibold text-theme-dark-blue mb-4">
                        ROI: {roiData.roi}%
                      </div>
                      <p className="text-sm text-theme-dark-blue/60 italic">
                        *Projections based on industry averages and typical improvements from SEO/PPC optimization
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            {seoPpcLoading ? (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-blue-primary"></div>
                    <p className="text-theme-dark-blue/70">Loading SEO & PPC analysis...</p>
                  </div>
                </CardContent>
              </Card>
            ) : seoPpcData ? (
              <>
                {/* Opportunity Score Card */}
                <Card className="bg-white/95 backdrop-blur-sm border-2 border-theme-blue-primary">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Opportunity Score: {seoPpcData.opportunityScore || 0}/100
                    </CardTitle>
                    <CardDescription>
                      Based on SERP position, schema presence, analytics, speed scores, and PPC status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-theme-dark-blue/70">Overall Opportunity</span>
                        <span className={`font-bold text-lg ${
                          (seoPpcData.opportunityScore || 0) >= 70 ? 'text-green-600' :
                          (seoPpcData.opportunityScore || 0) >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {seoPpcData.opportunityScore || 0}/100
                        </span>
                      </div>
                      <Progress 
                        value={seoPpcData.opportunityScore || 0} 
                        className="h-3"
                      />
                      {seoPpcData.opportunityScoreBreakdown && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-xs">
                          <div>
                            <div className="text-theme-dark-blue/70">SERP</div>
                            <div className="font-semibold">{seoPpcData.opportunityScoreBreakdown.serpPosition || 0}</div>
                          </div>
                          <div>
                            <div className="text-theme-dark-blue/70">Schemas</div>
                            <div className="font-semibold">{seoPpcData.opportunityScoreBreakdown.schemas || 0}</div>
                          </div>
                          <div>
                            <div className="text-theme-dark-blue/70">Analytics</div>
                            <div className="font-semibold">{seoPpcData.opportunityScoreBreakdown.analytics || 0}</div>
                          </div>
                          <div>
                            <div className="text-theme-dark-blue/70">Speed</div>
                            <div className="font-semibold">{seoPpcData.opportunityScoreBreakdown.speedScores || 0}</div>
                          </div>
                          <div>
                            <div className="text-theme-dark-blue/70">PPC</div>
                            <div className="font-semibold">{seoPpcData.opportunityScoreBreakdown.ppcStatus || 0}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-theme-dark-blue">SEO Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-theme-dark-blue/70">Local Business Schema</span>
                        <div className="flex items-center">
                          {seoPpcData.schemas?.localBusiness ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-green-500 font-semibold">Found</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500 mr-2" />
                              <span className="text-red-500 font-semibold">Missing</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-dark-blue/70">FAQ Schema</span>
                        <div className="flex items-center">
                          {seoPpcData.schemas?.faq ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-green-500 font-semibold">Found</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500 mr-2" />
                              <span className="text-red-500 font-semibold">Missing</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-dark-blue/70">SERP Position</span>
                        <span className="font-semibold text-theme-dark-blue">
                          {seoPpcData.serpPosition ? `#${seoPpcData.serpPosition}` : 'Not ranked'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-dark-blue/70">PPC & Advertising</span>
                        {seoPpcData.ppcStatus?.runningAds ? (
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-green-500 font-semibold">
                              Running Ads ({seoPpcData.ppcStatus.adCount || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-orange-500 font-semibold">Not Running Ads</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-theme-dark-blue">Technical SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-theme-dark-blue/70">Google Analytics</span>
                        <div className="flex items-center">
                          {seoPpcData.analytics?.googleAnalytics?.found ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-green-500 font-semibold">Found</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500 mr-2" />
                              <span className="text-red-500 font-semibold">Not Found</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-dark-blue/70">Facebook Pixel</span>
                        <div className="flex items-center">
                          {seoPpcData.analytics?.facebookPixel?.found ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-green-500 font-semibold">Found</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500 mr-2" />
                              <span className="text-red-500 font-semibold">Not Found</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-theme-dark-blue/70">Desktop Speed Score</span>
                          <span className="font-semibold text-theme-dark-blue">
                            {seoPpcData.speedScores?.desktop ? `${seoPpcData.speedScores.desktop}/100` : 'N/A'}
                          </span>
                        </div>
                        {seoPpcData.speedScores?.desktop ? (
                          <Progress value={seoPpcData.speedScores.desktop} className="h-2" />
                        ) : (
                          <div className="text-xs text-theme-dark-blue/50 italic">
                            N/A — speed data not available for desktop
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-theme-dark-blue/70">Mobile Speed Score</span>
                          <span className="font-semibold text-theme-dark-blue">
                            {seoPpcData.speedScores?.mobile ? `${seoPpcData.speedScores.mobile}/100` : 'N/A'}
                          </span>
                        </div>
                        {seoPpcData.speedScores?.mobile ? (
                          <Progress value={seoPpcData.speedScores.mobile} className="h-2" />
                        ) : (
                          <div className="text-xs text-theme-dark-blue/50 italic">
                            N/A — speed data not available for mobile
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Local Competitors */}
                {competitors.length > 0 && (
                  <Card className="bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-theme-dark-blue">Local Pack Competitors</CardTitle>
                      <CardDescription>
                        {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} found in local search
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {competitors.map((competitor: CompetitorData, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-semibold text-theme-dark-blue">{competitor.name}</div>
                              {competitor.domain && (
                                <div className="text-sm text-theme-dark-blue/70">{competitor.domain}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {competitor.rating > 0 && (
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{competitor.rating}</span>
                                  </div>
                                  {competitor.reviewsCount > 0 && (
                                    <div className="text-xs text-theme-dark-blue/60">
                                      {competitor.reviewsCount} reviews
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {competitors.length === 0 && seoPpcData?.localCompetitors && (
                  <Card className="bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-theme-dark-blue">Local Pack Competitors</CardTitle>
                      <CardDescription>No competitors found (current business filtered out)</CardDescription>
                    </CardHeader>
                  </Card>
                )}

                {/* Recommendations */}
                {seoPpcData.recommendations && seoPpcData.recommendations.length > 0 && (
                  <Card className="bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-theme-dark-blue flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {seoPpcData.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-theme-blue-primary mt-0.5 flex-shrink-0" />
                            <span className="text-theme-dark-blue/80">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-theme-dark-blue/70">No SEO & PPC data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reputation Tab */}
          <TabsContent value="reputation" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-theme-dark-blue">Online Reputation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-theme-dark-blue">Average Rating</h3>
                      <div className="flex items-center mt-2">
                        <Star className="w-6 h-6 text-theme-yellow-primary mr-1" />
                        <span className="text-2xl font-bold text-theme-dark-blue">{profile.rating.toFixed(1)}</span>
                        <span className="text-theme-dark-blue/70 ml-2">out of 5.0</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-theme-dark-blue">{profile.reviewsCount}</div>
                      <div className="text-theme-dark-blue/70">Total Reviews</div>
                    </div>
                  </div>
                  
                  {profile.reviewsCount < 50 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                        <span className="text-orange-700 font-semibold">
                          Low review count - Reputation management recommended
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-theme-dark-blue">Competitor Analysis</CardTitle>
                <CardDescription>How this business compares to competitors</CardDescription>
              </CardHeader>
              <CardContent>
                {seoPpcLoading ? (
                  <div className="py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-blue-primary"></div>
                      <p className="text-theme-dark-blue/70">Loading competitor data...</p>
                    </div>
                  </div>
                ) : competitors.length === 0 ? (
                  <div className="py-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <p className="text-theme-dark-blue/70 mb-2">No competitor data available</p>
                    <p className="text-sm text-theme-dark-blue/50">
                      Competitor data will appear here once SEO & PPC analysis is complete.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {competitors.map((competitor, index) => (
                    <div key={index} className="border border-theme-light-blue/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-theme-dark-blue">{competitor.name}</h4>
                          <p className="text-sm text-theme-dark-blue/70">{competitor.domain}</p>
                        </div>
                        <Badge 
                          variant={competitor.comparison === 'better' ? 'destructive' : competitor.comparison === 'worse' ? 'default' : 'secondary'}
                        >
                          {competitor.comparison === 'better' ? 'Better' : competitor.comparison === 'worse' ? 'Worse' : 'Equal'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-theme-dark-blue/70">Rating</div>
                          <div className="font-semibold text-theme-dark-blue">{competitor.rating.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-theme-dark-blue/70">Reviews</div>
                          <div className="font-semibold text-theme-dark-blue">{competitor.reviewsCount}</div>
                        </div>
                        <div>
                          <div className="text-theme-dark-blue/70">SEO Score</div>
                          <div className="font-semibold text-theme-dark-blue">{competitor.seoScore}/100</div>
                        </div>
                        <div>
                          <div className="text-theme-dark-blue/70">Traffic</div>
                          <div className="font-semibold text-theme-dark-blue">{competitor.monthlyTraffic.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-theme-dark-blue">Active Advertisements</CardTitle>
                <CardDescription>
                  {adsData?.isRunningAds 
                    ? `Running ${adsData.totalAds} active ad${adsData.totalAds !== 1 ? 's' : ''}`
                    : 'No active advertisements detected'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adsLoading ? (
                  <div className="text-center py-8 text-theme-dark-blue/70">Loading ads...</div>
                ) : adsData?.isRunningAds && adsData.ads && adsData.ads.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adsData.ads.map((ad: any, index: number) => (
                        <Card key={index} className="bg-gray-50 border-theme-light-blue/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-sm font-semibold text-theme-dark-blue line-clamp-2">
                                {ad.title || 'Ad Title'}
                              </CardTitle>
                              {ad.verified && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {ad.description && (
                              <p className="text-xs text-theme-dark-blue/70 line-clamp-2">{ad.description}</p>
                            )}
                            {ad.url && (
                              <a
                                href={ad.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-theme-blue-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Ad
                              </a>
                            )}
                            {ad.previewImage && (
                              <div className="mt-2 rounded border border-gray-200 overflow-hidden">
                                <img
                                  src={ad.previewImage}
                                  alt={ad.title || 'Ad preview'}
                                  className="w-full h-auto"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-theme-dark-blue/60 pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-2">
                                {ad.platform && (
                                  <Badge variant="outline" className="text-xs">
                                    {ad.platform.replace('google_', '').replace('_', ' ')}
                                  </Badge>
                                )}
                                {ad.format && (
                                  <span className="capitalize">{ad.format}</span>
                                )}
                              </div>
                              {ad.lastShown && (
                                <span className="text-xs">
                                  Last shown: {new Date(ad.lastShown).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-theme-dark-blue/30 mx-auto mb-4" />
                    <p className="text-theme-dark-blue/70 mb-2">
                      {adsData?.error 
                        ? `Unable to load ads: ${adsData.error}`
                        : 'No active advertisements found'}
                    </p>
                    <p className="text-sm text-theme-dark-blue/50">
                      This business may not be running Google Ads currently, or ad data is not available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
