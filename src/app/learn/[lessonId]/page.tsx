import LessonClient from "./LessonClient";

export const metadata = {
  title: "Chess Lesson | Acme Workforce",
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LessonClient lessonId={lessonId} />;
}
