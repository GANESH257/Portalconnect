# SERP Intelligence Database Schema Documentation

## 🎯 **Purpose & Scope**

This comprehensive database schema is the **foundation for all SERP intelligence agents and future functionality**. It supports:

- **Prospect Finder Agent**: Business discovery and lead generation
- **Website Intelligence Agent**: Competitor analysis and SEO insights  
- **SERP Intelligence Agent**: Keyword tracking and ranking monitoring
- **Watchlist System**: Unified prospect/competitor management
- **Analytics & Reporting**: Historical data and trends
- **Future Agents**: Any new agents that need SERP data

## 📊 **Database Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │   SerpJobs      │    │  SerpResults    │
│                 │◄───┤                 │◄───┤                 │
│ - Authentication│    │ - Search Requests│    │ - Individual Results│
│ - User Management│   │ - DataForSEO Jobs│   │ - Rankings & Data│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ WatchlistItems  │    │ BusinessProfiles│    │ KeywordRankings │
│                 │    │                 │    │                 │
│ - Prospects     │    │ - Business Data  │    │ - Ranking History│
│ - Competitors   │    │ - SEO Metrics   │    │ - Trend Analysis│
│ - Websites      │    │ - Contact Info  │    │ - Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ CompetitorAnalysis│
                       │                 │
                       │ - SEO Comparison│
                       │ - Content Analysis│
                       │ - Backlink Analysis│
                       └─────────────────┘
```

## 🗄️ **Core Tables**

### **1. SerpJob** - Search Request Tracking
**Purpose**: Track all SERP search requests and DataForSEO jobs

**Key Fields**:
- `keyword`: Search term
- `location`: Geographic location
- `searchType`: organic, maps, local_pack
- `status`: pending, processing, completed, failed
- `dataforseoTaskId`: DataForSEO task reference
- `cost`: API cost tracking
- `resultsCount`: Number of results found

**Relationships**:
- `user`: Who made the request
- `serpResults`: Individual results from this job
- `watchlistItems`: Items added to watchlist from this job

### **2. SerpResult** - Individual SERP Results
**Purpose**: Store individual results from DataForSEO API

**Key Fields**:
- `rankGroup`, `rankAbsolute`: Ranking positions
- `resultType`: organic, local_pack, maps, featured_snippet
- `title`, `description`, `url`: Content data
- `domain`, `websiteName`: Website identification
- `phone`, `address`, `city`: Contact information
- `rating`, `reviewsCount`: Review data
- `isPaid`, `isFeatured`: Ad and feature flags
- `highlighted`: Array of highlighted keywords
- `links`, `faq`, `images`: JSON data for rich content

**Relationships**:
- `serpJob`: Parent search job
- `businessProfile`: Linked business profile
- `watchlistItems`: Items added to watchlist

### **3. BusinessProfile** - Comprehensive Business Data
**Purpose**: Store detailed business profiles with SEO metrics

**Key Fields**:
- `name`, `domain`, `websiteUrl`: Business identification
- `category`, `subcategory`, `industry`: Business classification
- `location`, `address`, `city`, `state`: Geographic data
- `phone`, `email`: Contact information
- `rating`, `reviewsCount`: Review metrics
- `services`, `specialties`: Business offerings
- `insuranceAccepted`, `languages`: Service details
- `seoScore`, `domainAuthority`: SEO metrics
- `backlinks`, `monthlyTraffic`: Performance data
- `pageSpeed`, `mobileScore`: Technical metrics

**Relationships**:
- `serpResult`: Source SERP result
- `watchlistItems`: Items in watchlists
- `competitorAnalysis`: Competitor comparisons
- `keywordRankings`: Ranking history

### **4. KeywordRanking** - Ranking History Tracking
**Purpose**: Track keyword rankings over time for trend analysis

**Key Fields**:
- `keyword`: Tracked keyword
- `searchEngine`: Google, Bing, etc.
- `location`, `device`: Search parameters
- `rankGroup`, `rankAbsolute`: Current ranking
- `searchVolume`, `competition`: Keyword metrics
- `cpc`, `difficulty`: Cost and difficulty data
- `trend`: rising, falling, stable
- `previousRank`, `rankChange`: Change tracking

**Relationships**:
- `businessProfile`: Business being tracked

### **5. CompetitorAnalysis** - Competitive Intelligence
**Purpose**: Store competitor analysis and comparison data

**Key Fields**:
- `competitorId`: Competitor business ID
- `analysisType`: seo, content, backlinks, social, advertising
- `metric`: Specific metric being analyzed
- `value`: Metric value
- `score`: Numerical score
- `comparison`: better, worse, equal
- `insights`, `recommendations`: Analysis text

**Relationships**:
- `businessProfile`: Business being analyzed

### **6. WatchlistItem** - Prospect/Competitor Management
**Purpose**: Unified management of prospects, competitors, and websites

**Key Fields**:
- `itemType`: prospect, competitor, website
- `name`, `domain`, `category`: Item identification
- `score`, `rating`: Quality metrics
- `status`: active, monitoring, contacted, converted, lost
- `priority`: high, medium, low
- `tags`, `highlights`: Categorization
- `notes`: User notes
- `contactInfo`, `metrics`: JSON data storage

**Relationships**:
- `user`: Owner of the watchlist
- `serpJob`, `serpResult`, `businessProfile`: Source data

## 🔗 **Key Relationships**

### **Data Flow**:
1. **User** creates **SerpJob** (search request)
2. **SerpJob** generates **SerpResult[]** (individual results)
3. **SerpResult** can create **BusinessProfile** (detailed business data)
4. **BusinessProfile** can have **KeywordRanking[]** (tracking history)
5. **BusinessProfile** can have **CompetitorAnalysis[]** (competitor data)
6. Any of these can be added to **WatchlistItem[]** (user management)

### **Cross-References**:
- **SerpResult** ↔ **BusinessProfile** (1:1 optional)
- **BusinessProfile** ↔ **WatchlistItem[]** (1:many)
- **SerpJob** ↔ **WatchlistItem[]** (1:many)
- **User** ↔ **WatchlistItem[]** (1:many)

## 📈 **Performance Optimizations**

### **Indexes**:
- `serp_jobs`: `[userId, keyword]`, `[status]`, `[createdAt]`
- `serp_results`: `[serpJobId]`, `[domain]`, `[resultType]`, `[rankAbsolute]`
- `business_profiles`: `[domain]`, `[category]`, `[city, state]`, `[rating]`, `[seoScore]`
- `keyword_rankings`: `[businessProfileId]`, `[keyword]`, `[trackedAt]`, `[rankAbsolute]`
- `watchlist_items`: `[userId]`, `[itemType]`, `[status]`, `[priority]`, `[addedAt]`

### **Data Types**:
- **JSON fields**: `links`, `faq`, `images`, `businessHours`, `socialMedia`, `contactInfo`, `metrics`
- **Array fields**: `highlighted`, `services`, `specialties`, `insuranceAccepted`, `tags`
- **DateTime fields**: All timestamps for trend analysis
- **Float fields**: Ratings, scores, costs for calculations

## 🚀 **Future Extensibility**

### **Agent Support**:
- **Prospect Finder**: Uses `SerpResult` + `BusinessProfile` + `WatchlistItem`
- **Website Intelligence**: Uses `BusinessProfile` + `CompetitorAnalysis`
- **SERP Intelligence**: Uses `KeywordRanking` + `SerpJob` + `SerpResult`
- **Watchlist**: Uses `WatchlistItem` with all related data

### **Analytics Support**:
- **Trend Analysis**: `KeywordRanking` over time
- **Competitor Tracking**: `CompetitorAnalysis` comparisons
- **Performance Metrics**: `BusinessProfile` SEO scores
- **User Behavior**: `WatchlistItem` status changes

### **API Integration**:
- **DataForSEO**: `SerpJob` + `SerpResult` mapping
- **SEO Tools**: `BusinessProfile` + `KeywordRanking` data
- **CRM Systems**: `WatchlistItem` + `BusinessProfile` export
- **Analytics**: All tables support reporting queries

## 🔧 **Migration Strategy**

1. **Phase 1**: Core tables (`SerpJob`, `SerpResult`, `BusinessProfile`)
2. **Phase 2**: Tracking tables (`KeywordRanking`, `CompetitorAnalysis`)
3. **Phase 3**: Management tables (`WatchlistItem`)
4. **Phase 4**: Optimization (indexes, constraints, triggers)

## 📝 **Usage Examples**

### **Prospect Finder Workflow**:
```sql
-- 1. Create search job
INSERT INTO serp_jobs (user_id, keyword, location, search_type) 
VALUES ('user123', 'spine care las vegas', 'Las Vegas, NV', 'maps');

