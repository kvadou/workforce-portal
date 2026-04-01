"use client";

import { BoltIcon, UsersIcon } from "@heroicons/react/24/outline";
import type { OnboardingDetail } from "@/hooks/useOnboardingAdmin";
import { ChecklistItem, NoteField } from "../components";

export default function TrainingTab({
  data,
  onToggle,
  onNoteSave,
  togglePending,
}: {
  data: OnboardingDetail;
  onToggle: (field: string, value: boolean) => void;
  onNoteSave: (field: string, value: string) => void;
  togglePending: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Post-Orientation Training */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-3 flex items-center gap-2">
          <BoltIcon className="h-5 w-5 text-neutral-400" />
          Post-Orientation Training
        </h2>
        <div className="space-y-1">
          <div className="border-l-4 border-primary-500 pl-3">
            <ChecklistItem
              label="Orientation Debrief"
              field="orientationDebriefComplete"
              checked={data.orientationDebriefComplete}
              timestamp={data.orientationDebriefAt}
              onToggle={onToggle}
              isPending={togglePending}
            />
            <p className="text-body-xs text-primary-600 ml-7 -mt-1 mb-2">
              Key milestone — enables activation panel
            </p>
          </div>
          <ChecklistItem
            label="Demo / Magic - 2 hours"
            field="demoMagicComplete"
            checked={data.demoMagicComplete}
            timestamp={data.demoMagicCompletedAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Chess Confidence - 2 hours"
            field="chessConfidenceComplete"
            checked={data.chessConfidenceComplete}
            timestamp={data.chessConfidenceCompletedAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Teaching In Schools - 2 hours"
            field="teachingInSchoolsComplete"
            checked={data.teachingInSchoolsComplete}
            timestamp={data.teachingInSchoolsCompletedAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Chessable"
            field="chessableComplete"
            checked={data.chessableComplete}
            timestamp={data.chessableCompletedAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
        </div>
      </div>

      {/* Shadow Lessons & Mentoring */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-3 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-neutral-400" />
          Shadow Lessons & Mentoring
        </h2>
        <div className="space-y-1 mb-4">
          <ChecklistItem
            label="Shadow #1"
            field="shadow1Complete"
            checked={data.shadow1Complete}
            timestamp={data.shadow1At}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Shadow #2"
            field="shadow2Complete"
            checked={data.shadow2Complete}
            timestamp={data.shadow2At}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Shadow #3"
            field="shadow3Complete"
            checked={data.shadow3Complete}
            timestamp={data.shadow3At}
            onToggle={onToggle}
            isPending={togglePending}
          />
        </div>
        <div className="space-y-4">
          <NoteField
            label="Shadow Feedback"
            field="shadowFeedback"
            value={data.shadowFeedback}
            onSave={onNoteSave}
          />
          <ChecklistItem
            label="Mentor Sign Up"
            field="mentorSignUp"
            checked={data.mentorSignUp}
            timestamp={null}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <NoteField
            label="Month 1 Mentor Notes"
            field="month1MentorNotes"
            value={data.month1MentorNotes}
            onSave={onNoteSave}
          />
        </div>
      </div>
    </div>
  );
}
