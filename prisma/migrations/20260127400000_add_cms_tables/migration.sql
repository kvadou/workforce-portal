-- CMS Tables Migration
-- Creates Page, PageContent, PageVersion tables for the CMS system

-- Create enums (Visibility already exists)
CREATE TYPE "PageCategory" AS ENUM ('TEACHING', 'BUSINESS', 'ADMIN', 'ONBOARDING', 'CUSTOM');
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- Create PageContent table first (Page references it)
CREATE TABLE "PageContent" (
    "id" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "draftBlocks" JSONB,
    "hasDraft" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageContent_pkey" PRIMARY KEY ("id")
);

-- Create Page table
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "featuredImage" TEXT,
    "pageCategory" "PageCategory" NOT NULL DEFAULT 'CUSTOM',
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'ALL_TUTORS',
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contentId" TEXT,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- Create PageVersion table
CREATE TABLE "PageVersion" (
    "id" TEXT NOT NULL,
    "pageContentId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "PageVersion_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
ALTER TABLE "PageContent" ADD CONSTRAINT "PageContent_pageType_pageId_key" UNIQUE ("pageType", "pageId");
ALTER TABLE "Page" ADD CONSTRAINT "Page_slug_key" UNIQUE ("slug");
ALTER TABLE "Page" ADD CONSTRAINT "Page_contentId_key" UNIQUE ("contentId");

-- Create indexes
CREATE INDEX "PageContent_pageType_idx" ON "PageContent"("pageType");
CREATE INDEX "PageContent_pageId_idx" ON "PageContent"("pageId");

CREATE INDEX "Page_slug_idx" ON "Page"("slug");
CREATE INDEX "Page_organizationId_idx" ON "Page"("organizationId");
CREATE INDEX "Page_pageCategory_idx" ON "Page"("pageCategory");

CREATE INDEX "PageVersion_pageContentId_idx" ON "PageVersion"("pageContentId");
CREATE INDEX "PageVersion_createdAt_idx" ON "PageVersion"("createdAt");

-- Add foreign keys
ALTER TABLE "Page" ADD CONSTRAINT "Page_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Page" ADD CONSTRAINT "Page_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "PageContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_pageContentId_fkey" FOREIGN KEY ("pageContentId") REFERENCES "PageContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
