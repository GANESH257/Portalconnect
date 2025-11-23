# Complete Database Documentation - Ensemble Digital Labs

## 📊 Database Overview

**Database Provider**: MySQL (configured in Prisma schema)  
**ORM**: Prisma  
**Total Tables**: 10  
**Purpose**: Full-stack business intelligence platform with authentication, SERP intelligence, prospect management, and competitive analysis

---

## 🗄️ Database Schema Architecture

### **Schema Organization**
The database is organized into 3 main functional areas:
1. **Authentication & User Management** (3 tables)
2. **SERP Intelligence & Business Data** (5 tables)
3. **Prospect & Watchlist Management** (2 tables)

---

## 📋 Table 1: `users` (User Management)

### **Purpose**
Stores user account information for authentication and profile management.

### **Table Name**: `users` (mapped from Prisma model `User`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique identifier (CUID) |
| `email` | `email` | `TEXT` | UNIQUE, NOT NULL | User's email address (login) |
| `passwordHash` | `password_hash` | `TEXT` | NOT NULL | Bcrypt hashed password |
| `companyName` | `company_name` | `TEXT` | NOT NULL | User's company name |
| `position` | `position` | `TEXT` | NOT NULL | User's job position |
| `phoneNumber` | `phone_number` | `TEXT` | NOT NULL | User's phone number |
| `profilePictureUrl` | `profile_picture_url` | `TEXT` | NULLABLE | URL to profile picture |
| `bio` | `bio` | `TEXT` | NULLABLE | User biography/description |
| `emailVerified` | `email_verified` | `BOOLEAN` | NOT NULL, DEFAULT: false | Email verification status |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Account creation timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | NOT NULL, AUTO-UPDATE | Last update timestamp |
| `lastLogin` | `last_login` | `TIMESTAMP(3)` | NULLABLE | Last login timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `email`

### **Relationships**
- **One-to-Many** → `sessions` (User can have multiple sessions)
- **One-to-Many** → `email_verifications` (User can have multiple verification tokens)
- **One-to-Many** → `serp_jobs` (User can create multiple SERP search jobs)
- **One-to-Many** → `watchlist_items` (User can have multiple watchlist items)
- **One-to-Many** → `prospect_items` (User can have multiple prospects)

### **Usage Example**
```typescript
// Create user
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    passwordHash: "$2b$12$...",
    companyName: "Acme Corp",
    position: "Marketing Director",
    phoneNumber: "+1-555-0123"
  }
});

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }
});
```

---

## 📋 Table 2: `sessions` (Session Management)

### **Purpose**
Stores JWT session tokens for user authentication and session tracking.

### **Table Name**: `sessions` (mapped from Prisma model `Session`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique session identifier (CUID) |
| `userId` | `user_id` | `TEXT` | NOT NULL, FOREIGN KEY | Reference to `users.id` |
| `tokenHash` | `token_hash` | `TEXT` | NOT NULL | Hashed JWT token |
| `expiresAt` | `expires_at` | `TIMESTAMP(3)` | NOT NULL | Token expiration timestamp |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Session creation timestamp |
| `isActive` | `is_active` | `BOOLEAN` | NOT NULL, DEFAULT: true | Whether session is active |

### **Indexes**
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `users.id` (ON DELETE CASCADE)

### **Relationships**
- **Many-to-One** → `users` (Each session belongs to one user)

### **Cascade Behavior**
- When a user is deleted, all their sessions are automatically deleted (CASCADE)

### **Usage Example**
```typescript
// Create session
const session = await prisma.session.create({
  data: {
    userId: user.id,
    tokenHash: hashedToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  }
});

// Find active sessions for user
const activeSessions = await prisma.session.findMany({
  where: {
    userId: user.id,
    isActive: true,
    expiresAt: { gt: new Date() }
  }
});
```

---

## 📋 Table 3: `email_verifications` (Email Verification)

### **Purpose**
Stores email verification tokens for account activation.

### **Table Name**: `email_verifications` (mapped from Prisma model `EmailVerification`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique verification identifier (CUID) |
| `userId` | `user_id` | `TEXT` | NOT NULL, FOREIGN KEY | Reference to `users.id` |
| `token` | `token` | `TEXT` | UNIQUE, NOT NULL | Unique verification token |
| `expiresAt` | `expires_at` | `TIMESTAMP(3)` | NOT NULL | Token expiration timestamp |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Token creation timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `token`
- FOREIGN KEY: `user_id` → `users.id` (ON DELETE CASCADE)

### **Relationships**
- **Many-to-One** → `users` (Each verification belongs to one user)

### **Cascade Behavior**
- When a user is deleted, all their verification tokens are automatically deleted (CASCADE)

### **Usage Example**
```typescript
// Create verification token
const verification = await prisma.emailVerification.create({
  data: {
    userId: user.id,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
});

// Verify token
const verification = await prisma.emailVerification.findUnique({
  where: { token: tokenString },
  include: { user: true }
});
```

---

## 📋 Table 4: `serp_jobs` (SERP Search Jobs)

### **Purpose**
Tracks SERP (Search Engine Results Page) search requests and their status. This is the parent table for all search operations.

### **Table Name**: `serp_jobs` (mapped from Prisma model `SerpJob`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique job identifier (CUID) |
| `userId` | `user_id` | `TEXT` | NOT NULL, FOREIGN KEY | Reference to `users.id` |
| `keyword` | `keyword` | `TEXT` | NOT NULL | Search keyword (e.g., "dental clinic") |
| `location` | `location` | `TEXT` | NULLABLE | Search location (e.g., "St. Louis, MO") |
| `language` | `language` | `TEXT` | NULLABLE, DEFAULT: "English" | Search language |
| `device` | `device` | `TEXT` | NULLABLE, DEFAULT: "desktop" | Device type (desktop, mobile, tablet) |
| `os` | `os` | `TEXT` | NULLABLE, DEFAULT: "windows" | Operating system |
| `searchEngine` | `search_engine` | `TEXT` | NOT NULL, DEFAULT: "google" | Search engine (google, bing, etc.) |
| `searchType` | `search_type` | `TEXT` | NOT NULL, DEFAULT: "organic" | Type: organic, maps, local_pack |
| `status` | `status` | `TEXT` | NOT NULL, DEFAULT: "pending" | Job status: pending, processing, completed, failed |
| `dataforseoTaskId` | `dataforseo_task_id` | `TEXT` | NULLABLE | DataForSEO API task ID |
| `cost` | `cost` | `DOUBLE PRECISION` | NULLABLE, DEFAULT: 0 | API call cost in USD |
| `resultsCount` | `results_count` | `INTEGER` | NULLABLE | Number of results returned |
| `errorMessage` | `error_message` | `TEXT` | NULLABLE | Error message if job failed |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Job creation timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | NOT NULL, AUTO-UPDATE | Last update timestamp |
| `completedAt` | `completed_at` | `TIMESTAMP(3)` | NULLABLE | Job completion timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- COMPOSITE INDEX: `(user_id, keyword)` - For finding user's search history
- INDEX: `status` - For filtering by job status
- INDEX: `created_at` - For sorting by creation date
- FOREIGN KEY: `user_id` → `users.id` (ON DELETE CASCADE)

### **Relationships**
- **Many-to-One** → `users` (Each job belongs to one user)
- **One-to-Many** → `serp_results` (Each job has multiple results)
- **One-to-Many** → `watchlist_items` (Job can be linked to watchlist items)
- **One-to-Many** → `prospect_items` (Job can be linked to prospect items)

### **Cascade Behavior**
- When a user is deleted, all their SERP jobs are automatically deleted (CASCADE)
- When a job is deleted, all its results are automatically deleted (CASCADE)

### **Status Values**
- `pending`: Job created but not started
- `processing`: Job is currently running
- `completed`: Job finished successfully
- `failed`: Job encountered an error

