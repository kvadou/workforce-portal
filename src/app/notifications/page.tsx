import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = {
  title: "Notifications | Acme Workforce",
  description: "View your notifications and alerts",
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <NotificationsClient />
    </div>
  );
}
