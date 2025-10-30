import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Star, 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Target,
  Zap,
  Shield,
  Activity,
  UserPlus,
  UserCheck,
  Plus
} from 'lucide-react';

interface WatchlistItem {
  id: string;
  userId: string;
  serpJobId: string | null;
  serpResultId: string | null;
  businessProfileId: string | null;
  itemType: 'prospect' | 'website';
  name: string;
  domain: string | null;
  category: string;
  location: string;
  score: number | null;
  rating: number | null;
  status: 'active' | 'monitoring' | 'contacted' | 'converted' | 'lost';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  notes: string | null;
  highlights: string[];
  contactInfo: any | null;
  metrics: any | null;
  lastChecked: string | null;
  addedAt: string;
  updatedAt: string;
}

export default function WatchlistPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('all');

  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [profileDetailsByItemId, setProfileDetailsByItemId] = useState<Record<string, any>>({});
  
  const updateWatchlist = async (id: string, update: Partial<WatchlistItem>) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/serp/watchlist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(update)
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // Fetch real watchlist data from API
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/serp/watchlist', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setWatchlistItems(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch watchlist:', error);
      }
    };

    fetchWatchlist();
  }, []);

  // Enrich items with business profile details for better display
  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        const itemsWithProfile = watchlistItems.filter(w => !!w.businessProfileId || !!w.serpResultId);
        const results = await Promise.all(itemsWithProfile.map(async (w) => {
          try {
            const idToUse = w.businessProfileId || w.serpResultId as string;
            const res = await fetch(`/api/serp/business/${idToUse}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return [w.id, null] as const;
            const json = await res.json();
            return [w.id, json?.data || null] as const;
          } catch {
            return [w.id, null] as const;
          }
        }));
        const map: Record<string, any> = {};
        for (const [id, val] of results) if (val) map[id] = val;
        setProfileDetailsByItemId(map);
      } catch {
        // ignore
      }
    };
    if (watchlistItems.length > 0) run();
  }, [watchlistItems]);

  const displayedItems = useMemo(() => {
    return watchlistItems.map((it) => {
      const p = profileDetailsByItemId[it.id];
      const address = p ? [p.address || null, p.city || null, p.state || null, p.zipCode || null].filter(Boolean).join(', ') : null;
      const domainFromProfile = p?.domain || p?.websiteUrl || null;
      return {
        ...it,
        location: it.location || address || '',
        rating: typeof it.rating === 'number' ? it.rating : (typeof p?.rating === 'number' ? p.rating : null),
        domain: it.domain || domainFromProfile,
        _profile: p || null
      } as any;
    });
  }, [watchlistItems, profileDetailsByItemId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600 text-white';
      case 'monitoring': return 'bg-blue-600 text-white';
      case 'contacted': return 'bg-amber-600 text-white';
      case 'converted': return 'bg-purple-600 text-white';
      case 'lost': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-amber-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-amber-700';
    if (score >= 40) return 'text-orange-700';
    return 'text-red-700';
  };

  const filteredItems = displayedItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.domain && item.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    const matchesPriority = selectedPriority === 'All' || item.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'score':
        aValue = a.score;
        bValue = b.score;
        break;
      case 'rating':
        aValue = a.rating;
        bValue = b.rating;
        break;
      case 'addedDate':
        aValue = new Date(a.addedDate).getTime();
        bValue = new Date(b.addedDate).getTime();
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        aValue = a.score;
        bValue = b.score;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleRemoveItem = async (id: string) => {
    const prev = watchlistItems;
    setWatchlistItems(prev => prev.filter(item => item.id !== id));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/serp/watchlist/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) setWatchlistItems(prev);
    } catch {
      setWatchlistItems(prev);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setWatchlistItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus as any } : item
    ));
    await updateWatchlist(id, { status: newStatus as any });
  };

  const handlePriorityChange = async (id: string, newPriority: string) => {
    setWatchlistItems(prev => prev.map(item => 
      item.id === id ? { ...item, priority: newPriority as any } : item
    ));
    await updateWatchlist(id, { priority: newPriority as any });
  };

  const handleNotesChange = (id: string, notes: string) => {
    setWatchlistItems(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  };

  const handleNotesBlur = async (id: string, notes?: string | null) => {
    await updateWatchlist(id, { notes: notes ?? '' } as any);
  };

  const categories = ['All', 'Spine Care', 'Spine Surgery', 'Chiropractic', 'Orthopedics'];
  const statuses = ['All', 'active', 'monitoring', 'contacted', 'converted', 'lost'];
  const priorities = ['All', 'high', 'medium', 'low'];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
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
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-theme-dark-blue">Watchlist</h1>
                <p className="text-theme-light-blue">Track and manage your prospects and competitors</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Items: <span className="font-semibold text-gray-800">{displayedItems.length}</span>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                <Download className="w-4 h-4 mr-2" />
                Export Watchlist
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Filters and Search */}
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 mb-6 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-theme-light-blue" />
                <Input
                  placeholder="Search watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-theme-light-blue" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-theme-light-blue/30 rounded-md bg-white text-theme-dark-blue"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-theme-light-blue/30 rounded-md bg-white text-theme-dark-blue"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 border border-theme-light-blue/30 rounded-md bg-white text-theme-dark-blue"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-theme-light-blue/30 rounded-md bg-white text-theme-dark-blue"
                >
                  <option value="score-desc">Score (High to Low)</option>
                  <option value="score-asc">Score (Low to High)</option>
                  <option value="rating-desc">Rating (High to Low)</option>
                  <option value="rating-asc">Rating (Low to High)</option>
                  <option value="addedDate-desc">Recently Added</option>
                  <option value="addedDate-asc">Oldest Added</option>
                  <option value="name-asc">Name (A to Z)</option>
                  <option value="name-desc">Name (Z to A)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              All Items ({filteredItems.length})
            </TabsTrigger>
            <TabsTrigger value="prospects" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Prospects ({filteredItems.filter(item => item.itemType === 'prospect').length})
            </TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Competitors ({filteredItems.filter(item => item.itemType === 'website').length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* All Items Tab */}
          <TabsContent value="all" className="space-y-4">
            {sortedItems.map((item) => {
              const profileLink = item.businessProfileId || item.serpResultId || null;
              const CardWrapper: any = profileLink ? Link : 'div';
              const cardProps: any = profileLink ? { to: `/business/${profileLink}` } : {};
              return (
              <CardWrapper key={item.id} {...cardProps} className="block">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
                  <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-theme-blue-primary to-theme-yellow-primary rounded-lg flex items-center justify-center">
                          {item.type === 'prospect' ? <Target className="w-6 h-6 text-white" /> : <Globe className="w-6 h-6 text-white" />}
                        </div>
                      </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-theme-dark-blue">{item.name}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-700 mb-2">
                          {item.domain && (
                            <span className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <Globe className="w-4 h-4" />
                              <a
                                href={item.domain.startsWith('http') ? item.domain : `https://${item.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-700"
                              >
                                {item.domain.replace(/^https?:\/\//, '')}
                              </a>
                          </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.location}
                          </span>
                          {typeof item.rating === 'number' && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                              {item.rating.toFixed(1)}
                          </span>
                          )}
                          {item._profile?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {item._profile.phone}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {item.addedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                              Added: {new Date(item.addedAt).toLocaleDateString()}
                          </span>
                          )}
                          {item.updatedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                              Last checked: {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap justify-end">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(item.score || 0)}`}>
                          {typeof item.score === 'number' ? item.score : 0}/100
                        </div>
                        <div className="text-sm text-gray-500">Score</div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <select
                          value={item.status}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-theme-light-blue/30 rounded bg-white text-theme-dark-blue"
                        >
                          <option value="active">Active</option>
                          <option value="monitoring">Monitoring</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                        <select
                          value={item.priority}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onChange={(e) => handlePriorityChange(item.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-theme-light-blue/30 rounded bg-white text-theme-dark-blue"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            const token = localStorage.getItem('token');
                            const resp = await fetch('/api/serp/add-to-prospects', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                businessProfileId: item.businessProfileId || undefined,
                                name: item.name,
                                domain: item.domain,
                                category: item.category,
                                location: item.location,
                                score: item.score,
                                rating: item.rating
                              })
                            });
                            if (resp.ok) {
                          alert(`${item.name} added to Prospects!`);
                            } else {
                              const err = await resp.json();
                              alert(`Failed to add to Prospects: ${err.message || 'Unknown error'}`);
                            }
                          } catch (err) {
                            alert('Failed to add to Prospects');
                          }
                        }}
                        className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white whitespace-nowrap shrink-0"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add to Prospects
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => { 
                          e.preventDefault(); e.stopPropagation(); 
                          setWatchlistItems(prev => prev.map(w => w.id === item.id ? { ...w, itemType: 'website' } : w));
                          await updateWatchlist(item.id, { itemType: 'website' } as any);
                        }}
                        className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white whitespace-nowrap shrink-0"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Add to Competitors
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveItem(item.id); }}
                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                    {item.metrics?.seoScore && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-theme-dark-blue">{item.metrics.seoScore}</div>
                        <div className="text-xs text-theme-light-blue">SEO Score</div>
                      </div>
                    )}
                    {item.metrics?.performanceScore && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-theme-dark-blue">{item.metrics.performanceScore}</div>
                        <div className="text-xs text-theme-light-blue">Performance</div>
                      </div>
                    )}
                    {item.metrics?.backlinks && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-theme-dark-blue">{item.metrics.backlinks}</div>
                        <div className="text-xs text-theme-light-blue">Backlinks</div>
                      </div>
                    )}
                    {item.metrics?.domainAuthority && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-theme-dark-blue">{item.metrics.domainAuthority}</div>
                        <div className="text-xs text-theme-light-blue">DA</div>
                      </div>
                    )}
                    {item.metrics?.monthlyTraffic && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-theme-dark-blue">{item.metrics.monthlyTraffic.toLocaleString()}</div>
                        <div className="text-xs text-theme-light-blue">Monthly Traffic</div>
                      </div>
                    )}
                    {item.metrics?.pageSpeed && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-theme-dark-blue">{item.metrics.pageSpeed}s</div>
                        <div className="text-xs text-theme-light-blue">Page Speed</div>
                      </div>
                    )}
                  </div>

                  {/* Tags and Highlights */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {item.contactInfo?.phone && (
                      <div className="flex items-center gap-2 text-sm text-theme-dark-blue">
                        <Phone className="w-4 h-4 text-theme-light-blue" />
                        {item.contactInfo.phone}
                      </div>
                    )}
                    {item.contactInfo?.email && (
                      <div className="flex items-center gap-2 text-sm text-theme-dark-blue">
                        <Mail className="w-4 h-4 text-theme-light-blue" />
                        {item.contactInfo.email}
                      </div>
                    )}
                    {item.domain && (
                      <div className="flex items-center gap-2 text-sm text-theme-dark-blue">
                        <Globe className="w-4 h-4 text-theme-light-blue" />
                        <a href={`https://${item.domain}`} target="_blank" rel="noopener noreferrer" className="hover:text-theme-blue-primary">
                          {item.domain}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="bg-blue-50/40 p-3 rounded-md">
                    <textarea
                      value={item.notes || ''}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      onBlur={() => handleNotesBlur(item.id, item.notes)}
                      placeholder="Add notes..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y bg-white"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    />
                    </div>
                </CardContent>
                </Card>
              </CardWrapper>
            )})}
          </TabsContent>

          {/* Prospects Tab */}
          <TabsContent value="prospects" className="space-y-4">
            {sortedItems.filter(item => item.itemType === 'prospect').map((item) => (
              <Link key={item.id} to={`/business/${item.businessProfileId || item.id}`} className="block">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
                <CardContent className="p-6">
                  {/* Same content as All Items but filtered for prospects only */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-theme-blue-primary to-theme-yellow-primary rounded-lg flex items-center justify-center">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-theme-dark-blue">{item.name}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-theme-light-blue mb-2">
                          <span className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {item.domain}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {item.rating} ({item.reviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                          {item.score}/100
                        </div>
                        <div className="text-sm text-theme-light-blue">Score</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="space-y-4">
            {sortedItems.filter(item => item.itemType === 'website').map((item) => (
              <Link key={item.id} to={`/business/${item.businessProfileId || item.id}`} className="block">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
                <CardContent className="p-6">
                  {/* Same content as All Items but filtered for competitors only */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-theme-blue-primary to-theme-yellow-primary rounded-lg flex items-center justify-center">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-theme-dark-blue">{item.name}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-theme-light-blue mb-2">
                          <span className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {item.domain}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {item.rating} ({item.reviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                          {item.score}/100
                        </div>
                        <div className="text-sm text-theme-light-blue">Score</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-theme-light-blue">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-theme-dark-blue">{displayedItems.length}</div>
                  <p className="text-xs text-theme-light-blue mt-1">In watchlist</p>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-theme-light-blue">Active Prospects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-theme-dark-blue">{displayedItems.filter(item => item.status === 'active').length}</div>
                  <p className="text-xs text-theme-light-blue mt-1">Currently tracking</p>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-theme-light-blue">Converted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-theme-dark-blue">{displayedItems.filter(item => item.status === 'converted').length}</div>
                  <p className="text-xs text-theme-light-blue mt-1">Successfully converted</p>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-theme-light-blue">Avg Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-theme-dark-blue">{displayedItems.length ? Math.round(displayedItems.reduce((sum, item) => sum + (item.score || 0), 0) / displayedItems.length) : 0}</div>
                  <p className="text-xs text-theme-light-blue mt-1">Overall quality</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/95 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-theme-dark-blue">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {['active', 'monitoring', 'contacted', 'converted', 'lost'].map(status => (
                    <div key={status} className="text-center">
                      <div className="text-2xl font-bold text-theme-dark-blue">{displayedItems.filter(item => item.status === status).length}</div>
                      <div className="text-sm text-theme-light-blue capitalize">{status}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
