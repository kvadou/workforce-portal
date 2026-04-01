import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MainNav } from "./MainNav";
import type { UserRole } from "@prisma/client";

export async function SiteHeader() {
  const [session, courses] = await Promise.all([
    getServerSession(authOptions),
    prisma.curriculum.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const userName = session?.user?.name || "Tutor";
  const userRole = (session?.user?.role as UserRole) || undefined;

  return <MainNav courses={courses} userName={userName} userRole={userRole} />;
}
