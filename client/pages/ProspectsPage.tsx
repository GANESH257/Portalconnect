import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Calendar,
  Target,
  MessageSquare,
  TrendingUp,
  Users,
  Eye,
  Trash2,
  Edit,
  Sparkles,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../hooks/useAuth';

interface ProspectItem {
  id: string;
  name: string;
  domain?: string;
  category?: string;
  location?: string;
  score?: number;
  rating?: number;
  status: string;
  priority: string;
  tags: string[];
  notes?: string;
  progress?: string;
  pitchingPoints: string[];
  aiRecommendations?: string;
  emailTemplate?: string;
  lastContacted?: string;
  nextFollowUp?: string;
  createdAt: string;
  businessProfile?: {
    id: string;
    name: string;
    domain?: string;
    websiteUrl?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    rating?: number;
    reviewsCount?: number;
    category?: string;
    comprehensiveScore?: {
      leadScore: number;
      presenceScore: number;
      seoScore: number;
      engagementScore: number;
    };
  };
}

const statusColors = {
  'new': 'bg-blue-100 text-blue-800',
  'contacted': 'bg-yellow-100 text-yellow-800',
  'qualified': 'bg-green-100 text-green-800',
  'proposal': 'bg-purple-100 text-purple-800',
  'closed-won': 'bg-emerald-100 text-emerald-800',
  'closed-lost': 'bg-red-100 text-red-800'
};

const priorityColors = {
  'high': 'bg-red-100 text-red-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'low': 'bg-green-100 text-green-800'
};

export default function ProspectsPage() {
  const { user } = useAuth();
  const [prospects, setProspects] = useState<ProspectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<ProspectItem | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState('');

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/serp/prospects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProspects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching prospects:', error);
    } finally {
      setLoading(false);
    }
  };

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
          location: businessData.location,
          score: businessData.score,
          rating: businessData.rating
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProspects(prev => [data.data, ...prev]);
      }
    } catch (error) {
      console.error('Error adding to prospects:', error);
    }
  };

  const handleUpdateProspect = async (itemId: string, updateData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/serp/prospects/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        setProspects(prev => prev.map(p => p.id === itemId ? data.data : p));
        setSelectedProspect(data.data);
      }
    } catch (error) {
      console.error('Error updating prospect:', error);
    }
  };

  const handleRemoveProspect = async (itemId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/serp/prospects/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProspects(prev => prev.filter(p => p.id !== itemId));
        setSelectedProspect(null);
      }
    } catch (error) {
      console.error('Error removing prospect:', error);
    }
  };

  const handleGenerateAIRecommendations = async (itemId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/serp/prospects/${itemId}/ai-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProspects(prev => prev.map(p => p.id === itemId ? { ...p, ...data.data } : p));
        setShowAIRecommendations(true);
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = !searchTerm || 
      prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || prospect.status === statusFilter;
    const matchesPriority = !priorityFilter || prospect.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'contacted': return <MessageSquare className="w-4 h-4" />;
      case 'qualified': return <Target className="w-4 h-4" />;
      case 'proposal': return <TrendingUp className="w-4 h-4" />;
      case 'closed-won': return <CheckCircle className="w-4 h-4" />;
      case 'closed-lost': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-dark-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prospects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
              <p className="text-gray-600 mt-2">Manage your sales prospects and track progress</p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/agents/prospect-finder">
                <Button className="bg-theme-dark-blue hover:bg-theme-dark-blue/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Find New Prospects
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search prospects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="closed-won">Closed Won</SelectItem>
                    <SelectItem value="closed-lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prospects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProspects.map((prospect) => (
            <Card key={prospect.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {prospect.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[prospect.status as keyof typeof statusColors]}>
                        {getStatusIcon(prospect.status)}
                        <span className="ml-1 capitalize">{prospect.status}</span>
                      </Badge>
                      <Badge className={priorityColors[prospect.priority as keyof typeof priorityColors]}>
                        {prospect.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProspect(prospect);
                        setShowNotesModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProspect(prospect.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {prospect.businessProfile && (
                    <div className="space-y-2">
                      {prospect.businessProfile.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {prospect.businessProfile.phone}
                        </div>
                      )}
                      {prospect.businessProfile.address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {prospect.businessProfile.address}
                        </div>
                      )}
                      {prospect.businessProfile.websiteUrl && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="w-4 h-4 mr-2" />
                          <a 
                            href={prospect.businessProfile.websiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-theme-dark-blue hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {prospect.businessProfile?.comprehensiveScore && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Lead Score</div>
                      <Progress 
                        value={prospect.businessProfile.comprehensiveScore.leadScore} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500">
                        {prospect.businessProfile.comprehensiveScore.leadScore}/100
                      </div>
                    </div>
                  )}

                  {prospect.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prospect.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {prospect.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{prospect.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProspect(prospect);
                        setShowAIRecommendations(true);
                      }}
                      className="flex-1"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI Insights
                    </Button>
                    {prospect.businessProfile?.id && (
                      <Link to={`/business/${prospect.businessProfile.id}`}>
                        <Button size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProspects.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter || priorityFilter 
                ? 'Try adjusting your filters to see more results.'
                : 'Start by finding prospects using the Prospect Finder agent.'
              }
            </p>
            <Link to="/agents/prospect-finder">
              <Button className="bg-theme-dark-blue hover:bg-theme-dark-blue/90">
                <Plus className="w-4 h-4 mr-2" />
                Find Prospects
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedProspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Prospect: {selectedProspect.name}</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowNotesModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select 
                    value={selectedProspect.status} 
                    onValueChange={(value) => setSelectedProspect({...selectedProspect, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="closed-won">Closed Won</SelectItem>
                      <SelectItem value="closed-lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <Select 
                    value={selectedProspect.priority} 
                    onValueChange={(value) => setSelectedProspect({...selectedProspect, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <Textarea
                    value={selectedProspect.notes || ''}
                    onChange={(e) => setSelectedProspect({...selectedProspect, notes: e.target.value})}
                    placeholder="Add notes about this prospect..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress
                  </label>
                  <Textarea
                    value={selectedProspect.progress || ''}
                    onChange={(e) => setSelectedProspect({...selectedProspect, progress: e.target.value})}
                    placeholder="Track progress and next steps..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowNotesModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleUpdateProspect(selectedProspect.id, {
                      status: selectedProspect.status,
                      priority: selectedProspect.priority,
                      notes: selectedProspect.notes,
                      progress: selectedProspect.progress
                    });
                    setShowNotesModal(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showAIRecommendations && selectedProspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">AI Recommendations: {selectedProspect.name}</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowAIRecommendations(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-6">
                {!selectedProspect.aiRecommendations && (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-theme-dark-blue mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Generate AI-powered recommendations for this prospect</p>
                    <Button
                      onClick={() => handleGenerateAIRecommendations(selectedProspect.id)}
                      className="bg-theme-dark-blue hover:bg-theme-dark-blue/90"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Recommendations
                    </Button>
                  </div>
                )}

                {selectedProspect.aiRecommendations && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {selectedProspect.aiRecommendations}
                        </pre>
                      </div>
                    </div>

                    {selectedProspect.emailTemplate && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Email Template</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {selectedProspect.emailTemplate}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedProspect.pitchingPoints && selectedProspect.pitchingPoints.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Pitching Points</h4>
                        <div className="space-y-2">
                          {selectedProspect.pitchingPoints.map((point, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-theme-dark-blue rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowAIRecommendations(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