### **Usage Example**
```typescript
// Create SERP job
const job = await prisma.serpJob.create({
  data: {
    userId: user.id,
    keyword: "dental clinic",
    location: "St. Louis, MO",
    searchType: "maps",
    status: "pending"
  }
});

// Update job status
await prisma.serpJob.update({
  where: { id: job.id },
  data: {
    status: "completed",
    resultsCount: 100,
    completedAt: new Date()
  }
});

// Find user's recent jobs
const recentJobs = await prisma.serpJob.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

---

## 📋 Table 5: `serp_results` (SERP Search Results)

### **Purpose**
Stores individual search results from DataForSEO API. Each result represents one business/website found in a search.

### **Table Name**: `serp_results` (mapped from Prisma model `SerpResult`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique result identifier (CUID) |
| `serpJobId` | `serp_job_id` | `TEXT` | NOT NULL, FOREIGN KEY | Reference to `serp_jobs.id` |
| `rankGroup` | `rank_group` | `INTEGER` | NOT NULL | Ranking group number |
| `rankAbsolute` | `rank_absolute` | `INTEGER` | NOT NULL | Absolute ranking position |
| `page` | `page` | `INTEGER` | NOT NULL, DEFAULT: 1 | Page number of result |
| `position` | `position` | `TEXT` | NULLABLE | Position: left, right, top, bottom |
| `resultType` | `result_type` | `TEXT` | NOT NULL | Type: organic, local_pack, maps, featured_snippet |
| `title` | `title` | `TEXT` | NULLABLE | Result title/name |
| `description` | `description` | `TEXT` | NULLABLE | Result description |
| `url` | `url` | `TEXT` | NULLABLE | Result URL (TEXT type for long URLs) |
| `domain` | `domain` | `TEXT` | NULLABLE | Website domain |
| `websiteName` | `website_name` | `TEXT` | NULLABLE | Website name |
| `phone` | `phone` | `TEXT` | NULLABLE | Business phone number |
| `address` | `address` | `TEXT` | NULLABLE | Business address |
| `city` | `city` | `TEXT` | NULLABLE | City |
| `state` | `state` | `TEXT` | NULLABLE | State |
| `zipCode` | `zip_code` | `TEXT` | NULLABLE | ZIP code |
| `country` | `country` | `TEXT` | NULLABLE | Country |
| `rating` | `rating` | `DOUBLE PRECISION` | NULLABLE | Business rating (e.g., 4.5) |
| `reviewsCount` | `reviews_count` | `INTEGER` | NULLABLE | Number of reviews |
| `ratingMax` | `rating_max` | `INTEGER` | NULLABLE | Maximum rating (usually 5) |
| `isPaid` | `is_paid` | `BOOLEAN` | NOT NULL, DEFAULT: false | Whether result is paid advertisement |
| `isFeatured` | `is_featured` | `BOOLEAN` | NOT NULL, DEFAULT: false | Whether result is featured |
| `isImage` | `is_image` | `BOOLEAN` | NOT NULL, DEFAULT: false | Whether result is an image |
| `isVideo` | `is_video` | `BOOLEAN` | NOT NULL, DEFAULT: false | Whether result is a video |
| `isMalicious` | `is_malicious` | `BOOLEAN` | NOT NULL, DEFAULT: false | Whether result is flagged as malicious |
| `breadcrumb` | `breadcrumb` | `TEXT` | NULLABLE | Breadcrumb navigation path |
| `cacheUrl` | `cache_url` | `TEXT` | NULLABLE | Cached URL (TEXT type for long URLs) |
| `relatedSearchUrl` | `related_search_url` | `TEXT` | NULLABLE | Related search URL (TEXT type) |
| `extendedSnippet` | `extended_snippet` | `TEXT` | NULLABLE | Extended description snippet |
| `highlighted` | `highlighted` | `JSON` | NULLABLE | Array of highlighted keywords (JSON) |
| `links` | `links` | `JSON` | NULLABLE | Related links (JSON) |
| `faq` | `faq` | `JSON` | NULLABLE | FAQ data (JSON) |
| `images` | `images` | `JSON` | NULLABLE | Image data (JSON) |
| `price` | `price` | `TEXT` | NULLABLE | Price information |
| `timestamp` | `timestamp` | `TIMESTAMP(3)` | NULLABLE | Result timestamp |
| `xpath` | `xpath` | `TEXT` | NULLABLE | XPath selector |
| `cid` | `cid` | `TEXT` | NULLABLE | Google CID (Customer ID) for local businesses |
| `placeId` | `place_id` | `TEXT` | NULLABLE | Google Place ID |
| `rawData` | `raw_data` | `JSON` | NULLABLE | Complete raw data from DataForSEO (JSON) |
| `rectangle` | `rectangle` | `JSON` | NULLABLE | Position rectangle data (JSON) |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Result creation timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- INDEX: `serp_job_id` - For finding all results for a job
- INDEX: `domain` - For finding results by domain
- INDEX: `result_type` - For filtering by result type
- INDEX: `rank_absolute` - For sorting by ranking
- FOREIGN KEY: `serp_job_id` → `serp_jobs.id` (ON DELETE CASCADE)

### **Relationships**
- **Many-to-One** → `serp_jobs` (Each result belongs to one job)
- **One-to-One** → `business_profiles` (Each result can have one business profile)
- **One-to-Many** → `watchlist_items` (Result can be in multiple watchlists)
- **One-to-Many** → `prospect_items` (Result can be in multiple prospect lists)

### **Cascade Behavior**
- When a SERP job is deleted, all its results are automatically deleted (CASCADE)

### **JSON Fields**
- `highlighted`: Array of highlighted keywords from search
- `links`: Related links structure
- `faq`: FAQ questions and answers
- `images`: Image URLs and metadata
- `rawData`: Complete API response for reference
- `rectangle`: Position coordinates on SERP

### **Usage Example**
```typescript
// Store SERP results
const results = await Promise.all(
  apiResults.map(result => 
    prisma.serpResult.create({
      data: {
        serpJobId: job.id,
        rankAbsolute: result.rank,
        resultType: result.type,
        title: result.title,
        domain: result.domain,
        url: result.url,
        phone: result.phone,
        address: result.address,
        city: result.city,
        state: result.state,
        zipCode: result.zipCode,
        rating: result.rating?.value,
        reviewsCount: result.rating?.votes_count,
        placeId: result.place_id,
        cid: result.cid,
        rawData: result // Store complete raw data
      }
    })
  )
);

