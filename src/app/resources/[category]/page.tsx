import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildVisibilityFilter } from "@/lib/visibility";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { InlineContentEditor } from "@/components/content/InlineContentEditor";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResourcesSection } from "@/components/shared/ResourcesSection";

// Map URL slugs to category labels and database categories (Admin resources for tutors)
const categoryMap: Record<string, { label: string; dbCategory: string; description: string }> = {
  "admin-team": {
    label: "Admin Team",
    dbCategory: "ADMIN_TEAM",
    description: "Contact information and resources for the admin team"
  },
  "clubs": {
    label: "Clubs",
    dbCategory: "CLUB_LOCATIONS",
    description: "Information about club locations and schedules"
  },
  "forms": {
    label: "Forms",
    dbCategory: "FORMS",
    description: "Required forms and documentation"
  },
  "chesspectations": {
    label: "Chesspectations",
    dbCategory: "CHESSPECTATIONS",
    description: "Standards and expectations for tutors"
  },
  "admin-video-tutorials": {
    label: "Admin Video Tutorials",
    dbCategory: "ADMIN_VIDEO_TUTORIALS",
    description: "Video guides for administrative tasks"
  },
  "deib-policies": {
    label: "DEIB Policies",
    dbCategory: "DEIB_POLICIES",
    description: "Diversity, Equity, Inclusion, and Belonging policies"
  },
  "lesson-reports": {
    label: "Lesson Reports",
    dbCategory: "LESSON_REPORTS",
    description: "Lesson report templates and guidelines"
  },
  "referral-guidelines": {
    label: "Referral Guidelines",
    dbCategory: "REFERRAL_GUIDELINES",
    description: "Guidelines for tutor referral program"
  },
};

interface Props {
  params: Promise<{ category: string }>;
}

export default async function AdminResourcePage({ params }: Props) {
  const { category } = await params;
  const categoryInfo = categoryMap[category];

  if (!categoryInfo) {
    notFound();
  }

  // Get user session for visibility filtering
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userOrgId = session.user.organizationId;
  const isAdmin = hasMinRole(userRole, "ADMIN");

  // Build visibility filter
  const visibilityFilter = buildVisibilityFilter(userRole, userOrgId);

  // Fetch resources from database with visibility filtering
  const resources = await prisma.resource.findMany({
    where: {
      category: categoryInfo.dbCategory as any,
      isActive: true,
      ...(isAdmin ? {} : visibilityFilter),
    } as Prisma.ResourceWhereInput,
    orderBy: [
      { order: "asc" },
      { title: "asc" },
    ],
  });

  // Main resource is the one with order 0 (the page content)
  const mainResource = resources.find(r => r.order === 0);
  // Sub-resources are any with order > 0 (individual videos, PDFs, etc.)
  const subResources = resources.filter(r => r.order > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-400">Admin</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-medium">{categoryInfo.label}</span>
        </nav>

        {/* Page Header */}
        <PageHeader
          icon={ShieldCheckIcon}
          title={categoryInfo.label}
          description={categoryInfo.description}
          gradient="from-neutral-600 to-neutral-800"
        />

        {/* Main Content */}
        {!mainResource ? (
          <EmptyState
            icon={ShieldCheckIcon}
            title="Coming Soon"
            description={`Resources for ${categoryInfo.label} will be added soon. Check back later!`}
            gradient="from-neutral-500 to-neutral-700"
          />
        ) : (
          <>
            {/* Rich Content - Inline Editable for Admins */}
            <Card className="mb-8 border-neutral-200 shadow-sm hover:shadow-sm transition-shadow">
              <CardContent className="py-6 sm:py-8">
                <InlineContentEditor
                  resourceId={mainResource.id}
                  publishedContent={mainResource.content}
                  draftContent={mainResource.draftContent}
                  hasDraft={mainResource.hasDraft}
                />
              </CardContent>
            </Card>

            {/* Sub-Resources Section with Search */}
            <ResourcesSection
              resources={subResources}
              gradient="from-neutral-600 to-neutral-800"
            />
          </>
        )}
      </main>
    </div>
  );
}
