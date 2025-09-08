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
          &larr; Back to Market
        </Link>
        <h1 className="text-3xl font-bold mb-6">
          Create a New Course
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Fill out the details below to publish your course
          on the blockchain. Once created, it will be
          available for all users to purchase.
        </p>
        <CreateCourseForm />
      </div>
    </main>
  );
}
