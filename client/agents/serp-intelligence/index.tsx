import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Search, 
  Target, 
  Users, 
  Globe, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Eye,
  MousePointer
} from 'lucide-react';

export default function SERPIntelligenceAgent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState('spine care las vegas');
  const [trackingData, setTrackingData] = useState(null);

  // Track keyword rankings
  const trackKeywords = async () => {
    if (!keyword.trim()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/serp/track-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keyword: keyword,
          location: 'Las Vegas, NV',
          device: 'desktop'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTrackingData(data.data);
          setActiveTab('rankings');
        }
      } else {
        console.error('Tracking failed:', response.statusText);
      }
    } catch (error) {
      console.error('Tracking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demonstration
  const mockData = {
    overview: {
      totalKeywords: 1247,
      avgPosition: 3.2,
      visibility: 78.5,
      competitors: 12
    },
    rankings: [
      { keyword: 'spine care clinic', position: 1, change: '+2', traffic: 1250 },
      { keyword: 'back pain treatment', position: 3, change: '-1', traffic: 890 },
      { keyword: 'chiropractic services', position: 2, change: '+1', traffic: 2100 },
      { keyword: 'spinal decompression', position: 4, change: '0', traffic: 650 },
      { keyword: 'neck pain relief', position: 2, change: '+3', traffic: 1800 }
    ],
    competitors: [
      { name: 'SpineCare Plus', domain: 'spinecareplus.com', avgPosition: 2.1, backlinks: 1250 },
      { name: 'Back Health Center', domain: 'backhealth.com', avgPosition: 2.8, backlinks: 980 },
      { name: 'Spinal Solutions', domain: 'spinalsolutions.com', avgPosition: 3.2, backlinks: 750 },
      { name: 'Pain Relief Clinic', domain: 'painreliefclinic.com', avgPosition: 3.8, backlinks: 650 }
    ],
    trends: [
      { month: 'Jan', position: 4.2, traffic: 1200 },
      { month: 'Feb', position: 3.8, traffic: 1350 },
      { month: 'Mar', position: 3.5, traffic: 1500 },
      { month: 'Apr', position: 3.2, traffic: 1650 },
      { month: 'May', position: 3.0, traffic: 1800 },
      { month: 'Jun', position: 2.8, traffic: 1950 }
    ]
  };

  const handleAnalyze = async () => {
    trackKeywords();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-light-blue/5 to-theme-blue-primary/5">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-theme-light-blue/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-theme-blue-primary to-theme-yellow-primary rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-dark-blue">SERP Intelligence</h1>
              <p className="text-theme-light-blue">Advanced SEO analytics and competitor tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword to track..."
              className="px-4 py-2 border border-theme-light-blue/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-blue-primary/50 bg-white/80 backdrop-blur-sm"
            />
            <Button 
              onClick={trackKeywords}
              disabled={isLoading || !keyword.trim()}
              className="bg-theme-blue-primary hover:bg-theme-dark-blue text-white"
            >
              {isLoading ? 'Tracking...' : 'Track Keywords'}
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Competitors
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Trends
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-theme-light-blue">Total Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-theme-dark-blue">{trackingData?.overview?.totalKeywords?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-theme-light-blue mt-1">Tracked keywords</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-theme-light-blue">Avg Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-theme-dark-blue">{trackingData?.overview?.avgPosition || '0'}</div>
                  <p className="text-xs text-theme-light-blue mt-1">Average ranking</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-theme-light-blue">Visibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-theme-dark-blue">{trackingData?.overview?.visibility || '0'}%</div>
                  <p className="text-xs text-theme-light-blue mt-1">Search visibility</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-theme-light-blue">Competitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-theme-dark-blue">{trackingData?.overview?.competitors || '0'}</div>
                  <p className="text-xs text-theme-light-blue mt-1">Tracked competitors</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Top Performing Keywords</CardTitle>
                  <CardDescription>Keywords with best rankings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.isArray(trackingData?.rankings) ? trackingData.rankings.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-theme-blue-primary border-theme-blue-primary">
                          #{item.position}
                        </Badge>
                        <span className="text-theme-dark-blue font-medium">{item.keyword}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-theme-light-blue text-sm">{item.traffic.toLocaleString()} traffic</span>
                        <Badge variant="secondary" className="text-green-600 bg-green-50">
                          {item.change}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-theme-light-blue py-4">
                      No ranking data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Competitor Analysis</CardTitle>
                  <CardDescription>Top competitors in your niche</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.isArray(trackingData?.competitors) ? trackingData.competitors.slice(0, 3).map((competitor, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-theme-blue-primary to-theme-yellow-primary rounded-full flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-theme-dark-blue">{competitor.name}</p>
                          <p className="text-xs text-theme-light-blue">{competitor.domain}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-theme-dark-blue">Pos: {competitor.avgPosition}</p>
                        <p className="text-xs text-theme-light-blue">{competitor.backlinks} links</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-theme-light-blue py-4">
                      No competitor data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
              <CardHeader>
                <CardTitle className="text-theme-dark-blue">Keyword Rankings</CardTitle>
                <CardDescription>Detailed view of all tracked keywords</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(trackingData?.rankings || []).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-theme-light-blue/5 rounded-lg border border-theme-light-blue/10">
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={item.position <= 3 ? "default" : "secondary"}
                          className={item.position <= 3 ? "bg-theme-blue-primary text-white" : ""}
                        >
                          #{item.position}
                        </Badge>
                        <div>
                          <p className="font-medium text-theme-dark-blue">{item.keyword}</p>
                          <p className="text-sm text-theme-light-blue">Monthly traffic: {item.traffic.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {item.change.startsWith('+') ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : item.change.startsWith('-') ? (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span className={`text-sm font-medium ${
                            item.change.startsWith('+') ? 'text-green-600' : 
                            item.change.startsWith('-') ? 'text-red-600' : 'text-theme-light-blue'
                          }`}>
                            {item.change}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" className="text-theme-blue-primary border-theme-blue-primary hover:bg-theme-blue-primary hover:text-white">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
              <CardHeader>
                <CardTitle className="text-theme-dark-blue">Competitor Analysis</CardTitle>
                <CardDescription>Detailed competitor insights and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(trackingData?.competitors || []).map((competitor, index) => (
                    <div key={index} className="p-4 bg-theme-light-blue/5 rounded-lg border border-theme-light-blue/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-theme-blue-primary to-theme-yellow-primary rounded-full flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-theme-dark-blue">{competitor.name}</p>
                            <p className="text-sm text-theme-light-blue">{competitor.domain}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="text-theme-blue-primary border-theme-blue-primary hover:bg-theme-blue-primary hover:text-white">
                          <MousePointer className="w-4 h-4 mr-1" />
                          Analyze
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white/50 rounded-lg">
                          <p className="text-2xl font-bold text-theme-dark-blue">{competitor.avgPosition}</p>
                          <p className="text-xs text-theme-light-blue">Avg Position</p>
                        </div>
                        <div className="text-center p-3 bg-white/50 rounded-lg">
                          <p className="text-2xl font-bold text-theme-dark-blue">{competitor.backlinks.toLocaleString()}</p>
                          <p className="text-xs text-theme-light-blue">Backlinks</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Position Trends</CardTitle>
                  <CardDescription>Average position over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(trackingData?.trends || []).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-theme-dark-blue font-medium">{trend.month}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={100 - (trend.position * 20)} className="w-24" />
                          <span className="text-sm text-theme-light-blue">Pos: {trend.position}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-theme-light-blue/20">
                <CardHeader>
                  <CardTitle className="text-theme-dark-blue">Traffic Trends</CardTitle>
                  <CardDescription>Monthly traffic growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(trackingData?.trends || []).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-theme-dark-blue font-medium">{trend.month}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(trend.traffic / 2000) * 100} className="w-24" />
                          <span className="text-sm text-theme-light-blue">{trend.traffic.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
