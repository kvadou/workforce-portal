import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SessionManagement } from "@/components/admin/SessionManagement";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  // Get all orientation sessions
  const sessions = await prisma.orientationSession.findMany({
    include: {
      _count: {
        select: { participants: true },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });

  const upcomingSessions = sessions.filter(
    (s) => new Date(s.scheduledAt) > new Date() && s.isActive
  );
  const pastSessions = sessions.filter(
    (s) => new Date(s.scheduledAt) <= new Date() || !s.isActive
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Onboarding</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading-lg text-neutral-900">
              Orientation Sessions
            </h1>
            <p className="text-body-md text-neutral-600">
              Schedule and manage orientation debrief sessions
            </p>
          </div>
        </div>
      </div>

      <SessionManagement
        upcomingSessions={upcomingSessions.map((s) => ({
          ...s,
          participantCount: s._count.participants,
          participants: s.participants.map((p) => ({
            id: p.id,
            userName: p.user.name,
            userEmail: p.user.email,
          })),
        }))}
        pastSessions={pastSessions.map((s) => ({
          ...s,
          participantCount: s._count.participants,
          participants: s.participants.map((p) => ({
            id: p.id,
            userName: p.user.name,
            userEmail: p.user.email,
          })),
        }))}
      />
    </div>
  );
}