// Find top results for a job
const topResults = await prisma.serpResult.findMany({
  where: { serpJobId: job.id },
  orderBy: { rankAbsolute: 'asc' },
  take: 10
});
```

---

## 📋 Table 6: `business_profiles` (Business Intelligence)

### **Purpose**
Stores comprehensive business intelligence data extracted from SERP results. This is the enriched business profile with SEO metrics, contact info, and analysis data.

### **Table Name**: `business_profiles` (mapped from Prisma model `BusinessProfile`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique profile identifier (CUID) |
| `serpResultId` | `serp_result_id` | `TEXT` | UNIQUE, NULLABLE, FOREIGN KEY | Reference to `serp_results.id` |
| `placeId` | `place_id` | `TEXT` | NULLABLE | Google Place ID |
| `cid` | `cid` | `TEXT` | NULLABLE | Google CID (Customer ID) |
| `name` | `name` | `TEXT` | NOT NULL | Business name |
| `domain` | `domain` | `TEXT` | NULLABLE | Business domain |
| `websiteUrl` | `website_url` | `TEXT` | NULLABLE | Full website URL (TEXT type) |
| `category` | `category` | `TEXT` | NULLABLE | Business category |
| `subcategory` | `subcategory` | `TEXT` | NULLABLE | Business subcategory |
| `industry` | `industry` | `TEXT` | NULLABLE | Industry classification |
| `location` | `location` | `TEXT` | NULLABLE | General location string |
| `address` | `address` | `TEXT` | NULLABLE | Street address |
| `city` | `city` | `TEXT` | NULLABLE | City |
| `state` | `state` | `TEXT` | NULLABLE | State |
| `zipCode` | `zip_code` | `TEXT` | NULLABLE | ZIP code |
| `country` | `country` | `TEXT` | NULLABLE | Country |
| `phone` | `phone` | `TEXT` | NULLABLE | Phone number |
| `email` | `email` | `TEXT` | NULLABLE | Email address |
| `description` | `description` | `TEXT` | NULLABLE | Business description |
| `rating` | `rating` | `DOUBLE PRECISION` | NULLABLE | Average rating |
| `reviewsCount` | `reviews_count` | `INTEGER` | NULLABLE | Number of reviews |
| `ratingMax` | `rating_max` | `INTEGER` | NULLABLE | Maximum rating (usually 5) |
| `isVerified` | `is_verified` | `BOOLEAN` | NOT NULL, DEFAULT: false | Google verified status |
| `isPaid` | `is_paid` | `BOOLEAN` | NOT NULL, DEFAULT: false | Paid advertisement status |
| `businessHours` | `business_hours` | `JSON` | NULLABLE | Business hours (JSON) |
| `socialMedia` | `social_media` | `JSON` | NULLABLE | Social media links (JSON) |
| `services` | `services` | `JSON` | NULLABLE | Array of services (JSON) |
| `specialties` | `specialties` | `JSON` | NULLABLE | Array of specialties (JSON) |
| `insuranceAccepted` | `insurance_accepted` | `JSON` | NULLABLE | Insurance types accepted (JSON) |
| `languages` | `languages` | `JSON` | NULLABLE | Languages spoken (JSON) |
| `certifications` | `certifications` | `JSON` | NULLABLE | Certifications (JSON) |
| `awards` | `awards` | `JSON` | NULLABLE | Awards received (JSON) |
| `seoScore` | `seo_score` | `INTEGER` | NULLABLE | SEO score (0-100) |
| `domainAuthority` | `domain_authority` | `INTEGER` | NULLABLE | Domain authority score |
| `backlinks` | `backlinks` | `INTEGER` | NULLABLE | Number of backlinks |
| `monthlyTraffic` | `monthly_traffic` | `INTEGER` | NULLABLE | Estimated monthly traffic |
| `pageSpeed` | `page_speed` | `DOUBLE PRECISION` | NULLABLE | Page speed score |
| `mobileScore` | `mobile_score` | `INTEGER` | NULLABLE | Mobile optimization score |
| `accessibilityScore` | `accessibility_score` | `INTEGER` | NULLABLE | Accessibility score |
| `lastAnalyzed` | `last_analyzed` | `TIMESTAMP(3)` | NULLABLE | Last analysis timestamp |
| `isActive` | `is_active` | `BOOLEAN` | NOT NULL, DEFAULT: true | Whether profile is active |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Profile creation timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | NOT NULL, AUTO-UPDATE | Last update timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `serp_result_id` - One profile per SERP result
- INDEX: `domain` - For finding profiles by domain
- INDEX: `category` - For filtering by category
- COMPOSITE INDEX: `(city, state)` - For location-based queries
- INDEX: `rating` - For sorting by rating
- INDEX: `seo_score` - For sorting by SEO score
- FOREIGN KEY: `serp_result_id` → `serp_results.id` (ON DELETE SET NULL)

### **Relationships**
- **One-to-One** → `serp_results` (Each profile can be linked to one SERP result)
- **One-to-Many** → `watchlist_items` (Profile can be in multiple watchlists)
- **One-to-Many** → `prospect_items` (Profile can be in multiple prospect lists)
- **One-to-Many** → `competitor_analysis` (Profile can have multiple competitor analyses)
- **One-to-Many** → `keyword_rankings` (Profile can have multiple keyword rankings)

### **Cascade Behavior**
- When a SERP result is deleted, the business profile's `serpResultId` is set to NULL (SET NULL)

### **JSON Fields**
- `businessHours`: `{ "monday": "9am-5pm", ... }`
- `socialMedia`: `{ "facebook": "url", "twitter": "url", ... }`
- `services`: `["Service 1", "Service 2", ...]`
- `specialties`: `["Specialty 1", "Specialty 2", ...]`
- `insuranceAccepted`: `["Insurance 1", "Insurance 2", ...]`
- `languages`: `["English", "Spanish", ...]`
- `certifications`: `["Cert 1", "Cert 2", ...]`
- `awards`: `["Award 1", "Award 2", ...]`

### **Usage Example**
```typescript
// Create business profile
const profile = await prisma.businessProfile.create({
  data: {
    serpResultId: result.id,
    name: "ABC Dental Clinic",
    domain: "abcdental.com",
    websiteUrl: "https://www.abcdental.com",
    category: "Dental Clinic",
    address: "123 Main St",
    city: "St. Louis",
    state: "MO",
    zipCode: "63101",
    phone: "+1-555-0123",
    rating: 4.5,
    reviewsCount: 150,
    services: ["General Dentistry", "Cosmetic Dentistry"],
    seoScore: 75,
    domainAuthority: 45,
    backlinks: 1200
  }
});

// Find profiles by location
const profiles = await prisma.businessProfile.findMany({
  where: {
    city: "St. Louis",
    state: "MO",
    category: "Dental Clinic"
  },
  orderBy: { rating: 'desc' }
});
```

---

## 📋 Table 7: `keyword_rankings` (Keyword Tracking)

### **Purpose**
Tracks keyword rankings over time for business profiles. Used for SEO monitoring and trend analysis.

### **Table Name**: `keyword_rankings` (mapped from Prisma model `KeywordRanking`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique ranking identifier (CUID) |
| `businessProfileId` | `business_profile_id` | `TEXT` | NOT NULL, FOREIGN KEY | Reference to `business_profiles.id` |
| `keyword` | `keyword` | `TEXT` | NOT NULL | Tracked keyword |
| `searchEngine` | `search_engine` | `TEXT` | NOT NULL, DEFAULT: "google" | Search engine |
| `location` | `location` | `TEXT` | NULLABLE | Search location |
| `device` | `device` | `TEXT` | NULLABLE, DEFAULT: "desktop" | Device type |
| `rankGroup` | `rank_group` | `INTEGER` | NOT NULL | Ranking group number |
| `rankAbsolute` | `rank_absolute` | `INTEGER` | NOT NULL | Absolute ranking position |
| `page` | `page` | `INTEGER` | NOT NULL, DEFAULT: 1 | Page number |
| `position` | `position` | `TEXT` | NULLABLE | Position on page |
| `url` | `url` | `TEXT` | NULLABLE | Ranking URL (TEXT type) |
| `title` | `title` | `TEXT` | NULLABLE | Page title |
| `description` | `description` | `TEXT` | NULLABLE | Page description |
| `isPaid` | `is_paid` | `BOOLEAN` | NOT NULL, DEFAULT: false | Whether ranking is paid |
| `searchVolume` | `search_volume` | `INTEGER` | NULLABLE | Monthly search volume |
| `competition` | `competition` | `TEXT` | NULLABLE | Competition level: low, medium, high |
| `cpc` | `cpc` | `DOUBLE PRECISION` | NULLABLE | Cost per click (USD) |
| `difficulty` | `difficulty` | `INTEGER` | NULLABLE | Keyword difficulty score (0-100) |
| `trend` | `trend` | `TEXT` | NULLABLE | Trend: rising, falling, stable |
| `previousRank` | `previous_rank` | `INTEGER` | NULLABLE | Previous ranking position |
| `rankChange` | `rank_change` | `INTEGER` | NULLABLE | Change in ranking (+/-) |
| `trackedAt` | `tracked_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Tracking timestamp |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Record creation timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- INDEX: `business_profile_id` - For finding all rankings for a profile
- INDEX: `keyword` - For finding rankings by keyword
- INDEX: `tracked_at` - For sorting by tracking date
- INDEX: `rank_absolute` - For sorting by ranking
- FOREIGN KEY: `business_profile_id` → `business_profiles.id` (ON DELETE CASCADE)

