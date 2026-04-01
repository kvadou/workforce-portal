"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  Bars3Icon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingVideo, OnboardingQuizQuestion, QuizQuestionType } from "@prisma/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ContentManagementProps {
  videos: OnboardingVideo[];
  questions: OnboardingQuizQuestion[];
}

interface QuizOption {
  id: string;
  text: string;
}

export function ContentManagement({
  videos,
  questions,
}: ContentManagementProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"videos" | "quiz">("videos");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<OnboardingVideo | null>(null);
  const [editingQuestion, setEditingQuestion] =
    useState<OnboardingQuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  // Video form state
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    vimeoId: "",
    duration: "",
    order: "0",
    isRequired: true,
  });

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    question: "",
    type: "MULTIPLE_CHOICE" as QuizQuestionType,
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ] as QuizOption[],
    correctAnswer: "",
    explanation: "",
    order: "0",
    category: "",
  });

  const resetVideoForm = useCallback(() => {
    setVideoForm({
      title: "",
      description: "",
      vimeoId: "",
      duration: "",
      order: "0",
      isRequired: true,
    });
    setEditingVideo(null);
  }, []);

  const resetQuestionForm = useCallback(() => {
    setQuestionForm({
      question: "",
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ],
      correctAnswer: "",
      explanation: "",
      order: "0",
      category: "",
    });
    setEditingQuestion(null);
  }, []);

  const handleSaveVideo = useCallback(async () => {
    setIsLoading(true);
    try {
      const method = editingVideo ? "PUT" : "POST";
      const response = await fetch("/api/admin/onboarding/content/videos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingVideo?.id,
          ...videoForm,
          duration: parseInt(videoForm.duration) || 0,
          order: parseInt(videoForm.order) || 0,
        }),
      });

      if (response.ok) {
        setShowVideoModal(false);
        resetVideoForm();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save video:", error);
    } finally {
      setIsLoading(false);
    }
  }, [editingVideo, videoForm, router, resetVideoForm]);

  const handleSaveQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const method = editingQuestion ? "PUT" : "POST";
      const response = await fetch("/api/admin/onboarding/content/questions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingQuestion?.id,
          ...questionForm,
          order: parseInt(questionForm.order) || 0,
        }),
      });

      if (response.ok) {
        setShowQuestionModal(false);
        resetQuestionForm();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save question:", error);
    } finally {
      setIsLoading(false);
    }
  }, [editingQuestion, questionForm, router, resetQuestionForm]);

  const handleDeleteVideo = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await fetch("/api/admin/onboarding/content/videos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to delete video:", error);
      } finally {
        setIsLoading(false);
        setDeleteVideoId(null);
      }
    },
    [router]
  );

  const handleDeleteQuestion = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await fetch("/api/admin/onboarding/content/questions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to delete question:", error);
      } finally {
        setIsLoading(false);
        setDeleteQuestionId(null);
      }
    },
    [router]
  );

  const openEditVideo = useCallback((video: OnboardingVideo) => {
    setVideoForm({
      title: video.title,
      description: video.description || "",
      vimeoId: video.vimeoId,
      duration: video.duration.toString(),
      order: video.order.toString(),
      isRequired: video.isRequired,
    });
    setEditingVideo(video);
    setShowVideoModal(true);
  }, []);

  const openEditQuestion = useCallback((question: OnboardingQuizQuestion) => {
    setQuestionForm({
      question: question.question,
      type: question.type,
      options: question.options as unknown as QuizOption[],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
      order: question.order.toString(),
      category: question.category || "",
    });
    setEditingQuestion(question);
    setShowQuestionModal(true);
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("videos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "videos"
              ? "bg-primary-100 text-primary-700"
              : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <PlayCircleIcon className="h-4 w-4" />
          Videos ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "quiz"
              ? "bg-primary-100 text-primary-700"
              : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <QuestionMarkCircleIcon className="h-4 w-4" />
          Quiz Questions ({questions.length})
        </button>
      </div>

      {/* Videos Tab */}
      {activeTab === "videos" && (
        <div>
          <button
            onClick={() => {
              resetVideoForm();
              setShowVideoModal(true);
            }}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Video
          </button>

          {videos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <PlayCircleIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No videos added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4"
                >
                  <Bars3Icon className="h-4 w-4 text-neutral-400" />
                  <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                    {video.order + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-body-md font-medium text-neutral-900">
                      {video.title}
                    </p>
                    <p className="text-body-sm text-neutral-500">
                      Vimeo: {video.vimeoId} • {Math.floor(video.duration / 60)}{" "}
                      min
                    </p>
                  </div>
                  {!video.isActive && (
                    <span className="text-body-xs text-neutral-400">
                      Inactive
                    </span>
                  )}
                  <button
                    onClick={() => openEditVideo(video)}
                    className="p-2 text-neutral-400 hover:text-neutral-600"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteVideoId(video.id)}
                    className="p-2 text-neutral-400 hover:text-error"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === "quiz" && (
        <div>
          <button
            onClick={() => {
              resetQuestionForm();
              setShowQuestionModal(true);
            }}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Question
          </button>

          {questions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <QuestionMarkCircleIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No questions added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((question) => {
                const options = question.options as unknown as QuizOption[];
                const correctOption = options.find(
                  (o) => o.id === question.correctAnswer
                );
                return (
                  <div
                    key={question.id}
                    className="bg-white rounded-lg shadow-sm p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                        {question.order + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-body-md font-medium text-neutral-900">
                          {question.question}
                        </p>
                        <p className="text-body-sm text-success mt-1">
                          Correct: {correctOption?.text}
                        </p>
                        {question.category && (
                          <span className="inline-block mt-2 text-body-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                            {question.category}
                          </span>
                        )}
                      </div>
                      {!question.isActive && (
                        <span className="text-body-xs text-neutral-400">
                          Inactive
                        </span>
                      )}
                      <button
                        onClick={() => openEditQuestion(question)}
                        className="p-2 text-neutral-400 hover:text-neutral-600"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteQuestionId(question.id)}
                        className="p-2 text-neutral-400 hover:text-error"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-md text-neutral-900">
                {editingVideo ? "Edit Video" : "Add Video"}
              </h2>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  resetVideoForm();
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) =>
                    setVideoForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Orientation Part 1 - Who is Acme Workforce?"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Vimeo ID *
                </label>
                <input
                  type="text"
                  value={videoForm.vimeoId}
                  onChange={(e) =>
                    setVideoForm((prev) => ({
                      ...prev,
                      vimeoId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="123456789"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                    Duration (seconds) *
                  </label>
                  <input
                    type="number"
                    value={videoForm.duration}
                    onChange={(e) =>
                      setVideoForm((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    placeholder="1080"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={videoForm.order}
                    onChange={(e) =>
                      setVideoForm((prev) => ({
                        ...prev,
                        order: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) =>
                    setVideoForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoForm.isRequired}
                  onChange={(e) =>
                    setVideoForm((prev) => ({
                      ...prev,
                      isRequired: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-body-sm text-neutral-700">
                  Required to complete onboarding
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  resetVideoForm();
                }}
                className="px-4 py-2 text-body-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVideo}
                disabled={
                  isLoading || !videoForm.title || !videoForm.vimeoId || !videoForm.duration
                }
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-body-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Video"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteVideoId !== null}
        onClose={() => setDeleteVideoId(null)}
        onConfirm={() => deleteVideoId && handleDeleteVideo(deleteVideoId)}
        title="Delete Video"
        message="Are you sure you want to delete this video?"
        variant="danger"
        confirmLabel="Delete"
      />

      <ConfirmDialog
        isOpen={deleteQuestionId !== null}
        onClose={() => setDeleteQuestionId(null)}
        onConfirm={() => deleteQuestionId && handleDeleteQuestion(deleteQuestionId)}
        title="Delete Question"
        message="Are you sure you want to delete this question?"
        variant="danger"
        confirmLabel="Delete"
      />

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-md text-neutral-900">
                {editingQuestion ? "Edit Question" : "Add Question"}
              </h2>
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  resetQuestionForm();
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Question *
                </label>
                <textarea
                  value={questionForm.question}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="What is the main teaching philosophy at Acme Workforce?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                    Type
                  </label>
                  <select
                    value={questionForm.type}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        type: e.target.value as QuizQuestionType,
                      }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={questionForm.category}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    placeholder="Admin Procedures"
                  />
                </div>
              </div>

              {questionForm.type === "MULTIPLE_CHOICE" && (
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-2">
                    Options * (click to mark correct)
                  </label>
                  <div className="space-y-2">
                    {questionForm.options.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setQuestionForm((prev) => ({
                              ...prev,
                              correctAnswer: option.id,
                            }))
                          }
                          className={`h-8 w-8 rounded-lg flex items-center justify-center border-2 transition-colors ${
                            questionForm.correctAnswer === option.id
                              ? "bg-success border-success text-white"
                              : "border-neutral-300 text-neutral-400 hover:border-success"
                          }`}
                        >
                          {questionForm.correctAnswer === option.id ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            option.id.toUpperCase()
                          )}
                        </button>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...questionForm.options];
                            newOptions[index].text = e.target.value;
                            setQuestionForm((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                          placeholder={`Option ${option.id.toUpperCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {questionForm.type === "TRUE_FALSE" && (
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-2">
                    Correct Answer *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="trueFalse"
                        checked={questionForm.correctAnswer === "true"}
                        onChange={() =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            correctAnswer: "true",
                          }))
                        }
                        className="h-4 w-4 text-primary-600"
                      />
                      <span>True</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="trueFalse"
                        checked={questionForm.correctAnswer === "false"}
                        onChange={() =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            correctAnswer: "false",
                          }))
                        }
                        className="h-4 w-4 text-primary-600"
                      />
                      <span>False</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Explanation (shown after quiz)
                </label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="This is correct because..."
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-neutral-700 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  value={questionForm.order}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      order: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  resetQuestionForm();
                }}
                className="px-4 py-2 text-body-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={
                  isLoading ||
                  !questionForm.question ||
                  !questionForm.correctAnswer
                }
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-body-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
