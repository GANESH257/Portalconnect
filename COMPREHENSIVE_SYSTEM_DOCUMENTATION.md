# Comprehensive Business Intelligence System Documentation

## System Overview
This is a full-stack business intelligence platform that provides comprehensive lead scoring, SEO analysis, and ad performance tracking using DataForSEO APIs. The system offers both fast prospect finding and detailed business profile analysis.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Routing**: React Router 6 (SPA mode)
- **Styling**: TailwindCSS 3 with custom theme
- **UI Components**: Radix UI + Lucide React icons
- **State Management**: React Context API + Hooks

### Backend (Express + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with HttpOnly cookies
- **API Integration**: DataForSEO REST APIs
- **Security**: bcryptjs password hashing, CORS configuration

### Database Schema
- **Users**: Authentication and user management
- **SerpJobs**: SERP analysis job tracking
- **SerpResults**: Individual SERP result storage
- **BusinessProfiles**: Business profile data with comprehensive scoring
- **WatchlistItems**: User watchlist management
- **KeywordRankings**: Keyword tracking data

## DataForSEO API Integration

### 1. Business Listings Search
- **Endpoint**: `POST /v3/business_data/business_listings/search/live`
- **Purpose**: Find businesses by keyword and location
- **Parameters**: keyword, location_name, language_code, limit
- **Response**: Business listings with contact info, ratings, categories

### 2. Google My Business Info
- **Endpoint**: `POST /v3/business_data/google/my_business_info/live`
- **Purpose**: Get detailed GMB information for specific business
- **Parameters**: keyword, location_name, language_code
- **Response**: GMB profile data, hours, contact info, reviews

### 3. Reviews API
- **Endpoint**: `POST /v3/business_data/google/reviews/task_post`
- **Purpose**: Get business reviews and ratings
- **Parameters**: keyword, location_name, language_code, max_reviews_count
- **Response**: Review data, ratings, response rates

### 4. Ranked Keywords
- **Endpoint**: `POST /v3/dataforseo_labs/google/ranked_keywords/live`
- **Purpose**: Get SEO keyword rankings for domain
- **Parameters**: target (domain), language_name, location_name, limit
- **Response**: Keyword rankings, positions, search volumes

### 5. Bulk Traffic Estimation
- **Endpoint**: `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live`
- **Purpose**: Get organic and paid traffic estimates
- **Parameters**: targets (domains), location_code, language_code, item_types
- **Response**: Traffic estimates, ETV (estimated traffic value)

### 6. On-Page Analysis
- **Endpoint**: `POST /v3/on_page/task_post`
- **Purpose**: Analyze website technical SEO
- **Parameters**: url, location_name, language_name
- **Response**: On-page score, critical issues, warnings

### 7. Backlinks API
- **Endpoint**: `POST /v3/backlinks/bulk_backlinks/live`
- **Purpose**: Get backlink analysis
- **Parameters**: target (domain), limit
- **Response**: Backlink data, referring domains, authority metrics

### 8. Ads Search
- **Endpoint**: `POST /v3/serp/google/ads_search/live/advanced`
- **Purpose**: Get ad creatives for specific domain
- **Parameters**: target (domain), location_code, platform, depth, date_range
- **Response**: Ad creatives, titles, formats, timestamps

### 9. Ads Advertisers
- **Endpoint**: `POST /v3/serp/google/ads_advertisers/live/advanced`
- **Purpose**: Get advertiser information and ad counts
- **Parameters**: keyword, location_code, language_code
- **Response**: Advertiser data, approx ads count, verification status

## Comprehensive Scoring System

### Lead Score Formula
```
LeadScore = 0.30 * PresenceScore + 0.35 * SEOScore + 0.25 * AdsActivityScore + 0.10 * EngagementScore
```

### Presence Score (0-100)
- **Rating Component (40%)**: `(rating - 1) / 4 * 100`
- **Review Count (40%)**: `Math.min(100, Math.log10(1 + reviewCount) * 20)`
- **NAP Completeness (20%)**: Name, Address, Phone completeness bonus

