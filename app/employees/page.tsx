import Link from "next/link";

export default function EmployeesPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto min-h-screen max-w-md bg-white px-5 pb-10 pt-6">
        <header className="mb-8">
          <Link
            href="/"
            className="mb-5 inline-block text-sm font-medium text-gray-600"
          >
            ← 返回首页
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            员工管理
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Employees
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 p-5">
          <p className="text-gray-600">
            接下来可以在这里添加、修改和停用员工。
          </p>
        </section>
      </div>
    </main>
  );
}