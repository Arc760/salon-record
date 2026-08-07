"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AppModal } from "./AppModal";
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

type ImportPreview = {
  rows: string[][];
  exportedAt: string;
  summary: {
    employees: number;
    records: number;
    expenses: number;
    menuItems: number;
    drafts: number;
    settlements: number;
  };
};

const DAILY_RECORDS_KEY = "salon-record-daily-records";
const EXPENSES_KEY = "salon-record-expenses";
const EXPORT_STORAGE_KEYS = [
  "salon-record-daily-records",
  "salon-record-daily-record-drafts",
  "salon-record-employees",
  "salon-record-expenses",
  "salon-record-language",
  "salon-record-order-draft",
  "salon-record-service-menu",
  "salon-record-weekly-settlements",
];

const text = {
  zh: {
    appName: "美甲店经营记账本",
    subtitle: "Salon Record",
    morning: "早上好",
    afternoon: "下午好",
    evening: "晚上好",
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
    exportData: "导出CSV",
    importData: "导入CSV",
    importPreview: "导入预览",
    importConfirm: "确认导入",
    importCancel: "取消",
    importBackupNotice: "导入前会自动先导出当前数据备份。",
    importEmployees: "员工",
    importRecords: "账目",
    importExpenses: "支出",
    importMenuItems: "菜单项目",
    importDrafts: "草稿",
    importSettlements: "周结记录",
    importSuccess: "数据已导入，请刷新页面查看。",
    importInvalid: "请选择正确的数据备份CSV文件。",
    statusDone: "今天的账目已经记录",
    statusPending: "今天还没有完成记账",
  },
  en: {
    appName: "Salon Record",
    subtitle: "Nail salon business ledger",
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
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
    exportData: "Export CSV",
    importData: "Import CSV",
    importPreview: "Import Preview",
    importConfirm: "Confirm Import",
    importCancel: "Cancel",
    importBackupNotice: "The current data will be exported before importing.",
    importEmployees: "Employees",
    importRecords: "Records",
    importExpenses: "Expenses",
    importMenuItems: "Menu Items",
    importDrafts: "Drafts",
    importSettlements: "Settlements",
    importSuccess: "Data imported. Refresh the page to view it.",
    importInvalid: "Choose a valid backup CSV file.",
    statusDone: "Today's record is saved",
    statusPending: "Today's report is not completed",
  },
};

export default function Home() {
  const { language, setLanguage, locale } = useLanguage();
  const t = text[language];
  const importInputRef = useRef<HTMLInputElement>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [greeting, setGreeting] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
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

  useEffect(() => {
    const loadGreeting = window.setTimeout(() => {
      setGreeting(getGreetingForHour(new Date().getHours(), t));
    }, 0);

    return () => window.clearTimeout(loadGreeting);
  }, [t]);

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
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={exportSalonData}
              className="min-h-10 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700"
            >
              {t.exportData}
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="min-h-10 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700"
            >
              {t.importData}
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => previewSalonDataImport(event, t, setImportPreview)}
              className="hidden"
            />
            <LanguageSwitcher language={language} setLanguage={setLanguage} />
          </div>
        </header>

        <section className="mb-3">
          <p className="text-base font-semibold text-gray-900">{greeting}</p>
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
      {importPreview && (
        <ImportPreviewModal
          preview={importPreview}
          t={t}
          onCancel={() => setImportPreview(null)}
          onConfirm={() => {
            importSalonData(importPreview.rows, t);
            setImportPreview(null);
          }}
        />
      )}
      <BottomNav />
    </main>
  );
}

