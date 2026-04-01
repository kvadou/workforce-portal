"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Chessboard } from "@/components/chess/Chessboard";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilmIcon,
  LightBulbIcon,
  PlayIcon,
  PuzzlePieceIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CanvaEmbed, hasCanvaEmbed } from "@/components/content/CanvaEmbed";
import Link from "next/link";

type TabType = "story" | "chessercises" | "gameplay" | "video";

interface LessonData {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  thumbnail: string;
  videoUrl: string;
  videoDuration: string;
  status: "draft" | "published" | "archived";
  module: {
    id: string;
    title: string;
    curriculum: {
      id: string;
      title: string;
    };
  };
  developmentalSkills: Array<{
    title: string;
    description: string;
  }>;
  story: {
    introduction: string;
    teacherTip: string;
    content: Record<string, unknown> | null;
    paragraphs: Array<{ type: string; content: string }>;
  };
  chessercises: {
    warmUp?: { instructions: string[] };
    dressUp?: { instructions: string[] };
    chessUp?: { instructions: string[] };
  };
  exercises: Array<{
    id: string;
    number: number;
    title: string;
    instructions: string;
    fen: string;
    solution: string;
    explanation: string;
    highlightSquares: string[];
  }>;
  printMaterials: Array<{
    id: string;
    title: string;
    type: string;
    pageCount: number;
    thumbnailUrl: string;
    fileUrl: string;
  }>;
  navigation: {
    prev: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
  };
}

interface Props {
  lesson: LessonData;
}

// Tab configuration with icons
const tabConfig: { id: TabType; label: string; icon: React.ReactNode; mobileLabel: string }[] = [
  { id: "story", label: "Story", mobileLabel: "Story", icon: <BookOpenIcon className="w-4 h-4" /> },
  { id: "chessercises", label: "Chessercises", mobileLabel: "Chess", icon: <StarIcon className="w-4 h-4" /> },
  { id: "gameplay", label: "Gameplay", mobileLabel: "PlayIcon", icon: <PuzzlePieceIcon className="w-4 h-4" /> },
  { id: "video", label: "Video", mobileLabel: "Video", icon: <FilmIcon className="w-4 h-4" /> },
];

