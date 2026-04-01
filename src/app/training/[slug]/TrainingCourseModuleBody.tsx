"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CanvaEmbed } from "@/components/content/CanvaEmbed";
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BoltIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  PaperClipIcon,
  PlayCircleIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import type { ModuleContentType } from "@prisma/client";
import type { TrainingModule } from "@/hooks/useTrainingCourses";
import VimeoPlayer from "./VimeoPlayer";
import { sanitizeHtml } from "@/lib/sanitize";

const PuzzleSolver = dynamic(() => import("@/components/chess/PuzzleSolver"), { ssr: false });
const LessonPlayer = dynamic(() => import("@/components/chess/LessonPlayer"), { ssr: false });

interface ModuleNavTarget {
  id: string;
  title: string;
}

interface TrainingCourseModuleBodyProps {
  moduleContent: TrainingModule;
  activeTab: "notes" | "resources";
  notes: string;
  notesSaved: boolean;
  isSavingNotes: boolean;
  isUpdatingProgress: boolean;
  contentTypeIcon: React.ReactNode;
  prevModule: ModuleNavTarget | null;
  nextModule: ModuleNavTarget | null;
  onSetActiveTab: (tab: "notes" | "resources") => void;
  onNotesChange: (value: string) => void;
  onCompleteModule: (moduleId: string) => Promise<void>;
  onStartQuiz: () => void;
  onSelectModule: (moduleId: string) => void;
  onVideoProgress: (seconds: number, duration: number) => Promise<void>;
  onVideoComplete: () => Promise<void>;
}

type ParsedModulePayload = Record<string, unknown>;

