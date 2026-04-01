import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessVisibility } from "@/lib/visibility";
import { Visibility } from "@prisma/client";
import { PublicPageContent } from "./PublicPageContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch page by slug
async function getPage(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      organization: {
        select: { id: true, name: true, subdomain: true },
      },
      content: true,
    },
  });

  return page;
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.description || undefined,
    openGraph: {
      title: page.seoTitle || page.title,
      description: page.description || undefined,
      images: page.featuredImage ? [page.featuredImage] : undefined,
    },
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const page = await getPage(slug);

  // Page not found
  if (!page) {
    notFound();
  }

  // Page not published
  if (page.status !== "PUBLISHED") {
    // Admins can preview unpublished pages
    const isAdmin =
      session?.user?.role === "SUPER_ADMIN" ||
      session?.user?.role === "ADMIN";

    if (!isAdmin) {
      notFound();
    }
  }

  // Check visibility access
  if (!session?.user) {
    // Redirect unauthenticated users to login
    redirect(`/login?callbackUrl=/p/${slug}`);
  }

  const userRole = session.user.role as string;
  const userOrgId = session.user.organizationId;
  const pageVisibility = page.visibility as Visibility;

  // Check if user has access based on visibility
  if (!canAccessVisibility(userRole, pageVisibility)) {
    notFound(); // Or show "access denied" page
  }

  // Check organization access
  if (page.organizationId) {
    // Page is org-specific
    const isAdmin =
      session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";

    if (!isAdmin && page.organizationId !== userOrgId) {
      notFound();
    }
  }

  // Check if page has expired
  if (page.expiresAt && new Date(page.expiresAt) < new Date()) {
    notFound();
  }

  // Pass the content to the client component
  return (
    <PublicPageContent
      page={{
        id: page.id,
        title: page.title,
        description: page.description,
        pageCategory: page.pageCategory,
        content: page.content
          ? {
              blocks: page.content.blocks as unknown[],
            }
          : null,
      }}
    />
  );
}