### SEO Score (0-100)
- **On-Page Score (50%)**: Technical SEO health
- **Traffic (30%)**: `Math.min(100, Math.log10(1 + organicTraffic) * 15)`
- **Keywords (20%)**: `Math.min(100, Math.log10(1 + keywordCount) * 10)`

### Ads Activity Score (0-100)
- **Paid ETV (60%)**: Log-normalized paid traffic estimate
- **Creatives Count (20%)**: Number of unique ad creatives
- **Ad Recency (10%)**: Campaign freshness (0-100)
- **Verified Advertiser (10%)**: Advertiser verification bonus

### Engagement Score (0-100)
- **Review Velocity (40%)**: Recent review activity
- **Response Rate (30%)**: Owner response rate
- **Rating Trend (30%)**: Overall rating quality

## Ad Performance Analysis

### Detailed Ad Metrics
- **Paid ETV**: Estimated monthly paid traffic
- **Creatives Count**: Number of unique ad creatives
- **Approx Ads Count**: Total ad campaigns
- **Ad Recency Score**: Campaign freshness (0-100)
- **Verified Advertiser**: Advertiser verification status
- **Platforms**: Google Search, Maps, Shopping, YouTube
- **Last Active Date**: When ads were last shown
- **Recent Creatives**: Ad titles, formats, dates, verification

### Ad Activity Score Calculation
```typescript
const adActivityScore = 
  (logNormalize(paidETV, 1, 100000) * 0.60) +
  (logNormalize(creativesCount, 0, 200) * 0.20) +
  (adRecency * 0.10) +
  (verified ? 100 : 0) * 0.10;
```

## System Features

### Prospect Finder (Fast)
- Business listings search
- Basic lead scoring
- Simple recommendations
- Quick results for lead generation

### Business Profile Analysis (Comprehensive)
- Full DataForSEO API integration
- Detailed scoring breakdown
- Ad performance analysis
- SEO technical analysis
- Review sentiment analysis
- Backlink authority metrics
- Actionable recommendations

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### SERP Intelligence
- `POST /api/serp/search-prospects` - Search for prospects
- `POST /api/serp/analyze-website` - Analyze website SEO
- `POST /api/serp/track-keywords` - Track keyword rankings
- `GET /api/serp/business/:profileId` - Get business profile with comprehensive scoring

### Business Data
- `POST /api/serp/business-listings` - Get business listings
- `POST /api/serp/google-my-business` - Get GMB info
- `POST /api/serp/comprehensive-score` - Get comprehensive scoring
- `POST /api/serp/business-reviews` - Get business reviews
- `POST /api/serp/ranked-keywords` - Get keyword rankings
- `POST /api/serp/bulk-traffic` - Get traffic estimation
- `POST /api/serp/ads-search` - Get ad creatives
- `POST /api/serp/onpage-analysis` - Get on-page analysis
- `POST /api/serp/backlink-analysis` - Get backlink analysis

### Watchlist Management
- `POST /api/serp/add-to-watchlist` - Add to watchlist
- `GET /api/serp/watchlist` - Get watchlist items
- `PUT /api/serp/watchlist/:itemId` - Update watchlist item
- `DELETE /api/serp/watchlist/:itemId` - Remove from watchlist

## Frontend Components

### Prospect Finder Agent
- **File**: `client/agents/prospect-finder/index.tsx`
- **Features**: 
  - Missouri-specific search
  - Location type filtering (ZIP, County, Radius)
  - Map visualization
  - Basic lead scoring
  - Quick recommendations

### Business Profile Page
- **File**: `client/pages/BusinessProfilePage.tsx`
- **Features**:
  - Comprehensive scoring display
  - Detailed ad performance analysis
  - SEO metrics and recommendations
  - Review analysis
  - ROI calculator
  - Competitor analysis

### Watchlist Page
- **File**: `client/pages/WatchlistPage.tsx`
- **Features**:
  - Watchlist management
  - Business profile navigation
  - Filtering and sorting
  - Status tracking

### Map Component
- **File**: `client/components/MapComponent.tsx`
- **Features**:
  - Interactive map visualization
  - Business location markers
  - ZIP code and county grouping
  - Radius search visualization
  - Filter controls

