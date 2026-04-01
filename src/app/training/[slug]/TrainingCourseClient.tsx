"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useTrainingCourse,
  useTrainingModule,
  useEnrollInCourse,
  useUpdateModuleProgress,
  useSubmitQuiz,
  TrainingModule,
  QuizSubmissionResult,
} from "@/hooks/useTrainingCourses";
import QuizPlayer, { QuizQuestion } from "@/components/training/QuizPlayer";
import QuizResults from "@/components/training/QuizResults";
import { toast } from "sonner";
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BoltIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayCircleIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import TrainingCourseModuleBody, {
  getContentTypeIcon,
} from "./TrainingCourseModuleBody";

interface TrainingCourseClientProps {
  slug: string;
}

export default function TrainingCourseClient({ slug }: TrainingCourseClientProps) {
  const { data: course, isLoading, error } = useTrainingCourse(slug);
  const enrollMutation = useEnrollInCourse();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"notes" | "resources">("notes");
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    result: QuizSubmissionResult;
    answers: Record<string, string>;
  } | null>(null);

  const { data: moduleContent, isLoading: isModuleLoading } = useTrainingModule(
    selectedModuleId ? slug : null,
    selectedModuleId
  );
  const updateProgressMutation = useUpdateModuleProgress();
  const submitQuizMutation = useSubmitQuiz();

  useEffect(() => {
    if (course?.enrollment && course.modules?.length > 0 && !selectedModuleId) {
      const firstIncomplete = course.modules.find(
        (module) => module.progress?.status !== "COMPLETED"
      );
      setSelectedModuleId(firstIncomplete?.id || course.modules[0].id);
    }
  }, [course, selectedModuleId]);

  useEffect(() => {
    if (moduleContent?.progress?.notes !== undefined) {
      setNotes(moduleContent.progress.notes || "");
      setNotesSaved(true);
    }
  }, [moduleContent?.id, moduleContent?.progress?.notes]);

  const saveNotes = useCallback(
    async (notesContent: string) => {
      if (!selectedModuleId || !course?.enrollment) return;

      setIsSavingNotes(true);
      try {
        await updateProgressMutation.mutateAsync({
          slug,
          moduleId: selectedModuleId,
          data: { notes: notesContent },
        });
        setNotesSaved(true);
      } catch {
        toast.error("Failed to save notes");
      } finally {
        setIsSavingNotes(false);
      }
    },
    [selectedModuleId, slug, course?.enrollment, updateProgressMutation]
  );

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setNotesSaved(false);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(value);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync(slug);
      toast.success("Enrolled successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll");
    }
  };

  const handleCompleteModule = async (moduleId: string) => {
    try {
      await updateProgressMutation.mutateAsync({
        slug,
        moduleId,
        data: { markComplete: true },
      });
      toast.success("Module completed! +10 points", {
        icon: <BoltIcon className="w-4 h-4 text-warning" />,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update progress");
    }
  };

  const handleVideoProgress = async (seconds: number, duration: number) => {
    if (!selectedModuleId) return;

    try {
      await updateProgressMutation.mutateAsync({
        slug,
        moduleId: selectedModuleId,
        data: {
          videoProgress: seconds,
          videoDuration: duration,
          lastVideoPosition: seconds,
        },
      });
    } catch {
      // Silent fail for progress updates
    }
  };

  const handleVideoComplete = async () => {
    if (!selectedModuleId || !moduleContent) return;

    if (!moduleContent.hasQuiz) {
      await handleCompleteModule(selectedModuleId);
    }
  };

  const handleStartQuiz = () => {
    setQuizResult(null);
    setShowQuiz(true);
  };

  const handleQuizComplete = async (_score: number, answers: Record<string, string>) => {
    if (!selectedModuleId || !moduleContent) return;

    try {
      const result = await submitQuizMutation.mutateAsync({
        slug,
        moduleId: selectedModuleId,
        answers,
      });

      setShowQuiz(false);
      setQuizResult({ result, answers });

      if (result.passed) {
        toast.success(`Quiz passed! +${result.pointsEarned} points`, {
          icon: <BoltIcon className="w-4 h-4 text-warning" />,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit quiz");
    }
  };

  const handleQuizRetry = () => {
    setQuizResult(null);
    setShowQuiz(true);
  };

  const currentModuleIndex =
    course?.modules?.findIndex((module) => module.id === selectedModuleId) ?? -1;
  const prevModule = currentModuleIndex > 0 ? course?.modules?.[currentModuleIndex - 1] : null;
  const nextModule =
    currentModuleIndex >= 0 && currentModuleIndex < (course?.modules?.length ?? 0) - 1
      ? course?.modules?.[currentModuleIndex + 1]
      : null;

  const handleQuizContinue = () => {
    setQuizResult(null);
    if (nextModule) {
      setSelectedModuleId(nextModule.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-8 text-center">
        <div className="text-error mb-4">Course not found</div>
        <Link href="/training">
          <Button>Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const isEnrolled = !!course.enrollment;
  const isCompleted = course.enrollment?.status === "COMPLETED";
  const progress = course.enrollment?.progress || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/training"
                className="flex items-center gap-1 text-neutral-500 hover:text-primary-500 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Catalog</span>
              </Link>
              <div className="h-6 w-px bg-neutral-200" />
              <h1 className="font-semibold text-neutral-900 truncate max-w-md">{course.title}</h1>
            </div>

            <div className="flex items-center gap-4">
              {isEnrolled && !isCompleted && (
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-neutral-700">{progress}% Complete</div>
                  <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              {isCompleted && (
                <div className="flex items-center gap-2 text-success">
                  <TrophyIcon className="w-5 h-5" />
                  <span className="font-medium">Completed!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto">
        {!isEnrolled ? (
          <div className="p-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <AcademicCapIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">{course.title}</h2>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  {course.description || "Start learning today and earn points as you progress."}
                </p>

                <div className="flex items-center justify-center gap-6 mb-8 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <BookOpenIcon className="w-4 h-4" />
                    {course.modules?.length || 0} modules
                  </span>
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {course.duration} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <BoltIcon className="w-4 h-4 text-warning" />
                    {(course.modules?.length || 0) * 10 + 50} pts available
                  </span>
                </div>

                <Button
                  size="lg"
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                  className="px-8"
                >
                  {enrollMutation.isPending ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <AcademicCapIcon className="w-5 h-5 mr-2" />
                      Enroll Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-57px)]">
            <div className="lg:hidden border-b border-neutral-200 bg-white">
              <div className="p-3 flex items-center gap-3">
                <BookOpenIcon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <select
                  value={selectedModuleId || ""}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="flex-1 text-sm font-medium border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {course.modules?.map((module, i) => (
                    <option key={module.id} value={module.id}>
                      {module.progress?.status === "COMPLETED" ? "\u2713 " : ""}
                      {i + 1}. {module.title}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-neutral-500 whitespace-nowrap">
                  {course.modules?.filter((module) => module.progress?.status === "COMPLETED")
                    .length || 0}
                  /{course.modules?.length || 0}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isModuleLoading ? (
                <div className="flex items-center justify-center h-full">
                  <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : moduleContent ? (
                <TrainingCourseModuleBody
                  moduleContent={moduleContent}
                  activeTab={activeTab}
                  notes={notes}
                  notesSaved={notesSaved}
                  isSavingNotes={isSavingNotes}
                  isUpdatingProgress={updateProgressMutation.isPending}
                  contentTypeIcon={getContentTypeIcon(moduleContent.contentType)}
                  prevModule={prevModule ? { id: prevModule.id, title: prevModule.title } : null}
                  nextModule={nextModule ? { id: nextModule.id, title: nextModule.title } : null}
                  onSetActiveTab={setActiveTab}
                  onNotesChange={handleNotesChange}
                  onCompleteModule={handleCompleteModule}
                  onStartQuiz={handleStartQuiz}
                  onSelectModule={setSelectedModuleId}
                  onVideoProgress={handleVideoProgress}
                  onVideoComplete={handleVideoComplete}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <PlayCircleIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Select a module to begin
                    </h3>
                    <p className="text-neutral-500">
                      Choose a module from the sidebar to start learning
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:block lg:w-80 border-l border-neutral-200 bg-white overflow-y-auto flex-shrink-0">
              <div className="p-4 border-b border-neutral-100">
                <h3 className="font-semibold text-neutral-900">Course Content</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {course.modules?.filter((module) => module.progress?.status === "COMPLETED")
                    .length || 0}{" "}
                  of {course.modules?.length || 0} completed
                </p>
              </div>

              <div className="divide-y divide-neutral-100">
                {course.modules?.map((module, index) => (
                  <ModuleListItem
                    key={module.id}
                    module={module}
                    index={index}
                    isSelected={selectedModuleId === module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showQuiz && moduleContent?.quizQuestions && (
        <QuizPlayer
          questions={moduleContent.quizQuestions as QuizQuestion[]}
          passingScore={moduleContent.passingScore || 80}
          moduleTitle={moduleContent.title}
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
        />
      )}

      {quizResult && moduleContent?.quizQuestions && (
        <QuizResults
          score={quizResult.result.score}
          passingScore={quizResult.result.passingScore}
          questions={moduleContent.quizQuestions as QuizQuestion[]}
          answers={quizResult.answers}
          pointsEarned={quizResult.result.pointsEarned}
          moduleTitle={moduleContent.title}
          onRetry={handleQuizRetry}
          onContinue={handleQuizContinue}
          onClose={() => setQuizResult(null)}
        />
      )}
    </div>
  );
}

function ModuleListItem({
  module,
  index,
  isSelected,
  onClick,
}: {
  module: TrainingModule;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isCompleted = module.progress?.status === "COMPLETED";
  const isInProgress = module.progress?.status === "IN_PROGRESS";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
        isSelected
          ? "bg-primary-50 border-l-4 border-l-primary-500"
          : "hover:bg-neutral-50 border-l-4 border-l-transparent"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isCompleted
            ? "bg-success-light text-success"
            : isInProgress
            ? "bg-warning-light text-warning"
            : isSelected
            ? "bg-primary-100 text-primary-600"
            : "bg-neutral-100 text-neutral-500"
        }`}
      >
        {isCompleted ? (
          <CheckCircleIcon className="w-4 h-4" />
        ) : (
          <span className="text-sm font-medium">{index + 1}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium truncate ${isSelected ? "text-primary-700" : "text-neutral-900"}`}>
          {module.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {getContentTypeIcon(module.contentType)}
          <span>{module.contentType}</span>
          {module.hasQuiz && <span className="text-primary-500">+ Quiz</span>}
        </div>
      </div>
      {isInProgress && <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />}
    </button>
  );
}
