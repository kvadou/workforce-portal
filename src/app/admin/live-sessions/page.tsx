import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminLiveSessionsClient from "./AdminLiveSessionsClient";

export const metadata: Metadata = {
  title: "Manage Live Sessions | Admin | Acme Workforce",
  description: "Create and manage live training sessions",
};

export default async function AdminLiveSessionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin/live-sessions");
  }

  // Check admin access
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  return <AdminLiveSessionsClient />;
}
