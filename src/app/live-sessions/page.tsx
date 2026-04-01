import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LiveSessionsClient from "./LiveSessionsClient";

export const metadata: Metadata = {
  title: "Live Sessions | Acme Workforce",
  description: "Browse and register for upcoming live training sessions",
};

export default async function LiveSessionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/live-sessions");
  }

  return <LiveSessionsClient />;
}
