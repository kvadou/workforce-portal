"use client";

import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  StopCircleIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingDetail } from "@/hooks/useOnboardingAdmin";
import { NoteField } from "../components";

export default function AdminTab({
  data,
  googleGroups,
  onNoteSave,
  onActivationStep,
  selectedGroup,
  setSelectedGroup,
  activationPending,
}: {
  data: OnboardingDetail;
  googleGroups: Record<string, string> | undefined;
  onNoteSave: (field: string, value: string) => void;
  onActivationStep: (step: string, groupKey?: string) => void;
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
  activationPending: boolean;
}) {
  const allActivationStepsDone =
    data.branchIdGenerated &&
    data.tutorCruncherCreated &&
    data.googleGroupAdded;

  return (
    <div className="space-y-6">
      {/* Tutor Profile Notes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-3 flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-neutral-400" />
          Tutor Profile Notes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NoteField
            label="First Impressions"
            field="firstImpressions"
            value={data.firstImpressions}
            onSave={onNoteSave}
          />
          <NoteField
            label="Long Term Goals"
            field="longTermGoals"
            value={data.longTermGoals}
            onSave={onNoteSave}
          />
          <NoteField
            label="Location"
            field="location"
            value={data.location}
            onSave={onNoteSave}
            multiline={false}
          />
          <NoteField
            label="Chess Level"
            field="chessLevelNotes"
            value={data.chessLevelNotes}
            onSave={onNoteSave}
            multiline={false}
          />
          <div className="md:col-span-2">
            <NoteField
              label="Availability / Scheduling Goals"
              field="availabilityScheduling"
              value={data.availabilityScheduling}
              onSave={onNoteSave}
            />
          </div>
          <div className="md:col-span-2">
            <NoteField
              label="Admin Notes"
              field="adminNotes"
              value={data.adminNotes}
              onSave={onNoteSave}
            />
          </div>
        </div>
      </div>

      {/* Activation Panel */}
      {data.orientationDebriefComplete && (
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-primary-200">
          <h2 className="text-heading-md text-neutral-900 mb-4 flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-primary-600" />
            Activation Panel
          </h2>

          <div className="space-y-4">
            {/* Generate Branch ID */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                {data.branchIdGenerated ? (
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                ) : (
                  <StopCircleIcon className="h-5 w-5 text-neutral-300" />
                )}
                <div>
                  <p className="text-body-sm font-medium text-neutral-800">
                    Generate Branch ID
                  </p>
                  {data.branchIdGenerated && data.branchIdGeneratedAt && (
                    <p className="text-body-xs text-neutral-500">
                      Generated{" "}
                      {new Date(
                        data.branchIdGeneratedAt
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {!data.branchIdGenerated ? (
                <button
                  onClick={() => onActivationStep("generate_branch_id")}
                  disabled={activationPending}
                  className="px-3 py-1.5 text-body-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {activationPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </button>
              ) : (
                <span className="text-body-xs text-success font-medium">
                  Done
                </span>
              )}
            </div>

            {/* Create TutorCruncher Profile */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                {data.tutorCruncherCreated ? (
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                ) : (
                  <StopCircleIcon className="h-5 w-5 text-neutral-300" />
                )}
                <div>
                  <p className="text-body-sm font-medium text-neutral-800">
                    Create TutorCruncher Profile
                  </p>
                  {data.tutorCruncherCreated &&
                    data.tutorCruncherCreatedAt && (
                      <p className="text-body-xs text-neutral-500">
                        Created{" "}
                        {new Date(
                          data.tutorCruncherCreatedAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                </div>
              </div>
              {!data.tutorCruncherCreated ? (
                <button
                  onClick={() => onActivationStep("create_tc_profile")}
                  disabled={activationPending}
                  className="px-3 py-1.5 text-body-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {activationPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </button>
              ) : (
                <span className="text-body-xs text-success font-medium">
                  Done
                </span>
              )}
            </div>

            {/* Add to Google Group */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                {data.googleGroupAdded ? (
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                ) : (
                  <StopCircleIcon className="h-5 w-5 text-neutral-300" />
                )}
                <div>
                  <p className="text-body-sm font-medium text-neutral-800">
                    Add to Google Group
                  </p>
                  {data.googleGroupAdded && data.googleGroupName && (
                    <p className="text-body-xs text-neutral-500">
                      Added to {data.googleGroupName}{" "}
                      {data.googleGroupAddedAt &&
                        new Date(
                          data.googleGroupAddedAt
                        ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {!data.googleGroupAdded ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="rounded-lg border border-neutral-200 px-2 py-1.5 text-body-sm text-neutral-800"
                  >
                    <option value="">Select group...</option>
                    {googleGroups &&
                      Object.entries(googleGroups).map(([key]) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() =>
                      selectedGroup &&
                      onActivationStep("add_google_group", selectedGroup)
                    }
                    disabled={!selectedGroup || activationPending}
                    className="px-3 py-1.5 text-body-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {activationPending ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-body-xs text-success font-medium">
                  Done
                </span>
              )}
            </div>

            {/* Send Welcome Email */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                {data.welcomeEmailSent ? (
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                ) : (
                  <StopCircleIcon className="h-5 w-5 text-neutral-300" />
                )}
                <div>
                  <p className="text-body-sm font-medium text-neutral-800">
                    Send Welcome Email
                  </p>
                  {data.welcomeEmailSent && data.welcomeEmailSentAt && (
                    <p className="text-body-xs text-neutral-500">
                      Sent{" "}
                      {new Date(
                        data.welcomeEmailSentAt
                      ).toLocaleDateString()}
                    </p>
                  )}
                  {!data.welcomeEmailSent && (
                    <p className="text-body-xs text-warning">
                      Available at go-live (ENABLE_WELCOME_EMAIL)
                    </p>
                  )}
                </div>
              </div>
              {!data.welcomeEmailSent ? (
                <button
                  onClick={() => onActivationStep("send_welcome_email")}
                  disabled={activationPending}
                  className="px-3 py-1.5 text-body-sm font-medium rounded-lg bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  title="Disabled until ENABLE_WELCOME_EMAIL is set"
                >
                  Send
                </button>
              ) : (
                <span className="text-body-xs text-success font-medium">
                  Done
                </span>
              )}
            </div>

            {/* Full Activate */}
            <div className="border-t border-neutral-200 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-md font-semibold text-neutral-900">
                    Full Activate
                  </p>
                  <p className="text-body-xs text-neutral-500">
                    Upgrades role from ONBOARDING_TUTOR to TUTOR, creates
                    TutorProfile, grants app access
                  </p>
                </div>
                {data.activatedAt ? (
                  <span className="flex items-center gap-2 text-success font-medium text-body-sm">
                    <CheckCircleIcon className="h-5 w-5" />
                    Activated{" "}
                    {new Date(data.activatedAt).toLocaleDateString()}
                  </span>
                ) : (
                  <button
                    onClick={() => onActivationStep("full_activate")}
                    disabled={
                      !allActivationStepsDone || activationPending
                    }
                    className={`px-4 py-2 text-body-sm font-semibold rounded-lg ${
                      allActivationStepsDone
                        ? "bg-success text-white hover:bg-success-dark"
                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    } disabled:opacity-50`}
                    title={
                      !allActivationStepsDone
                        ? "Complete all steps above first"
                        : "Activate this tutor"
                    }
                  >
                    {activationPending ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      "Activate Tutor"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Reason */}
      {data.returnedAt && data.returnReason && (
        <div className="bg-error-light border border-error rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-error mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-body-md font-semibold text-error-dark mb-1">
              Returned for Corrections
            </h3>
            <p className="text-body-sm text-error-dark">{data.returnReason}</p>
            <p className="text-body-xs text-error mt-2">
              Returned on {new Date(data.returnedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
