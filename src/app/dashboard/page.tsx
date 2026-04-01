import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "Dashboard | Acme Workforce",
  description: "Your personalized tutoring dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <DashboardClient />
    </div>
  );
}
