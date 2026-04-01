"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ClientHeader } from "@/components/portal/ClientHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClass, useStudents, useAddStudent } from "@/hooks/useClasses";
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
interface PageProps {
  params: Promise<{ id: string }>;
}

// Mock sessions data - will be replaced with real API later
const mockSessions = [
  {
    id: "1",
    date: "2024-01-15",
    lesson: { number: 6, title: "The King" },
    attendance: 7,
    duration: 45,
  },
  {
    id: "2",
    date: "2024-01-08",
    lesson: { number: 5, title: "The Pawns" },
    attendance: 8,
    duration: 50,
  },
  {
    id: "3",
    date: "2024-01-01",
    lesson: { number: 4, title: "The Rook" },
    attendance: 6,
    duration: 45,
  },
];

const avatarOptions = ["🦁", "🐻", "🦊", "🐼", "🐨", "🐰", "🐸", "🦄", "🐵", "🐧"];

export default function ClassDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentFirstName, setNewStudentFirstName] = useState("");
  const [newStudentLastName, setNewStudentLastName] = useState("");
  const [newStudentAvatar, setNewStudentAvatar] = useState(avatarOptions[0]);
  const [activeTab, setActiveTab] = useState<"students" | "sessions">("students");

  // Fetch class and students from API
  const { data: classData, isLoading: classLoading, error: classError } = useClass(id);
  const { data: students = [], isLoading: studentsLoading } = useStudents(id);
  const addStudentMutation = useAddStudent();
  const sessions = mockSessions; // Will be replaced with real API later

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentFirstName.trim()) return;

    try {
      await addStudentMutation.mutateAsync({
        classId: id,
        data: {
          firstName: newStudentFirstName.trim(),
          lastName: newStudentLastName.trim() || undefined,
          avatar: newStudentAvatar,
        },
      });
      setIsAddingStudent(false);
      setNewStudentFirstName("");
      setNewStudentLastName("");
      setNewStudentAvatar(avatarOptions[0]);
    } catch (err) {
      console.error("Failed to add student:", err);
    }
  };

  // Calculate average progress (for now use a placeholder since we need progress data)
  const averageProgress = students.length > 0
    ? students.reduce((sum, s) => sum + ((s.progress?.filter(p => p.status === "COMPLETED").length || 0)), 0) / students.length
    : 0;

  // Loading state
  if (classLoading) {
    return (
      <div className="min-h-screen bg-accent-light">
        <ClientHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (classError || !classData) {
    return (
      <div className="min-h-screen bg-accent-light">
        <ClientHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/classes"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Classes
          </Link>
          <Card className="border-error bg-error-light">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4 text-error-dark">
                <ExclamationCircleIcon className="w-12 h-12" />
                <p className="text-lg font-medium">Class not found</p>
                <p className="text-sm text-error">The class you're looking for doesn't exist or has been deleted.</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-light">
      <ClientHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Classes
        </Link>

        {/* Class Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-[var(--radius-lg)] flex items-center justify-center"
              style={{ backgroundColor: `${classData.color || "#6366f1"}20` }}
            >
              <AcademicCapIcon
                className="w-8 h-8"
                style={{ color: classData.color || "#6366f1" }}
              />
            </div>
            <div>
              <h1 className="text-display text-neutral-900">{classData.name}</h1>
              <p className="text-body-lg text-neutral-500">
                {classData.description || "No description"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <PencilSquareIcon className="w-4 h-4 mr-2" />
              Edit Class
            </Button>
            <Button size="sm" onClick={() => setIsAddingStudent(true)}>
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{ backgroundColor: `${classData.color || "#6366f1"}20` }}
              >
                <UsersIcon className="w-5 h-5" style={{ color: classData.color || "#6366f1" }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {students.length}
                </p>
                <p className="text-body-sm text-neutral-500">Students</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-success-light flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {averageProgress.toFixed(1)}
                </p>
                <p className="text-body-sm text-neutral-500">
                  Avg Lessons Completed
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-info-light flex items-center justify-center">
                <BookOpenIcon className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {classData.currentLesson?.number || 1}
                </p>
                <p className="text-body-sm text-neutral-500">Current Lesson</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-warning-light flex items-center justify-center">
                <CalendarDaysIcon className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {sessions.length}
                </p>
                <p className="text-body-sm text-neutral-500">Sessions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Lesson Banner */}
        {classData.currentLesson && (
          <Card className="mb-6 overflow-hidden">
            <div
              className="h-1"
              style={{ backgroundColor: classData.color || "#6366f1" }}
            />
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-[var(--radius-md)] flex items-center justify-center">
                    <span className="text-primary-600 font-bold">
                      {classData.currentLesson.number}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-sm text-neutral-500">
                      Currently Teaching
                    </p>
                    <h3 className="font-semibold text-neutral-900">
                      {classData.currentLesson.title}
                    </h3>
                  </div>
                </div>
                <Link href={`/lessons/${classData.currentLesson.id}`}>
                  <Button variant="outline" size="sm">
                    View Lesson
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Student Form */}
        {isAddingStudent && (
          <Card className="mb-6 border-2 border-primary-200">
            <CardHeader>
              <h2 className="text-heading-sm text-neutral-900">
                Add New Student
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-body-sm font-medium text-neutral-700 mb-1"
                    >
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={newStudentFirstName}
                      onChange={(e) => setNewStudentFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Emma"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-body-sm font-medium text-neutral-700 mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={newStudentLastName}
                      onChange={(e) => setNewStudentLastName(e.target.value)}
                      className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Johnson"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 mb-2">
                    Choose an Avatar
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setNewStudentAvatar(avatar)}
                        className={`w-12 h-12 text-2xl rounded-full bg-neutral-100 hover:bg-neutral-200 transition-all ${
                          newStudentAvatar === avatar
                            ? "ring-2 ring-offset-2 ring-primary-500 bg-primary-100"
                            : ""
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingStudent(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addStudentMutation.isPending || !newStudentFirstName}
                  >
                    {addStudentMutation.isPending && (
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Add Student
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-neutral-200 mb-6">
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-3 px-1 text-body font-medium transition-colors border-b-2 ${
              activeTab === "students"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`pb-3 px-1 text-body font-medium transition-colors border-b-2 ${
              activeTab === "sessions"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Sessions ({sessions.length})
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <ArrowPathIcon className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500 mb-4">No students in this class yet</p>
                <Button onClick={() => setIsAddingStudent(true)}>
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  Add First Student
                </Button>
              </div>
            ) : (
              students.map((student) => {
                const completedLessons = student.progress?.filter(p => p.status === "COMPLETED").length || 0;
                const totalLessons = 10; // Placeholder - would come from curriculum data

                return (
                  <Card key={student.id} hover className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary-100 to-accent-navy-light flex items-center justify-center text-2xl">
                          {student.avatar || "🎓"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900">
                            {student.firstName} {student.lastName || ""}
                          </h3>
                          <p className="text-body-sm text-neutral-500">
                            {student.nickname ? `"${student.nickname}"` : `${completedLessons} lessons completed`}
                          </p>

                          {/* Progress bar */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                              <span>{completedLessons} lessons completed</span>
                              <span>
                                {Math.round((completedLessons / totalLessons) * 100)}%
                              </span>
                            </div>
                            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-accent-navy-light rounded-full transition-all"
                                style={{
                                  width: `${Math.min((completedLessons / totalLessons) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-[var(--radius-md)] transition-colors">
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-heading-sm text-neutral-900">
                Class Sessions
              </h2>
              <Button size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Log Session
              </Button>
            </CardHeader>
            <div className="divide-y divide-border">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-neutral-100 rounded-[var(--radius-md)] flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900">
                      Lesson {session.lesson.number}: {session.lesson.title}
                    </h3>
                    <p className="text-body-sm text-neutral-500">
                      {new Date(session.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-body-sm text-neutral-500">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      <span>{session.attendance} attended</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{session.duration} min</span>
                    </div>
                  </div>
                  <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-[var(--radius-md)] transition-colors">
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
