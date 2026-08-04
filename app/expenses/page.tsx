"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppModal } from "../AppModal";
import { LanguageSwitcher, useLanguage } from "../useLanguage";

type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  vendor: string;
  note: string;
  createdAt: string;
};

type CategoryKey = "rent" | "supplies" | "payroll" | "utilities" | "marketing" | "other";

const EXPENSES_KEY = "salon-record-expenses";
const categoryKeys: CategoryKey[] = [
  "rent",
  "supplies",
  "payroll",
  "utilities",
  "marketing",
  "other",
];

const text = {
  zh: {
    back: "← 返回首页",
    title: "添加支出",
    subtitle: "Add Expense",
    date: "支出日期",
    category: "支出分类",
    amount: "金额",
    vendor: "商家 / 用途",
    vendorPlaceholder: "例如：甲油采购",
    note: "备注",
    save: "保存支出",
    invalid: "请选择日期并输入正确的支出金额。",
    confirmDelete: "确定删除这笔支出吗？",
    dailyTotal: "支出合计",
    records: "支出记录",
    empty: "暂无支出记录",
    delete: "删除",
    categories: {
      rent: "房租",
      supplies: "材料",
      payroll: "工资",
      utilities: "水电",
      marketing: "营销",
      other: "其他",
    },
  },
  en: {
    back: "← Back Home",
    title: "Add Expense",
    subtitle: "Expense",
    date: "Expense Date",
    category: "Category",
    amount: "Amount",
    vendor: "Vendor / Purpose",
    vendorPlaceholder: "For example: nail polish purchase",
    note: "Note",
    save: "Save Expense",
    invalid: "Choose a date and enter a valid expense amount.",
    confirmDelete: "Delete this expense?",
    dailyTotal: "Expense total",
    records: "Expense Records",
    empty: "No expense records yet",
    delete: "Delete",
    categories: {
      rent: "Rent",
      supplies: "Supplies",
      payroll: "Payroll",
      utilities: "Utilities",
      marketing: "Marketing",
      other: "Other",
    },
  },
};

