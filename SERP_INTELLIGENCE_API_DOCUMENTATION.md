# SERP Intelligence API Documentation

## 🎯 **Overview**

This document provides comprehensive documentation for the SERP Intelligence API endpoints that connect the frontend agents to the DataForSEO service and database.

## 🔐 **Authentication**

All SERP Intelligence endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📊 **API Endpoints**

### **1. Search Prospects**
**Endpoint**: `POST /api/serp/search-prospects`  
**Purpose**: Search for business prospects using Google Maps and Local Pack data  
**Authentication**: Required

**Request Body**:
```json
{
  "keyword": "spine care las vegas",
  "location": "Las Vegas, NV",
  "device": "desktop"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "jobId": "cmh3nk3mj0000rqllsoybppjl",
    "results": [
      {
        "type": "local_pack",
        "rank_absolute": 1,
        "title": "The Spine Center",
        "description": "7380 W Sahara Ave # 100 · (702) 252-7246",
        "domain": "www.spinecenterlv.com",
        "phone": "(702) 252-7246",
        "url": "https://www.spinecenterlv.com/",
        "rating": {
          "value": 4.9,
          "votes_count": 434
        }
      }
    ],
    "jobDetails": {
      "id": "cmh3nk3mj0000rqllsoybppjl",
      "keyword": "spine care las vegas",
      "status": "completed",
      "resultsCount": 13,
      "cost": 0.004
    }
  }
}
```

---

### **2. Analyze Website**
**Endpoint**: `POST /api/serp/analyze-website`  
**Purpose**: Comprehensive website analysis for competitive intelligence  
**Authentication**: Required

**Request Body**:
```json
{
  "url": "https://www.spinecenterlv.com",
  "location": "Las Vegas, NV",
  "device": "desktop"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://www.spinecenterlv.com",
    "seo": {
      "performance_score": 78,
      "accessibility_score": 82,
      "best_practices_score": 85,
      "seo_score": 72
    },
    "backlinks": {
      "total_backlinks": 127,
      "referring_domains": 45,
      "domain_authority": 42
    },
    "domainAuthority": {
      "domain_authority": 42,
      "page_authority": 38
    },
    "analyzedAt": "2024-10-23T16:40:35.000Z"
  }
}
```

---

### **3. Add to Watchlist**
**Endpoint**: `POST /api/serp/add-to-watchlist`  
**Purpose**: Add prospects, competitors, or websites to user's watchlist  
**Authentication**: Required

**Request Body**:
```json
{
  "serpJobId": "cmh3nk3mj0000rqllsoybppjl",
  "serpResultId": "cmh3nk3n60004rqll6pyg1352",
  "businessProfileId": "cmh3nk3nj0006rqllxu952vgs",
  "itemType": "prospect",
  "name": "The Spine Center",
  "domain": "www.spinecenterlv.com",
  "category": "Spine Care",
  "location": "Las Vegas, NV",
  "score": 92,
  "rating": 4.9,
  "status": "active",
  "priority": "high",
  "tags": ["Top Rated", "Insurance Accepted"],
  "highlights": ["High potential prospect", "Excellent reviews"],
  "notes": "Follow up scheduled for next week"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "watchlistItemId": "cmh3nk3np0008rqlly6dxukmx",
    "message": "The Spine Center added to watchlist as prospect"
  }
}
```

---

### **4. Get Watchlist Items**
**Endpoint**: `GET /api/serp/watchlist`  
**Purpose**: Retrieve user's watchlist items with optional filtering  
**Authentication**: Required

**Query Parameters**:
- `itemType`: Filter by type (prospect, competitor, website)
- `status`: Filter by status (active, monitoring, contacted, converted, lost)
- `priority`: Filter by priority (high, medium, low)
- `category`: Filter by category

**Example**: `GET /api/serp/watchlist?itemType=prospect&status=active`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cmh3nk3np0008rqlly6dxukmx",
      "itemType": "prospect",
      "name": "The Spine Center",
      "domain": "www.spinecenterlv.com",
      "category": "Spine Care",
      "location": "Las Vegas, NV",
      "score": 92,
      "rating": 4.9,
      "status": "active",
      "priority": "high",
      "tags": ["Top Rated", "Insurance Accepted"],
      "highlights": ["High potential prospect", "Excellent reviews"],
      "notes": "Follow up scheduled for next week",
      "addedAt": "2024-10-23T16:40:35.000Z",
      "businessProfile": {
        "id": "cmh3nk3nj0006rqllxu952vgs",
        "name": "The Spine Center",
        "phone": "(702) 252-7246",
        "rating": 4.9,
        "services": ["Spinal Decompression", "Chiropractic", "Physical Therapy"]
      }
    }
  ]
}
```

---

### **5. Update Watchlist Item**
**Endpoint**: `PUT /api/serp/watchlist/:itemId`  
**Purpose**: Update watchlist item properties  
**Authentication**: Required

**Request Body**:
```json
{
  "status": "contacted",
  "priority": "medium",
  "tags": ["Top Rated", "Insurance Accepted", "Contacted"],
  "highlights": ["High potential prospect", "Initial contact made"],
  "notes": "Initial contact made. Waiting for response to partnership proposal.",
  "score": 88,
  "rating": 4.9
}
```

**Response**:
```json
{
  "success": true,
  "message": "Watchlist item updated successfully"
}
```

---

### **6. Remove from Watchlist**
**Endpoint**: `DELETE /api/serp/watchlist/:itemId`  
**Purpose**: Remove item from watchlist  
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Item removed from watchlist"
}
```

