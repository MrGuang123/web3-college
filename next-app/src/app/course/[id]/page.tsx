import { CourseDetail } from "@/app/components/CourseDetail";

type CoursePageProps = {
  params: {
    id: string;
  };
};

export default function CoursePage({
  params,
}: CoursePageProps) {
  const courseId = BigInt(params.id);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-4xl">
        <CourseDetail courseId={courseId} />
      </div>
    </main>
  );
}
