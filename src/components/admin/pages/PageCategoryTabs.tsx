"use client";

import { PageCategory, PAGE_CATEGORY_LABELS } from "@/lib/validations/page";
import {
  BookOpenIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface PageCategoryTabsProps {
  activeCategory: PageCategory | "all";
  onCategoryChange: (category: PageCategory | "all") => void;
  counts?: Record<PageCategory | "all", number>;
}

const categoryIcons: Record<PageCategory | "all", typeof DocumentTextIcon> = {
  all: DocumentTextIcon,
  TEACHING: BookOpenIcon,
  BUSINESS: BriefcaseIcon,
  ADMIN: ShieldCheckIcon,
  ONBOARDING: AcademicCapIcon,
  CUSTOM: DocumentTextIcon,
};

const categoryColors: Record<PageCategory | "all", string> = {
  all: "text-neutral-600 border-neutral-400 bg-neutral-50",
  TEACHING: "text-info border-info bg-info-light",
  BUSINESS: "text-success border-success bg-success-light",
  ADMIN: "text-primary-600 border-primary-400 bg-primary-50",
  ONBOARDING: "text-warning border-warning bg-warning-light",
  CUSTOM: "text-neutral-600 border-neutral-400 bg-neutral-50",
};

const allCategories: (PageCategory | "all")[] = [
  "all",
  "TEACHING",
  "BUSINESS",
  "ADMIN",
  "ONBOARDING",
  "CUSTOM",
];

export function PageCategoryTabs({
  activeCategory,
  onCategoryChange,
  counts = {} as Record<PageCategory | "all", number>,
}: PageCategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {allCategories.map((category) => {
        const Icon = categoryIcons[category];
        const isActive = activeCategory === category;
        const count = counts[category] ?? 0;

        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              isActive
                ? `${categoryColors[category]} border-current font-medium`
                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>
              {category === "all" ? "All Pages" : PAGE_CATEGORY_LABELS[category]}
            </span>
            {count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-white/50" : "bg-neutral-100"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PageCategoryTabs;