### **Relationships**
- **Many-to-One** → `business_profiles` (Each ranking belongs to one business profile)

### **Cascade Behavior**
- When a business profile is deleted, all its keyword rankings are automatically deleted (CASCADE)

### **Usage Example**
```typescript
// Track keyword ranking
const ranking = await prisma.keywordRanking.create({
  data: {
    businessProfileId: profile.id,
    keyword: "dental clinic st louis",
    searchEngine: "google",
    location: "St. Louis, MO",
    rankAbsolute: 5,
    searchVolume: 1200,
    competition: "high",
    cpc: 2.50,
    difficulty: 65,
    trend: "rising"
  }
});

// Get ranking history
const history = await prisma.keywordRanking.findMany({
  where: {
    businessProfileId: profile.id,
    keyword: "dental clinic st louis"
  },
  orderBy: { trackedAt: 'desc' }
});
```

---

## 📋 Table 8: `competitor_analysis` (Competitive Intelligence)

### **Purpose**
Stores competitive analysis data comparing businesses against their competitors.

### **Table Name**: `competitor_analysis` (mapped from Prisma model `CompetitorAnalysis`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique analysis identifier (CUID) |
| `businessProfileId` | `business_profile_id` | `TEXT` | NOT NULL, FOREIGN KEY | Reference to `business_profiles.id` |
| `competitorId` | `competitor_id` | `TEXT` | NOT NULL | Competitor business profile ID |
| `analysisType` | `analysis_type` | `TEXT` | NOT NULL | Type: seo, content, backlinks, social, advertising |
| `metric` | `metric` | `TEXT` | NOT NULL | Metric name (e.g., "domain_authority") |
| `value` | `value` | `TEXT` | NOT NULL | Metric value |
| `score` | `score` | `INTEGER` | NULLABLE | Score (0-100) |
| `comparison` | `comparison` | `TEXT` | NULLABLE | Comparison: better, worse, equal |
| `insights` | `insights` | `TEXT` | NULLABLE | Analysis insights |
| `recommendations` | `recommendations` | `TEXT` | NULLABLE | Recommendations |
| `analyzedAt` | `analyzed_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Analysis timestamp |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Record creation timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- INDEX: `business_profile_id` - For finding analyses for a profile
- INDEX: `competitor_id` - For finding analyses by competitor
- INDEX: `analysis_type` - For filtering by analysis type
- FOREIGN KEY: `business_profile_id` → `business_profiles.id` (ON DELETE CASCADE)

### **Relationships**
- **Many-to-One** → `business_profiles` (Each analysis belongs to one business profile)

### **Cascade Behavior**
- When a business profile is deleted, all its competitor analyses are automatically deleted (CASCADE)

### **Analysis Types**
- `seo`: SEO metrics comparison
- `content`: Content strategy comparison
- `backlinks`: Backlink profile comparison
- `social`: Social media presence comparison
- `advertising`: Advertising strategy comparison

### **Usage Example**
```typescript
// Create competitor analysis
const analysis = await prisma.competitorAnalysis.create({
  data: {
    businessProfileId: profile.id,
    competitorId: competitorProfile.id,
    analysisType: "seo",
    metric: "domain_authority",
    value: "45",
    score: 75,
    comparison: "worse",
    insights: "Competitor has higher domain authority",
    recommendations: "Build more quality backlinks"
  }
});

// Get all competitor analyses
const analyses = await prisma.competitorAnalysis.findMany({
  where: { businessProfileId: profile.id },
  orderBy: { analyzedAt: 'desc' }
});
```

---

## 📋 Table 9: `watchlist_items` (Watchlist Management)

### **Purpose**
Unified management system for prospects, competitors, and websites that users want to track.

### **Table Name**: `watchlist_items` (mapped from Prisma model `WatchlistItem`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique watchlist item identifier (CUID) |
| `userId` | `user_id` | `TEXT` | NOT NULL, FOREIGN KEY | Reference to `users.id` |
| `serpJobId` | `serp_job_id` | `TEXT` | NULLABLE, FOREIGN KEY | Reference to `serp_jobs.id` |
| `serpResultId` | `serp_result_id` | `TEXT` | NULLABLE, FOREIGN KEY | Reference to `serp_results.id` |
| `businessProfileId` | `business_profile_id` | `TEXT` | NULLABLE, FOREIGN KEY | Reference to `business_profiles.id` |
| `itemType` | `item_type` | `TEXT` | NOT NULL | Type: prospect, competitor, website |
| `name` | `name` | `TEXT` | NOT NULL | Item name |
| `domain` | `domain` | `TEXT` | NULLABLE | Website domain |
| `category` | `category` | `TEXT` | NULLABLE | Business category |
| `location` | `location` | `TEXT` | NULLABLE | Location |
| `score` | `score` | `INTEGER` | NULLABLE | Opportunity score |
| `rating` | `rating` | `DOUBLE PRECISION` | NULLABLE | Business rating |
| `status` | `status` | `TEXT` | NOT NULL, DEFAULT: "active" | Status: active, monitoring, contacted, converted, lost |
| `priority` | `priority` | `TEXT` | NOT NULL, DEFAULT: "medium" | Priority: high, medium, low |
| `tags` | `tags` | `JSON` | NULLABLE | Array of tags (JSON) |
| `notes` | `notes` | `TEXT` | NULLABLE | User notes |
| `highlights` | `highlights` | `JSON` | NULLABLE | Key highlights (JSON) |
| `contactInfo` | `contact_info` | `JSON` | NULLABLE | Contact information (JSON) |
| `metrics` | `metrics` | `JSON` | NULLABLE | Performance metrics (JSON) |
| `lastChecked` | `last_checked` | `TIMESTAMP(3)` | NULLABLE | Last check timestamp |
| `addedAt` | `added_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Item addition timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | NOT NULL, AUTO-UPDATE | Last update timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- INDEX: `user_id` - For finding user's watchlist items
- INDEX: `item_type` - For filtering by item type
- INDEX: `status` - For filtering by status
- INDEX: `priority` - For filtering by priority
- INDEX: `added_at` - For sorting by addition date
- FOREIGN KEY: `user_id` → `users.id` (ON DELETE CASCADE)
- FOREIGN KEY: `serp_job_id` → `serp_jobs.id` (ON DELETE SET NULL)
- FOREIGN KEY: `serp_result_id` → `serp_results.id` (ON DELETE SET NULL)
- FOREIGN KEY: `business_profile_id` → `business_profiles.id` (ON DELETE SET NULL)

### **Relationships**
- **Many-to-One** → `users` (Each item belongs to one user)
- **Many-to-One** → `serp_jobs` (Item can be linked to a search job)
- **Many-to-One** → `serp_results` (Item can be linked to a search result)
- **Many-to-One** → `business_profiles` (Item can be linked to a business profile)

### **Cascade Behavior**
- When a user is deleted, all their watchlist items are automatically deleted (CASCADE)
- When a SERP job/result/profile is deleted, the watchlist item's reference is set to NULL (SET NULL)

### **Item Types**
- `prospect`: Potential customer/lead
- `competitor`: Competitor to monitor
- `website`: Website to track

### **Status Values**
- `active`: Currently active
- `monitoring`: Being monitored
- `contacted`: Contact has been made
- `converted`: Successfully converted
- `lost`: Opportunity lost

### **Priority Values**
- `high`: High priority
- `medium`: Medium priority (default)
- `low`: Low priority

### **JSON Fields**
- `tags`: `["tag1", "tag2", ...]`
- `highlights`: `["Highlight 1", "Highlight 2", ...]`
- `contactInfo`: `{ "email": "...", "phone": "...", ... }`
- `metrics`: `{ "traffic": 1000, "rankings": 50, ... }`

