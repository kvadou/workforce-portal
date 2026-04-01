import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { categorySlug } = await params;

  // Redirect to main forum with category filter
  redirect(`/forum?category=${categorySlug}`);
}
