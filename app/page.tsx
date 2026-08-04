"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "./BottomNav";
import { LanguageSwitcher, useLanguage } from "./useLanguage";

type DailyRecord = {
  date: string;
  cashSales: number;
  cardSales: number;
  commissions: { amount: number }[];
};

type Expense = {
  date: string;
  amount: number;
};

const DAILY_RECORDS_KEY = "salon-record-daily-records";
const EXPENSES_KEY = "salon-record-expenses";

const text = {
  zh: {
    appName: "美甲店经营记账本",
    subtitle: "Salon Record",
    greeting: "晚上好",
    sales: "今日营业额",
    expenses: "今日支出",
    employeePay: "员工提成",
    estimatedIncome: "预计店铺收入",
    notRecorded: "尚未记录",
    recordToday: "记账 / 补录账目",
    addExpense: "添加支出",
    employees: "员工管理",
    services: "菜单",
    reports: "查看报表",
    statusDone: "今天的账目已经记录",
    statusPending: "今天还没有完成记账",
  },
  en: {
    appName: "Salon Record",
    subtitle: "Nail salon business ledger",
    greeting: "Good evening",
    sales: "Today's Sales",
    expenses: "Today's Expenses",
    employeePay: "Employee Commission",
    estimatedIncome: "Estimated Income",
    notRecorded: "Not recorded",
    recordToday: "Record / Backfill",
    addExpense: "Add Expense",
    employees: "Employees",
    services: "Menu",
    reports: "Reports",
    statusDone: "Today's record is saved",
    statusPending: "Today's report is not completed",
  },
};

export default function Home() {
  const { language, setLanguage, locale } = useLanguage();
  const t = text[language];
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const today = getTodayDate();
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [locale],
  );

  useEffect(() => {
    const loadSummary = window.setTimeout(() => {
      setDailyRecords(readStorage<DailyRecord[]>(DAILY_RECORDS_KEY, []));
      setExpenses(readStorage<Expense[]>(EXPENSES_KEY, []));
    }, 0);

    return () => window.clearTimeout(loadSummary);
  }, []);

  const todaySummary = useMemo(() => {
    const record = dailyRecords.find((item) => item.date === today);
    const sales = record ? record.cashSales + record.cardSales : 0;
    const employeePay =
      record?.commissions.reduce((sum, entry) => sum + entry.amount, 0) ?? 0;
    const expenseTotal = expenses
      .filter((expense) => expense.date === today)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      hasRecord: Boolean(record),
      sales,
      expenses: expenseTotal,
      employeePay,
      estimatedIncome: sales - employeePay - expenseTotal,
    };
  }, [dailyRecords, expenses, today]);

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-white px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.appName}</h1>
            <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
          </div>
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </header>

        <section className="mb-3">
          <p className="text-base font-semibold text-gray-900">{t.greeting}</p>
          <p className="mt-1 text-sm text-gray-500">{formattedDate}</p>
        </section>

        <section className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <SummaryCard
            title={t.sales}
            value={
              todaySummary.hasRecord
                ? formatCurrency(todaySummary.sales)
                : t.notRecorded
            }
          />
          <SummaryCard
            title={t.expenses}
            value={formatCurrency(todaySummary.expenses)}
          />
          <SummaryCard
            title={t.employeePay}
            value={
              todaySummary.hasRecord
                ? formatCurrency(todaySummary.employeePay)
                : t.notRecorded
            }
          />
          <SummaryCard
            title={t.estimatedIncome}
            value={
              todaySummary.hasRecord
                ? formatCurrency(todaySummary.estimatedIncome)
                : t.notRecorded
            }
          />
        </section>

        <div className="mb-3 rounded-xl bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            {todaySummary.hasRecord ? t.statusDone : t.statusPending}
          </p>
        </div>

        <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ActionButton href="/daily-record" label={t.recordToday} primary />
          <ActionButton href="/expenses" label={t.addExpense} />
        </section>
      </div>
      <BottomNav />
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border border-gray-200 p-3">
      <p className="min-h-8 text-xs text-gray-500">{title}</p>
      <p className="mt-2 break-words text-sm font-bold text-gray-900">
        {value}
      </p>
    </article>
  );
}

function ActionButton({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "flex min-h-12 w-full items-center rounded-xl bg-gray-900 px-3 text-sm font-semibold text-white"
          : "flex min-h-12 w-full items-center rounded-xl border border-gray-300 bg-white px-3 text-left text-sm font-semibold text-gray-800"
      }
    >
      {label}
    </Link>
  );
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getTodayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
