import Link from "next/link";
import { CreateCourseForm } from "../components/CreateCourseForm";

export default function CreateCoursePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="text-blue-500 hover:underline mb-8 block"
        >
          &larr; 回到首页&apos;
        </Link>
        <h1 className="text-3xl font-bold mb-6">
          创建新课程
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          填写以下详细信息，将你的课程发布到区块链上。一旦创建，它将可供所有用户购买。
        </p>
        <CreateCourseForm />
      </div>
    </main>
  );
}
