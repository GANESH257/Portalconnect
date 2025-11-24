# Documentation Index

## 🎯 **Start Here**

**New to the project?** → Read **[COMPLETE_SYSTEM_DOCUMENTATION_MASTER.md](./COMPLETE_SYSTEM_DOCUMENTATION_MASTER.md)** first!

This master guide covers:
- Complete system overview
- Hybrid model architecture
- Competitor data system
- All API endpoints
- Database schema
- Services & components
- Data flow
- Deployment guides
- Development setup
- Troubleshooting

---

# Documentation Index - Data Collection System

## 📚 Complete Documentation Suite

This directory contains comprehensive documentation for the data collection system, including database schema, API usage, data flow, and field mappings.

---

## 📄 Documentation Files

### **1. DATA_COLLECTION_COMPLETE_DOCUMENTATION.md**
**Purpose**: Complete guide to the data collection script (`collect-spine-data.ts`)

**Contents**:
- Overview of 3-phase collection process
- Detailed step-by-step documentation for each phase
- API endpoints and parameters
- Data extraction and storage logic
- Error handling and configuration
- Statistics tracking

**Use When**: Understanding how data is collected, debugging collection issues, or modifying the collection script

---

### **2. DATA_COLLECTION_FLOW_MAPPING.csv**
**Purpose**: CSV mapping of data collection flow

**Contents**:
- Phase, Step, Data Item
- API Endpoint and Service Method
- Parameters and Response Path
- Storage Location
- Required/Optional flags
- Notes

**Use When**: Quick reference for data flow, understanding which API provides which data, or creating data flow diagrams

**Format**: CSV with columns:
- Phase, Step, Data Item, API Endpoint, Service Method, Parameters, Response Path, Storage Location, Required, Notes

---

### **3. API_COMPLETE_DOCUMENTATION.md**
**Purpose**: Complete documentation for all APIs used in data collection

**Contents**:
- DataForSEO APIs (12 endpoints)
- Google APIs (3 endpoints)
- HTML Analysis methods
- Request/Response structures
- Authentication methods
- Error handling
- Cost and rate limiting information

**Use When**: Integrating new APIs, understanding API responses, debugging API calls, or estimating costs

---

### **4. DATABASE_FIELD_SOURCE_MAPPING_ENRICHED.csv**
**Purpose**: Complete mapping of database fields to their data sources

**Contents**:
- Table Name, Field Name
- Data Source (API or calculation)
- API Endpoint
- API Response Path
- Transformation logic
- Required/Optional
- Storage Location

**Use When**: Understanding where each database field comes from, debugging data issues, or adding new fields

**Format**: CSV with columns:
- Table Name, Field Name, Data Source, API Endpoint, API Response Path, Transformation, Required, Storage Location

---

### **5. DATABASE_COMPLETE_DOCUMENTATION.md** (Existing)
**Purpose**: Complete database schema documentation

**Contents**:
- All tables and fields
- Relationships and indexes
- Usage examples
- Data types and constraints

**Use When**: Understanding database structure, writing queries, or modifying schema

---

### **6. DATABASE_FIELD_SOURCE_MAPPING.csv** (Existing)
**Purpose**: Original database field mapping (without enriched data)

**Contents**: Basic field mappings for core tables

**Use When**: Reference for original schema (before enriched data was added)

---

## 🔄 Data Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1: DISCOVERY                       │
├─────────────────────────────────────────────────────────────┤
│  Maps API → Local Pack API → Business Listings API         │
│  → Deduplication → Unique Businesses List                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PHASE 2: ENRICHMENT                        │
│              (For Each Business)                            │
├─────────────────────────────────────────────────────────────┤
│  1. GMB Info API                                            │
│  2. Reviews API (async)                                     │
│  3. Ranked Keywords API                                     │
│  4. Traffic Estimation API                                  │
│  5. Ads Creatives API                                       │
│  6. On-Page Analysis API (async)                            │
│  7. Google Places API                                       │
│  8. Safe Browsing API                                       │
│  9. PageSpeed Insights API                                 │
│  10. HTML Fetch → Analytics/Schema Detection               │
│  11. Schema Validation                                      │
│  12. Backlinks API                                         │
│  13. Domain Rank API                                        │
│  14. Ads Advertisers API (after all businesses)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 3: STORAGE                         │
├─────────────────────────────────────────────────────────────┤
│  1. Create SERP Job                                         │
│  2. Create SerpResult (with rawData.enriched)               │
│  3. Create BusinessProfile (with calculated scores)        │
│  4. Create KeywordRankings (up to 100 per business)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Key Data Structures