export function LessonPageClient({ lesson }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("story");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenHeader, setShowFullscreenHeader] = useState(true);
  const [completedTabs, setCompletedTabs] = useState<Set<TabType>>(new Set(["story"]));

  // Handle ESC key for fullscreen exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Auto-hide header in fullscreen mode after inactivity
  useEffect(() => {
    if (!isFullscreen) return;

    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowFullscreenHeader(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowFullscreenHeader(false), 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    timeout = setTimeout(() => setShowFullscreenHeader(false), 3000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  const markTabComplete = useCallback((tab: TabType) => {
    setCompletedTabs(prev => new Set([...prev, tab]));
  }, []);

  // Fullscreen mode layout
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {/* Fullscreen Header - Auto-hides */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            showFullscreenHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
          }`}
        >
          <div className="bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                {lesson.navigation.prev && (
                  <Link href={`/lessons/${lesson.navigation.prev.id}`}>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <ChevronLeftIcon className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Prev</span>
                    </Button>
                  </Link>
                )}
                <h1 className="text-white font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                  {lesson.title}
                </h1>
                {lesson.navigation.next && (
                  <Link href={`/lessons/${lesson.navigation.next.id}`}>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/20"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Fullscreen Content */}
        <div className="h-full overflow-auto">
          {activeTab === "story" && <StoryTab story={lesson.story} fullscreen />}
          {activeTab === "chessercises" && <ChessercisesTab chessercises={lesson.chessercises} fullscreen />}
          {activeTab === "gameplay" && <GameplayTab exercises={lesson.exercises} fullscreen />}
          {activeTab === "video" && (
            <VideoTab
              videoUrl={lesson.videoUrl}
              title={`Lesson ${lesson.number}: ${lesson.title}`}
              thumbnail={lesson.thumbnail}
              fullscreen
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Back & Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link
                href={`/courses/${lesson.module.curriculum.id}`}
                className="flex items-center gap-1 text-neutral-500 hover:text-primary-500 transition-colors shrink-0"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Back</span>
              </Link>
              <div className="min-w-0">
                <h1 className="text-heading-sm text-neutral-900 truncate">
                  {lesson.title}
                </h1>
                <p className="text-xs text-neutral-500 truncate hidden sm:block">
                  {lesson.module.curriculum.title} &bull; {lesson.module.title}
                </p>
              </div>
            </div>

            {/* Navigation & Fullscreen */}
            <div className="flex items-center gap-2 shrink-0">
              {lesson.navigation.prev && (
                <Link href={`/lessons/${lesson.navigation.prev.id}`}>
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <ChevronLeftIcon className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              {lesson.navigation.next && (
                <Link href={`/lessons/${lesson.navigation.next.id}`}>
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-[61px] z-30 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto scrollbar-hide">
            {tabConfig.map((tab) => {
              const isActive = activeTab === tab.id;
              const isComplete = completedTabs.has(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    markTabComplete(tab.id);
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-primary-500 text-white shadow-[var(--shadow-primary)]"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {isComplete && !isActive ? (
                    <CheckCircleIcon className="w-4 h-4 text-success" />
                  ) : (
                    tab.icon
                  )}
                  <span className="text-sm font-medium sm:inline">
                    <span className="sm:hidden">{tab.mobileLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area - Full Width */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Card className="overflow-visible">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {activeTab === "story" && <StoryTab story={lesson.story} />}
            {activeTab === "chessercises" && <ChessercisesTab chessercises={lesson.chessercises} />}
            {activeTab === "gameplay" && <GameplayTab exercises={lesson.exercises} />}
            {activeTab === "video" && (
              <VideoTab
                videoUrl={lesson.videoUrl}
                title={`Lesson ${lesson.number}: ${lesson.title}`}
                thumbnail={lesson.thumbnail}
              />
            )}
          </CardContent>
        </Card>

        {/* Bottom Navigation - Mobile Friendly */}
        <div className="flex items-center justify-between mt-6 gap-4">
          {lesson.navigation.prev ? (
            <Link href={`/lessons/${lesson.navigation.prev.id}`} className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full sm:w-auto">
                <ChevronLeftIcon className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="truncate">
                  <span className="sm:hidden">Previous</span>
                  <span className="hidden sm:inline">Previous Lesson</span>
                </span>
              </Button>
            </Link>
          ) : (
            <div className="flex-1 sm:flex-initial" />
          )}

          {lesson.navigation.next ? (
            <Link href={`/lessons/${lesson.navigation.next.id}`} className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto">
                <span className="truncate">
                  <span className="sm:hidden">Next</span>
                  <span className="hidden sm:inline">Next Lesson</span>
                </span>
                <ChevronRightIcon className="w-4 h-4 ml-1 sm:ml-2" />
              </Button>
            </Link>
          ) : (
            <div className="flex-1 sm:flex-initial" />
          )}
        </div>
      </div>
    </main>
  );
}

// Story Tab Component - Optimized for full width
function StoryTab({ story, fullscreen = false }: { story: LessonData["story"]; fullscreen?: boolean }) {
  const containerClass = fullscreen
    ? "max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
    : "w-full";

  // Handle Canva embed content (from WordPress import)
  if (story.content && hasCanvaEmbed(story.content)) {
    const { canvaEmbed } = story.content as {
      canvaEmbed: { url: string; designId: string; height?: string };
    };
    return (
      <div className={`space-y-6 ${containerClass}`}>
        {story.introduction && (
          <div className="prose prose-lg max-w-none">
            <p className="text-body-lg text-neutral-700 leading-relaxed">
              {story.introduction}
            </p>
          </div>
        )}

        {story.teacherTip && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <LightBulbIcon className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide uppercase">
                Teacher Tip
              </span>
            </div>
            <p className="text-white/95 text-body leading-relaxed">{story.teacherTip}</p>
          </div>
        )}

        <div className="pt-4">
          <h3 className="text-heading text-neutral-900 mb-4 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-primary-500" />
            Story
          </h3>
          <CanvaEmbed
            url={canvaEmbed.url}
            designId={canvaEmbed.designId}
            height={fullscreen ? "calc(100vh - 120px)" : undefined}
            title="Story Content"
          />
        </div>
      </div>
    );
  }

  // Handle rich text paragraphs content (from WordPress import)
  if (
    story.content &&
    (story.content as { type?: string }).type === "rich_text" &&
    (story.content as { paragraphs?: unknown[] }).paragraphs
  ) {
    const paragraphs = (story.content as { paragraphs: Array<{ type?: string; content: string }> }).paragraphs;
    return (
      <div className={`space-y-6 ${containerClass}`}>
        {story.introduction && (
          <div className="prose prose-lg max-w-none">
            <p className="text-body-lg text-neutral-700 leading-relaxed">
              {story.introduction}
            </p>
          </div>
        )}

        {story.teacherTip && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 sm:p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <LightBulbIcon className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide uppercase">
                Teacher Tip
              </span>
            </div>
            <p className="text-white/95 text-body leading-relaxed">{story.teacherTip}</p>
          </div>
        )}

        <div className="pt-4">
          <h3 className="text-heading text-neutral-900 mb-4 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-primary-500" />
            Story
          </h3>
          <div className="space-y-4">
            {paragraphs.map((paragraph, index) => {
              if (paragraph.type === "interactive_moment") {
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-accent-orange to-warning text-white p-4 sm:p-5 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <StarIcon className="w-5 h-5" />
                      <span className="font-semibold text-sm tracking-wide uppercase">
                        Interactive Moment
                      </span>
                    </div>
                    <p className="text-white/95 text-body leading-relaxed">{paragraph.content}</p>
                  </div>
                );
              }
              return (
                <p
                  key={index}
                  className="text-body-lg text-neutral-700 leading-relaxed"
                >
                  {paragraph.content}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default: Handle legacy format or no content
  return (
    <div className={`space-y-6 ${containerClass}`}>
      {story.introduction && (
        <div className="prose prose-lg max-w-none">
          <p className="text-body-lg text-neutral-700 leading-relaxed">
            {story.introduction}
          </p>
        </div>
      )}

      {story.teacherTip && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 sm:p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <LightBulbIcon className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wide uppercase">
              Teacher Tip
            </span>
          </div>
          <p className="text-white/95 text-body leading-relaxed">{story.teacherTip}</p>
        </div>
      )}

      {story.paragraphs && story.paragraphs.length > 0 && (
        <div className="pt-4">
          <h3 className="text-heading text-neutral-900 mb-4 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-primary-500" />
            Story
          </h3>
          <div className="space-y-4">
            {story.paragraphs.map((paragraph, index) => {
              if (paragraph.type === "interactive_moment") {
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-accent-orange to-warning text-white p-4 sm:p-5 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <StarIcon className="w-5 h-5" />
                      <span className="font-semibold text-sm tracking-wide uppercase">
                        Interactive Moment
                      </span>
                    </div>
                    <p className="text-white/95 text-body leading-relaxed">{paragraph.content}</p>
                  </div>
                );
              }
              return (
                <p
                  key={index}
                  className="text-body-lg text-neutral-700 leading-relaxed"
                >
                  {paragraph.content}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {!story.introduction &&
        !story.teacherTip &&
        (!story.paragraphs || story.paragraphs.length === 0) &&
        !story.content && (
          <div className="text-center py-16">
            <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <p className="text-neutral-500 text-lg">No story content for this lesson yet.</p>
          </div>
        )}
    </div>
  );
}

// Chessercises Tab Component
function ChessercisesTab({
  chessercises,
  fullscreen = false,
}: {
  chessercises: LessonData["chessercises"];
  fullscreen?: boolean;
}) {
  const containerClass = fullscreen
    ? "max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
    : "w-full";

  const hasContent =
    (chessercises.warmUp?.instructions?.length ?? 0) > 0 ||
    (chessercises.dressUp?.instructions?.length ?? 0) > 0 ||
    (chessercises.chessUp?.instructions?.length ?? 0) > 0;

  if (!hasContent) {
    return (
      <div className={`text-center py-16 ${containerClass}`}>
        <StarIcon className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
        <p className="text-neutral-500 text-lg">No chessercises for this lesson yet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${containerClass}`}>
      {/* Warm Up */}
      {chessercises.warmUp?.instructions &&
        chessercises.warmUp.instructions.length > 0 && (
          <section className="bg-gradient-to-br from-primary-50 to-white rounded-xl p-5 sm:p-6 border border-primary-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                <span className="text-lg">♟</span>
              </div>
              <h3 className="text-heading text-neutral-900">Warm Up</h3>
            </div>
            <ul className="space-y-3">
              {chessercises.warmUp.instructions.map(
                (instruction: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-body-lg text-neutral-700"
                  >
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    {instruction}
                  </li>
                )
              )}
            </ul>
          </section>
        )}

      {/* Dress Up */}
      {chessercises.dressUp?.instructions &&
        chessercises.dressUp.instructions.length > 0 && (
          <section className="bg-gradient-to-br from-accent-orange-light to-white rounded-xl p-5 sm:p-6 border border-accent-orange">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent-orange rounded-lg flex items-center justify-center text-white shadow-sm">
                <span className="text-lg">♟</span>
              </div>
              <h3 className="text-heading text-neutral-900">Dress Up</h3>
            </div>
            <ul className="space-y-3">
              {chessercises.dressUp.instructions.map(
                (instruction: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-body-lg text-neutral-700"
                  >
                    <span className="w-6 h-6 bg-accent-orange-light text-accent-orange rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    {instruction}
                  </li>
                )
              )}
            </ul>
          </section>
        )}

      {/* Chess Up */}
      {chessercises.chessUp?.instructions &&
        chessercises.chessUp.instructions.length > 0 && (
          <section className="bg-gradient-to-br from-success-light to-white rounded-xl p-5 sm:p-6 border border-success">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center text-white shadow-sm">
                <span className="text-lg">♟</span>
              </div>
              <h3 className="text-heading text-neutral-900">Chess Up</h3>
            </div>
            <ul className="space-y-3">
              {chessercises.chessUp.instructions.map(
                (instruction: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-body-lg text-neutral-700"
                  >
                    <span className="w-6 h-6 bg-success-light text-success rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    {instruction}
                  </li>
                )
              )}
            </ul>
          </section>
        )}
    </div>
  );
}

// Video Tab Component
function VideoTab({
  videoUrl,
  title,
  thumbnail,
  fullscreen = false,
}: {
  videoUrl: string;
  title: string;
  thumbnail: string;
  fullscreen?: boolean;
}) {
  const containerClass = fullscreen
    ? "max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
    : "w-full";

  if (!videoUrl) {
    return (
      <div className={`text-center py-16 ${containerClass}`}>
        <PlayIcon className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
        <p className="text-neutral-500 text-lg">No video available for this lesson.</p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-dropdown">
        <VideoPlayer
          url={videoUrl}
          title={title}
          thumbnail={thumbnail}
          onStart={() => console.log("Video started")}
          onComplete={() => console.log("Video completed")}
          onProgress={(p) => console.log("Progress:", p)}
        />
      </div>
    </div>
  );
}

// Gameplay Tab Component
function GameplayTab({
  exercises,
  fullscreen = false
}: {
  exercises: LessonData["exercises"];
  fullscreen?: boolean;
}) {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [userMove, setUserMove] = useState<{ from: string; to: string } | null>(null);

  const containerClass = fullscreen
    ? "max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
    : "w-full";

  if (exercises.length === 0) {
    return (
      <div className={`text-center py-16 ${containerClass}`}>
        <PuzzlePieceIcon className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
        <p className="text-neutral-500 text-lg">No exercises for this lesson yet.</p>
      </div>
    );
  }

  const exercise = exercises[currentExercise];

  const handleMove = (from: string, to: string) => {
    setUserMove({ from, to });
    console.log(`Move: ${from} -> ${to}`);
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setShowSolution(false);
      setUserMove(null);
    }
  };

  const handlePrevExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1);
      setShowSolution(false);
      setUserMove(null);
    }
  };

  return (
    <div className={`space-y-6 ${containerClass}`}>
      {/* Exercise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-heading text-neutral-900">
          Exercise {exercise.number}: {exercise.title || "Practice"}
        </h3>
        <div className="flex gap-2 flex-wrap">
          {exercises.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentExercise(index);
                setShowSolution(false);
                setUserMove(null);
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                currentExercise === index
                  ? "bg-primary-500 text-white shadow-[var(--shadow-primary)]"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <p className="text-body-lg text-neutral-700 bg-neutral-50 p-4 rounded-xl">{exercise.instructions}</p>

      {/* Interactive Chessboard */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-md">
          <Chessboard
            fen={exercise.fen}
            interactive={true}
            size="lg"
            onMove={handleMove}
            lastMove={userMove || undefined}
            highlightSquares={exercise.highlightSquares || []}
          />
        </div>

        {userMove && (
          <div className="p-4 bg-info-light rounded-xl border border-info w-full max-w-md">
            <p className="text-sm text-info-dark text-center">
              Your move:{" "}
              <span className="font-mono font-bold">
                {userMove.from} → {userMove.to}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={() => setShowSolution(!showSolution)}>
          {showSolution ? "Hide Solution" : "Show Solution"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setUserMove(null)}
          disabled={!userMove}
        >
          Reset Board
        </Button>
      </div>

      {showSolution && (
        <div className="bg-success-light p-5 rounded-xl border border-success/20">
          <h4 className="font-semibold text-success-dark mb-2 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            Solution
          </h4>
          <p className="text-body-lg text-success-dark">{exercise.solution}</p>
          {exercise.explanation && (
            <p className="text-body text-success-dark/80 mt-2">
              {exercise.explanation}
            </p>
          )}
        </div>
      )}

      {/* Exercise Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <Button
          variant="outline"
          onClick={handlePrevExercise}
          disabled={currentExercise === 0}
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-neutral-500 font-medium">
          {currentExercise + 1} of {exercises.length}
        </span>
        <Button
          onClick={handleNextExercise}
          disabled={currentExercise === exercises.length - 1}
        >
          Next
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