### **Usage Example**
```typescript
// Add to watchlist
const watchlistItem = await prisma.watchlistItem.create({
  data: {
    userId: user.id,
    businessProfileId: profile.id,
    serpResultId: result.id,
    itemType: "prospect",
    name: profile.name,
    domain: profile.domain,
    category: profile.category,
    score: 85,
    rating: profile.rating,
    status: "active",
    priority: "high",
    tags: ["dental", "st-louis"],
    highlights: ["High rating", "Good reviews"]
  }
});

// Get user's watchlist
const watchlist = await prisma.watchlistItem.findMany({
  where: { userId: user.id },
  include: { businessProfile: true },
  orderBy: { addedAt: 'desc' }
});
```

---

## 📋 Table 10: `prospect_items` (Prospect Management)

### **Purpose**
Enhanced prospect tracking with sales pipeline management, AI recommendations, and email templates.

### **Table Name**: `prospect_items` (mapped from Prisma model `ProspectItem`)

### **Fields**

| Field Name | Database Column | Type | Constraints | Description |
|------------|----------------|------|-------------|-------------|
| `id` | `id` | `TEXT` | PRIMARY KEY, NOT NULL | Unique prospect identifier (CUID) |
| `userId` | `user_id` | `TEXT` | NOT NULL, FOREIGN KEY | Reference to `users.id` |
| `serpJobId` | `serp_job_id` | `TEXT` | NULLABLE, FOREIGN KEY | Reference to `serp_jobs.id` |
| `serpResultId` | `serp_result_id` | `TEXT` | NULLABLE, FOREIGN KEY | Reference to `serp_results.id` |
| `businessProfileId` | `business_profile_id` | `TEXT` | NULLABLE, FOREIGN KEY | Reference to `business_profiles.id` |
| `name` | `name` | `TEXT` | NOT NULL | Prospect name |
| `domain` | `domain` | `TEXT` | NULLABLE | Website domain |
| `category` | `category` | `TEXT` | NULLABLE | Business category |
| `location` | `location` | `TEXT` | NULLABLE | Location |
| `score` | `score` | `INTEGER` | NULLABLE | Lead score |
| `rating` | `rating` | `DOUBLE PRECISION` | NULLABLE | Business rating |
| `status` | `status` | `TEXT` | NOT NULL, DEFAULT: "new" | Status: new, contacted, qualified, proposal, closed-won, closed-lost |
| `priority` | `priority` | `TEXT` | NOT NULL, DEFAULT: "medium" | Priority: high, medium, low |
| `tags` | `tags` | `JSON` | NULLABLE | Array of tags (JSON) |
| `notes` | `notes` | `TEXT` | NULLABLE | User notes |
| `progress` | `progress` | `TEXT` | NULLABLE | Progress notes |
| `pitchingPoints` | `pitching_points` | `JSON` | NULLABLE | Sales pitching points (JSON) |
| `aiRecommendations` | `ai_recommendations` | `TEXT` | NULLABLE | AI-generated recommendations |
| `emailTemplate` | `email_template` | `TEXT` | NULLABLE | AI-generated email template |
| `contactInfo` | `contact_info` | `JSON` | NULLABLE | Contact information (JSON) |
| `metrics` | `metrics` | `JSON` | NULLABLE | Performance metrics (JSON) |
| `lastContacted` | `last_contacted` | `TIMESTAMP(3)` | NULLABLE | Last contact timestamp |
| `nextFollowUp` | `next_follow_up` | `TIMESTAMP(3)` | NULLABLE | Next follow-up timestamp |
| `isActive` | `is_active` | `BOOLEAN` | NOT NULL, DEFAULT: true | Whether prospect is active |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Prospect creation timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | NOT NULL, AUTO-UPDATE | Last update timestamp |

### **Indexes**
- PRIMARY KEY: `id`
- INDEX: `user_id` - For finding user's prospects
- INDEX: `business_profile_id` - For finding prospects by business profile
- INDEX: `status` - For filtering by status
- INDEX: `priority` - For filtering by priority
- FOREIGN KEY: `user_id` → `users.id` (ON DELETE CASCADE)
- FOREIGN KEY: `serp_job_id` → `serp_jobs.id` (ON DELETE SET NULL)
- FOREIGN KEY: `serp_result_id` → `serp_results.id` (ON DELETE SET NULL)
- FOREIGN KEY: `business_profile_id` → `business_profiles.id` (ON DELETE SET NULL)

### **Relationships**
- **Many-to-One** → `users` (Each prospect belongs to one user)
- **Many-to-One** → `serp_jobs` (Prospect can be linked to a search job)
- **Many-to-One** → `serp_results` (Prospect can be linked to a search result)
- **Many-to-One** → `business_profiles` (Prospect can be linked to a business profile)

### **Cascade Behavior**
- When a user is deleted, all their prospects are automatically deleted (CASCADE)
- When a SERP job/result/profile is deleted, the prospect's reference is set to NULL (SET NULL)

### **Status Values (Sales Pipeline)**
- `new`: New prospect, not contacted
- `contacted`: Initial contact made
- `qualified`: Prospect qualified
- `proposal`: Proposal sent
- `closed-won`: Deal won
- `closed-lost`: Deal lost

### **Priority Values**
- `high`: High priority
- `medium`: Medium priority (default)
- `low`: Low priority

### **JSON Fields**
- `tags`: `["tag1", "tag2", ...]`
- `pitchingPoints`: `["Point 1", "Point 2", ...]`
- `contactInfo`: `{ "email": "...", "phone": "...", ... }`
- `metrics`: `{ "traffic": 1000, "rankings": 50, ... }`

### **Usage Example**
```typescript
// Add prospect
const prospect = await prisma.prospectItem.create({
  data: {
    userId: user.id,
    businessProfileId: profile.id,
    name: profile.name,
    domain: profile.domain,
    category: profile.category,
    score: 90,
    status: "new",
    priority: "high",
    tags: ["dental", "high-value"],
    aiRecommendations: "High SEO opportunity",
    emailTemplate: "Dear [Name], ..."
  }
});

// Update prospect status
await prisma.prospectItem.update({
  where: { id: prospect.id },
  data: {
    status: "contacted",
    lastContacted: new Date(),
    nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
});

// Get prospects by status
const activeProspects = await prisma.prospectItem.findMany({
  where: {
    userId: user.id,
    status: { in: ["new", "contacted", "qualified"] },
    isActive: true
  },
  orderBy: { priority: 'desc' }
});
```

---

## 🔗 Complete Relationship Diagram

```
users (1) ──┬── (many) sessions
            ├── (many) email_verifications
            ├── (many) serp_jobs
            ├── (many) watchlist_items
            └── (many) prospect_items

serp_jobs (1) ──┬── (many) serp_results
                ├── (many) watchlist_items
                └── (many) prospect_items

serp_results (1) ──┬── (1) business_profiles
                  ├── (many) watchlist_items
                  └── (many) prospect_items

business_profiles (1) ──┬── (many) watchlist_items
                        ├── (many) prospect_items
                        ├── (many) competitor_analysis
                        └── (many) keyword_rankings
```

---

## 📊 Database Statistics

### **Table Sizes** (Estimated)
- `users`: Small (hundreds to thousands of records)
- `sessions`: Medium (thousands of records, auto-cleanup)
- `email_verifications`: Small (hundreds, auto-cleanup)
- `serp_jobs`: Medium (thousands of records)
- `serp_results`: Large (hundreds of thousands of records)
- `business_profiles`: Large (tens of thousands of records)
- `keyword_rankings`: Very Large (millions of records over time)
- `competitor_analysis`: Medium (thousands of records)
- `watchlist_items`: Medium (thousands of records)
- `prospect_items`: Medium (thousands of records)

### **Index Usage**
- **Primary Keys**: All tables have CUID primary keys
- **Foreign Keys**: All relationships are indexed
- **Composite Indexes**: Used for common query patterns
- **Single Column Indexes**: Used for filtering and sorting

---

## 🔧 Database Configuration

### **Prisma Configuration**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### **Connection String Format**
```
mysql://username:password@host:port/database?schema=public
```

