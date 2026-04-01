import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { LearningPathsClient } from "./LearningPathsClient";

export const metadata = {
  title: "Learning Paths | Acme Workforce",
  description: "Guided training paths to develop your tutoring skills",
};

export default async function LearningPathsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      <LearningPathsClient />
    </div>
  );
}
