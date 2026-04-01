"use client";

import { EnvelopeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import type { OnboardingDetail } from "@/hooks/useOnboardingAdmin";
import { ChecklistItem, NoteField } from "../components";

export default function ActivityTab({
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
      {/* Email Checklist */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-3 flex items-center gap-2">
          <EnvelopeIcon className="h-5 w-5 text-neutral-400" />
          Email Checklist
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <ChecklistItem
            label="Cert Date & Details Email + Cal Invites"
            field="certDateEmailSent"
            checked={data.certDateEmailSent}
            timestamp={data.certDateEmailSentAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label='"Next Steps" & Shadow Email Sent'
            field="nextStepsShadowEmailSent"
            checked={data.nextStepsShadowEmailSent}
            timestamp={data.nextStepsShadowEmailSentAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Online Cert / Tip 10 Email Sent"
            field="onlineCertEmailSent"
            checked={data.onlineCertEmailSent}
            timestamp={data.onlineCertEmailSentAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Acme Email Sent"
            field="storyTimeEmailSent"
            checked={data.storyTimeEmailSent}
            timestamp={data.storyTimeEmailSentAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
        </div>
      </div>

      {/* Pre-Orientation Checklist */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-3 flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-neutral-400" />
          Pre-Orientation Checklist
        </h2>
        <div className="space-y-1">
          <ChecklistItem
            label="Certification Complete"
            field="certificationComplete"
            checked={data.certificationComplete}
            timestamp={data.certificationCompletedAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Payouts Setup"
            field="payoutsSetup"
            checked={data.payoutsSetup}
            timestamp={data.payoutsSetupAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          <ChecklistItem
            label="Initial Call Complete"
            field="initialCallComplete"
            checked={data.initialCallComplete}
            timestamp={data.initialCallAt}
            onToggle={onToggle}
            isPending={togglePending}
          />
          {data.initialCallComplete && (
            <div className="ml-7 mt-1">
              <NoteField
                label="Initial Call Notes"
                field="initialCallNotes"
                value={data.initialCallNotes}
                onSave={onNoteSave}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