### **Enriched Data Object** (`rawData.enriched`)
Stored in `serp_results.rawData.enriched`:

```json
{
  "gmbInfo": {...},
  "reviews": {...},
  "rankedKeywords": [...],
  "traffic": {...},
  "onPageResults": {...},
  "backlinks": {...},
  "domainRank": {...},
  "analytics": {
    "googleAnalytics": {"found": true/false, "type": "GA4"/"UA", "id": "..."},
    "facebookPixel": {"found": true/false, "id": "..."}
  },
  "schemas": {
    "localBusiness": true/false,
    "faq": true/false,
    "organization": true/false,
    "breadcrumbs": true/false,
    "product": true/false,
    "review": true/false
  },
  "htmlContent": "...",
  "ads": {...},
  "adsCreatives": [...],
  "adsCreativesCount": 19,
  "pageSpeedInsights": {...},
  "googlePlaces": {...},
  "safeBrowsing": {...},
  "schemaValidation": {...}
}
```

---

## 🔍 Quick Reference

### **Find Data Source**
1. Check `DATABASE_FIELD_SOURCE_MAPPING_ENRICHED.csv` for field mapping
2. Check `API_COMPLETE_DOCUMENTATION.md` for API details
3. Check `DATA_COLLECTION_FLOW_MAPPING.csv` for collection flow

### **Understand Collection Process**
1. Read `DATA_COLLECTION_COMPLETE_DOCUMENTATION.md` for full process
2. Check `DATA_COLLECTION_FLOW_MAPPING.csv` for step-by-step flow

### **Debug Data Issues**
1. Check `DATABASE_FIELD_SOURCE_MAPPING_ENRICHED.csv` to find source
2. Check `API_COMPLETE_DOCUMENTATION.md` for API response structure
3. Check `DATA_COLLECTION_COMPLETE_DOCUMENTATION.md` for error handling

### **Add New Data Collection**
1. Review `API_COMPLETE_DOCUMENTATION.md` for available APIs
2. Update `DATA_COLLECTION_COMPLETE_DOCUMENTATION.md` with new step
3. Update `DATA_COLLECTION_FLOW_MAPPING.csv` with new mapping
4. Update `DATABASE_FIELD_SOURCE_MAPPING_ENRICHED.csv` with new fields

---

## 📝 File Locations

- **Collection Script**: `scripts/collect-spine-data.ts`
- **DataForSEO Service**: `server/services/dataforseoService.ts`
- **Database Schema**: `prisma/schema.prisma`
- **Documentation**: Root directory (`.md` and `.csv` files)

---

## 🎯 Use Cases

### **For Developers**
- Use `DATA_COLLECTION_COMPLETE_DOCUMENTATION.md` to understand the collection process
- Use `API_COMPLETE_DOCUMENTATION.md` to integrate new APIs
- Use `DATABASE_FIELD_SOURCE_MAPPING_ENRICHED.csv` to understand data flow

### **For Data Analysts**
- Use `DATABASE_FIELD_SOURCE_MAPPING_ENRICHED.csv` to understand data sources
- Use `DATABASE_COMPLETE_DOCUMENTATION.md` to understand schema
- Use `DATA_COLLECTION_FLOW_MAPPING.csv` for data lineage

### **For QA/Testing**
- Use `DATA_COLLECTION_COMPLETE_DOCUMENTATION.md` to understand expected behavior
- Use `API_COMPLETE_DOCUMENTATION.md` to understand API responses
- Use `DATABASE_FIELD_SOURCE_MAPPING_ENRICHED.csv` to verify data correctness

---

## 🔄 Maintenance

**When to Update Documentation**:
- Adding new API endpoints
- Modifying data collection flow
- Adding new database fields
- Changing data transformations
- Adding new data sources

**Update Order**:
1. Update collection script
2. Update `DATA_COLLECTION_COMPLETE_DOCUMENTATION.md`
3. Update `DATA_COLLECTION_FLOW_MAPPING.csv`
4. Update `API_COMPLETE_DOCUMENTATION.md` (if new API)
5. Update `DATABASE_FIELD_SOURCE_MAPPING_ENRICHED.csv`
6. Update `DATABASE_COMPLETE_DOCUMENTATION.md` (if schema changed)

---

## 📞 Support

For questions or issues:
1. Check relevant documentation file
2. Review code comments in collection script
3. Check API documentation in service files
4. Review database schema in Prisma schema file

