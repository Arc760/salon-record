"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "../BottomNav";
import { LanguageSwitcher, useLanguage } from "../useLanguage";

type BasePayPeriod = "daily" | "weekly" | "monthly";

type SalaryHistoryEntry = {
  id: string;
  newAmount: number;
  payPeriod: BasePayPeriod;
  effectiveDate: string;
  createdAt: string;
  status: "active" | "cancelled";
};

type Employee = {
  id: string;
  name: string;
  basePay: number;
  basePayPeriod: BasePayPeriod;
  active: boolean;
  salaryHistory?: SalaryHistoryEntry[];
};

type OrderExtra = {
  price: number;
  commission: number;
};

type EmployeeOrder = {
  id: string;
  employeeId: string;
  employeeName: string;
  price: number;
  commission: number;
  extras?: OrderExtra[];
  paymentMethod?: "card" | "cash" | "gift-card" | "split";
  giftCardAmount?: number;
  giftCardRemainderMethod?: "card" | "cash" | "split";
  discountAmount?: number;
  cashAmount?: number;
  cardAmount?: number;
};

type DailyRecord = {
  date: string;
  commissions: { employeeId: string; employeeName: string; amount: number }[];
  orders?: EmployeeOrder[];
};

type WeeklySettlement = {
  id: string;
  employeeId: string;
  weekStart: string;
  weekEnd: string;
  amount: number;
  settledAt: string;
};

type WeeklyRow = {
  employee: Employee;
  basePay: number;
  revenue: number;
  orderCount: number;
  commission: number;
  total: number;
  settled: boolean;
};

const EMPLOYEES_KEY = "salon-record-employees";
const DAILY_RECORDS_KEY = "salon-record-daily-records";
const WEEKLY_SETTLEMENTS_KEY = "salon-record-weekly-settlements";

const text = {
  zh: {
    back: "← 返回首页",
    title: "周结工资",
    subtitle: "按周结算员工底薪和提成",
    week: "结算周",
    employee: "员工",
    orders: "单数",
    revenue: "营业额",
    basePay: "底薪",
    commission: "提成",
    total: "应结工资",
    settled: "已结算",
    markSettled: "标记已结算",
    undo: "取消结算",
    empty: "这一周还没有员工工资数据",
    summary: "周结合计",
    exportCsv: "导出本周CSV",
  },
  en: {
    back: "← Back Home",
    title: "Weekly Payroll",
    subtitle: "Settle weekly base pay and commission",
    week: "Settlement Week",
    employee: "Employee",
    orders: "Orders",
    revenue: "Revenue",
    basePay: "Base Pay",
    commission: "Commission",
    total: "Pay Total",
    settled: "Settled",
    markSettled: "Mark Settled",
    undo: "Undo",
    empty: "No payroll data for this week",
    summary: "Weekly Total",
    exportCsv: "Export Week CSV",
  },
};