-- 2. Store results
INSERT INTO serp_results (serp_job_id, rank_absolute, title, domain, phone, rating)
VALUES ('job456', 1, 'The Spine Center', 'spinecenterlv.com', '(702) 252-7246', 4.9);

-- 3. Create business profile
INSERT INTO business_profiles (name, domain, category, city, phone, rating)
VALUES ('The Spine Center', 'spinecenterlv.com', 'Spine Care', 'Las Vegas', '(702) 252-7246', 4.9);

-- 4. Add to watchlist
INSERT INTO watchlist_items (user_id, business_profile_id, item_type, name, status)
VALUES ('user123', 'profile789', 'prospect', 'The Spine Center', 'active');
```

### **Website Intelligence Workflow**:
```sql
-- 1. Analyze website
INSERT INTO business_profiles (name, domain, seo_score, domain_authority, backlinks)
VALUES ('Competitor Site', 'competitor.com', 78, 42, 127);

-- 2. Track competitor analysis
INSERT INTO competitor_analysis (business_profile_id, competitor_id, analysis_type, metric, value, score)
VALUES ('profile123', 'competitor456', 'seo', 'domain_authority', '42', 78);

-- 3. Add to watchlist as competitor
INSERT INTO watchlist_items (user_id, business_profile_id, item_type, name, status)
VALUES ('user123', 'profile123', 'competitor', 'Competitor Site', 'monitoring');
```

This schema provides the foundation for all current and future SERP intelligence functionality while maintaining performance and extensibility.
