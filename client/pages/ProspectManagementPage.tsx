import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Plus,
  Download,
  BarChart3
} from "lucide-react";

type Prospect = {
  id: string;
  name: string;
  domain?: string;
  websiteUrl?: string;
  rating?: number;
  reviewsCount?: number;
  status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  score?: number;
  lastContacted?: string;
  nextAction?: string;
  notes?: string;
  businessProfileId?: string;
  addedAt?: string;
  updatedAt?: string;
};

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-gray-100 text-gray-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' }
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

export default function ProspectManagementPage() {
  const [items, setItems] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("addedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch("/api/serp/prospects", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch {
      // swallow
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.domain && item.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'rating':
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
      case 'score':
        aValue = a.score || 0;
        bValue = b.score || 0;
        break;
      case 'addedAt':
        aValue = new Date(a.addedAt || 0).getTime();
        bValue = new Date(b.addedAt || 0).getTime();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus as any } : item
    ));
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/serp/prospects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      // Refresh to reflect persisted values
      fetchProspects();
    } catch {}
  };

  const handlePriorityChange = async (id: string, newPriority: string) => {
    // Optimistic UI update
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, priority: newPriority as any } : item
    ));
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/serp/prospects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ priority: newPriority })
      });
      fetchProspects();
    } catch {}
  };

  const handleLastContactChange = async (id: string, newDate: string) => {
    // Normalize to ISO midnight UTC to avoid TZ shifts
    const isoDate = new Date(`${newDate}T00:00:00`).toISOString();
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, lastContacted: isoDate } : item
    ));
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/serp/prospects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lastContacted: isoDate })
      });
      await fetchProspects();
    } catch {}
  };

  const handleNotesChange = async (id: string, newNotes: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, notes: newNotes } : item
    ));
  };

  const handleNotesBlur = async (id: string, notes?: string) => {
    // No-op: saving happens when clicking Save in row actions
  };

  const handleDeleteProspect = async (id: string) => {
    // Optimistic remove
    const prev = items;
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    try {
      const token = localStorage.getItem('token');
      // Primary: remove endpoint used in backend routes
      const resp = await fetch(`/api/serp/prospects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
        // Revert on failure
        setItems(prev);
        try { const err = await resp.json(); alert(err.message || 'Failed to remove prospect'); } catch {}
      }
    } catch {
      setItems(prev);
      alert('Failed to remove prospect');
    }
  };

  const toggleEditRow = async (prospect: Prospect) => {
    const isEditing = !!editingRows[prospect.id];
    if (isEditing) {
      // Save
      try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`/api/serp/prospects/${prospect.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            notes: prospect.notes || '',
            // send both keys to align with backend naming variations
            lastContacted: prospect.lastContacted || null,
            lastChecked: prospect.lastContacted || null
          })
        });
        if (resp.ok) {
          await fetchProspects();
        }
      } catch {}
    }
    setEditingRows(prev => ({ ...prev, [prospect.id]: !isEditing }));
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prospect Management</h1>
              <p className="text-gray-600 mt-1">Analyze and manage your prospects pipeline</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Prospect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prospects</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter(item => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(item.addedAt || 0) > weekAgo;
                  }).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Qualified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter(item => item.status === 'qualified').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed Won</p>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter(item => item.status === 'closed-won').length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as "asc" | "desc");
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="addedAt-desc">Newest First</option>
              <option value="addedAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="rating-desc">Highest Rating</option>
              <option value="rating-asc">Lowest Rating</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>
        </div>

        {/* Prospects Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading prospects...</div>
          ) : sortedItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No prospects found</p>
              <p className="text-sm">Try adjusting your filters or add some prospects to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospect</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating & Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedItems.map((prospect) => (
                    <tr key={prospect.id} className="hover:bg-gray-50">
                      {/* Prospect Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {prospect.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {prospect.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {prospect.category || 'Business'}
                            </div>
                            {prospect.location && (
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {prospect.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {prospect.domain && (
                            <div className="flex items-center text-sm">
                              <Globe className="w-4 h-4 mr-2 text-gray-400" />
                              <a 
                                href={prospect.websiteUrl || `https://${prospect.domain}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 truncate"
                              >
                                {prospect.domain}
                              </a>
                            </div>
                          )}
                          {prospect.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {prospect.phone}
                            </div>
                          )}
                          {prospect.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {prospect.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Rating & Score */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {prospect.rating && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-sm font-medium">{prospect.rating.toFixed(1)}</span>
                              {prospect.reviewsCount && (
                                <span className="text-xs text-gray-500 ml-1">({prospect.reviewsCount})</span>
                              )}
                            </div>
                          )}
                          {prospect.score && (
                            <div className="text-sm">
                              <span className={`font-medium ${getScoreColor(prospect.score)}`}>
                                {prospect.score}/100
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <select
                          value={prospect.status || 'new'}
                          onChange={(e) => handleStatusChange(prospect.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(prospect.status || 'new')} focus:ring-2 focus:ring-blue-500`}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <select
                          value={prospect.priority || 'medium'}
                          onChange={(e) => handlePriorityChange(prospect.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getPriorityColor(prospect.priority || 'medium')} focus:ring-2 focus:ring-blue-500`}
                        >
                          {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Last Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={prospect.lastContacted ? new Date(prospect.lastContacted).toISOString().slice(0,10) : ''}
                            onChange={(e) => handleLastContactChange(prospect.id, e.target.value)}
                            disabled={!editingRows[prospect.id]}
                            className={`px-2 py-1 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${editingRows[prospect.id] ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                          />
                        </div>
                        {prospect.nextAction && (
                          <div className="text-xs text-blue-600 mt-1">
                            Next: {prospect.nextAction}
                          </div>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4 min-w-[220px]">
                        <textarea
                          value={prospect.notes || ''}
                          onChange={(e) => handleNotesChange(prospect.id, e.target.value)}
                          onBlur={() => handleNotesBlur(prospect.id, prospect.notes)}
                          readOnly={!editingRows[prospect.id]}
                          placeholder="Add notes..."
                          rows={2}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${editingRows[prospect.id] ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {prospect.businessProfileId && (
                            <Link
                              to={`/business/${prospect.businessProfileId}`}
                              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Link>
                          )}
                          <button onClick={() => toggleEditRow(prospect)} className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
                            {editingRows[prospect.id] ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                Save
                              </>
                            ) : (
                              <>
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </>
                            )}
                          </button>
                          <button onClick={() => handleDeleteProspect(prospect.id)} className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


