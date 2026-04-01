import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  // Fetch all lessons with videos from database
  const lessons = await prisma.lesson.findMany({
    where: {
      videoUrl: { not: null },
    },
    include: {
      module: {
        include: {
          curriculum: {
            select: { title: true },
          },
        },
      },
    },
    orderBy: [
      { module: { curriculum: { order: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  });

  // Get unique modules for navigation
  const modulesMap = new Map<string, { id: string; title: string; courseTitle: string; lessonCount: number }>();
  lessons.forEach((lesson) => {
    if (!modulesMap.has(lesson.module.id)) {
      modulesMap.set(lesson.module.id, {
        id: lesson.module.id,
        title: lesson.module.title,
        courseTitle: lesson.module.curriculum.title,
        lessonCount: 0,
      });
    }
    const mod = modulesMap.get(lesson.module.id)!;
    mod.lessonCount++;
  });
  const modules = Array.from(modulesMap.values());

  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-orange-light to-warning-light flex items-center justify-center">
              <PlayIcon className="w-7 h-7 text-accent-orange" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">PlayIcon Library</h1>
              <p className="text-neutral-500">
                Browse and watch all lesson videos
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-accent-orange-light flex items-center justify-center">
                <PlayIcon className="w-5 h-5 text-accent-orange" />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">{lessons.length}</p>
                <p className="text-sm text-neutral-500">Total Videos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-info-light flex items-center justify-center">
                <BookOpenIcon className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">{modules.length}</p>
                <p className="text-sm text-neutral-500">Modules</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">-</p>
                <p className="text-sm text-neutral-500">Total Duration</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PlayIcon Grid */}
        {lessons.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <PlayIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No videos found
              </h3>
              <p className="text-neutral-500">
                Videos will appear here once lessons with video content are added.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="overflow-hidden group hover:shadow-sm transition-shadow">
                {/* PlayIcon Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-primary-500 to-accent-navy">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                    <BookOpenIcon className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-lg font-bold">Lesson {lesson.number}</span>
                  </div>

                  {/* PlayIcon Button Overlay */}
                  <Link href={`/lessons/${lesson.id}`}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/20 group-hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                        <PlayIcon className="w-7 h-7 text-white ml-1" />
                      </div>
                    </div>
                  </Link>
                </div>

                {/* PlayIcon Info */}
                <CardContent className="p-4">
                  <p className="text-xs text-primary-500 font-medium mb-1">
                    {lesson.module.title}
                  </p>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {lesson.title}
                  </h3>
                  {lesson.subtitle && (
                    <p className="text-sm text-neutral-500 line-clamp-2">
                      {lesson.subtitle}
                    </p>
                  )}

                  <Link
                    href={`/lessons/${lesson.id}`}
                    className="mt-3 w-full inline-flex items-center justify-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    Watch Now
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Module Quick Navigation */}
        {modules.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-neutral-900">Browse by Module</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">
                        {module.title}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {module.lessonCount} videos
                      </p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-neutral-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