### **Data Types Used**
- `TEXT`: Variable-length strings (MySQL TEXT type)
- `INTEGER`: Whole numbers
- `DOUBLE PRECISION`: Floating-point numbers
- `BOOLEAN`: True/false values
- `TIMESTAMP(3)`: Date and time with millisecond precision
- `JSON`: JSON data (MySQL JSON type)

### **Special Considerations**
- **URL Fields**: Use `@db.Text` for long URLs (prevents truncation)
- **JSON Fields**: Store arrays and objects as JSON for flexibility
- **Cascade Deletes**: Used for data integrity
- **SET NULL**: Used for optional relationships

---

## 🚀 Common Query Patterns

### **1. Get User's Recent Searches**
```typescript
const recentSearches = await prisma.serpJob.findMany({
  where: { userId: user.id },
  include: {
    serpResults: {
      take: 10,
      orderBy: { rankAbsolute: 'asc' }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

### **2. Get Business Profile with All Related Data**
```typescript
const profile = await prisma.businessProfile.findUnique({
  where: { id: profileId },
  include: {
    serpResult: true,
    keywordRankings: {
      orderBy: { trackedAt: 'desc' },
      take: 10
    },
    competitorAnalysis: {
      take: 5
    },
    watchlistItems: {
      where: { userId: user.id }
    }
  }
});
```

### **3. Get Prospects by Pipeline Stage**
```typescript
const pipeline = await prisma.prospectItem.groupBy({
  by: ['status'],
  where: { userId: user.id, isActive: true },
  _count: { id: true }
});
```

### **4. Search Businesses by Location**
```typescript
const businesses = await prisma.businessProfile.findMany({
  where: {
    city: "St. Louis",
    state: "MO",
    category: { contains: "dental", mode: 'insensitive' },
    rating: { gte: 4.0 }
  },
  orderBy: [
    { rating: 'desc' },
    { reviewsCount: 'desc' }
  ],
  take: 50
});
```

---

## 📝 Notes

1. **Database Provider**: Currently configured as MySQL, but migrations show PostgreSQL syntax. Ensure consistency.
2. **CUID IDs**: All primary keys use CUID (Collision-resistant Unique Identifier) for better distribution.
3. **JSON Fields**: Used extensively for flexible data storage (arrays, objects).
4. **Cascade Deletes**: Implemented for data integrity when parent records are deleted.
5. **Indexes**: Optimized for common query patterns (user lookups, filtering, sorting).
6. **Text Fields**: Long URLs use `@db.Text` to prevent truncation issues.

---

---

## 🔌 API-to-Database Mapping

This section documents all external APIs used (DataForSEO and Google APIs) and how their responses are stored in the database tables.

### **API Provider: DataForSEO**

**Base URL**: `https://api.dataforseo.com/v3`  
**Authentication**: Basic Auth (username/password)  
**Rate Limit**: 60 requests/minute, 1000 requests/day

---

## 📡 API Endpoints & Database Storage

### **1. Google Maps Search API**

**Endpoint**: `POST /v3/serp/google/maps/live/advanced`  
**Purpose**: Search for local businesses on Google Maps  
**Used In**: Prospect Finder Agent  
**Stores In**: `serp_jobs`, `serp_results`, `business_profiles`

#### **Request Parameters**
```typescript
{
  keyword: string,        // e.g., "dental clinic"
  location_code: number,  // e.g., 2840 (St. Louis, MO)
  language_code: string,  // "en"
  device: string          // "desktop" | "mobile" | "tablet"
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "type": "maps_search",
        "rank_group": 1,
        "rank_absolute": 1,
        "title": "Business Name",
        "url": "https://...",
        "domain": "example.com",
        "phone": "+1-555-0123",
        "address": "123 Main St",
        "address_info": {
          "city": "St. Louis",
          "region": "MO",
          "postal_code": "63101",
          "country_code": "US"
        },
        "rating": {
          "value": 4.5,
          "votes_count": 150,
          "max": 5
        },
        "place_id": "ChIJ...",
        "cid": "1234567890",
        "category": "Dental Clinic",
        "additional_categories": ["General Dentistry", "Cosmetic"],
        "category_ids": ["cat1", "cat2"]
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `serp_jobs`**
- Created first to track the search request
- Fields populated:
  - `keyword` ← `keyword` (from request)
  - `location` ← `location` (from request)
  - `searchType` ← `"maps"`
  - `status` ← `"pending"` → `"processing"` → `"completed"`
  - `resultsCount` ← Count of items returned
  - `cost` ← `0.002` (API cost)

**Table: `serp_results`**
- One record per business result
- Fields populated from API response:
  ```typescript
  {
    serpJobId: job.id,
    rankGroup: result.rank_group,
    rankAbsolute: result.rank_absolute,
    resultType: "maps",
    title: result.title,
    url: result.url,
    domain: result.domain,
    phone: result.phone,
    address: result.address,
    city: result.address_info?.city,
    state: result.address_info?.region,
    zipCode: result.address_info?.postal_code,
    country: result.address_info?.country_code,
    rating: result.rating?.value,
    reviewsCount: result.rating?.votes_count,
    ratingMax: result.rating?.max,
    placeId: result.place_id,
    cid: result.cid,
    rawData: result  // Complete API response stored as JSON
  }
  ```

**Table: `business_profiles`**
- Created from `serp_results` data (on-demand or automatically)
- Fields populated:
  ```typescript
  {
    serpResultId: serpResult.id,
    placeId: result.place_id,
    cid: result.cid,
    name: result.title,
    domain: result.domain,
    websiteUrl: result.url,
    category: result.category,
    address: result.address,
    city: result.address_info?.city,
    state: result.address_info?.region,
    zipCode: result.address_info?.postal_code,
    phone: result.phone,
    rating: result.rating?.value,
    reviewsCount: result.rating?.votes_count,
    services: result.additional_categories,  // JSON array
    specialties: result.category_ids  // JSON array
  }
  ```

---

### **2. Google Local Pack Search API**

**Endpoint**: `POST /v3/serp/google/local_finder/live/advanced`  
**Purpose**: Get Google Local Pack results (3-pack)  
**Used In**: Prospect Finder Agent  
**Stores In**: `serp_jobs`, `serp_results`, `business_profiles`

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_code: number,
  language_code: "en",
  device: string,
  limit: number  // Default: 20
}
```

#### **API Response Structure**
Similar to Maps API, but `type: "local_pack_search"`

#### **Database Storage Mapping**
Same as Maps API above, but:
- `resultType` ← `"local_pack"` (instead of "maps")
- Results are combined with Maps results before storage

---

### **3. Business Listings Search API**