export default function WeeklyPayPage() {
  const { language, setLanguage } = useLanguage();
  const t = text[language];
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [settlements, setSettlements] = useState<WeeklySettlement[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const { weekStart, weekEnd } = getWeekRange(selectedDate);

  useEffect(() => {
    const loadData = window.setTimeout(() => {
      setEmployees(readStorage<Employee[]>(EMPLOYEES_KEY, []));
      setRecords(readStorage<DailyRecord[]>(DAILY_RECORDS_KEY, []));
      setSettlements(
        readStorage<WeeklySettlement[]>(WEEKLY_SETTLEMENTS_KEY, []),
      );
    }, 0);

    return () => window.clearTimeout(loadData);
  }, []);

  const rows = useMemo(
    () => buildWeeklyRows(employees, records, settlements, weekStart, weekEnd),
    [employees, records, settlements, weekEnd, weekStart],
  );
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  function saveSettlements(nextSettlements: WeeklySettlement[]) {
    setSettlements(nextSettlements);
    window.localStorage.setItem(
      WEEKLY_SETTLEMENTS_KEY,
      JSON.stringify(nextSettlements),
    );
  }

  function toggleSettlement(row: WeeklyRow) {
    const existing = settlements.find(
      (settlement) =>
        settlement.employeeId === row.employee.id &&
        settlement.weekStart === weekStart &&
        settlement.weekEnd === weekEnd,
    );

    if (existing) {
      saveSettlements(
        settlements.filter((settlement) => settlement.id !== existing.id),
      );
      return;
    }

    saveSettlements([
      ...settlements,
      {
        id: crypto.randomUUID(),
        employeeId: row.employee.id,
        weekStart,
        weekEnd,
        amount: row.total,
        settledAt: new Date().toISOString(),
      },
    ]);
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-white px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-5 inline-block text-sm font-medium text-gray-600"
            >
              {t.back}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
          </div>
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </header>

        <section className="mb-3 rounded-xl border border-gray-200 p-3">
          <label
            htmlFor="weekly-date"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            {t.week}
          </label>
          <input
            id="weekly-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-gray-300 px-3 text-base text-gray-900 outline-none focus:border-gray-900"
          />
          <p className="mt-2 text-sm text-gray-500">
            {weekStart} - {weekEnd}
          </p>
        </section>

        <section className="mb-3 rounded-xl bg-gray-900 p-4 text-white">
          <p className="text-sm text-gray-300">{t.summary}</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(total)}</p>
          <button
            type="button"
            onClick={() => exportWeeklyPayrollCsv(rows, weekStart, weekEnd)}
            className="mt-3 min-h-10 rounded-xl bg-white px-4 text-sm font-semibold text-gray-900"
          >
            {t.exportCsv}
          </button>
        </section>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            {t.empty}
          </div>
        ) : (
          <section className="space-y-3">
            {rows.map((row) => (
              <article
                key={row.employee.id}
                className="rounded-xl border border-gray-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {row.employee.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {row.settled ? t.settled : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSettlement(row)}
                    className={`min-h-10 rounded-xl border px-3 text-sm font-semibold ${
                      row.settled
                        ? "border-gray-300 text-gray-700"
                        : "border-gray-900 bg-gray-900 text-white"
                    }`}
                  >
                    {row.settled ? t.undo : t.markSettled}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <MiniTotal label={t.orders} value={String(row.orderCount)} />
                  <MiniTotal label={t.revenue} value={formatCurrency(row.revenue)} />
                  <MiniTotal label={t.basePay} value={formatCurrency(row.basePay)} />
                  <MiniTotal
                    label={t.commission}
                    value={formatCurrency(row.commission)}
                  />
                  <MiniTotal label={t.total} value={formatCurrency(row.total)} />
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

function MiniTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function buildWeeklyRows(
  employees: Employee[],
  records: DailyRecord[],
  settlements: WeeklySettlement[],
  weekStart: string,
  weekEnd: string,
) {
  const dates = getDateRange(weekStart, weekEnd);

  return employees
    .map((employee) => {
      const basePay = dates.reduce(
        (sum, date) => sum + getDailyBasePay(employee, date),
        0,
      );
      const stats = dates.reduce(
        (totals, date) => {
          const dailyStats = getOrderStatsForEmployee(records, date, employee);
          const legacyCommission = getLegacyCommissionForEmployee(
            records,
            date,
            employee,
          );

          return {
            revenue: totals.revenue + dailyStats.revenue,
            orderCount: totals.orderCount + dailyStats.orderCount,
            commission:
              totals.commission +
              (dailyStats.commission > 0
                ? dailyStats.commission
                : legacyCommission),
          };
        },
        { revenue: 0, orderCount: 0, commission: 0 },
      );
      const total = basePay + stats.commission;
      const settled = settlements.some(
        (settlement) =>
          settlement.employeeId === employee.id &&
          settlement.weekStart === weekStart &&
          settlement.weekEnd === weekEnd,
      );

      return {
        employee,
        basePay,
        revenue: stats.revenue,
        orderCount: stats.orderCount,
        commission: stats.commission,
        total,
        settled,
      };
    })
    .filter((row) => row.total > 0 || row.revenue > 0)
    .sort((a, b) => b.total - a.total);
}

function getOrderStatsForEmployee(
  records: DailyRecord[],
  date: string,
  employee: Employee,
) {
  const record = records.find((item) => item.date === date);
  const orders =
    record?.orders?.filter(
      (order) =>
        order.employeeId === employee.id || order.employeeName === employee.name,
    ) ?? [];

  return {
    orderCount: orders.length,
    revenue: orders.reduce((sum, order) => sum + getOrderRevenue(order), 0),
    commission: orders.reduce((sum, order) => sum + getOrderCommission(order), 0),
  };
}

function getLegacyCommissionForEmployee(
  records: DailyRecord[],
  date: string,
  employee: Employee,
) {
  const record = records.find((item) => item.date === date);

  return (
    record?.commissions
      .filter(
        (entry) =>
          entry.employeeId === employee.id || entry.employeeName === employee.name,
      )
      .reduce((sum, entry) => sum + entry.amount, 0) ?? 0
  );
}

function getOrderRevenue(order: EmployeeOrder) {
  if (
    (order.paymentMethod ?? "card") === "split" ||
    ((order.paymentMethod ?? "card") === "gift-card" &&
      order.giftCardRemainderMethod === "split")
  ) {
    return (order.cashAmount ?? 0) + (order.cardAmount ?? 0);
  }

  const grossAmount =
    order.price +
    (order.extras ?? []).reduce((sum, extra) => sum + extra.price, 0) -
    (order.discountAmount ?? 0);

  if ((order.paymentMethod ?? "card") !== "gift-card") {
    return Math.max(0, grossAmount);
  }

  return Math.max(0, grossAmount - (order.giftCardAmount ?? 0));
}

function getOrderCommission(order: EmployeeOrder) {
  return (
    order.commission +
    (order.extras ?? []).reduce((sum, extra) => sum + extra.commission, 0)
  );
}

function getDailyBasePay(employee: Employee, date: string) {
  const salary = getSalaryForDate(employee, date);
  const amount = salary?.newAmount ?? employee.basePay ?? 0;
  const payPeriod = salary?.payPeriod ?? employee.basePayPeriod ?? "daily";

  if (payPeriod === "daily") {
    return amount;
  }

  if (payPeriod === "weekly") {
    return amount / 7;
  }

  return amount / getDaysInMonth(date);
}

function getSalaryForDate(employee: Employee, targetDate: string) {
  return (employee.salaryHistory ?? [])
    .filter(
      (entry) => entry.status !== "cancelled" && entry.effectiveDate <= targetDate,
    )
    .sort((firstEntry, secondEntry) => {
      const dateComparison = secondEntry.effectiveDate.localeCompare(
        firstEntry.effectiveDate,
      );

      return dateComparison !== 0
        ? dateComparison
        : secondEntry.createdAt.localeCompare(firstEntry.createdAt);
    })[0];
}

function getWeekRange(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, mondayOffset);
  const sunday = addDays(monday, 6);

  return {
    weekStart: formatDateKey(monday),
    weekEnd: formatDateKey(sunday),
  };
}

function getDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const currentDate = new Date(`${startDate}T12:00:00`);
  const lastDate = new Date(`${endDate}T12:00:00`);

  while (currentDate <= lastDate) {
    dates.push(formatDateKey(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getDaysInMonth(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function exportWeeklyPayrollCsv(
  rows: WeeklyRow[],
  weekStart: string,
  weekEnd: string,
) {
  const csvRows = [
    [
      "weekStart",
      "weekEnd",
      "employee",
      "orders",
      "revenue",
      "basePay",
      "commission",
      "total",
      "settled",
    ],
    ...rows.map((row) => [
      weekStart,
      weekEnd,
      row.employee.name,
      String(row.orderCount),
      String(roundCurrency(row.revenue)),
      String(roundCurrency(row.basePay)),
      String(roundCurrency(row.commission)),
      String(roundCurrency(row.total)),
      row.settled ? "yes" : "no",
    ]),
  ];
  const blob = new Blob(
    [csvRows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `weekly-pay-${weekStart}-to-${weekEnd}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}

function getTodayDate() {
  return formatDateKey(new Date());
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
