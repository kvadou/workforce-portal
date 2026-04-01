"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  FlagIcon,
  HeartIcon,
  LightBulbIcon,
  PencilSquareIcon,
  PlusIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  useLesson,
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
} from "@/hooks/useLessons";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface SkillFormData {
  title: string;
  description: string;
}

// Skill category icons for visual variety
const skillIcons = [LightBulbIcon, FlagIcon, LightBulbIcon, HeartIcon, UsersIcon, PuzzlePieceIcon, SparklesIcon];

export default function SkillsPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: lesson, isLoading: lessonLoading } = useLesson(id);
  const { data: skills, isLoading: skillsLoading } = useSkills(id);
  const createMutation = useCreateSkill();
  const updateMutation = useUpdateSkill();
  const deleteMutation = useDeleteSkill();

  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<SkillFormData>({
    title: "",
    description: "",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    skillId: string;
    skillName: string;
  }>({ isOpen: false, skillId: "", skillName: "" });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
    });
    setEditingSkill(null);
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (skill: {
    id: string;
    title: string;
    description: string;
  }) => {
    setFormData({
      title: skill.title,
      description: skill.description,
    });
    setEditingSkill(skill.id);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSkill) {
        await updateMutation.mutateAsync({
          lessonId: id,
          skillId: editingSkill,
          data: formData,
        });
        toast.success("Skill updated");
      } else {
        await createMutation.mutateAsync({ lessonId: id, data: formData });
        toast.success("Skill created");
      }
      resetForm();
    } catch {
      toast.error(editingSkill ? "Failed to update skill" : "Failed to create skill");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        lessonId: id,
        skillId: deleteDialog.skillId,
      });
      toast.success("Skill deleted");
      setDeleteDialog({ isOpen: false, skillId: "", skillName: "" });
    } catch {
      toast.error("Failed to delete skill");
    }
  };

  if (lessonLoading || skillsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Color palette for skill cards
  const skillColors = [
    "from-info-light to-cyan-100 text-info",
    "from-primary-100 to-accent-pink-light text-primary-600",
    "from-success-light to-success-light text-success",
    "from-accent-orange-light to-warning-light text-accent-orange",
    "from-error-light to-accent-pink-light text-error",
    "from-accent-navy-light to-violet-100 text-accent-navy",
    "from-success-light to-cyan-100 text-success",
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <Link
          href={`/admin/lessons/${id}`}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Lesson
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-success-light rounded-[var(--radius-lg)] flex items-center justify-center">
              <LightBulbIcon className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-heading-lg text-neutral-900">
                Developmental Skills
              </h1>
              <p className="text-body text-neutral-500">
                Lesson {lesson?.number}: {lesson?.title}
              </p>
            </div>
          </div>
          {!isCreating && !editingSkill && (
            <Button onClick={handleStartCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 bg-success-light border border-success">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-success-light rounded-lg flex items-center justify-center flex-shrink-0">
              <LightBulbIcon className="h-4 w-4 text-success" />
            </div>
            <div>
              <h3 className="font-medium text-success-dark mb-1">
                What are Developmental Skills?
              </h3>
              <p className="text-body-sm text-success-dark">
                These are the cognitive, social, and emotional skills that students
                develop through this lesson. Examples include critical thinking,
                pattern recognition, patience, and problem-solving.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills List */}
        <div className="space-y-4">
          <h2 className="text-heading-sm text-neutral-900">
            {skills?.length || 0} Skills
          </h2>

          {skills?.length === 0 && !isCreating ? (
            <Card>
              <CardContent className="py-12 text-center">
                <LightBulbIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-heading-sm text-neutral-900 mb-2">
                  No skills defined yet
                </h3>
                <p className="text-body text-neutral-500 mb-6">
                  Add developmental skills students will gain from this lesson
                </p>
                <Button onClick={handleStartCreate}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {skills?.map((skill, index) => {
                const IconComponent = skillIcons[index % skillIcons.length];
                const colorClass = skillColors[index % skillColors.length];

                return (
                  <Card
                    key={skill.id}
                    className={`transition-all overflow-hidden ${
                      editingSkill === skill.id
                        ? "ring-2 ring-primary-500"
                        : "hover:shadow-card-hover"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`h-12 w-12 rounded-[var(--radius-lg)] bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900 mb-1">
                            {skill.title}
                          </h3>
                          <p className="text-body-sm text-neutral-600">
                            {skill.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(skill)}
                            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                skillId: skill.id,
                                skillName: skill.title,
                              })
                            }
                            className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit/Create Form */}
        {(isCreating || editingSkill) && (
          <Card className="h-fit sticky top-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-heading-sm text-neutral-900">
                {editingSkill ? "Edit Skill" : "New Skill"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-[var(--radius-md)] transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-body-sm font-medium text-neutral-700 mb-1"
                  >
                    Skill Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Pattern Recognition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-body-sm font-medium text-neutral-700 mb-1"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Describe how this skill is developed through the lesson..."
                  />
                </div>

                {/* Suggested Skills */}
                <div className="pt-2">
                  <p className="text-body-sm text-neutral-500 mb-2">
                    Common developmental skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Critical Thinking",
                      "Problem Solving",
                      "Pattern Recognition",
                      "Patience",
                      "Focus",
                      "Decision Making",
                      "Planning Ahead",
                      "Spatial Reasoning",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, title: suggestion })
                        }
                        className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      !formData.title ||
                      !formData.description
                    }
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {editingSkill ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, skillId: "", skillName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Skill"
        description="Are you sure you want to delete this developmental skill? This action cannot be undone."
        itemName={deleteDialog.skillName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