export default function ExpensesPage() {
  const { language, setLanguage } = useLanguage();
  const t = text[language];
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [date, setDate] = useState(getTodayDate());
  const [category, setCategory] = useState<CategoryKey>("rent");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const closeLabel = language === "zh" ? "关闭" : "Close";

  useEffect(() => {
    const loadExpenses = window.setTimeout(() => {
      setExpenses(readStorage<Expense[]>(EXPENSES_KEY, []));
    }, 0);

    return () => window.clearTimeout(loadExpenses);
  }, []);

  const todayTotal = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date === date)
        .reduce((sum, expense) => sum + expense.amount, 0),
    [date, expenses],
  );

  function saveExpenses(nextExpenses: Expense[]) {
    const sortedExpenses = [...nextExpenses].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    setExpenses(sortedExpenses);
    window.localStorage.setItem(EXPENSES_KEY, JSON.stringify(sortedExpenses));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!date || Number.isNaN(numericAmount) || numericAmount <= 0) {
      window.alert(t.invalid);
      return;
    }

    saveExpenses([
      {
        id: crypto.randomUUID(),
        date,
        category,
        amount: numericAmount,
        vendor: vendor.trim(),
        note: note.trim(),
        createdAt: new Date().toISOString(),
      },
      ...expenses,
    ]);

    setAmount("");
    setVendor("");
    setNote("");
    setShowForm(false);
  }

  function deleteExpense(expenseId: string) {
    if (!window.confirm(t.confirmDelete)) {
      return;
    }

    saveExpenses(expenses.filter((expense) => expense.id !== expenseId));
  }

  return (
    <main className="h-screen overflow-hidden bg-gray-100">
      <div className="mx-auto flex h-screen max-w-md flex-col overflow-hidden bg-white px-4 py-4">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-5 inline-block text-sm font-medium text-gray-600"
            >
              {t.back}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="mt-2 text-sm text-gray-500">{t.subtitle}</p>
          </div>
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </header>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mb-3 min-h-11 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white"
        >
          {t.save}
        </button>

        {showForm && (
          <AppModal onClose={() => setShowForm(false)} contentClassName="p-5">
            <form
              onSubmit={handleSubmit}
              className="flex max-h-[calc(88vh-2.5rem)] flex-col space-y-5 overflow-y-auto"
            >
          <FormField label={t.date} htmlFor="expense-date">
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClassName}
            />
          </FormField>

          <FormField label={t.category} htmlFor="expense-category">
            <select
              id="expense-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryKey)}
              className={inputClassName}
            >
              {categoryKeys.map((item) => (
                <option key={item} value={item}>
                  {t.categories[item]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t.amount} htmlFor="expense-amount">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                id="expense-amount"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                value={amount}
                onKeyDown={blockNonNumericKeys}
                onChange={(event) =>
                  setAmount(cleanNumberInput(event.target.value))
                }
                placeholder="0.00"
                className={`${inputClassName} pl-8`}
              />
            </div>
          </FormField>

          <FormField label={t.vendor} htmlFor="expense-vendor">
            <input
              id="expense-vendor"
              type="text"
              value={vendor}
              onChange={(event) => setVendor(event.target.value)}
              placeholder={t.vendorPlaceholder}
              className={inputClassName}
            />
          </FormField>

          <FormField label={t.note} htmlFor="expense-note">
            <textarea
              id="expense-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className={`${inputClassName} py-3`}
            />
          </FormField>

          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-gray-900 px-5 text-base font-semibold text-white"
          >
            {t.save}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="min-h-12 w-full rounded-xl border border-gray-300 px-5 text-base font-semibold text-gray-700"
          >
            {closeLabel}
          </button>
            </form>
          </AppModal>
        )}

        <section className="mb-3 rounded-xl bg-amber-50 p-3">
          <p className="text-sm text-amber-900">
            {date} {t.dailyTotal}:{" "}
            <span className="font-bold">{formatCurrency(todayTotal)}</span>
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">{t.records}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {expenses.length} {t.records}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRecordsModal(true)}
              className="min-h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
            >
              {t.records}
            </button>
          </div>
        </section>

        {showRecordsModal && (
          <AppModal
            onClose={() => setShowRecordsModal(false)}
            contentClassName="flex flex-col"
          >
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-900">{t.records}</h2>
                <button
                  type="button"
                  onClick={() => setShowRecordsModal(false)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                >
                  {closeLabel}
                </button>
              </div>
              <div className="overflow-y-auto p-4">
          {expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              {t.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">
                        {formatCategory(expense.category, t.categories)} ·{" "}
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {expense.date}
                        {expense.vendor ? ` · ${expense.vendor}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteExpense(expense.id)}
                      className="shrink-0 text-sm font-semibold text-red-600"
                    >
                      {t.delete}
                    </button>
                  </div>
                  {expense.note && (
                    <p className="mt-3 text-sm text-gray-600">{expense.note}</p>
                  )}
                </article>
              ))}
            </div>
          )}
              </div>
          </AppModal>
        )}
      </div>
    </main>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-gray-800"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none focus:border-gray-900";

function blockNonNumericKeys(event: React.KeyboardEvent<HTMLInputElement>) {
  const allowedControlKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Enter",
    "Escape",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
  ];

  if (event.ctrlKey || event.metaKey || allowedControlKeys.includes(event.key)) {
    return;
  }

  if (!/^\d$/.test(event.key) && event.key !== ".") {
    event.preventDefault();
  }
}

function cleanNumberInput(value: string) {
  const cleanedValue = value.replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = cleanedValue.split(".");

  return decimalParts.length > 0
    ? `${integerPart}.${decimalParts.join("")}`
    : integerPart;
}

function formatCategory(
  category: string,
  labels: Record<CategoryKey, string>,
) {
  if (category in labels) {
    return labels[category as CategoryKey];
  }

  return category;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getTodayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
