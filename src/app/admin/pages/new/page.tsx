"use client";

import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ListBulletIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreatePage } from "@/hooks/usePages";
import {
  PageCategory,
  PAGE_CATEGORY_LABELS,
  VISIBILITY_LABELS,
  Visibility,
  generateSlug,
} from "@/lib/validations/page";
import { toast } from "sonner";

// Template definitions
const templates = [
  {
    id: "blank",
    name: "Blank Page",
    description: "Start with an empty canvas",
    icon: DocumentTextIcon,
  },
  {
    id: "basic",
    name: "Basic Content",
    description: "Title, description, and content area",
    icon: Squares2X2Icon,
  },
  {
    id: "two-column",
    name: "Two Column",
    description: "Side-by-side content layout",
    icon: ViewColumnsIcon,
  },
  {
    id: "list-page",
    name: "ListBulletIcon Page",
    description: "Perfect for resource lists",
    icon: ListBulletIcon,
  },
];

type Step = "category" | "details";

export default function NewPagePage() {
  const router = useRouter();
  const createMutation = useCreatePage();

  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<PageCategory>("CUSTOM");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("ALL_TUTORS");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(generateSlug(value));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!slug.trim()) {
      toast.error("Please enter a URL slug");
      return;
    }

    try {
      const page = await createMutation.mutateAsync({
        title: title.trim(),
        slug: slug.trim(),
        pageCategory: selectedCategory,
        visibility,
      });

      toast.success("Page created successfully");
      router.push(`/admin/pages/${page.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create page";
      toast.error(message);
    }
  };

  const categoryOptions: { value: PageCategory; icon: typeof BookOpenIcon }[] = [
    { value: "TEACHING", icon: BookOpenIcon },
    { value: "BUSINESS", icon: BriefcaseIcon },
    { value: "ADMIN", icon: ShieldCheckIcon },
    { value: "ONBOARDING", icon: AcademicCapIcon },
    { value: "CUSTOM", icon: DocumentTextIcon },
  ];

  const visibilityOptions: Visibility[] = [
    "ALL_TUTORS",
    "LEAD_TUTORS",
    "FRANCHISEE_OWNERS",
    "ADMINS_ONLY",
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/pages"
          className="p-2 hover:bg-neutral-100 rounded-[var(--radius-md)] transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-neutral-500" />
        </Link>
        <div>
          <h1 className="text-heading-lg text-neutral-900">Create New Page</h1>
          <p className="text-body text-neutral-500">
            {step === "category"
              ? "Choose a category and template"
              : "Enter page details"}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            step === "category"
              ? "bg-primary-100 text-primary-700"
              : "bg-success-light text-success-dark"
          }`}
        >
          {step === "details" ? (
            <CheckCircleIcon className="h-4 w-4" />
          ) : (
            <span className="h-5 w-5 flex items-center justify-center text-xs font-bold rounded-lg bg-current/20">
              1
            </span>
          )}
          <span className="text-sm font-medium">Category</span>
        </div>
        <div className="w-8 h-px bg-neutral-200" />
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            step === "details"
              ? "bg-primary-100 text-primary-700"
              : "bg-neutral-100 text-neutral-400"
          }`}
        >
          <span className="h-5 w-5 flex items-center justify-center text-xs font-bold rounded-lg bg-current/20">
            2
          </span>
          <span className="text-sm font-medium">Details</span>
        </div>
      </div>

      {step === "category" && (
        <>
          {/* Category Selection */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-heading-sm text-neutral-900">Page Category</h2>
              <p className="text-body-sm text-neutral-500">
                Choose where this page will be organized
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {categoryOptions.map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedCategory(value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border-2 transition-all ${
                      selectedCategory === value
                        ? "border-primary-500 bg-primary-50"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        selectedCategory === value
                          ? "text-primary-600"
                          : "text-neutral-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedCategory === value
                          ? "text-primary-700"
                          : "text-neutral-600"
                      }`}
                    >
                      {PAGE_CATEGORY_LABELS[value]}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-heading-sm text-neutral-900">Start From</h2>
              <p className="text-body-sm text-neutral-500">
                Choose a template or start blank
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-[var(--radius-lg)] border-2 transition-all ${
                        selectedTemplate === template.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <div
                        className={`h-12 w-12 rounded-[var(--radius-md)] flex items-center justify-center ${
                          selectedTemplate === template.id
                            ? "bg-primary-100"
                            : "bg-neutral-100"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            selectedTemplate === template.id
                              ? "text-primary-600"
                              : "text-neutral-400"
                          }`}
                        />
                      </div>
                      <div className="text-center">
                        <p
                          className={`font-medium ${
                            selectedTemplate === template.id
                              ? "text-primary-700"
                              : "text-neutral-700"
                          }`}
                        >
                          {template.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/admin/pages">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button onClick={() => setStep("details")}>
              Continue
            </Button>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          {/* Page Details Form */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-heading-sm text-neutral-900">Page Details</h2>
              <p className="text-body-sm text-neutral-500">
                Enter the basic information for your page
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Page Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter page title..."
                  className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">/p/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="page-url-slug"
                    className="flex-1 px-4 py-3 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  This will be the URL path for your page
                </p>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Visibility)}
                  className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {visibilityOptions.map((v) => (
                    <option key={v} value={v}>
                      {VISIBILITY_LABELS[v]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  Who can view this page
                </p>
              </div>

              {/* Summary */}
              <div className="p-4 bg-neutral-50 rounded-[var(--radius-lg)]">
                <p className="text-sm text-neutral-600">
                  <strong>Category:</strong>{" "}
                  {PAGE_CATEGORY_LABELS[selectedCategory]}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  <strong>Template:</strong>{" "}
                  {templates.find((t) => t.id === selectedTemplate)?.name}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep("category")}>
              Back
            </Button>
            <div className="flex gap-3">
              <Link href="/admin/pages">
                <Button variant="secondary">Cancel</Button>
              </Link>
              <Button
                onClick={handleCreate}
                disabled={!title.trim() || !slug.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Page"
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
