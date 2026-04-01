import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildVisibilityFilter } from "@/lib/visibility";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  LinkIcon,
  PhotoIcon,
  PlayIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { ResourceType, Prisma } from "@prisma/client";
import { AdminEditLink } from "@/components/admin/AdminEditButton";
import { TeachingPageContent } from "./TeachingPageContent";

// Map URL slugs to category labels and database categories
const categoryMap: Record<string, { label: string; dbCategory: string; description: string }> = {
  "video-library": {
    label: "PlayIcon Library",
    dbCategory: "VIDEO_LIBRARY",
    description: "Tutorial videos and demonstrations for teaching chess lessons"
  },
  "mini-games": {
    label: "Mini Games",
    dbCategory: "MINI_GAMES",
    description: "Fun interactive games to engage students during lessons"
  },
  "story-illustrations": {
    label: "Story Illustrations",
    dbCategory: "STORY_ILLUSTRATIONS",
    description: "Visual aids and illustrations for storytelling"
  },
  "printable-activities": {
    label: "Printable Activities",
    dbCategory: "PRINTABLE_ACTIVITIES",
    description: "Worksheets and activities to print for students"
  },
  "songs": {
    label: "Songs & Music",
    dbCategory: "SONGS",
    description: "Musical resources and songs for lessons"
  },
  "chess-resources": {
    label: "Chess Resources",
    dbCategory: "CHESS_RESOURCES",
    description: "Chess-specific teaching materials"
  },
  "adventures-resources": {
    label: "Adventures Resources",
    dbCategory: "BQ_RESOURCES",
    description: "Resources for Acme Training curriculum"
  },
  "online-teaching": {
    label: "Online Teaching",
    dbCategory: "ONLINE_TEACHING",
    description: "Tools and resources for virtual lessons"
  },
  "behavior-management": {
    label: "Behavior Management",
    dbCategory: "BEHAVIOR_MANAGEMENT",
    description: "Strategies and resources for classroom management"
  },
};

const typeIcons: Record<ResourceType, React.ReactNode> = {
  VIDEO: <PlayIcon className="w-5 h-5" />,
  PDF: <DocumentTextIcon className="w-5 h-5" />,
  IMAGE: <PhotoIcon className="w-5 h-5" />,
  LINK: <LinkIcon className="w-5 h-5" />,
  RICH_TEXT: <DocumentTextIcon className="w-5 h-5" />,
  TEMPLATE: <DocumentTextIcon className="w-5 h-5" />,
  CANVA_DESIGN: <PhotoIcon className="w-5 h-5" />,
};

const typeColors: Record<ResourceType, string> = {
  VIDEO: "bg-error-light text-error",
  PDF: "bg-info-light text-info",
  IMAGE: "bg-success-light text-success",
  LINK: "bg-primary-100 text-primary-600",
  RICH_TEXT: "bg-warning-light text-warning",
  TEMPLATE: "bg-accent-cyan-light text-accent-cyan",
  CANVA_DESIGN: "bg-primary-100 text-primary-600",
};

interface Props {
  params: Promise<{ category: string }>;
}

export default async function TeachingResourcePage({ params }: Props) {
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
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
          <Link href="/" className="hover:text-primary-500 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span>Teaching</span>
          <span>/</span>
          <span className="text-neutral-900">{categoryInfo.label}</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {categoryInfo.label}
          </h1>
          <p className="text-neutral-600">
            {categoryInfo.description}
          </p>
        </div>

        {/* Main Content - CMS Editable */}
        <TeachingPageContent
          category={category}
          categoryInfo={categoryInfo}
          mainResource={mainResource}
          subResources={subResources}
          typeIcons={typeIcons}
          typeColors={typeColors}
        />
      </main>
    </div>
  );
}
