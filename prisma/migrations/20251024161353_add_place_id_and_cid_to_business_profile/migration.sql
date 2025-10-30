-- DropIndex
DROP INDEX "public"."business_profiles_domain_key";

-- AlterTable
ALTER TABLE "business_profiles" ADD COLUMN     "cid" TEXT,
ADD COLUMN     "place_id" TEXT;

-- CreateTable
CREATE TABLE "prospect_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "serp_job_id" TEXT,
    "serp_result_id" TEXT,
    "business_profile_id" TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "category" TEXT,
    "location" TEXT,
    "score" INTEGER,
    "rating" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "tags" TEXT[],
    "notes" TEXT,
    "progress" TEXT,
    "pitchingPoints" TEXT[],
    "ai_recommendations" TEXT,
    "email_template" TEXT,
    "contact_info" JSONB,
    "metrics" JSONB,
    "last_contacted" TIMESTAMP(3),
    "next_follow_up" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prospect_items_user_id_idx" ON "prospect_items"("user_id");

-- CreateIndex
CREATE INDEX "prospect_items_business_profile_id_idx" ON "prospect_items"("business_profile_id");

-- CreateIndex
CREATE INDEX "prospect_items_status_idx" ON "prospect_items"("status");

-- CreateIndex
CREATE INDEX "prospect_items_priority_idx" ON "prospect_items"("priority");

-- AddForeignKey
ALTER TABLE "prospect_items" ADD CONSTRAINT "prospect_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_items" ADD CONSTRAINT "prospect_items_serp_job_id_fkey" FOREIGN KEY ("serp_job_id") REFERENCES "serp_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_items" ADD CONSTRAINT "prospect_items_serp_result_id_fkey" FOREIGN KEY ("serp_result_id") REFERENCES "serp_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_items" ADD CONSTRAINT "prospect_items_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
