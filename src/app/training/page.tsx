import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { TrainingCatalogClient } from "./TrainingCatalogClient";

export const metadata = {
  title: "Training | Acme Workforce",
  description: "Develop your skills with guided learning paths and courses",
};

export default async function TrainingCatalogPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <TrainingCatalogClient />
    </div>
  );
}
