import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ForumClient } from "./ForumClient";

export const metadata = {
  title: "Discussion Forums | Acme Workforce",
  description: "Connect with fellow tutors, ask questions, and share knowledge",
};

export default async function ForumPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <ForumClient />;
}