**Endpoint**: `POST /v3/business_data/business_listings/search/live`  
**Purpose**: Search business directory listings  
**Used In**: Business enrichment, comprehensive scoring  
**Stores In**: `business_profiles` (enrichment data)

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_name: string,  // e.g., "St. Louis, MO"
  language_code: "en",
  limit: number  // Default: 100
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "title": "Business Name",
        "category": "Dental Clinic",
        "address": "123 Main St",
        "phone": "+1-555-0123",
        "website": "https://example.com",
        "rating": { "value": 4.5, "votes_count": 150 },
        "place_id": "ChIJ...",
        "cid": "1234567890"
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`** (enrichment/update)
- Used to enrich existing profiles or create new ones
- Fields updated:
  - `name` ← `item.title`
  - `category` ← `item.category`
  - `address` ← `item.address`
  - `phone` ← `item.phone`
  - `websiteUrl` ← `item.website`
  - `rating` ← `item.rating.value`
  - `reviewsCount` ← `item.rating.votes_count`
  - `placeId` ← `item.place_id`
  - `cid` ← `item.cid`

---

### **4. Google My Business Info API**

**Endpoint**: `POST /v3/business_data/google/my_business_info/live`  
**Purpose**: Get detailed Google My Business information  
**Used In**: Business profile enrichment, comprehensive scoring  
**Stores In**: `business_profiles`

#### **Request Parameters**
```typescript
{
  keyword: string,        // Business name
  location_name: string,
  language_code: "en",
  place_id?: string,      // Optional
  cid?: string            // Optional
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "title": "Business Name",
      "category": "Dental Clinic",
      "address_info": {
        "address": "123 Main St",
        "city": "St. Louis",
        "region": "MO",
        "postal_code": "63101"
      },
      "phone": "+1-555-0123",
      "website": "https://example.com",
      "rating": { "value": 4.5, "votes_count": 150 },
      "business_hours": {
        "monday": "9am-5pm",
        "tuesday": "9am-5pm"
      },
      "social_media": {
        "facebook": "https://facebook.com/...",
        "twitter": "https://twitter.com/..."
      },
      "services": ["Service 1", "Service 2"],
      "languages": ["English", "Spanish"]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`**
- Fields populated:
  ```typescript
  {
    name: result.title,
    category: result.category,
    address: result.address_info?.address,
    city: result.address_info?.city,
    state: result.address_info?.region,
    zipCode: result.address_info?.postal_code,
    phone: result.phone,
    websiteUrl: result.website,
    rating: result.rating?.value,
    reviewsCount: result.rating?.votes_count,
    businessHours: result.business_hours,  // JSON
    socialMedia: result.social_media,  // JSON
    services: result.services,  // JSON array
    languages: result.languages  // JSON array
  }
  ```

---

### **5. Google Reviews API**

**Endpoint**: `POST /v3/business_data/google/reviews/task_post`  
**Purpose**: Get business reviews and ratings  
**Used In**: Business enrichment, comprehensive scoring  
**Stores In**: `business_profiles` (rating/reviews fields)

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_name: string,
  language_code: "en",
  max_reviews_count: number  // Default: 1000
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "reviews": [{
        "rating": 5,
        "text": "Great service!",
        "author": "John Doe",
        "date": "2024-01-15"
      }],
      "rating": {
        "value": 4.5,
        "votes_count": 150
      }
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`**
- Fields updated:
  ```typescript
  {
    rating: result.rating?.value,  // Average rating
    reviewsCount: result.reviews?.length || result.rating?.votes_count
  }
  ```
- Note: Individual reviews are not stored in database (only aggregated metrics)

---

### **6. Ranked Keywords API**

**Endpoint**: `POST /v3/dataforseo_labs/google/ranked_keywords/live`  
**Purpose**: Get keywords a domain ranks for  
**Used In**: SEO analysis, keyword tracking  
**Stores In**: `keyword_rankings`, `business_profiles` (seoScore)

#### **Request Parameters**
```typescript
{
  target: string,         // Domain (e.g., "example.com")
  language_name: "English",
  location_name: string,
  limit: number  // Default: 1000
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "keyword": "dental clinic st louis",
        "rank_group": 1,
        "rank_absolute": 5,
        "url": "https://example.com/page",
        "title": "Page Title",
        "search_volume": 1200,
        "competition": "high",
        "cpc": 2.50,
        "difficulty": 65
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `keyword_rankings`**
- One record per keyword ranking
- Fields populated:
  ```typescript
  {
    businessProfileId: profile.id,
    keyword: item.keyword,
    rankAbsolute: item.rank_absolute,
    rankGroup: item.rank_group,
    url: item.url,
    title: item.title,
    searchVolume: item.search_volume,
    competition: item.competition,
    cpc: item.cpc,
    difficulty: item.difficulty,
    trackedAt: new Date()
  }
  ```

**Table: `business_profiles`** (calculated fields)
- `seoScore` ← Calculated from keyword rankings, traffic, backlinks
- `monthlyTraffic` ← Estimated from keyword rankings

---

### **7. Bulk Traffic Estimation API**

**Endpoint**: `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live`  
**Purpose**: Estimate organic and paid traffic  
**Used In**: Comprehensive scoring, SEO analysis  
**Stores In**: `business_profiles` (monthlyTraffic)

#### **Request Parameters**
```typescript
{
  targets: string[],      // Array of domains
  location_name: string,
  language_name: "English"
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "target": "example.com",
        "metrics": {
          "organic": {
            "etv": 50000,  // Estimated traffic value
            "count": 1200   // Keyword count
          },
          "paid": {
            "etv": 10000,
            "count": 50
          }
        }
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`**
- Fields updated:
  ```typescript
  {
    monthlyTraffic: result.items[0].metrics.organic.etv
  }
  ```

---

### **8. On-Page Analysis API**

**Endpoint**: `POST /v3/on_page/task_post`  
**Purpose**: Analyze website technical SEO  
**Used In**: Comprehensive scoring, SEO analysis  
**Stores In**: `business_profiles` (pageSpeed, mobileScore, accessibilityScore)

#### **Request Parameters**
```typescript
{
  url: string,            // Full URL
  location_name: string,
  language_name: "English"
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "url": "https://example.com",
        "onpage_score": 85,
        "page_timing": {
          "largest_contentful_paint": 2000,
          "first_input_delay": 0.1,
          "cumulative_layout_shift": 0.05
        },
        "mobile_score": 90,
        "accessibility_score": 88
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`**
- Fields updated:
  ```typescript
  {
    pageSpeed: calculateSpeedScore(page_timing),  // Calculated from Core Web Vitals
    mobileScore: item.mobile_score,
    accessibilityScore: item.accessibility_score,
    seoScore: item.onpage_score  // Part of overall SEO score
  }
  ```

---

### **9. Backlinks API**

**Endpoint**: `POST /v3/backlinks/bulk_backlinks/live`  
**Purpose**: Get backlink profile  
**Used In**: Comprehensive scoring, SEO analysis  
**Stores In**: `business_profiles` (backlinks, domainAuthority)

#### **Request Parameters**
```typescript
{
  target: string,         // Domain
  limit: number  // Default: 100
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "url_from": "https://referrer.com",
        "url_to": "https://example.com",
        "domain_from": "referrer.com",
        "domain_rank": 45,
        "anchor": "Link text"
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`**
- Fields updated:
  ```typescript
  {
    backlinks: result.items.length,  // Total backlink count
    domainAuthority: calculateDomainAuthority(result.items)  // Calculated metric
  }
  ```

---

### **10. Ads Search API**

**Endpoint**: `POST /v3/serp/google/ads_search/live/advanced`  
**Purpose**: Find ads for a specific domain  
**Used In**: Comprehensive scoring, ad analysis  
**Stores In**: `business_profiles` (isPaid), `serp_results` (isPaid)

#### **Request Parameters**
```typescript
{
  target: string,         // Domain
  location_code: number,
  platform: "google_search",
  depth: number,          // Default: 40
  date_from: string,      // "2024-01-01"
  date_to: string         // "2024-12-31"
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "type": "ads_search",
        "title": "Ad Title",
        "domain": "example.com",
        "ad_aclk": "https://..."
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`**
- Fields updated:
  ```typescript
  {
    isPaid: result.items.length > 0  // Has active ads
  }
  ```

**Table: `serp_results`**
- Fields updated:
  ```typescript
  {
    isPaid: true  // If domain matches ads
  }
  ```

---

### **11. Ads Advertisers API**

**Endpoint**: `POST /v3/serp/google/ads_advertisers/live/advanced`  
**Purpose**: Get advertisers for a keyword  
**Used In**: Prospect Finder (ad enrichment)  
**Stores In**: `serp_results` (isPaid flag, ad enrichment)

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_code: number,
  language_code: "en"
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "type": "ads_advertiser",
        "advertiser_id": "12345",
        "domain": "example.com",
        "approx_ads_count": 25,
        "verified": true
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `serp_results`** (enrichment)
- Used to identify which businesses are running ads
- Fields enriched:
  ```typescript
  {
    isPaid: true,  // If domain matches advertiser
    // Additional enrichment data stored in rawData
  }
  ```

---

### **12. Google Organic Search API**

**Endpoint**: `POST /v3/serp/google/organic/live/regular`  
**Purpose**: Get organic search results  
**Used In**: Website Intelligence, Keyword Tracking  
**Stores In**: `serp_jobs`, `serp_results`, `keyword_rankings`

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_code: number,
  language_code: "en",
  device: string
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "type": "organic",
        "rank_group": 1,
        "rank_absolute": 1,
        "title": "Page Title",
        "url": "https://example.com/page",
        "domain": "example.com",
        "description": "Page description",
        "breadcrumb": "Home > Category > Page"
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `serp_jobs`**
- Created to track organic search
- `searchType` ← `"organic"`

**Table: `serp_results`**
- One record per organic result
- Fields populated:
  ```typescript
  {
    resultType: "organic",
    rankAbsolute: item.rank_absolute,
    title: item.title,
    url: item.url,
    domain: item.domain,
    description: item.description,
    breadcrumb: item.breadcrumb
  }
  ```

**Table: `keyword_rankings`**
- Created from organic results for tracked keywords
- Links to `business_profiles` via domain matching

---

### **13. Domain Rank Overview API**

**Endpoint**: `POST /v3/dataforseo_labs/google/domain_rank_overview/live`  
**Purpose**: Get domain authority and ranking overview  
**Used In**: Domain analysis  
**Stores In**: `business_profiles` (domainAuthority)

#### **Request Parameters**
```typescript
{
  target: string,         // Domain
  location_name: string,
  language_name: "English"
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "target": "example.com",
        "rank": 45,
        "backlinks": 1200,
        "referring_domains": 500
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`**
- Fields updated:
  ```typescript
  {
    domainAuthority: result.items[0].rank,
    backlinks: result.items[0].backlinks
  }
  ```

---

### **14. Business Q&A API**

**Endpoint**: `POST /v3/business_data/google/business_questions_answers/search/live`  
**Purpose**: Get business Q&A from Google  
**Used In**: Business enrichment  
**Stores In**: Not stored in database (returned in API response only)

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_name: string,
  language_code: "en",
  place_id?: string
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "question": "What are your hours?",
        "answer": "We're open 9am-5pm",
        "author": "Business Owner"
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**
- **Not stored in database** - returned directly to frontend
- Used for sales intelligence and recommendations

---

### **15. Business Updates API**

**Endpoint**: `POST /v3/business_data/google/my_business_updates/live`  
**Purpose**: Get business posts/updates from Google My Business  
**Used In**: Business enrichment  
**Stores In**: Not stored in database (returned in API response only)

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_name: string,
  language_code: "en",
  place_id?: string
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "update_type": "post",
        "text": "New service available!",
        "created_time": "2024-01-15"
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**
- **Not stored in database** - returned directly to frontend
- Used for activity tracking and engagement analysis

---

### **16. Categories Aggregation API**

**Endpoint**: `POST /v3/business_data/business_listings/categories_aggregation/live`  
**Purpose**: Get category distribution for a search  
**Used In**: Business analysis  
**Stores In**: Not stored in database (returned in API response only)

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_name: string,
  language_code: "en"
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "category": "Dental Clinic",
        "count": 45
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**
- **Not stored in database** - returned directly to frontend
- Used for market analysis and insights

---

### **17. On-Page Instant Pages API**

**Endpoint**: `POST /v3/on_page/instant_pages`  
**Purpose**: Get Core Web Vitals instantly  
**Used In**: Performance analysis  
**Stores In**: `business_profiles` (pageSpeed - calculated)

#### **Request Parameters**
```typescript
{
  url: string,
  enable_javascript: true,
  enable_browser_rendering: true,
  browser_preset: "mobile" | "desktop"
}
```

#### **API Response Structure**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "url": "https://example.com",
        "onpage_score": 85,
        "page_timing": {
          "largest_contentful_paint": 2000,
          "first_input_delay": 0.1,
          "cumulative_layout_shift": 0.05,
          "time_to_interactive": 2500
        }
      }]
    }]
  }]
}
```

#### **Database Storage Mapping**

**Table: `business_profiles`**
- Fields updated:
  ```typescript
  {
    pageSpeed: calculateSpeedScore(page_timing)  // Calculated from Core Web Vitals
  }
  ```

---

### **18. Google AI Mode API**

**Endpoint**: `POST /v3/serp/google/ai_mode/live/advanced`  
**Purpose**: Get AI-enhanced search results  
**Used In**: Advanced search (future use)  
**Stores In**: `serp_jobs`, `serp_results`

#### **Request Parameters**
```typescript
{
  keyword: string,
  location_code: number,
  language_code: "en",
  device: string
}
```

#### **API Response Structure**
Similar to Organic API but with AI enhancements

#### **Database Storage Mapping**
Same as Organic API above

---

## 📊 Complete API-to-Table Mapping Summary

| API Endpoint | Primary Table | Secondary Tables | Data Stored |
|--------------|---------------|------------------|-------------|
| Maps Search | `serp_results` | `serp_jobs`, `business_profiles` | Business listings, locations, ratings |
| Local Pack | `serp_results` | `serp_jobs`, `business_profiles` | Local business results |
| Business Listings | `business_profiles` | - | Business directory data |
| GMB Info | `business_profiles` | - | Detailed business info, hours, social |
| Reviews | `business_profiles` | - | Rating, review count |
| Ranked Keywords | `keyword_rankings` | `business_profiles` | SEO keyword rankings |
| Traffic Estimation | `business_profiles` | - | Monthly traffic estimates |
| On-Page Analysis | `business_profiles` | - | Technical SEO scores |
| Backlinks | `business_profiles` | - | Backlink count, domain authority |
| Ads Search | `business_profiles`, `serp_results` | - | Ad presence flags |
| Ads Advertisers | `serp_results` | - | Advertiser identification |
| Organic Search | `serp_results` | `serp_jobs`, `keyword_rankings` | Organic rankings |
| Domain Rank | `business_profiles` | - | Domain authority |
| Q&A | - | - | Not stored (API response only) |
| Business Updates | - | - | Not stored (API response only) |
| Categories | - | - | Not stored (API response only) |
| Instant Pages | `business_profiles` | - | Core Web Vitals |
| AI Mode | `serp_results` | `serp_jobs` | AI-enhanced results |

---

## 🔄 Data Flow Diagram

```
User Request
    ↓
DataForSEO API Call
    ↓
API Response (JSON)
    ↓
Data Transformation
    ↓
Database Storage
    ├── serp_jobs (track request)
    ├── serp_results (store results)
    ├── business_profiles (enrich data)
    ├── keyword_rankings (track keywords)
    └── competitor_analysis (compare data)
```

---

## 💾 Data Transformation Examples

### **Example 1: Maps API → Database**

**API Response:**
```json
{
  "type": "maps_search",
  "title": "ABC Dental",
  "address": "123 Main St",
  "address_info": {
    "city": "St. Louis",
    "region": "MO",
    "postal_code": "63101"
  },
  "rating": { "value": 4.5, "votes_count": 150 },
  "place_id": "ChIJ...",
  "cid": "123456"
}
```

**Database Record (serp_results):**
```sql
INSERT INTO serp_results (
  title, address, city, state, zip_code,
  rating, reviews_count, place_id, cid, raw_data
) VALUES (
  'ABC Dental', '123 Main St', 'St. Louis', 'MO', '63101',
  4.5, 150, 'ChIJ...', '123456', '{"complete": "api response"}'
);
```

### **Example 2: Multiple APIs → Business Profile**

**Step 1: Maps API** → Creates `serp_result`  
**Step 2: GMB Info API** → Enriches `business_profile`  
**Step 3: Reviews API** → Updates `business_profile.rating`  
**Step 4: Ranked Keywords API** → Creates `keyword_rankings`  
**Step 5: Traffic API** → Updates `business_profile.monthlyTraffic`  
**Step 6: Backlinks API** → Updates `business_profile.backlinks`  
**Step 7: On-Page API** → Updates `business_profile.pageSpeed`  
**Step 8: Ads API** → Updates `business_profile.isPaid`

**Final `business_profile` record contains aggregated data from 8+ APIs**

---

**Last Updated**: Based on current Prisma schema and DataForSEO API integration  
**Version**: 1.1.0  
**Status**: Production Ready ✅