---

### **7. Get SERP Job Results**
**Endpoint**: `GET /api/serp/job/:jobId`  
**Purpose**: Retrieve detailed results from a SERP search job  
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cmh3nk3mj0000rqllsoybppjl",
    "keyword": "spine care las vegas",
    "location": "Las Vegas, NV",
    "searchType": "maps",
    "status": "completed",
    "resultsCount": 13,
    "cost": 0.004,
    "createdAt": "2024-10-23T16:40:35.000Z",
    "completedAt": "2024-10-23T16:40:45.000Z",
    "serpResults": [
      {
        "id": "cmh3nk3n60004rqll6pyg1352",
        "rankAbsolute": 1,
        "resultType": "local_pack",
        "title": "The Spine Center",
        "domain": "www.spinecenterlv.com",
        "phone": "(702) 252-7246",
        "rating": 4.9,
        "businessProfile": {
          "id": "cmh3nk3nj0006rqllxu952vgs",
          "name": "The Spine Center",
          "services": ["Spinal Decompression", "Chiropractic", "Physical Therapy"]
        }
      }
    ]
  }
}
```

---

### **8. Get Business Profile**
**Endpoint**: `GET /api/serp/business/:profileId`  
**Purpose**: Retrieve detailed business profile information  
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cmh3nk3nj0006rqllxu952vgs",
    "name": "The Spine Center",
    "domain": "www.spinecenterlv.com",
    "websiteUrl": "https://www.spinecenterlv.com/",
    "category": "Spine Care",
    "location": "Las Vegas, NV",
    "phone": "(702) 252-7246",
    "rating": 4.9,
    "reviewsCount": 434,
    "seoScore": 78,
    "domainAuthority": 42,
    "backlinks": 127,
    "services": ["Spinal Decompression", "Chiropractic", "Physical Therapy"],
    "specialties": ["Spine Care", "Pain Management"],
    "insuranceAccepted": ["Blue Cross", "Aetna", "Cigna"],
    "serpResult": {
      "id": "cmh3nk3n60004rqll6pyg1352",
      "rankAbsolute": 1,
      "resultType": "local_pack"
    },
    "watchlistItems": [
      {
        "id": "cmh3nk3np0008rqlly6dxukmx",
        "itemType": "prospect",
        "status": "active",
        "priority": "high"
      }
    ],
    "keywordRankings": [
      {
        "keyword": "spine care las vegas",
        "rankAbsolute": 1,
        "searchVolume": 1200,
        "competition": "medium"
      }
    ],
    "competitorAnalysis": [
      {
        "analysisType": "seo",
        "metric": "domain_authority",
        "value": "42",
        "score": 78,
        "comparison": "better"
      }
    ]
  }
}
```

## 🔄 **Data Flow Architecture**

### **Prospect Finder Workflow**:
1. User searches for prospects → `POST /api/serp/search-prospects`
2. DataForSEO Maps API called → Results stored in database
3. Business profiles created → Results returned to frontend
4. User adds to watchlist → `POST /api/serp/add-to-watchlist`

### **Website Intelligence Workflow**:
1. User analyzes website → `POST /api/serp/analyze-website`
2. Multiple DataForSEO APIs called → SEO, backlinks, domain authority
3. Analysis results stored → Comprehensive report returned
4. User adds to watchlist → `POST /api/serp/add-to-watchlist`

### **Watchlist Management Workflow**:
1. User views watchlist → `GET /api/serp/watchlist`
2. User updates items → `PUT /api/serp/watchlist/:itemId`
3. User removes items → `DELETE /api/serp/watchlist/:itemId`
4. Real-time updates → Frontend state management

## 📊 **Error Handling**

### **Common Error Responses**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### **Error Codes**:
- `400`: Bad Request - Missing or invalid parameters
- `401`: Unauthorized - Invalid or missing authentication
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server or API error

## 🚀 **Rate Limiting**

- **Requests per minute**: 60
- **Requests per day**: 1000
- **Cost per request**: $0.002
- **Automatic retry**: Built-in rate limit handling

## 🔧 **Integration Examples**

### **Frontend Integration**:
```typescript
// Search prospects
const searchProspects = async (keyword: string, location: string) => {
  const response = await fetch('/api/serp/search-prospects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ keyword, location })
  });
  return response.json();
};

// Add to watchlist
const addToWatchlist = async (itemData: any) => {
  const response = await fetch('/api/serp/add-to-watchlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  return response.json();
};
```

### **Database Integration**:
```typescript
// Get watchlist with business profiles
const getWatchlistWithProfiles = async (userId: string) => {
  return await prisma.watchlistItem.findMany({
    where: { userId },
    include: {
      businessProfile: {
        include: {
          keywordRankings: true,
          competitorAnalysis: true
        }
      }
    }
  });
};
```

This API provides the complete foundation for all SERP intelligence agents and future functionality.
