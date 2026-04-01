"use client";

import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  PuzzlePieceIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  Square3Stack3DIcon,
  TrashIcon,
  TrophyIcon,
  UsersIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAdminCourse,
  useUpdateCourse,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  type TrainingModule,
} from "@/hooks/useTrainingCourses";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useVimeoMetadata, useConfigureVimeoDomains } from "@/hooks/useVimeo";
import { parseVimeoInput } from "@/lib/vimeo";
import { CanvaDesignPicker } from "@/components/admin/CanvaDesignPicker";
import type { CourseCategory, CourseDifficulty, ModuleContentType } from "@prisma/client";

const categoryOptions: { value: CourseCategory; label: string }[] = [
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "TEACHING_SKILLS", label: "Teaching Skills" },
  { value: "CHESS_SKILLS", label: "Chess Skills" },
  { value: "BUSINESS", label: "Business" },
  { value: "LEADERSHIP", label: "Leadership" },
  { value: "CERTIFICATION", label: "Certification" },
];

const difficultyOptions: { value: CourseDifficulty; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const contentTypeOptions: { value: ModuleContentType; label: string; icon: React.ReactNode }[] = [
  { value: "VIDEO", label: "VideoCameraIcon", icon: <VideoCameraIcon className="h-4 w-4" /> },
  { value: "ARTICLE", label: "Article", icon: <DocumentTextIcon className="h-4 w-4" /> },
  { value: "QUIZ", label: "Quiz Only", icon: <QuestionMarkCircleIcon className="h-4 w-4" /> },
  { value: "MIXED", label: "Mixed Content", icon: <Square3Stack3DIcon className="h-4 w-4" /> },
  { value: "CANVA", label: "Canva Design", icon: <PhotoIcon className="h-4 w-4" /> },
  { value: "CHESS_PUZZLE", label: "Chess PuzzlePieceIcon", icon: <PuzzlePieceIcon className="h-4 w-4" /> },
  { value: "CHESS_LESSON", label: "Chess Lesson", icon: <TrophyIcon className="h-4 w-4" /> },
];

interface ModuleFormData {
  id?: string;
  title: string;
  description: string;
  contentType: ModuleContentType;
  videoUrl: string;
  content: string;
  hasQuiz: boolean;
  passingScore: number;
}

const emptyModuleForm: ModuleFormData = {
  title: "",
  description: "",
  contentType: "VIDEO",
  videoUrl: "",
  content: "",
  hasQuiz: false,
  passingScore: 80,
};

export default function TrainingCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: course, isLoading, error } = useAdminCourse(id);
  const updateMutation = useUpdateCourse();
  const createModuleMutation = useCreateModule();
  const updateModuleMutation = useUpdateModule();
  const deleteModuleMutation = useDeleteModule();

  const [isEditing, setIsEditing] = useState(false);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>(emptyModuleForm);
  const [moduleDomainsConfigured, setModuleDomainsConfigured] = useState<boolean | null>(null);
  const [deleteModule, setDeleteModule] = useState<{ id: string; title: string } | null>(null);

  const {
    isLoading: isFetchingMetadata,
    error: fetchError,
    fetchMetadata,
  } = useVimeoMetadata();

  const {
    isConfiguring,
    error: configError,
    configureDomains,
  } = useConfigureVimeoDomains();

  const handleFetchVideoMetadata = async () => {
    const parsed = parseVimeoInput(moduleForm.videoUrl);
    if (!parsed) return;

    const result = await fetchMetadata(parsed.videoId);
    if (result?.metadata) {
      const metadata = result.metadata;
      setModuleForm((prev) => ({
        ...prev,
        title: prev.title || metadata.name,
      }));
      setModuleDomainsConfigured(result.allDomainsConfigured);
    }
  };

  const handleConfigureVideoDomains = async () => {
    const parsed = parseVimeoInput(moduleForm.videoUrl);
    if (!parsed) return;

    const result = await configureDomains(parsed.videoId);
    if (result) {
      setModuleDomainsConfigured(result.allDomainsConfigured);
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnailUrl: "",
    duration: "",
    difficulty: "BEGINNER" as CourseDifficulty,
    category: "TEACHING_SKILLS" as CourseCategory,
    isRequired: false,
    isPublished: false,
  });

  // Load form data when course loads
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        slug: course.slug,
        description: course.description || "",
        thumbnailUrl: course.thumbnailUrl || "",
        duration: course.duration?.toString() || "",
        difficulty: course.difficulty,
        category: course.category,
        isRequired: course.isRequired,
        isPublished: course.isPublished,
      });
    }
  }, [course]);

  const handleSaveCourse = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          title: formData.title,
          slug: formData.slug,
          description: formData.description || undefined,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          difficulty: formData.difficulty,
          category: formData.category,
          isRequired: formData.isRequired,
          isPublished: formData.isPublished,
        },
      });
      toast.success("Course updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course");
    }
  };

  const handleSaveModule = async () => {
    try {
      if (moduleForm.id) {
        await updateModuleMutation.mutateAsync({
          courseId: id,
          moduleId: moduleForm.id,
          data: {
            title: moduleForm.title,
            description: moduleForm.description || undefined,
            contentType: moduleForm.contentType,
            videoUrl: moduleForm.videoUrl || undefined,
            content: moduleForm.content || undefined,
            hasQuiz: moduleForm.hasQuiz,
            passingScore: moduleForm.passingScore,
          },
        });
        toast.success("Module updated");
      } else {
        await createModuleMutation.mutateAsync({
          courseId: id,
          data: {
            title: moduleForm.title,
            description: moduleForm.description || undefined,
            contentType: moduleForm.contentType,
            videoUrl: moduleForm.videoUrl || undefined,
            content: moduleForm.content || undefined,
            hasQuiz: moduleForm.hasQuiz,
            passingScore: moduleForm.passingScore,
          },
        });
        toast.success("Module created");
      }
      setModuleFormOpen(false);
      setModuleForm(emptyModuleForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save module");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModuleMutation.mutateAsync({ courseId: id, moduleId });
      toast.success("Module deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete module");
    } finally {
      setDeleteModule(null);
    }
  };

  const openEditModule = (module: TrainingModule) => {
    setModuleForm({
      id: module.id,
      title: module.title,
      description: module.description || "",
      contentType: module.contentType,
      videoUrl: module.videoUrl || "",
      content: module.content || "",
      hasQuiz: module.hasQuiz,
      passingScore: module.passingScore || 80,
    });
    setModuleFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 text-center">
        <div className="text-error mb-4">Course not found</div>
        <Link href="/admin/training">
          <Button>Back to Training</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/training"
          className="inline-flex items-center gap-1 text-neutral-500 hover:text-primary-500 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Training Courses
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
              <AcademicCapIcon className="h-8 w-8 text-primary-500" />
              {course.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-2 py-1 text-xs rounded ${
                  course.isPublished
                    ? "bg-success-light text-success-dark"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {course.isPublished ? "Published" : "Draft"}
              </span>
              {course.isRequired && (
                <span className="px-2 py-1 text-xs rounded bg-error-light text-error-dark">
                  Required
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFormData({
                  title: course.title,
                  slug: course.slug,
                  description: course.description || "",
                  thumbnailUrl: course.thumbnailUrl || "",
                  duration: course.duration?.toString() || "",
                  difficulty: course.difficulty,
                  category: course.category,
                  isRequired: course.isRequired,
                  isPublished: course.isPublished,
                });
                setIsEditing(true);
              }}
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Edit Course
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Modules",
            value: course.modules?.length || 0,
            icon: <Square3Stack3DIcon className="h-5 w-5" />,
            color: "bg-info-light text-info",
          },
          {
            label: "Enrolled",
            value: course.enrollmentStats?.totalEnrolled || 0,
            icon: <UsersIcon className="h-5 w-5" />,
            color: "bg-primary-100 text-primary-600",
          },
          {
            label: "In Progress",
            value: course.enrollmentStats?.inProgress || 0,
            icon: <ClockIcon className="h-5 w-5" />,
            color: "bg-warning-light text-warning",
          },
          {
            label: "Completed",
            value: course.enrollmentStats?.completed || 0,
            icon: <CheckCircleIcon className="h-5 w-5" />,
            color: "bg-success-light text-success",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-body-sm text-neutral-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Course Modules</h2>
          <Button
            size="sm"
            onClick={() => {
              setModuleForm(emptyModuleForm);
              setModuleFormOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </CardHeader>
        <CardContent>
          {!course.modules || course.modules.length === 0 ? (
            <div className="text-center py-12">
              <Square3Stack3DIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-heading-sm text-neutral-900 mb-2">
                No modules yet
              </h3>
              <p className="text-body text-neutral-500 mb-4">
                Add modules to build your course content
              </p>
              <Button
                onClick={() => {
                  setModuleForm(emptyModuleForm);
                  setModuleFormOpen(true);
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Module
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {course.modules.map((module, index) => (
                <div
                  key={module.id}
                  className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg"
                >
                  <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900">{module.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        {contentTypeOptions.find((o) => o.value === module.contentType)?.icon}
                        {module.contentType}
                      </span>
                      {module.hasQuiz && (
                        <span className="flex items-center gap-1">
                          <QuestionMarkCircleIcon className="h-3 w-3" />
                          Has Quiz
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModule(module)}
                      className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModule({ id: module.id, title: module.title })}
                      className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-lg"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteModule !== null}
        onClose={() => setDeleteModule(null)}
        onConfirm={() => deleteModule && handleDeleteModule(deleteModule.id)}
        title="Delete Module"
        message={deleteModule ? `Delete module "${deleteModule.title}"? This cannot be undone.` : ""}
        variant="danger"
        confirmLabel="Delete"
      />

      {/* Edit Course Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold text-neutral-900">Edit Course</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as CourseCategory,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty: e.target.value as CourseDifficulty,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {difficultyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={(e) =>
                      setFormData({ ...formData, isRequired: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">Required course</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublished: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">Published</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCourse}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      CheckIcon Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Module Form Modal */}
      {moduleFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold text-neutral-900">
                {moduleForm.id ? "Edit Module" : "Add Module"}
              </h2>
              <button
                onClick={() => setModuleFormOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, title: e.target.value })
                  }
                  placeholder="e.g., Introduction to Teaching"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Content Type
                </label>
                <div className="flex gap-2">
                  {contentTypeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setModuleForm({ ...moduleForm, contentType: opt.value })
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                        moduleForm.contentType === opt.value
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {(moduleForm.contentType === "VIDEO" ||
                moduleForm.contentType === "MIXED") && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      VideoCameraIcon URL (Vimeo)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={moduleForm.videoUrl}
                        onChange={(e) => {
                          setModuleForm({ ...moduleForm, videoUrl: e.target.value });
                          setModuleDomainsConfigured(null);
                        }}
                        placeholder="https://vimeo.com/..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={handleFetchVideoMetadata}
                        disabled={!moduleForm.videoUrl || isFetchingMetadata}
                        className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isFetchingMetadata ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        )}
                        Fetch Info
                      </button>
                    </div>
                    {(fetchError || configError) && (
                      <p className="mt-1 text-xs text-error">
                        {fetchError?.message || configError?.message}
                      </p>
                    )}
                  </div>

                  {/* Privacy Status */}
                  {moduleDomainsConfigured !== null && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                          moduleDomainsConfigured
                            ? "bg-success-light text-success-dark"
                            : "bg-warning-light text-warning-dark"
                        }`}
                      >
                        {moduleDomainsConfigured ? (
                          <>
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            Embed domains configured
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                            Embed domains need configuration
                          </>
                        )}
                      </div>
                      {!moduleDomainsConfigured && (
                        <button
                          type="button"
                          onClick={handleConfigureVideoDomains}
                          disabled={isConfiguring}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs bg-warning-light text-warning-dark rounded-lg hover:bg-warning-light transition-colors disabled:opacity-50"
                        >
                          {isConfiguring ? (
                            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                          )}
                          Configure
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(moduleForm.contentType === "ARTICLE" ||
                moduleForm.contentType === "MIXED") && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Article Content
                  </label>
                  <textarea
                    value={moduleForm.content}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, content: e.target.value })
                    }
                    rows={6}
                    placeholder="Enter module content (supports markdown)"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {moduleForm.contentType === "CANVA" && (
                <CanvaModuleSection
                  content={moduleForm.content}
                  onChange={(content) => setModuleForm({ ...moduleForm, content })}
                />
              )}

              {moduleForm.contentType === "CHESS_PUZZLE" && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500">
                    Configure the chess puzzle content. The content field should be JSON with puzzle data.
                  </p>
                  <textarea
                    value={moduleForm.content}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, content: e.target.value })
                    }
                    rows={4}
                    placeholder='{"puzzleId": "...", "fen": "...", "moves": "e2e4 d7d5", "rating": 1200, "themes": ["fork"]}'
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                </div>
              )}

              {moduleForm.contentType === "CHESS_LESSON" && (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500">
                    Configure the chess lesson content. The content field should be JSON with lesson levels.
                  </p>
                  <textarea
                    value={moduleForm.content}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, content: e.target.value })
                    }
                    rows={6}
                    placeholder='{"title": "Lesson Title", "levels": [{"id": "1", "order": 0, "fen": "...", "goal": "...", "goalType": "CAPTURE_TARGETS", "targetSquares": ["e5"], "playerColor": "white"}]}'
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                </div>
              )}

              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moduleForm.hasQuiz}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, hasQuiz: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-medium">Include quiz</span>
                </label>

                {moduleForm.hasQuiz && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={moduleForm.passingScore}
                      onChange={(e) =>
                        setModuleForm({
                          ...moduleForm,
                          passingScore: parseInt(e.target.value) || 80,
                        })
                      }
                      min="0"
                      max="100"
                      className="w-24 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Quiz questions can be added after saving the module
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setModuleFormOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveModule}
                  disabled={
                    createModuleMutation.isPending || updateModuleMutation.isPending
                  }
                >
                  {createModuleMutation.isPending || updateModuleMutation.isPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {moduleForm.id ? "CheckIcon Changes" : "Add Module"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CanvaModuleSection({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Parse existing canva data from content JSON
  let canvaData: { canvaUrl?: string; canvaDesignId?: string; canvaTitle?: string } = {};
  try {
    if (content) canvaData = JSON.parse(content);
  } catch {
    // not JSON yet, that's fine
  }

  return (
    <div className="space-y-3">
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <PhotoIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">Canva Design</h3>
            <p className="text-sm text-neutral-500">
              {canvaData.canvaTitle || (canvaData.canvaUrl ? "Design selected" : "Select a design from Canva")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {canvaData.canvaUrl ? "Change Design" : "Select from Canva"}
        </button>
      </div>

      {canvaData.canvaUrl && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Embed URL
          </label>
          <input
            type="text"
            value={canvaData.canvaUrl}
            readOnly
            className="w-full px-4 py-2 border rounded-lg bg-neutral-50 text-sm text-neutral-600"
          />
        </div>
      )}

      <CanvaDesignPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(design) => {
          onChange(
            JSON.stringify({
              canvaUrl: design.embedUrl,
              canvaDesignId: design.id,
              canvaTitle: design.title,
            })
          );
          setPickerOpen(false);
        }}
        selectedId={canvaData.canvaDesignId}
      />
    </div>
  );
}
