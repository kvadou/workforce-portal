"use client";

import { useEffect } from "react";
import { CMSWrapper } from "@/components/cms/CMSWrapper";
import { CMSPageRenderer } from "@/components/cms/CMSPageRenderer";
import { PAGE_CATEGORY_LABELS, PageCategory } from "@/lib/validations/page";
import { useCMS } from "@/providers/CMSProvider";

interface PublicPageContentProps {
  page: {
    id: string;
    title: string;
    description: string | null;
    pageCategory: string;
    content: {
      blocks: unknown[];
    } | null;
  };
}

export function PublicPageContent({ page }: PublicPageContentProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Category Badge */}
          {page.pageCategory !== "CUSTOM" && (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                page.pageCategory === "TEACHING"
                  ? "bg-info-light text-info-dark"
                  : page.pageCategory === "BUSINESS"
                  ? "bg-success-light text-success-dark"
                  : page.pageCategory === "ADMIN"
                  ? "bg-primary-100 text-primary-700"
                  : page.pageCategory === "ONBOARDING"
                  ? "bg-warning-light text-warning-dark"
                  : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {PAGE_CATEGORY_LABELS[page.pageCategory as PageCategory]}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-neutral-900">
            {page.title}
          </h1>

          {/* Description */}
          {page.description && (
            <p className="mt-3 text-lg text-neutral-600">
              {page.description}
            </p>
          )}
        </div>
      </div>

      {/* Page Content */}
      <CMSWrapper pageType="page" pageId={page.id}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <CMSPageRenderer
            pageType="page"
            pageId={page.id}
            className=""
          />
        </div>
      </CMSWrapper>
    </div>
  );
}
