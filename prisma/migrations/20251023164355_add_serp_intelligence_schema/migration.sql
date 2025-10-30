-- CreateTable
CREATE TABLE "serp_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "location" TEXT,
    "language" TEXT DEFAULT 'English',
    "device" TEXT DEFAULT 'desktop',
    "os" TEXT DEFAULT 'windows',
    "search_engine" TEXT NOT NULL DEFAULT 'google',
    "search_type" TEXT NOT NULL DEFAULT 'organic',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dataforseo_task_id" TEXT,
    "cost" DOUBLE PRECISION DEFAULT 0,
    "results_count" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "serp_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serp_results" (
    "id" TEXT NOT NULL,
    "serp_job_id" TEXT NOT NULL,
    "rank_group" INTEGER NOT NULL,
    "rank_absolute" INTEGER NOT NULL,
    "page" INTEGER NOT NULL DEFAULT 1,
    "position" TEXT,
    "result_type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "url" TEXT,
    "domain" TEXT,
    "website_name" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "country" TEXT,
    "rating" DOUBLE PRECISION,
    "reviews_count" INTEGER,
    "rating_max" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_image" BOOLEAN NOT NULL DEFAULT false,
    "is_video" BOOLEAN NOT NULL DEFAULT false,
    "is_malicious" BOOLEAN NOT NULL DEFAULT false,
    "breadcrumb" TEXT,
    "cache_url" TEXT,
    "related_search_url" TEXT,
    "extended_snippet" TEXT,
    "highlighted" TEXT[],
    "links" JSONB,
    "faq" JSONB,
    "images" JSONB,
    "price" TEXT,
    "timestamp" TIMESTAMP(3),
    "xpath" TEXT,
    "cid" TEXT,
    "rectangle" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serp_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "serp_result_id" TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "website_url" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "description" TEXT,
    "rating" DOUBLE PRECISION,
    "reviews_count" INTEGER,
    "rating_max" INTEGER,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "business_hours" JSONB,
    "social_media" JSONB,
    "services" TEXT[],
    "specialties" TEXT[],
    "insurance_accepted" TEXT[],
    "languages" TEXT[],
    "certifications" TEXT[],
    "awards" TEXT[],
    "seo_score" INTEGER,
    "domain_authority" INTEGER,
    "backlinks" INTEGER,
    "monthly_traffic" INTEGER,
    "page_speed" DOUBLE PRECISION,
    "mobile_score" INTEGER,
    "accessibility_score" INTEGER,
    "last_analyzed" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_rankings" (
    "id" TEXT NOT NULL,
    "business_profile_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "search_engine" TEXT NOT NULL DEFAULT 'google',
    "location" TEXT,
    "device" TEXT DEFAULT 'desktop',
    "rank_group" INTEGER NOT NULL,
    "rank_absolute" INTEGER NOT NULL,
    "page" INTEGER NOT NULL DEFAULT 1,
    "position" TEXT,
    "url" TEXT,
    "title" TEXT,
    "description" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "search_volume" INTEGER,
    "competition" TEXT,
    "cpc" DOUBLE PRECISION,
    "difficulty" INTEGER,
    "trend" TEXT,
    "previous_rank" INTEGER,
    "rank_change" INTEGER,
    "tracked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_analysis" (
    "id" TEXT NOT NULL,
    "business_profile_id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "score" INTEGER,
    "comparison" TEXT,
    "insights" TEXT,
    "recommendations" TEXT,
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "serp_job_id" TEXT,
    "serp_result_id" TEXT,
    "business_profile_id" TEXT,
    "item_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "category" TEXT,
    "location" TEXT,
    "score" INTEGER,
    "rating" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "tags" TEXT[],
    "notes" TEXT,
    "highlights" TEXT[],
    "contact_info" JSONB,
    "metrics" JSONB,
    "last_checked" TIMESTAMP(3),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "serp_jobs_user_id_keyword_idx" ON "serp_jobs"("user_id", "keyword");

-- CreateIndex
CREATE INDEX "serp_jobs_status_idx" ON "serp_jobs"("status");

-- CreateIndex
CREATE INDEX "serp_jobs_created_at_idx" ON "serp_jobs"("created_at");

-- CreateIndex
CREATE INDEX "serp_results_serp_job_id_idx" ON "serp_results"("serp_job_id");

-- CreateIndex
CREATE INDEX "serp_results_domain_idx" ON "serp_results"("domain");

-- CreateIndex
CREATE INDEX "serp_results_result_type_idx" ON "serp_results"("result_type");

-- CreateIndex
CREATE INDEX "serp_results_rank_absolute_idx" ON "serp_results"("rank_absolute");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_serp_result_id_key" ON "business_profiles"("serp_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_domain_key" ON "business_profiles"("domain");

-- CreateIndex
CREATE INDEX "business_profiles_domain_idx" ON "business_profiles"("domain");

-- CreateIndex
CREATE INDEX "business_profiles_category_idx" ON "business_profiles"("category");

-- CreateIndex
CREATE INDEX "business_profiles_city_state_idx" ON "business_profiles"("city", "state");

-- CreateIndex
CREATE INDEX "business_profiles_rating_idx" ON "business_profiles"("rating");

-- CreateIndex
CREATE INDEX "business_profiles_seo_score_idx" ON "business_profiles"("seo_score");

-- CreateIndex
CREATE INDEX "keyword_rankings_business_profile_id_idx" ON "keyword_rankings"("business_profile_id");

-- CreateIndex
CREATE INDEX "keyword_rankings_keyword_idx" ON "keyword_rankings"("keyword");

-- CreateIndex
CREATE INDEX "keyword_rankings_tracked_at_idx" ON "keyword_rankings"("tracked_at");

-- CreateIndex
CREATE INDEX "keyword_rankings_rank_absolute_idx" ON "keyword_rankings"("rank_absolute");

-- CreateIndex
CREATE INDEX "competitor_analysis_business_profile_id_idx" ON "competitor_analysis"("business_profile_id");

-- CreateIndex
CREATE INDEX "competitor_analysis_competitor_id_idx" ON "competitor_analysis"("competitor_id");

-- CreateIndex
CREATE INDEX "competitor_analysis_analysis_type_idx" ON "competitor_analysis"("analysis_type");

-- CreateIndex
CREATE INDEX "watchlist_items_user_id_idx" ON "watchlist_items"("user_id");

-- CreateIndex
CREATE INDEX "watchlist_items_item_type_idx" ON "watchlist_items"("item_type");

-- CreateIndex
CREATE INDEX "watchlist_items_status_idx" ON "watchlist_items"("status");

-- CreateIndex
CREATE INDEX "watchlist_items_priority_idx" ON "watchlist_items"("priority");

-- CreateIndex
CREATE INDEX "watchlist_items_added_at_idx" ON "watchlist_items"("added_at");

-- AddForeignKey
ALTER TABLE "serp_jobs" ADD CONSTRAINT "serp_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serp_results" ADD CONSTRAINT "serp_results_serp_job_id_fkey" FOREIGN KEY ("serp_job_id") REFERENCES "serp_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_serp_result_id_fkey" FOREIGN KEY ("serp_result_id") REFERENCES "serp_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_rankings" ADD CONSTRAINT "keyword_rankings_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_analysis" ADD CONSTRAINT "competitor_analysis_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_serp_job_id_fkey" FOREIGN KEY ("serp_job_id") REFERENCES "serp_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_serp_result_id_fkey" FOREIGN KEY ("serp_result_id") REFERENCES "serp_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
