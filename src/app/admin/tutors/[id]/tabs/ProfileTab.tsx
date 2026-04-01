"use client";

import {
  ClockIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { TutorTeam } from "@prisma/client";
import type { AdminTutorOverview } from "@/hooks/useTutorProfiles";

/* ─── Constants ─── */

const teamOptions: { value: TutorTeam; label: string }[] = [
  { value: "LA", label: "Los Angeles" },
  { value: "NYC", label: "New York" },
  { value: "SF", label: "San Francisco" },
  { value: "ONLINE", label: "Online" },
  { value: "WESTSIDE", label: "Westside" },
  { value: "EASTSIDE", label: "Eastside" },
];

const certTypeLabels: Record<string, string> = {
  SCHOOL_CERTIFIED: "School Certified",
  BQ_CERTIFIED: "BQ Certified",
  PLAYGROUP_CERTIFIED: "Playgroup Certified",
  CHESSABLE_COMPLETED: "Chessable Completed",
  BACKGROUND_CHECK: "Background Check",
  ADVANCED_CHESS: "Advanced Chess",
  LEAD_TUTOR: "Lead Tutor",
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pending", color: "text-warning", bgColor: "bg-warning-light" },
  ACTIVE: { label: "Active", color: "text-success", bgColor: "bg-success-light" },
  INACTIVE: { label: "Inactive", color: "text-neutral-500", bgColor: "bg-neutral-100" },
  QUIT: { label: "Quit", color: "text-accent-orange", bgColor: "bg-accent-orange-light" },
  TERMINATED: { label: "Terminated", color: "text-error", bgColor: "bg-error-light" },
};

/* ─── Props ─── */

interface ProfileTabProps {
  tutor: AdminTutorOverview;
  isEditing: boolean;
  editData: Record<string, unknown>;
  setEditData: (data: Record<string, unknown>) => void;
}

/* ─── Main Component ─── */

export function ProfileTab({
  tutor,
  isEditing,
  editData,
  setEditData,
}: ProfileTabProps) {
  const status = statusConfig[tutor.status] || statusConfig.PENDING;

  return (
    <div>
      {/* Two-column layout (OpsHub pattern) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Left Column (2/3) ─── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact Information */}
          <SectionCard title="Contact Information" icon={<UserIcon className="h-5 w-5 text-primary-500" />}>
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {tutor.user.headshotUrl || tutor.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tutor.user.headshotUrl || tutor.user.avatarUrl || ""}
                    alt={tutor.user.name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {getInitials(tutor.user.name)}
                  </span>
                )}
              </div>

              {/* Info Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField
                  icon={<EnvelopeIcon className="h-4 w-4 text-neutral-400" />}
                  label="Email"
                  value={tutor.user.email}
                />
                <InfoField
                  icon={<PhoneIcon className="h-4 w-4 text-neutral-400" />}
                  label="Phone"
                  value={tutor.user.phone || "\u2014"}
                  isEditing={isEditing}
                  editValue={(editData.phone as string) || ""}
                  onEditChange={(v) => setEditData({ ...editData, phone: v })}
                />
                <InfoField
                  icon={<UserIcon className="h-4 w-4 text-neutral-400" />}
                  label="Pronouns"
                  value={tutor.pronouns || "\u2014"}
                  isEditing={isEditing}
                  editValue={(editData.pronouns as string) || ""}
                  onEditChange={(v) => setEditData({ ...editData, pronouns: v })}
                />
                <InfoField
                  icon={<MapPinIcon className="h-4 w-4 text-neutral-400" />}
                  label="Team"
                  value={
                    tutor.team
                      ? teamOptions.find((t) => t.value === tutor.team)?.label || tutor.team
                      : "\u2014"
                  }
                  isEditing={isEditing}
                  editNode={
                    <select
                      value={(editData.team as string) || ""}
                      onChange={(e) => setEditData({ ...editData, team: e.target.value })}
                      className="px-2 py-1 border border-neutral-300 rounded-lg text-sm"
                    >
                      <option value="">Select Team</option>
                      {teamOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  }
                />
              </div>
            </div>

            {/* External Systems */}
            {(tutor.tutorCruncherId || tutor.branchId) && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">External Systems</p>
                <div className="flex gap-4">
                  {tutor.tutorCruncherId && (
                    <a
                      href={`https://account.acmeworkforce.com/contractors/${tutor.tutorCruncherId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
                    >
                      TutorCruncher #{tutor.tutorCruncherId}
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </a>
                  )}
                  {tutor.branchId && (
                    <span className="text-sm text-neutral-600">Branch: {tutor.branchId}</span>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Bio */}
          <SectionCard title="Bio" icon={<DocumentTextIcon className="h-5 w-5 text-primary-500" />}>
            {isEditing ? (
              <textarea
                value={(editData.bio as string) || ""}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y"
                placeholder="Tutor bio..."
              />
            ) : tutor.user.bio ? (
              <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {tutor.user.bio}
              </p>
            ) : (
              <p className="text-sm text-neutral-400">No bio added yet</p>
            )}
          </SectionCard>

          {/* Emergency Contacts */}
          <SectionCard title="Emergency Contact" icon={<PhoneIcon className="h-5 w-5 text-error" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoField
                icon={<UserIcon className="h-4 w-4 text-neutral-400" />}
                label="Name"
                value={tutor.user.emergencyContactName || "\u2014"}
                isEditing={isEditing}
                editValue={(editData.emergencyContactName as string) || ""}
                onEditChange={(v) => setEditData({ ...editData, emergencyContactName: v })}
              />
              <InfoField
                icon={<PhoneIcon className="h-4 w-4 text-neutral-400" />}
                label="Phone"
                value={tutor.user.emergencyContactPhone || "\u2014"}
                isEditing={isEditing}
                editValue={(editData.emergencyContactPhone as string) || ""}
                onEditChange={(v) => setEditData({ ...editData, emergencyContactPhone: v })}
              />
              <InfoField
                icon={<UserIcon className="h-4 w-4 text-neutral-400" />}
                label="Relation"
                value={tutor.user.emergencyContactRelation || "\u2014"}
                isEditing={isEditing}
                editValue={(editData.emergencyContactRelation as string) || ""}
                onEditChange={(v) => setEditData({ ...editData, emergencyContactRelation: v })}
              />
            </div>
          </SectionCard>

          {/* Chess Skills */}
          <SectionCard title="Chess Skills">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Level</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={(editData.chessLevel as string) || ""}
                    onChange={(e) => setEditData({ ...editData, chessLevel: e.target.value })}
                    className="mt-1 px-2 py-1 border border-neutral-300 rounded-lg text-sm w-full"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-neutral-900">{tutor.chessLevel || "\u2014"}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Rating</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={(editData.chessRating as string) || ""}
                    onChange={(e) => setEditData({ ...editData, chessRating: e.target.value })}
                    className="mt-1 px-2 py-1 border border-neutral-300 rounded-lg text-sm w-full"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-neutral-900">{tutor.chessRating || "\u2014"}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Noctie Rating</p>
                <p className="mt-1 text-sm font-medium text-neutral-900">{tutor.noctieRating || "\u2014"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Chessable</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={(editData.chessableUsername as string) || ""}
                    onChange={(e) => setEditData({ ...editData, chessableUsername: e.target.value })}
                    className="mt-1 px-2 py-1 border border-neutral-300 rounded-lg text-sm w-full"
                    placeholder="Username"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-neutral-900">{tutor.chessableUsername || "\u2014"}</p>
                )}
              </div>
            </div>

            {/* Puzzle & Lesson Stats */}
            {tutor.chess && (
              <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MiniStat label="Puzzle Rating" value={tutor.chess.puzzleRating ?? "\u2014"} />
                <MiniStat label="Puzzles Solved" value={tutor.chess.puzzlesSolved} />
                <MiniStat label="Puzzle Streak" value={tutor.chess.puzzleStreak} />
                <MiniStat label="Lessons" value={`${tutor.chess.lessonsCompleted}/${tutor.chess.lessonsTotal}`} />
              </div>
            )}
          </SectionCard>

          {/* Performance */}
          <SectionCard title="Performance" icon={<StarIcon className="h-5 w-5 text-warning" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg text-center">
                <p className="text-xl font-bold text-warning">{tutor.fiveStarCount}</p>
                <p className="text-xs text-neutral-500">5-Star Reviews</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg text-center">
                <p className="text-xl font-bold text-success">{tutor.trialConversions}</p>
                <p className="text-xs text-neutral-500">Trial Conversions</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg text-center">
                <p className="text-xl font-bold text-neutral-900">
                  {tutor.lastLessonDate
                    ? new Date(tutor.lastLessonDate).toLocaleDateString()
                    : "\u2014"}
                </p>
                <p className="text-xs text-neutral-500">Last Lesson</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ─── Right Column (1/3) ─── */}
        <div className="space-y-4">
          {/* Profile Details */}
          <SectionCard title="Profile Details">
            <div className="space-y-3">
              <DetailRow label="Status">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                  {status.label}
                </span>
              </DetailRow>
              {tutor.tutorCruncherId && (
                <DetailRow label="TC ID">
                  <span className="text-sm text-neutral-900">#{tutor.tutorCruncherId}</span>
                </DetailRow>
              )}
              <DetailRow label="Hire Date">
                <span className="text-sm text-neutral-900">
                  {tutor.hireDate ? new Date(tutor.hireDate).toLocaleDateString() : "\u2014"}
                </span>
              </DetailRow>
              <DetailRow label="Hourly Rate">
                {isEditing ? (
                  <input
                    type="number"
                    value={(editData.baseHourlyRate as string) || ""}
                    onChange={(e) => setEditData({ ...editData, baseHourlyRate: e.target.value })}
                    className="px-2 py-1 border border-neutral-300 rounded-lg text-sm w-20"
                  />
                ) : (
                  <span className="text-sm font-medium text-neutral-900">
                    {tutor.baseHourlyRate ? `$${Number(tutor.baseHourlyRate).toFixed(2)}/hr` : "\u2014"}
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Avg Rating">
                <span className="text-sm text-neutral-900 flex items-center gap-1">
                  {tutor.averageRating ? Number(tutor.averageRating).toFixed(1) : "\u2014"}
                  {tutor.averageRating && <StarIcon className="h-3.5 w-3.5 text-warning fill-current" />}
                </span>
              </DetailRow>
              {/* Labels */}
              {tutor.labels && tutor.labels.length > 0 && (
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-xs font-medium text-neutral-500 mb-2">Labels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tutor.labels.map((label) => (
                      <span
                        key={label.id}
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${label.color || "#6b7280"}20`,
                          color: label.color || "#6b7280",
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Certifications */}
          <SectionCard title="Certifications" icon={<ShieldCheckIcon className="h-5 w-5 text-success" />}>
            {/* Quick cert badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {tutor.isSchoolCertified && (
                <span className="flex items-center gap-1 px-2 py-1 bg-info-light text-info-dark rounded text-xs font-medium">
                  <CheckCircleIcon className="h-3.5 w-3.5" /> School
                </span>
              )}
              {tutor.isBqCertified && (
                <span className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                  <CheckCircleIcon className="h-3.5 w-3.5" /> BQ
                </span>
              )}
              {tutor.isPlaygroupCertified && (
                <span className="flex items-center gap-1 px-2 py-1 bg-success-light text-success-dark rounded text-xs font-medium">
                  <CheckCircleIcon className="h-3.5 w-3.5" /> Playgroup
                </span>
              )}
            </div>

            {tutor.certifications.length > 0 ? (
              <div className="space-y-2">
                {tutor.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-2 border border-neutral-200 rounded-lg">
                    <div>
                      <p className="font-medium text-xs">{certTypeLabels[cert.type] || cert.type}</p>
                      {cert.earnedAt && (
                        <p className="text-xs text-neutral-500">{new Date(cert.earnedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    {cert.status === "COMPLETED" ? (
                      <CheckCircleIcon className="h-4 w-4 text-success" />
                    ) : cert.status === "IN_PROGRESS" ? (
                      <ClockIcon className="h-4 w-4 text-warning" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-neutral-400" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !tutor.isSchoolCertified && !tutor.isBqCertified && !tutor.isPlaygroupCertified && (
                <EmptyState icon={<ShieldCheckIcon className="h-8 w-8 text-neutral-300" />} message="No certifications" />
              )
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionCard({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      {accent && <div className={`h-1 bg-${accent}`} />}
      <div className="p-4 pb-0">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
  isEditing,
  editValue,
  onEditChange,
  editNode,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (v: string) => void;
  editNode?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500">{label}</p>
        {isEditing && editNode ? (
          editNode
        ) : isEditing && onEditChange ? (
          <input
            type="text"
            value={editValue || ""}
            onChange={(e) => onEditChange(e.target.value)}
            className="px-2 py-1 border border-neutral-300 rounded-lg text-sm"
          />
        ) : (
          <p className="text-sm font-medium text-neutral-900 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-neutral-500">{label}</span>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm font-bold text-neutral-900">{String(value)}</p>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center py-4">
      {icon}
      <p className="text-xs text-neutral-400 mt-1.5">{message}</p>
    </div>
  );
}

/* ─── Helpers ─── */

function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
