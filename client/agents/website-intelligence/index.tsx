import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Globe, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Zap,
  Shield,
  Eye,
  BarChart3,
  Activity,
  Download,
  ExternalLink,
  Star,
  Clock,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Heart,
  Plus
} from 'lucide-react';

export default function WebsiteIntelligenceAgent() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);

  // Real API call to analyze website
  const analyzeWebsite = async () => {
    if (!url.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/serp/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: url,
          location: 'Las Vegas, NV',
          device: 'desktop'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysisData(data.data);
          setActiveTab('overview');
        }
      } else {
        console.error('Analysis failed:', response.statusText);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mock comprehensive analysis data
  const mockAnalysisData = {
    basicInfo: {
      domain: 'lasvegasspinecare.com',
      title: 'Las Vegas Spine Care Center - Advanced Spinal Treatment',
      description: 'Leading spine care clinic in Las Vegas offering advanced spinal treatments, chiropractic care, and pain management solutions.',
      favicon: 'https://lasvegasspinecare.com/favicon.ico',
      language: 'en-US',
      lastModified: '2024-01-15',
      server: 'Apache/2.4.41',
      ssl: true,
      mobileFriendly: true
    },
    seoScore: {
      overall: 78,
      technical: 85,
      content: 72,
      performance: 68,
      accessibility: 82,
      mobile: 75
    },
    performance: {
      pageSpeed: 3.2,
      loadTime: 2.8,
      firstContentfulPaint: 1.2,
      largestContentfulPaint: 2.1,
      cumulativeLayoutShift: 0.05,
      firstInputDelay: 45,
      totalBlockingTime: 120
    },
    technical: {
      metaTags: {
        title: 'Present',
        description: 'Present',
        keywords: 'Missing',
        robots: 'Present',
        canonical: 'Present',
        ogTags: 'Partial',
        twitterCards: 'Missing'
      },
      structuredData: {
        schema: 'Present',
        breadcrumbs: 'Present',
        organization: 'Present',
        medicalBusiness: 'Present',
        reviews: 'Present',
        faq: 'Missing'
      },
      security: {
        https: true,
        hsts: true,
        csp: false,
        xssProtection: true,
        contentTypeOptions: true
      }
    },
    content: {
      wordCount: 2847,
      headings: {
        h1: 1,
        h2: 4,
        h3: 8,
        h4: 12
      },
      images: {
        total: 15,
        withAlt: 12,
        optimized: 8,
        webp: 3
      },
      links: {
        internal: 23,
        external: 7,
        broken: 1,
        nofollow: 3
      }
    },
    keywords: {
      primary: ['spine care las vegas', 'spinal treatment', 'chiropractic care'],
      secondary: ['back pain treatment', 'neck pain relief', 'spinal decompression'],
      density: {
        'spine care': 2.3,
        'las vegas': 1.8,
        'treatment': 1.5,
        'pain': 1.2
      },
      competitors: [
        { keyword: 'spine care las vegas', position: 3, difficulty: 45 },
        { keyword: 'spinal treatment', position: 7, difficulty: 38 },
        { keyword: 'chiropractic care', position: 5, difficulty: 42 }
      ]
    },
    competitors: [
      {
        domain: 'advancedspine.com',
        title: 'Advanced Spine & Joint Institute',
        score: 85,
        strengths: ['Better mobile optimization', 'Faster load times'],
        weaknesses: ['Less content', 'Fewer backlinks']
      },
      {
        domain: 'nevadaspine.com',
        title: 'Nevada Spine Center',
        score: 72,
        strengths: ['More backlinks', 'Better local SEO'],
        weaknesses: ['Slower site', 'Poor mobile experience']
      }
    ],
    ads: {
      googleAds: {
        active: true,
        keywords: ['spine care las vegas', 'back pain treatment'],
        estimatedSpend: '$2,500/month',
        adGroups: 3,
        campaigns: 1
      },
      facebookAds: {
        active: true,
        estimatedSpend: '$800/month',
        targeting: ['Health & Wellness', 'Pain Management']
      },
      bingAds: {
        active: false,
        estimatedSpend: '$0/month'
      }
    },
    socialMedia: {
      facebook: {
        url: 'https://facebook.com/lasvegasspinecare',
        followers: 1250,
        engagement: 4.2,
        lastPost: '2024-01-10'
      },
      instagram: {
        url: 'https://instagram.com/lasvegasspinecare',
        followers: 890,
        engagement: 6.8,
        lastPost: '2024-01-12'
      },
      linkedin: {
        url: 'https://linkedin.com/company/lasvegasspinecare',
        followers: 340,
        engagement: 2.1,
        lastPost: '2024-01-08'
      }
    },
    backlinks: {
      total: 127,
      domainAuthority: 42,
      topLinks: [
        { domain: 'healthgrades.com', anchor: 'Las Vegas Spine Care Reviews', authority: 85 },
        { domain: 'yelp.com', anchor: 'Spine Care Center', authority: 78 },
        { domain: 'google.com', anchor: 'Las Vegas Spine Care', authority: 95 }
      ],
      toxicLinks: 3,
      newLinks: 12
    },
    recommendations: {
      critical: [
        'Implement HTTPS security headers',
        'Optimize images for faster loading',
        'Add missing meta keywords tag'
      ],
      important: [
        'Improve mobile page speed',
        'Add FAQ structured data',
        'Optimize for Core Web Vitals'
      ],
      suggestions: [
        'Create more local content',
        'Build more high-quality backlinks',
        'Improve social media engagement'
      ]
    }
  };

  const handleAnalyze = async () => {
    if (!url) return;
    analyzeWebsite();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

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
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-theme-dark-blue">Website Intelligence</h1>
                <p className="text-theme-light-blue">Comprehensive website analysis and competitive intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-theme-light-blue">
                Analysis: <span className="font-semibold text-theme-blue-primary">Deep Scan</span>
              </div>
              {analysisData && (
                <Button 
                  onClick={() => {
                    alert('Website added to watchlist! You can view it in your Watchlist page.');
                    console.log('Added to watchlist:', analysisData.basicInfo.domain);
                  }}
                  className="bg-theme-yellow-primary hover:bg-theme-yellow-primary/80 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </Button>
              )}
              <Button className="bg-theme-blue-primary hover:bg-theme-dark-blue text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Analysis Input */}
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-theme-dark-blue">Website Analysis</CardTitle>
            <CardDescription>Enter a website URL to perform comprehensive analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL (e.g., https://example.com)"
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={analyzeWebsite}
                disabled={isAnalyzing || !url}
                className="bg-theme-blue-primary hover:bg-theme-dark-blue text-white px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Search className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Website'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {analysisData && analysisData.seoScore && analysisData.performance && analysisData.basicInfo && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                SEO Analysis
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="competitors" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Competitors
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Advertising
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Recommendations
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-theme-light-blue">SEO Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(analysisData.seoScore?.overall || 0)}`}>
                      {analysisData.seoScore?.overall || 0}/100
                    </div>
                    <Progress value={analysisData.seoScore?.overall || 0} className="mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-theme-light-blue">Page Speed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-theme-dark-blue">
                      {analysisData.performance.pageSpeed}s
                    </div>
                    <p className="text-xs text-theme-light-blue mt-1">Load time</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-theme-light-blue">Domain Authority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-theme-dark-blue">
                      {analysisData.backlinks.domainAuthority}
                    </div>
                    <p className="text-xs text-theme-light-blue mt-1">Backlink strength</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-theme-light-blue">Backlinks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-theme-dark-blue">
                      {analysisData.backlinks.total}
                    </div>
                    <p className="text-xs text-theme-light-blue mt-1">Total links</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue">Website Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Domain:</span>
                      <span className="text-theme-dark-blue font-medium">{analysisData.basicInfo.domain}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">SSL:</span>
                      <Badge className={analysisData.basicInfo.ssl ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {analysisData.basicInfo.ssl ? 'Secure' : 'Not Secure'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Mobile Friendly:</span>
                      <Badge className={analysisData.basicInfo.mobileFriendly ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {analysisData.basicInfo.mobileFriendly ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Server:</span>
                      <span className="text-theme-dark-blue font-medium">{analysisData.basicInfo.server}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue">SEO Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Technical SEO:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisData.seoScore.technical} className="w-20" />
                        <span className="text-theme-dark-blue font-medium">{analysisData.seoScore.technical}/100</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Content Quality:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisData.seoScore.content} className="w-20" />
                        <span className="text-theme-dark-blue font-medium">{analysisData.seoScore.content}/100</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Performance:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisData.seoScore.performance} className="w-20" />
                        <span className="text-theme-dark-blue font-medium">{analysisData.seoScore.performance}/100</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Accessibility:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisData.seoScore.accessibility} className="w-20" />
                        <span className="text-theme-dark-blue font-medium">{analysisData.seoScore.accessibility}/100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SEO Analysis Tab */}
            <TabsContent value="seo" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue">Meta Tags Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(analysisData.technical.metaTags).map(([tag, status]) => (
                      <div key={tag} className="flex items-center justify-between">
                        <span className="text-theme-light-blue capitalize">{tag}:</span>
                        <Badge className={status === 'Present' ? "bg-green-100 text-green-800" : status === 'Missing' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                          {status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue">Structured Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(analysisData.technical.structuredData).map(([schema, status]) => (
                      <div key={schema} className="flex items-center justify-between">
                        <span className="text-theme-light-blue capitalize">{schema}:</span>
                        <Badge className={status === 'Present' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Keyword Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-theme-dark-blue mb-3">Primary Keywords</h4>
                      <div className="space-y-2">
                        {analysisData.keywords.primary.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="mr-2 mb-2">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-theme-dark-blue mb-3">Keyword Density</h4>
                      <div className="space-y-2">
                        {Object.entries(analysisData.keywords.density).map(([keyword, density]) => (
                          <div key={keyword} className="flex items-center justify-between">
                            <span className="text-sm text-theme-light-blue">{keyword}:</span>
                            <span className="text-sm font-medium text-theme-dark-blue">{density}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-theme-dark-blue mb-3">Rankings</h4>
                      <div className="space-y-2">
                        {analysisData.keywords.competitors.map((keyword, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-theme-light-blue">{keyword.keyword}:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-theme-dark-blue">#{keyword.position}</span>
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {keyword.difficulty}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-theme-light-blue">Page Speed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-theme-dark-blue">
                      {analysisData.performance.pageSpeed}s
                    </div>
                    <p className="text-xs text-theme-light-blue mt-1">Load time</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-theme-light-blue">First Contentful Paint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-theme-dark-blue">
                      {analysisData.performance.firstContentfulPaint}s
                    </div>
                    <p className="text-xs text-theme-light-blue mt-1">FCP</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-theme-light-blue">Largest Contentful Paint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-theme-dark-blue">
                      {analysisData.performance.largestContentfulPaint}s
                    </div>
                    <p className="text-xs text-theme-light-blue mt-1">LCP</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-theme-light-blue">Cumulative Layout Shift</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-theme-dark-blue">
                      {analysisData.performance.cumulativeLayoutShift}
                    </div>
                    <p className="text-xs text-theme-light-blue mt-1">CLS</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Content Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-theme-dark-blue mb-3">Content Stats</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-light-blue">Word Count:</span>
                          <span className="text-sm font-medium text-theme-dark-blue">{analysisData.content.wordCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-light-blue">Images:</span>
                          <span className="text-sm font-medium text-theme-dark-blue">{analysisData.content.images.total}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-light-blue">Optimized:</span>
                          <span className="text-sm font-medium text-theme-dark-blue">{analysisData.content.images.optimized}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-theme-dark-blue mb-3">Headings Structure</h4>
                      <div className="space-y-2">
                        {Object.entries(analysisData.content.headings).map(([level, count]) => (
                          <div key={level} className="flex items-center justify-between">
                            <span className="text-sm text-theme-light-blue">{level.toUpperCase()}:</span>
                            <span className="text-sm font-medium text-theme-dark-blue">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-theme-dark-blue mb-3">Links</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-light-blue">Internal:</span>
                          <span className="text-sm font-medium text-theme-dark-blue">{analysisData.content.links.internal}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-light-blue">External:</span>
                          <span className="text-sm font-medium text-theme-dark-blue">{analysisData.content.links.external}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-light-blue">Broken:</span>
                          <span className="text-sm font-medium text-red-600">{analysisData.content.links.broken}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Competitors Tab */}
            <TabsContent value="competitors" className="space-y-6">
              <div className="space-y-4">
                {analysisData.competitors.map((competitor, index) => (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-theme-dark-blue">{competitor.title}</h3>
                          <p className="text-theme-light-blue">{competitor.domain}</p>
                        </div>
                        <Badge className={getScoreBadge(competitor.score)}>
                          Score: {competitor.score}/100
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {competitor.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm text-theme-dark-blue flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-600 mb-2">Weaknesses</h4>
                          <ul className="space-y-1">
                            {competitor.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-sm text-theme-dark-blue flex items-center gap-2">
                                <XCircle className="w-3 h-3 text-red-600" />
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Advertising Tab */}
            <TabsContent value="ads" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue">Google Ads</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Status:</span>
                      <Badge className={analysisData.ads.googleAds.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {analysisData.ads.googleAds.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Monthly Spend:</span>
                      <span className="text-theme-dark-blue font-medium">{analysisData.ads.googleAds.estimatedSpend}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Campaigns:</span>
                      <span className="text-theme-dark-blue font-medium">{analysisData.ads.googleAds.campaigns}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Ad Groups:</span>
                      <span className="text-theme-dark-blue font-medium">{analysisData.ads.googleAds.adGroups}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue">Facebook Ads</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Status:</span>
                      <Badge className={analysisData.ads.facebookAds.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {analysisData.ads.facebookAds.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Monthly Spend:</span>
                      <span className="text-theme-dark-blue font-medium">{analysisData.ads.facebookAds.estimatedSpend}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Targeting:</span>
                      <span className="text-theme-dark-blue font-medium text-xs">{analysisData.ads.facebookAds.targeting.join(', ')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue">Bing Ads</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Status:</span>
                      <Badge className={analysisData.ads.bingAds.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {analysisData.ads.bingAds.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-light-blue">Monthly Spend:</span>
                      <span className="text-theme-dark-blue font-medium">{analysisData.ads.bingAds.estimatedSpend}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Social Media Presence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(analysisData.socialMedia).map(([platform, data]) => (
                      <div key={platform} className="text-center">
                        <h4 className="font-semibold text-theme-dark-blue mb-3 capitalize">{platform}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-theme-light-blue">Followers:</span>
                            <span className="text-sm font-medium text-theme-dark-blue">{data.followers.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-theme-light-blue">Engagement:</span>
                            <span className="text-sm font-medium text-theme-dark-blue">{data.engagement}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-theme-light-blue">Last Post:</span>
                            <span className="text-sm font-medium text-theme-dark-blue">{data.lastPost}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Critical Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisData.recommendations.critical.map((issue, index) => (
                        <li key={index} className="text-sm text-theme-dark-blue flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-yellow-600 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Important
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisData.recommendations.important.map((issue, index) => (
                        <li key={index} className="text-sm text-theme-dark-blue flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-blue-600 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisData.recommendations.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-theme-dark-blue flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
