"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

interface AdminEditButtonProps {
  resourceId: string;
  className?: string;
}

/**
 * A floating edit button that only appears for admin users.
 * When clicked, it navigates to the resource edit page with a returnTo parameter
 * so the admin is redirected back to the current page after saving.
 */
export function AdminEditButton({ resourceId, className = "" }: AdminEditButtonProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Only show for admin roles
  const isAdmin = session?.user?.role &&
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

  if (!isAdmin) {
    return null;
  }

  const editUrl = `/admin/resources/${resourceId}?returnTo=${encodeURIComponent(pathname)}`;

  return (
    <Link
      href={editUrl}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg shadow-sm hover:bg-primary-700 transition-all hover:scale-105 ${className}`}
    >
      <PencilSquareIcon className="h-5 w-5" />
      <span className="font-medium">Edit Page</span>
    </Link>
  );
}

/**
 * A smaller inline edit button for use within cards or lists.
 */
export function AdminEditLink({
  resourceId,
  children = "Edit",
  className = ""
}: AdminEditButtonProps & { children?: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isAdmin = session?.user?.role &&
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

  if (!isAdmin) {
    return null;
  }

  const editUrl = `/admin/resources/${resourceId}?returnTo=${encodeURIComponent(pathname)}`;

  return (
    <Link
      href={editUrl}
      className={`inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 ${className}`}
    >
      <PencilSquareIcon className="h-3.5 w-3.5" />
      {children}
    </Link>
  );
}
