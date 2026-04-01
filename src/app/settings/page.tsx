import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { SettingsPageClient } from "./SettingsPageClient";

export const metadata = {
  title: "Settings | Acme Workforce",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <SettingsPageClient />
    </div>
  );
}
