import type { OnboardingProgress } from "@prisma/client";

export const PHASE_COUNT = 6;

export interface PhaseInfo {
  phase: number;
  title: string;
  description: string;
  isComplete: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
  completedAt: Date | null;
}

export function getPhaseStatus(progress: OnboardingProgress): PhaseInfo[] {
  const phase1Complete = !!progress.phase1CompletedAt;
  const phase2Complete = !!progress.phase2CompletedAt;
  const phase3Complete = !!progress.phase3CompletedAt;
  const phase4Complete = !!progress.phase4CompletedAt;
  const phase5Complete = !!progress.phase5CompletedAt;
  const phase6Complete = !!progress.phase6CompletedAt;

  const phases: PhaseInfo[] = [
    {
      phase: 1,
      title: "Welcome & Training Videos",
      description: "Watch orientation videos and pass quizzes",
      isComplete: phase1Complete,
      isUnlocked: true,
      isCurrent: false,
      completedAt: progress.phase1CompletedAt,
    },
    {
      phase: 2,
      title: "Profile & Documents",
      description: "Set up your profile and submit W-9",
      isComplete: phase2Complete,
      isUnlocked: phase1Complete,
      isCurrent: false,
      completedAt: progress.phase2CompletedAt,
    },
    {
      phase: 3,
      title: "Orientation Debrief",
      description: "Attend the live group session",
      isComplete: phase3Complete,
      isUnlocked: phase2Complete,
      isCurrent: false,
      completedAt: progress.phase3CompletedAt,
    },
    {
      phase: 4,
      title: "Post-Orientation Training",
      description: "Complete training sessions with the team",
      isComplete: phase4Complete,
      isUnlocked: phase3Complete,
      isCurrent: false,
      completedAt: progress.phase4CompletedAt,
    },
    {
      phase: 5,
      title: "Shadow Lessons",
      description: "Observe experienced tutors in action",
      isComplete: phase5Complete,
      isUnlocked: phase4Complete,
      isCurrent: false,
      completedAt: progress.phase5CompletedAt,
    },
    {
      phase: 6,
      title: "Ready!",
      description: "Launch your profile and start teaching",
      isComplete: phase6Complete,
      isUnlocked: phase5Complete,
      isCurrent: false,
      completedAt: progress.phase6CompletedAt,
    },
  ];

  const currentPhase = phases.find((p) => p.isUnlocked && !p.isComplete);
  if (currentPhase) currentPhase.isCurrent = true;

  return phases;
}

export function getOverallProgress(progress: OnboardingProgress): number {
  const phases = getPhaseStatus(progress);
  const completed = phases.filter((p) => p.isComplete).length;
  return Math.round((completed / PHASE_COUNT) * 100);
}

export function getCurrentPhase(progress: OnboardingProgress): number {
  const phases = getPhaseStatus(progress);
  const current = phases.find((p) => p.isCurrent);
  return current ? current.phase : PHASE_COUNT + 1;
}
