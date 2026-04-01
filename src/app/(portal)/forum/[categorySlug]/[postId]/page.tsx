import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { PostDetailClient } from "./PostDetailClient";

interface PageProps {
  params: Promise<{ categorySlug: string; postId: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { postId } = await params;

  return (
    <PostDetailClient
      postId={postId}
      currentUserId={session.user.id}
      userRole={session.user.role || "TUTOR"}
    />
  );
}
