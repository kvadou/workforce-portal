import { use } from "react";
import TrainingCourseClient from "./TrainingCourseClient";

export default function TrainingCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return <TrainingCourseClient slug={slug} />;
}
