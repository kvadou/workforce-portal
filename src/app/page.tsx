import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { HomePageContent } from "@/components/portal/HomePageContent";
import { UserRole, Prisma } from "@prisma/client";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Get user session for role-based filtering
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role as UserRole;
  const userOrgId = session.user.organizationId;
  const isAdmin = hasMinRole(userRole, "ADMIN");
  const now = new Date();

  // Build where clause with role and org filtering
  const whereClause: Prisma.AnnouncementWhereInput = {
    isActive: true,
    publishDate: { lte: now },
    AND: [
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    ],
  };

  // Non-admins only see announcements targeting their role
  if (!isAdmin) {
    whereClause.targetRoles = { has: userRole };
    // Also filter by organization (shared + user's org)
    whereClause.OR = [
      { organizationId: null },
      { organizationId: userOrgId },
    ];
  }

  // Fetch announcements from database with filtering
  const announcements = await prisma.announcement.findMany({
    where: whereClause,
    orderBy: [
      { isPinned: "desc" },
      { publishDate: "desc" },
    ],
  });

  // Get current month name
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <HomePageContent
        announcements={announcements}
        currentMonth={currentMonth}
      />
    </div>
  );
}