function parseModulePayload(content: string | null): ParsedModulePayload | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") {
      return parsed as ParsedModulePayload;
    }
  } catch {
    // ignore invalid module JSON payloads
  }

  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export default function TrainingCourseModuleBody({
  moduleContent,
  activeTab,
  notes,
  notesSaved,
  isSavingNotes,
  isUpdatingProgress,
  contentTypeIcon,
  prevModule,
  nextModule,
  onSetActiveTab,
  onNotesChange,
  onCompleteModule,
  onStartQuiz,
  onSelectModule,
  onVideoProgress,
  onVideoComplete,
}: TrainingCourseModuleBodyProps) {
  const parsedPayload = useMemo(
    () => parseModulePayload(moduleContent.content),
    [moduleContent.content]
  );

  const canvaData = useMemo(() => {
    if (moduleContent.contentType !== "CANVA" || !parsedPayload) return null;
    const canvaUrl = parsedPayload.canvaUrl;
    if (typeof canvaUrl !== "string" || canvaUrl.length === 0) return null;

    return {
      canvaUrl,
      canvaDesignId:
        typeof parsedPayload.canvaDesignId === "string" ? parsedPayload.canvaDesignId : undefined,
      canvaTitle:
        typeof parsedPayload.canvaTitle === "string" ? parsedPayload.canvaTitle : undefined,
    };
  }, [moduleContent.contentType, parsedPayload]);

  const puzzleData = useMemo(() => {
    if (moduleContent.contentType !== "CHESS_PUZZLE" || !parsedPayload) return null;

    const puzzleId = parsedPayload.puzzleId;
    const fen = parsedPayload.fen;
    const moves = parsedPayload.moves;

    if (typeof puzzleId !== "string" || typeof fen !== "string") return null;
    if (!Array.isArray(moves) && typeof moves !== "string") return null;

    return {
      puzzleId,
      fen,
      moves: typeof moves === "string" ? moves : moves.join(" "),
      rating: typeof parsedPayload.rating === "number" ? parsedPayload.rating : undefined,
      themes: asStringArray(parsedPayload.themes),
    };
  }, [moduleContent.contentType, parsedPayload]);

  const lessonData = useMemo(() => {
    if (moduleContent.contentType !== "CHESS_LESSON" || !parsedPayload) return null;

    const levels = parsedPayload.levels;
    if (!Array.isArray(levels) || levels.length === 0) return null;

    return {
      lessonTitle:
        typeof parsedPayload.title === "string" ? parsedPayload.title : moduleContent.title,
      levels,
      completedLevels:
        typeof parsedPayload.completedLevels === "number" ? parsedPayload.completedLevels : 0,
    };
  }, [moduleContent.contentType, parsedPayload, moduleContent.title]);

  return (
    <div className="p-6">
      {moduleContent.videoUrl && (
        <div className="mb-6">
          <VimeoPlayer
            videoUrl={moduleContent.videoUrl}
            initialPosition={moduleContent.progress?.lastVideoPosition || 0}
            onProgress={onVideoProgress}
            onComplete={onVideoComplete}
          />
        </div>
      )}

      {canvaData && (
        <div className="mb-6">
          <CanvaEmbed
            url={canvaData.canvaUrl}
            designId={canvaData.canvaDesignId}
            title={canvaData.canvaTitle || moduleContent.title}
          />
        </div>
      )}

      {puzzleData && (
        <div className="mb-6">
          <PuzzleSolver
            puzzleId={puzzleData.puzzleId}
            fen={puzzleData.fen}
            moves={puzzleData.moves}
            rating={puzzleData.rating}
            themes={puzzleData.themes}
            onComplete={() => onCompleteModule(moduleContent.id)}
            boardWidth={480}
          />
        </div>
      )}

      {lessonData && (
        <div className="mb-6">
          <LessonPlayer
            lessonTitle={lessonData.lessonTitle}
            levels={lessonData.levels}
            completedLevels={lessonData.completedLevels}
            onLessonComplete={() => onCompleteModule(moduleContent.id)}
            boardWidth={480}
          />
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{moduleContent.title}</h2>
            {moduleContent.description && (
              <p className="text-neutral-500 mt-1">{moduleContent.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {moduleContent.progress?.status === "COMPLETED" ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-success-light text-success-dark rounded-full text-sm font-medium">
                <CheckCircleIcon className="w-4 h-4" />
                Completed
              </span>
            ) : !moduleContent.hasQuiz ? (
              <Button
                onClick={() => onCompleteModule(moduleContent.id)}
                disabled={isUpdatingProgress}
              >
                {isUpdatingProgress ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            {contentTypeIcon}
            {moduleContent.contentType}
          </span>
          {moduleContent.hasQuiz && (
            <span className="flex items-center gap-1">
              <QuestionMarkCircleIcon className="w-4 h-4" />
              Quiz ({moduleContent.passingScore}% to pass)
            </span>
          )}
          <span className="flex items-center gap-1 text-warning">
            <BoltIcon className="w-4 h-4" />
            +10 pts
          </span>
        </div>
      </div>

      <div className="border-b border-neutral-200 mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => onSetActiveTab("notes")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "notes"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <DocumentTextIcon className="w-4 h-4 inline mr-1.5" />
            Notes
          </button>
          <button
            onClick={() => onSetActiveTab("resources")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "resources"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <PaperClipIcon className="w-4 h-4 inline mr-1.5" />
            Resources
            {moduleContent.resourceUrls?.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">
                {moduleContent.resourceUrls.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "notes" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-700">Your Notes</label>
            <span
              className={`text-xs flex items-center gap-1 ${
                isSavingNotes
                  ? "text-warning"
                  : notesSaved
                  ? "text-success"
                  : "text-neutral-400"
              }`}
            >
              {isSavingNotes ? (
                <>
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : notesSaved ? (
                <>
                  <CheckIcon className="w-3 h-3" />
                  Saved
                </>
              ) : (
                "Unsaved changes"
              )}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Take notes while you learn... Your notes are automatically saved."
            className="w-full h-48 p-4 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      )}

      {activeTab === "resources" && (
        <div>
          {moduleContent.resourceUrls && moduleContent.resourceUrls.length > 0 ? (
            <div className="space-y-2">
              {moduleContent.resourceUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">{url.split("/").pop()}</p>
                    <p className="text-xs text-neutral-500">Click to download</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <PaperClipIcon className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
              <p>No resources for this module</p>
            </div>
          )}
        </div>
      )}

      {moduleContent.content && (
        <div className="mt-6 pt-6 border-t">
          <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(moduleContent.content) }}
          />
        </div>
      )}

      {moduleContent.hasQuiz && moduleContent.progress?.status !== "COMPLETED" && (
        <div className="mt-6 pt-6 border-t">
          <div className="bg-gradient-to-br from-primary-50 to-primary-50 rounded-xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center">
              <QuestionMarkCircleIcon className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Module Quiz</h3>
            <p className="text-neutral-500 mb-4">
              Complete the quiz to finish this module.
              <br />
              You need {moduleContent.passingScore}% to pass.
            </p>
            {moduleContent.progress?.quizAttempts && moduleContent.progress.quizAttempts > 0 && (
              <p className="text-sm text-neutral-400 mb-4">
                Last score: {moduleContent.progress.quizScore}%
                {" • "}
                {moduleContent.progress.quizAttempts} attempt(s)
              </p>
            )}
            <Button size="lg" onClick={onStartQuiz}>
              {moduleContent.progress?.quizAttempts && moduleContent.progress.quizAttempts > 0 ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Retake Quiz
                </>
              ) : (
                <>
                  <PlayCircleIcon className="w-4 h-4 mr-2" />
                  Start Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t flex items-center justify-between">
        <div>
          {prevModule && (
            <button
              onClick={() => onSelectModule(prevModule.id)}
              className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs text-neutral-400">Previous</div>
                <div className="font-medium">{prevModule.title}</div>
              </div>
            </button>
          )}
        </div>
        <div>
          {nextModule && (
            <button
              onClick={() => onSelectModule(nextModule.id)}
              className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <div className="text-right">
                <div className="text-xs text-neutral-400">Next</div>
                <div className="font-medium">{nextModule.title}</div>
              </div>
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function getContentTypeIcon(contentType: ModuleContentType): React.ReactNode {
  switch (contentType) {
    case "VIDEO":
      return <PlayIcon className="w-4 h-4" />;
    case "ARTICLE":
      return <DocumentTextIcon className="w-4 h-4" />;
    case "QUIZ":
      return <QuestionMarkCircleIcon className="w-4 h-4" />;
    case "MIXED":
      return <BookOpenIcon className="w-4 h-4" />;
    case "CANVA":
      return <BookOpenIcon className="w-4 h-4" />;
    case "CHESS_PUZZLE":
      return <BoltIcon className="w-4 h-4" />;
    case "CHESS_LESSON":
      return <AcademicCapIcon className="w-4 h-4" />;
    default:
      return <DocumentTextIcon className="w-4 h-4" />;
  }
}