function ImportPreviewModal({
  preview,
  t,
  onCancel,
  onConfirm,
}: {
  preview: ImportPreview;
  t: (typeof text)["zh"];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AppModal onClose={onCancel} contentClassName="flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900">{t.importPreview}</h2>
        <p className="mt-1 text-sm text-gray-500">{preview.exportedAt}</p>
        <p className="mt-2 text-sm text-amber-700">{t.importBackupNotice}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4">
        <SummaryCard title={t.importEmployees} value={String(preview.summary.employees)} />
        <SummaryCard title={t.importRecords} value={String(preview.summary.records)} />
        <SummaryCard title={t.importExpenses} value={String(preview.summary.expenses)} />
        <SummaryCard title={t.importMenuItems} value={String(preview.summary.menuItems)} />
        <SummaryCard title={t.importDrafts} value={String(preview.summary.drafts)} />
        <SummaryCard
          title={t.importSettlements}
          value={String(preview.summary.settlements)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-xl border border-gray-300 px-4 text-base font-semibold text-gray-700"
        >
          {t.importCancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-12 rounded-xl bg-gray-900 px-4 text-base font-semibold text-white"
        >
          {t.importConfirm}
        </button>
      </div>
    </AppModal>
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

function exportSalonData() {
  downloadSalonCsv(`salon-record-backup-${getTodayDate()}.csv`);
}

function downloadSalonCsv(fileName: string) {
  const exportedAt = new Date().toISOString();
  const rows = [
    ["app", "exportedAt", "key", "value"],
    ...EXPORT_STORAGE_KEYS.map((key) => [
      "salon-record",
      exportedAt,
      key,
      window.localStorage.getItem(key) ?? "",
    ]),
  ];
  const blob = new Blob(
    [rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function previewSalonDataImport(
  event: ChangeEvent<HTMLInputElement>,
  t: (typeof text)["zh"],
  setImportPreview: (preview: ImportPreview | null) => void,
) {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const csvText = String(reader.result ?? "");
      const rows = parseCsv(csvText);
      const [header, ...dataRows] = rows;

      if (
        !header ||
        header[0] !== "app" ||
        header[1] !== "exportedAt" ||
        header[2] !== "key" ||
        header[3] !== "value"
      ) {
        window.alert(t.importInvalid);
        return;
      }

      setImportPreview({
        rows: dataRows,
        exportedAt: dataRows[0]?.[1] ?? "",
        summary: buildImportSummary(dataRows),
      });
    } catch {
      window.alert(t.importInvalid);
    }
  };

  reader.onerror = () => window.alert(t.importInvalid);
  reader.readAsText(file);
}

function importSalonData(rows: string[][], t: (typeof text)["zh"]) {
  downloadSalonCsv(`salon-record-before-import-${getTodayDate()}.csv`);

  rows.forEach((row) => {
    const [app, , key, value] = row;

    if (app !== "salon-record" || !EXPORT_STORAGE_KEYS.includes(key)) {
      return;
    }

    if (value === "") {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  });

  window.alert(t.importSuccess);
}

function buildImportSummary(rows: string[][]): ImportPreview["summary"] {
  const data = new Map<string, string>();

  rows.forEach((row) => {
    const [app, , key, value] = row;

    if (app === "salon-record" && EXPORT_STORAGE_KEYS.includes(key)) {
      data.set(key, value);
    }
  });

  return {
    employees: getImportedItemCount(data.get("salon-record-employees")),
    records: getImportedItemCount(data.get("salon-record-daily-records")),
    expenses: getImportedItemCount(data.get("salon-record-expenses")),
    menuItems: getImportedItemCount(data.get("salon-record-service-menu")),
    drafts: getImportedObjectCount(data.get("salon-record-daily-record-drafts")),
    settlements: getImportedItemCount(data.get("salon-record-weekly-settlements")),
  };
}

function getImportedItemCount(value: string | undefined) {
  if (!value) {
    return 0;
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue.length : 0;
  } catch {
    return 0;
  }
}

function getImportedObjectCount(value: string | undefined) {
  if (!value) {
    return 0;
  }

  try {
    const parsedValue = JSON.parse(value);
    return parsedValue && typeof parsedValue === "object"
      ? Object.keys(parsedValue).length
      : 0;
  } catch {
    return 0;
  }
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function parseCsv(csvText: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function getTodayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getGreetingForHour(hour: number, t: (typeof text)["zh"]) {
  if (hour < 12) {
    return t.morning;
  }

  if (hour < 18) {
    return t.afternoon;
  }

  return t.evening;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
