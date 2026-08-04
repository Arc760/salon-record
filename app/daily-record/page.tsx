import Link from "next/link";

export default function DailyRecordPage() {
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
            记录今日账目
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Daily Record
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 p-5">
          <p className="text-gray-600">
            接下来我们会在这里添加现金收入、刷卡收入和员工数据。
          </p>
        </section>
      </div>
    </main>
  );
}