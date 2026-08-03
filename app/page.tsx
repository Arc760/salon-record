"use client";

import { useState } from "react";

type Language = "zh" | "en";

const translations = {
  zh: {
    appName: "美甲店经营账本",
    englishName: "Salon Record",
    greeting: "晚上好",
    sales: "今日营业额",
    expenses: "今日支出",
    employeePay: "员工工资",
    estimatedIncome: "预计店铺收入",
    notRecorded: "尚未记录",
    recordToday: "记录今日账目",
    addExpense: "添加支出",
    employees: "员工管理",
    reports: "查看报表",
    status: "今天还没有完成记账",
  },
  en: {
    appName: "Salon Record",
    englishName: "美甲店经营账本",
    greeting: "Good evening",
    sales: "Today’s Sales",
    expenses: "Today’s Expenses",
    employeePay: "Employee Pay",
    estimatedIncome: "Estimated Income",
    notRecorded: "Not recorded",
    recordToday: "Record Today",
    addExpense: "Add Expense",
    employees: "Employees",
    reports: "Reports",
    status: "Today’s report is not completed",
  },
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("zh");
  const text = translations[language];

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto min-h-screen max-w-md bg-white px-5 pb-10 pt-6">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {text.appName}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {text.englishName}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setLanguage(language === "zh" ? "en" : "zh")
            }
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            {language === "zh" ? "English" : "中文"}
          </button>
        </header>

        <section className="mb-6">
          <p className="text-lg font-semibold text-gray-900">
            {text.greeting}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            August 3, 2026
          </p>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3">
          <SummaryCard
            title={text.sales}
            value={text.notRecorded}
          />

          <SummaryCard
            title={text.expenses}
            value={text.notRecorded}
          />

          <SummaryCard
            title={text.employeePay}
            value={text.notRecorded}
          />

          <SummaryCard
            title={text.estimatedIncome}
            value={text.notRecorded}
          />
        </section>

        <div className="mb-6 rounded-2xl bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            {text.status}
          </p>
        </div>

        <section className="space-y-3">
          <ActionButton label={text.recordToday} primary />
          <ActionButton label={text.addExpense} />
          <ActionButton label={text.employees} />
          <ActionButton label={text.reports} />
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 p-4">
      <p className="min-h-10 text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-lg font-bold text-gray-900">
        {value}
      </p>
    </article>
  );
}

function ActionButton({
  label,
  primary = false,
}: {
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        primary
          ? "min-h-14 w-full rounded-2xl bg-gray-900 px-5 text-base font-semibold text-white"
          : "min-h-14 w-full rounded-2xl border border-gray-300 bg-white px-5 text-left text-base font-semibold text-gray-800"
      }
    >
      {label}
    </button>
  );
}