## Database Models

### User Model
```typescript
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  serpJobs     SerpJob[]
  watchlistItems WatchlistItem[]
}
```

### BusinessProfile Model
```typescript
model BusinessProfile {
  id          String   @id @default(cuid())
  name        String
  domain      String   @unique
  websiteUrl  String?
  category    String
  location    String
  address     String
  city        String
  state       String
  zipCode     String
  phone       String?
  email       String?
  rating      Float?
  reviewsCount Int?
  // ... additional fields
}
```

### SerpJob Model
```typescript
model SerpJob {
  id          String   @id @default(cuid())
  userId      String
  keyword     String
  location    String
  status      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  results     SerpResult[]
}
```

## Location Mapping System

### CSV-Based Location Mapping
- **File**: `missouri_locations_with_header.csv`
- **Purpose**: Map location names to DataForSEO location codes
- **Fields**: location_name, location_code, location_type
- **Algorithm**: Flexible matching with term extraction and scoring

### Location Matching Algorithm
```typescript
private calculateMatchScore(inputTerms: string[], csvTerms: string[]): number {
  let score = 0;
  
  // Exact term matches (highest priority)
  for (const inputTerm of inputTerms) {
    if (csvTerms.includes(inputTerm.toLowerCase())) {
      score += 100;
    }
  }
  
  // Partial matches
  for (const inputTerm of inputTerms) {
    for (const csvTerm of csvTerms) {
      if (csvTerm.includes(inputTerm.toLowerCase()) || 
          inputTerm.toLowerCase().includes(csvTerm)) {
        score += 50;
      }
    }
  }
  
  return score;
}
```

## Error Handling and Fallbacks

### API Error Handling
- Individual API call error handling
- Fallback empty data structures
- Graceful degradation for failed calls
- Comprehensive error logging

### Rate Limiting
- DataForSEO API rate limit management
- Request queuing and throttling
- Retry logic with exponential backoff

### Data Validation
- Input parameter validation
- Response data validation
- Type safety with TypeScript
- Zod schema validation for API requests

## Performance Optimizations

### Fast Prospect Search
- Single API call for business listings
- Frontend-based basic scoring
- Immediate results display
- No deep analysis delays

### Comprehensive Business Analysis
- Parallel API calls for detailed analysis
- Cached results where possible
- Progressive data loading
- Background processing for heavy operations

## Security Implementation

### Authentication
- JWT token-based authentication
- HttpOnly cookies for token storage
- Password hashing with bcryptjs
- Protected route middleware

### API Security
- CORS configuration
- Request validation
- Rate limiting
- Input sanitization

## Deployment Configuration

### Environment Variables
```env
DATABASE_URL="postgresql://..."
DATAFORSEO_LOGIN="your_login"
DATAFORSEO_PASSWORD="your_password"
JWT_SECRET="your_jwt_secret"
NODE_ENV="production"
```

### Production Build
```bash
pnpm build      # Production build
pnpm start      # Start production server
pnpm typecheck  # TypeScript validation
pnpm test       # Run tests
```

## Testing and Validation

### Unit Tests
- Service method testing
- API endpoint testing
- Database operation testing
- Error handling validation

### Integration Tests
- End-to-end API testing
- Frontend component testing
- User flow testing
- DataForSEO API integration testing

### Performance Testing
- Load testing for API endpoints
- Database query optimization
- Memory usage monitoring
- Response time analysis

## Monitoring and Logging

### Application Logging
- Comprehensive error logging
- API call tracking
- Performance metrics
- User action logging

### DataForSEO API Monitoring
- Rate limit tracking
- API response times
- Error rate monitoring
- Cost tracking

## Future Enhancements

### Planned Features
- Advanced filtering and search
- Custom scoring algorithms
- Automated reporting
- Integration with additional data sources
- Machine learning-based recommendations

### Scalability Considerations
- Database optimization
- Caching strategies
- API rate limit management
- Horizontal scaling preparation

---

**This documentation covers the complete business intelligence system implementation with comprehensive DataForSEO API integration, scoring algorithms, and user interface components.**
