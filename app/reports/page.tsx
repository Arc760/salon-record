"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppModal } from "../AppModal";
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
  salaryHistory: SalaryHistoryEntry[];
};

type CommissionEntry = {
  employeeId: string;
  employeeName: string;
  amount: number;
};

type OrderExtra = {
  id: string;
  name: string;
  price: number;
  commission: number;
};

type PaymentMethod = "card" | "cash" | "gift-card" | "split";

type EmployeeOrder = {
  id: string;
  employeeId: string;
  employeeName: string;
  serviceName: string;
  price: number;
  commission: number;
  extras: OrderExtra[];
  paymentMethod?: PaymentMethod;
  giftCardAmount?: number;
  giftCardRemainderMethod?: "card" | "cash" | "split";
  discountAmount?: number;
  cashAmount?: number;
  cardAmount?: number;
};

type GiftCardSale = {
  id: string;
  amount: number;
  paymentMethod: "card" | "cash";
  createdAt: string;
};

type DailyRecord = {
  date: string;
  cashSales: number;
  cardSales: number;
  commissions: CommissionEntry[];
  orders?: EmployeeOrder[];
  giftCardSales?: GiftCardSale[];
};

type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
};

type ReportMode = "shop" | "employee";
type Period = "day" | "week" | "month";
type LanguageText = typeof text.zh;

const DAILY_RECORDS_KEY = "salon-record-daily-records";
const EMPLOYEES_KEY = "salon-record-employees";
const EXPENSES_KEY = "salon-record-expenses";

const text = {
  zh: {
    back: "← 返回首页",
    title: "查看报表",
    subtitle: "Reports",
    shopReport: "店铺报表",
    employeeReport: "员工报表",
    reportDate: "报表日期",
    day: "日报",
    week: "周报",
    month: "月报",
    to: "至",
    sales: "营业额",
    cashSales: "现金收入",
    cardSales: "刷卡收入",
    employeeCommission: "员工提成",
    expense: "支出",
    netIncome: "净收入",
    counted: "已统计",
    days: "天账目",
    expenseCount: "笔支出",
    expenseCategories: "支出分类",
    noExpenses: "当前周期暂无支出",
    searchSalary: "搜索员工薪资",
    searchPlaceholder: "例如：May 6/6 或 May 6/6-6/10",
    employee: "员工",
    allEmployees: "全部员工",
    inactive: "（已停用）",
    startDate: "开始日期",
    endDate: "结束日期",
    viewing: "当前查看",
    basePay: "底薪",
    commission: "提成",
    total: "合计",
    weeklyTotal: "周结合计",
    employeeSummary: "员工汇总",
    noSalary: "当前范围暂无员工薪资记录",
    dailyDetails: "每日明细",
    noDailyDetails: "当前范围暂无每日明细",
    weeklySettlement: "周末结算",
    noWeeklySettlement: "当前范围暂无周结数据",
    weeklySettlementSuffix: "周末结算",
  },
  en: {
    back: "← Back Home",
    title: "Reports",
    subtitle: "Shop and employee reports",
    shopReport: "Shop Report",
    employeeReport: "Employee Report",
    reportDate: "Report Date",
    day: "Daily",
    week: "Weekly",
    month: "Monthly",
    to: "to",
    sales: "Sales",
    cashSales: "Cash Sales",
    cardSales: "Card Sales",
    employeeCommission: "Employee Commission",
    expense: "Expenses",
    netIncome: "Net Income",
    counted: "Counted",
    days: "record days",
    expenseCount: "expenses",
    expenseCategories: "Expense Categories",
    noExpenses: "No expenses in this period",
    searchSalary: "Search Employee Pay",
    searchPlaceholder: "Example: May 6/6 or May 6/6-6/10",
    employee: "Employee",
    allEmployees: "All Employees",
    inactive: " (inactive)",
    startDate: "Start Date",
    endDate: "End Date",
    viewing: "Viewing",
    basePay: "Base Pay",
    commission: "Commission",
    total: "Total",
    weeklyTotal: "Weekly Settlement Total",
    employeeSummary: "Employee Summary",
    noSalary: "No employee pay records in this range",
    dailyDetails: "Daily Details",
    noDailyDetails: "No daily details in this range",
    weeklySettlement: "Weekend Settlement",
    noWeeklySettlement: "No weekly settlement data in this range",
    weeklySettlementSuffix: "weekend settlement",
  },
};

export default function ReportsPage() {
  const { language, setLanguage } = useLanguage();
  const t = text[language];
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [mode, setMode] = useState<ReportMode>("shop");
  const [period, setPeriod] = useState<Period>("day");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [rangeStart, setRangeStart] = useState(getTodayDate());
  const [rangeEnd, setRangeEnd] = useState(getTodayDate());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");

  useEffect(() => {
    const loadReports = window.setTimeout(() => {
      setDailyRecords(readStorage<DailyRecord[]>(DAILY_RECORDS_KEY, []));
      setEmployees(readStorage<Employee[]>(EMPLOYEES_KEY, []));
      setExpenses(readStorage<Expense[]>(EXPENSES_KEY, []));
    }, 0);

    return () => window.clearTimeout(loadReports);
  }, []);

  const shopReport = useMemo(() => {
    const dates = getPeriodDates(selectedDate, period);
    const dateSet = new Set(dates);
    const filteredRecords = dailyRecords.filter((record) =>
      dateSet.has(record.date),
    );
    const filteredExpenses = expenses.filter((expense) => dateSet.has(expense.date));
    const cashSales = filteredRecords.reduce(
      (sum, record) => sum + getRecordCashSales(record),
      0,
    );
    const cardSales = filteredRecords.reduce(
      (sum, record) => sum + getRecordCardSales(record),
      0,
    );
    const commissionTotal = filteredRecords.reduce(
      (sum, record) => sum + getRecordCommissionTotal(record),
      0,
    );
    const expenseTotal = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      cashSales,
      cardSales,
      sales: cashSales + cardSales,
      commissionTotal,
      expenseTotal,
      netIncome: cashSales + cardSales - commissionTotal - expenseTotal,
      recordCount: filteredRecords.length,
      expenseCount: filteredExpenses.length,
      expensesByCategory: groupExpensesByCategory(filteredExpenses),
    };
  }, [dailyRecords, expenses, period, selectedDate]);

  const employeeQuery = useMemo(
    () => parseEmployeeSearch(employeeSearch, employees),
    [employeeSearch, employees],
  );
  const employeeStartDate = employeeQuery.startDate ?? rangeStart;
  const employeeEndDate = employeeQuery.endDate ?? rangeEnd;
  const employeeSearchText = getEmployeeSearchText(employeeSearch);
  const matchingEmployees = employeeSearchText
    ? employees.filter((employee) =>
        matchesSearchText(employee.name, employeeSearchText),
      )
    : employees;
  const employeeId = employeeSearchText
    ? "all"
    : employeeQuery.employeeId ?? selectedEmployeeId;

  const employeeReport = useMemo(
    () =>
      buildEmployeeReport({
        employees: matchingEmployees,
        dailyRecords,
        startDate: employeeStartDate,
        endDate: employeeEndDate,
        employeeId,
      }),
    [
      dailyRecords,
      employeeEndDate,
      employeeId,
      employeeStartDate,
      matchingEmployees,
    ],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-100 pb-20">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col overflow-x-hidden bg-white px-4 pb-24 pt-4 sm:px-6 lg:px-8">
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

        <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
          <TabButton active={mode === "shop"} onClick={() => setMode("shop")}>
            {t.shopReport}
          </TabButton>
          <TabButton
            active={mode === "employee"}
            onClick={() => setMode("employee")}
          >
            {t.employeeReport}
          </TabButton>
        </div>

        {mode === "shop" ? (
          <ShopReportView
            period={period}
            selectedDate={selectedDate}
            report={shopReport}
            setPeriod={setPeriod}
            setSelectedDate={setSelectedDate}
            t={t}
          />
        ) : (
          <EmployeeReportView
            employees={matchingEmployees}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
            search={employeeSearch}
            setSearch={setEmployeeSearch}
            startDate={rangeStart}
            endDate={rangeEnd}
            effectiveStartDate={employeeStartDate}
            effectiveEndDate={employeeEndDate}
            setStartDate={setRangeStart}
            setEndDate={setRangeEnd}
            report={employeeReport}
            t={t}
          />
        )}
      </div>
      <BottomNav />
    </main>
  );
}

function ShopReportView({
  period,
  selectedDate,
  report,
  setPeriod,
  setSelectedDate,
  t,
}: {
  period: Period;
  selectedDate: string;
  report: {
    startDate: string;
    endDate: string;
    sales: number;
    cashSales: number;
    cardSales: number;
    commissionTotal: number;
    expenseTotal: number;
    netIncome: number;
    recordCount: number;
    expenseCount: number;
    expensesByCategory: { category: string; amount: number }[];
  };
  setPeriod: (period: Period) => void;
  setSelectedDate: (date: string) => void;
  t: LanguageText;
}) {
  const [showExpenseCategories, setShowExpenseCategories] = useState(false);
  const closeLabel = t.back.includes("Back") ? "Close" : "关闭";

  return (
    <>
      <section className="mb-3 rounded-xl border border-gray-200 p-3">
        <FormLabel htmlFor="report-date">{t.reportDate}</FormLabel>
        <input
          id="report-date"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className={inputClassName}
        />

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            ["day", t.day],
            ["week", t.week],
            ["month", t.month],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value as Period)}
              className={`min-h-10 rounded-xl border px-2 text-sm font-semibold ${
                period === value
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {report.startDate} {t.to} {report.endDate}
        </p>
      </section>

      <section className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
        <SummaryCard label={t.sales} value={formatCurrency(report.sales)} />
        <SummaryCard label={t.cashSales} value={formatCurrency(report.cashSales)} />
        <SummaryCard label={t.cardSales} value={formatCurrency(report.cardSales)} />
        <SummaryCard
          label={t.employeeCommission}
          value={formatCurrency(report.commissionTotal)}
        />
        <SummaryCard label={t.expense} value={formatCurrency(report.expenseTotal)} />
        <SummaryCard label={t.netIncome} value={formatCurrency(report.netIncome)} />
      </section>

      <section className="mb-3 rounded-xl bg-blue-50 p-3">
        <p className="text-sm text-blue-900">
          {t.counted} {report.recordCount} {t.days}, {report.expenseCount}{" "}
          {t.expenseCount}.
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {t.expenseCategories}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {report.expensesByCategory.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowExpenseCategories(true)}
            className="min-h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
          >
            {t.expenseCategories}
          </button>
        </div>
      </section>

      {showExpenseCategories && (
        <ReportListModal
          title={t.expenseCategories}
          closeLabel={closeLabel}
          onClose={() => setShowExpenseCategories(false)}
        >
        {report.expensesByCategory.length === 0 ? (
          <EmptyState>{t.noExpenses}</EmptyState>
        ) : (
          <div className="space-y-3">
            {report.expensesByCategory.map((item) => (
              <div
                key={item.category}
                className="flex flex-col gap-2 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-semibold text-gray-900">
                  {item.category}
                </span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
        </ReportListModal>
      )}
    </>
  );
}

function EmployeeReportView({
  employees,
  selectedEmployeeId,
  setSelectedEmployeeId,
  search,
  setSearch,
  startDate,
  endDate,
  effectiveStartDate,
  effectiveEndDate,
  setStartDate,
  setEndDate,
  report,
  t,
}: {
  employees: Employee[];
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  search: string;
  setSearch: (search: string) => void;
  startDate: string;
  endDate: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  report: EmployeeReport;
  t: LanguageText;
}) {
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingStartDate, setPendingStartDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(startDate.slice(0, 7));
  const [detailModal, setDetailModal] = useState<
    "summary" | "daily" | "weekly" | null
  >(null);
  const selectedTotal = report.employeeTotals[0] ?? null;
  const isEnglish = t.back.includes("Back");
  const dateLabel = isEnglish ? "Date" : "日期";
  const datePickerTitle = isEnglish ? "Select Date" : "选择日期";
  const datePickerHint = isEnglish
    ? "Choose one day, or choose a second day to view the range between them."
    : "选择一个日期，或再选第二个日期查看两个日期之间的数据。";
  const closeLabel = t.back.includes("Back") ? "Close" : "关闭";

  useEffect(() => {
    if (selectedEmployeeId !== "all" || employees.length === 0) {
      return;
    }

    const selectFirstEmployee = window.setTimeout(() => {
      setSelectedEmployeeId(employees[0].id);
    }, 0);

    return () => window.clearTimeout(selectFirstEmployee);
  }, [employees, selectedEmployeeId, setSelectedEmployeeId]);

  function chooseEmployee(employeeId: string) {
    setSearch("");
    setShowRevenueModal(false);
    setSelectedEmployeeId(employeeId);
  }

  return (
    <>
      <section className="mb-3 rounded-xl border border-gray-200 p-3">
        <FormLabel htmlFor="employee-search">{t.searchSalary}</FormLabel>
        <input
          id="employee-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.searchPlaceholder}
          className={inputClassName}
        />

        <div className="mt-3">
          <FormLabel htmlFor="employee-select">{t.employee}</FormLabel>
          <select
            id="employee-select"
            value={selectedEmployeeId}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
            className={inputClassName}
          >
            <option value="all">{t.allEmployees}</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
                {employee.active ? "" : t.inactive}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold text-gray-800">{dateLabel}</p>
          <button
            type="button"
            onClick={() => {
              setPendingStartDate(null);
              setCalendarMonth(effectiveStartDate.slice(0, 7));
              setShowDatePicker(true);
            }}
            className="flex min-h-12 w-full min-w-0 max-w-full items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 text-left text-base font-semibold text-gray-900"
          >
            <span className="min-w-0 break-words">
              {effectiveStartDate === effectiveEndDate
                ? effectiveStartDate
                : `${effectiveStartDate} ${t.to} ${effectiveEndDate}`}
            </span>
            <span className="shrink-0 text-sm text-gray-500">v</span>
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {t.viewing}: {effectiveStartDate} {t.to} {effectiveEndDate}
        </p>
      </section>

      <section className="mb-3">
        <h2 className="mb-3 text-base font-bold text-gray-900">{t.employee}</h2>
        {employees.length === 0 ? (
          <EmptyState>{t.noSalary}</EmptyState>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {employees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => chooseEmployee(employee.id)}
                className={`min-h-10 shrink-0 rounded-xl border px-4 text-sm font-semibold ${
                  selectedEmployeeId === employee.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                {employee.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {showDatePicker && (
        <DateRangePickerModal
          title={datePickerTitle}
          hint={datePickerHint}
          closeLabel={closeLabel}
          month={calendarMonth}
          startDate={startDate}
          endDate={endDate}
          pendingStartDate={pendingStartDate}
          isEnglish={isEnglish}
          onPreviousMonth={() => setCalendarMonth(shiftMonth(calendarMonth, -1))}
          onNextMonth={() => setCalendarMonth(shiftMonth(calendarMonth, 1))}
          onClose={() => {
            setPendingStartDate(null);
            setShowDatePicker(false);
          }}
          onPickDate={(dateKey) => {
            if (!pendingStartDate) {
              setPendingStartDate(dateKey);
              setStartDate(dateKey);
              setEndDate(dateKey);
              return;
            }

            const nextStartDate =
              pendingStartDate <= dateKey ? pendingStartDate : dateKey;
            const nextEndDate =
              pendingStartDate <= dateKey ? dateKey : pendingStartDate;
            setStartDate(nextStartDate);
            setEndDate(nextEndDate);
            setPendingStartDate(null);
            setShowDatePicker(false);
          }}
        />
      )}

      {selectedTotal && (
        <section className="mb-3 rounded-xl border border-gray-200 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedTotal.employeeName}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {effectiveStartDate} {t.to} {effectiveEndDate}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRevenueModal(true)}
              className="min-h-10 shrink-0 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700"
            >
              Revenue
            </button>
          </div>
        </section>
      )}

      <section className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <SummaryCard label="营业额 / Sales" value={formatCurrency(report.revenueTotal)} />
        <SummaryCard label="单数 / Orders" value={String(report.orderCount)} />
        <SummaryCard label={t.basePay} value={formatCurrency(report.basePayTotal)} />
        <SummaryCard
          label={t.commission}
          value={formatCurrency(report.commissionTotal)}
        />
        <SummaryCard label={t.total} value={formatCurrency(report.payTotal)} />
      </section>

      <section className="mb-3 rounded-xl bg-green-50 p-3">
        <p className="text-sm text-green-900">
          {t.weeklyTotal}: {formatCurrency(report.weeklySettlementTotal)}
        </p>
      </section>

      <section className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setDetailModal("summary")}
          className="min-h-20 rounded-2xl border border-gray-200 p-3 text-left text-sm font-semibold text-gray-800"
        >
          {t.employeeSummary}
        </button>
        <button
          type="button"
          onClick={() => setDetailModal("daily")}
          className="min-h-20 rounded-2xl border border-gray-200 p-3 text-left text-sm font-semibold text-gray-800"
        >
          {t.dailyDetails}
        </button>
        <button
          type="button"
          onClick={() => setDetailModal("weekly")}
          className="min-h-20 rounded-2xl border border-gray-200 p-3 text-left text-sm font-semibold text-gray-800"
        >
          {t.weeklySettlement}
        </button>
      </section>

      {detailModal === "summary" && (
        <ReportListModal
          title={t.employeeSummary}
          closeLabel={closeLabel}
          onClose={() => setDetailModal(null)}
        >
        {report.employeeTotals.length === 0 ? (
          <EmptyState>{t.noSalary}</EmptyState>
        ) : (
          <div className="space-y-3">
            {report.employeeTotals.map((employee) => (
              <article
                key={employee.employeeId}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">
                      {employee.employeeName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      营业额 / Sales {formatCurrency(employee.revenueTotal)} · 单数 / Orders{" "}
                      {employee.orderCount}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {t.commission} {formatCurrency(employee.commissionTotal)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{t.total}</p>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(employee.payTotal)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        </ReportListModal>
      )}

      {detailModal === "daily" && (
        <ReportListModal
          title={t.dailyDetails}
          closeLabel={closeLabel}
          onClose={() => setDetailModal(null)}
        >
        {report.dailyRows.length === 0 ? (
          <EmptyState>{t.noDailyDetails}</EmptyState>
        ) : (
          <div className="space-y-3">
            {report.dailyRows.map((row) => (
              <article
                key={`${row.employeeId}-${row.date}`}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{row.employeeName}</p>
                    <p className="mt-1 text-sm text-gray-500">{row.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Sales {formatCurrency(row.revenue)} · Orders {row.orderCount}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t.basePay} {formatCurrency(row.basePay)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t.commission} {formatCurrency(row.commission)}
                    </p>
                    <p className="mt-1 font-bold text-gray-900">
                      {formatCurrency(row.total)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        </ReportListModal>
      )}

      {detailModal === "weekly" && (
        <ReportListModal
          title={t.weeklySettlement}
          closeLabel={closeLabel}
          onClose={() => setDetailModal(null)}
        >
        {report.weeklySettlements.length === 0 ? (
          <EmptyState>{t.noWeeklySettlement}</EmptyState>
        ) : (
          <div className="space-y-3">
            {report.weeklySettlements.map((week) => (
              <article
                key={`${week.employeeId}-${week.weekStart}`}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <p className="font-bold text-gray-900">{week.employeeName}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {week.weekStart} {t.to} {week.weekEnd},{" "}
                  {t.weeklySettlementSuffix}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Sales {formatCurrency(week.revenueTotal)} · Orders{" "}
                  {week.orderCount}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <MiniTotal label={t.basePay} value={week.basePayTotal} />
                  <MiniTotal label={t.commission} value={week.commissionTotal} />
                  <MiniTotal label={t.total} value={week.payTotal} />
                </div>
              </article>
            ))}
          </div>
        )}
        </ReportListModal>
      )}

      {showRevenueModal && selectedTotal && (
        <RevenueModal
          employeeName={selectedTotal.employeeName}
          rows={report.dailyRows}
          onClose={() => setShowRevenueModal(false)}
        />
      )}
    </>
  );
}

function DateRangePickerModal({
  title,
  hint,
  closeLabel,
  month,
  startDate,
  endDate,
  pendingStartDate,
  isEnglish,
  onPreviousMonth,
  onNextMonth,
  onPickDate,
  onClose,
}: {
  title: string;
  hint: string;
  closeLabel: string;
  month: string;
  startDate: string;
  endDate: string;
  pendingStartDate: string | null;
  isEnglish: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onPickDate: (dateKey: string) => void;
  onClose: () => void;
}) {
  const weekdays = isEnglish
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["日", "一", "二", "三", "四", "五", "六"];
  const monthLabel = formatMonthLabel(month, isEnglish);
  const selectedStart = pendingStartDate ?? startDate;
  const selectedEnd = pendingStartDate ?? endDate;
  const rangeStart = selectedStart <= selectedEnd ? selectedStart : selectedEnd;
  const rangeEnd = selectedStart <= selectedEnd ? selectedEnd : selectedStart;

  return (
    <AppModal onClose={onClose} contentClassName="flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
        >
          {closeLabel}
        </button>
      </div>
      <div className="overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="min-h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
          >
            {"<"}
          </button>
          <p className="text-base font-bold text-gray-900">{monthLabel}</p>
          <button
            type="button"
            onClick={onNextMonth}
            className="min-h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
          >
            {">"}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((weekday) => (
            <div
              key={weekday}
              className="py-2 text-center text-xs font-semibold text-gray-500"
            >
              {weekday}
            </div>
          ))}
          {buildCalendarCells(month).map((cell, index) =>
            cell ? (
              <button
                key={cell}
                type="button"
                onClick={() => onPickDate(cell)}
                className={`min-h-11 rounded-xl text-sm font-semibold ${
                  cell === rangeStart || cell === rangeEnd
                    ? "bg-gray-900 text-white"
                    : cell > rangeStart && cell < rangeEnd
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700"
                }`}
              >
                {Number(cell.slice(8, 10))}
              </button>
            ) : (
              <div key={`blank-${index}`} />
            ),
          )}
        </div>
        <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm font-semibold text-gray-800">
          {rangeStart === rangeEnd ? rangeStart : `${rangeStart} - ${rangeEnd}`}
        </p>
      </div>
    </AppModal>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl text-sm font-semibold ${
        active ? "bg-gray-900 text-white" : "text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function RevenueModal({
  employeeName,
  rows,
  onClose,
}: {
  employeeName: string;
  rows: EmployeeReport["dailyRows"];
  onClose: () => void;
}) {
  const revenueRows = rows.filter((row) => row.revenue > 0 || row.orderCount > 0);
  const totalRevenue = sumBy(revenueRows, (row) => row.revenue);
  const totalOrders = sumBy(revenueRows, (row) => row.orderCount);

  return (
    <AppModal onClose={onClose} contentClassName="flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {employeeName} Revenue
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {formatCurrency(totalRevenue)} · {totalOrders} orders
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {revenueRows.length === 0 ? (
            <EmptyState>No revenue records</EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[30rem] w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Orders</th>
                    <th className="px-3 py-3 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueRows.map((row) => (
                    <tr
                      key={`${row.employeeId}-${row.date}-revenue`}
                      className="border-t border-gray-200"
                    >
                      <td className="px-3 py-3 text-gray-900">{row.date}</td>
                      <td className="px-3 py-3 text-gray-700">{row.orderCount}</td>
                      <td className="px-3 py-3 font-semibold text-gray-900">
                        {formatCurrency(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </AppModal>
  );
}

function ReportListModal({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AppModal onClose={onClose} contentClassName="flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
          >
            {closeLabel}
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
    </AppModal>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-gray-900">{value}</p>
    </article>
  );
}

function MiniTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-bold text-gray-900">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function FormLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-gray-800"
    >
      {children}
    </label>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

type EmployeeReport = {
  basePayTotal: number;
  revenueTotal: number;
  orderCount: number;
  commissionTotal: number;
  payTotal: number;
  weeklySettlementTotal: number;
  employeeTotals: {
    employeeId: string;
    employeeName: string;
    basePayTotal: number;
    revenueTotal: number;
    orderCount: number;
    commissionTotal: number;
    payTotal: number;
  }[];
  dailyRows: {
    employeeId: string;
    employeeName: string;
    date: string;
    basePay: number;
    revenue: number;
    orderCount: number;
    commission: number;
    total: number;
  }[];
  weeklySettlements: {
    employeeId: string;
    employeeName: string;
    weekStart: string;
    weekEnd: string;
    basePayTotal: number;
    revenueTotal: number;
    orderCount: number;
    commissionTotal: number;
    payTotal: number;
  }[];
};

const inputClassName =
  "min-h-12 w-full min-w-0 max-w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none focus:border-gray-900";

function buildEmployeeReport({
  employees,
  dailyRecords,
  startDate,
  endDate,
  employeeId,
}: {
  employees: Employee[];
  dailyRecords: DailyRecord[];
  startDate: string;
  endDate: string;
  employeeId: string;
}): EmployeeReport {
  const normalizedStart = startDate <= endDate ? startDate : endDate;
  const normalizedEnd = startDate <= endDate ? endDate : startDate;
  const selectedEmployees =
    employeeId === "all"
      ? employees
      : employees.filter((employee) => employee.id === employeeId);
  const dateKeys = getDateRange(normalizedStart, normalizedEnd);
  const dailyRows = selectedEmployees.flatMap((employee) =>
    dateKeys
      .map((date) => {
        const orderStats = getOrderStatsForEmployee(dailyRecords, date, employee);
        const legacyCommission = getLegacyCommissionForEmployee(
          dailyRecords,
          date,
          employee,
        );
        const commission =
          orderStats.commission > 0 ? orderStats.commission : legacyCommission;
        const basePay = getDailyBasePay(employee, date);
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          date,
          basePay,
          revenue: orderStats.revenue,
          orderCount: orderStats.orderCount,
          commission,
          total: basePay + commission,
        };
      })
      .filter(
        (row) => row.basePay > 0 || row.commission > 0 || row.revenue > 0,
      ),
  );
  const employeeTotals = selectedEmployees
    .map((employee) => {
      const rows = dailyRows.filter((row) => row.employeeId === employee.id);
      const basePayTotal = sumBy(rows, (row) => row.basePay);
      const revenueTotal = sumBy(rows, (row) => row.revenue);
      const orderCount = sumBy(rows, (row) => row.orderCount);
      const commissionTotal = sumBy(rows, (row) => row.commission);

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        basePayTotal,
        revenueTotal,
        orderCount,
        commissionTotal,
        payTotal: basePayTotal + commissionTotal,
      };
    })
    .filter((employee) => employee.payTotal > 0)
    .sort((a, b) => b.payTotal - a.payTotal);
  const weeklySettlements = selectedEmployees.flatMap((employee) =>
    buildWeeklySettlements(employee, dailyRecords, normalizedStart, normalizedEnd),
  );
  const basePayTotal = sumBy(employeeTotals, (employee) => employee.basePayTotal);
  const commissionTotal = sumBy(
    employeeTotals,
    (employee) => employee.commissionTotal,
  );
  const revenueTotal = sumBy(employeeTotals, (employee) => employee.revenueTotal);
  const orderCount = sumBy(employeeTotals, (employee) => employee.orderCount);

  return {
    basePayTotal,
    revenueTotal,
    orderCount,
    commissionTotal,
    payTotal: basePayTotal + commissionTotal,
    weeklySettlementTotal: sumBy(weeklySettlements, (week) => week.payTotal),
    employeeTotals,
    dailyRows: dailyRows.sort((a, b) =>
      b.date === a.date
        ? a.employeeName.localeCompare(b.employeeName)
        : b.date.localeCompare(a.date),
    ),
    weeklySettlements,
  };
}

function buildWeeklySettlements(
  employee: Employee,
  dailyRecords: DailyRecord[],
  startDate: string,
  endDate: string,
) {
  const allDates = getDateRange(startDate, endDate);
  const weekKeys = new Map<string, string[]>();

  allDates.forEach((date) => {
    const { weekStart, weekEnd } = getWeekRange(date);
    const key = `${weekStart}|${weekEnd}`;
    weekKeys.set(key, [...(weekKeys.get(key) ?? []), date]);
  });

  return [...weekKeys.entries()]
    .map(([key, dates]) => {
      const [weekStart, weekEnd] = key.split("|");
      const basePayTotal = sumBy(dates, (date) => getDailyBasePay(employee, date));
      const revenueTotal = sumBy(
        dates,
        (date) => getOrderStatsForEmployee(dailyRecords, date, employee).revenue,
      );
      const orderCount = sumBy(
        dates,
        (date) => getOrderStatsForEmployee(dailyRecords, date, employee).orderCount,
      );
      const commissionTotal = sumBy(dates, (date) => {
        const orderCommission = getOrderStatsForEmployee(
          dailyRecords,
          date,
          employee,
        ).commission;
        return orderCommission > 0
          ? orderCommission
          : getLegacyCommissionForEmployee(dailyRecords, date, employee);
      });

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        weekStart,
        weekEnd,
        basePayTotal,
        revenueTotal,
        orderCount,
        commissionTotal,
        payTotal: basePayTotal + commissionTotal,
      };
    })
    .filter((week) => week.payTotal > 0)
    .sort((a, b) =>
      b.weekEnd === a.weekEnd
        ? a.employeeName.localeCompare(b.employeeName)
        : b.weekEnd.localeCompare(a.weekEnd),
    );
}

function getOrderStatsForEmployee(
  dailyRecords: DailyRecord[],
  date: string,
  employee: Employee,
) {
  const record = dailyRecords.find((item) => item.date === date);
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
  dailyRecords: DailyRecord[],
  date: string,
  employee: Employee,
) {
  const record = dailyRecords.find((item) => item.date === date);

  return (
    record?.commissions
      .filter(
        (entry) =>
          entry.employeeId === employee.id || entry.employeeName === employee.name,
      )
      .reduce((sum, entry) => sum + entry.amount, 0) ?? 0
  );
}

function getRecordCashSales(record: DailyRecord) {
  if (!record.orders) {
    return record.cashSales;
  }

  return getPaymentTotals(record.orders, record.giftCardSales ?? []).cashSales;
}

function getRecordCardSales(record: DailyRecord) {
  if (!record.orders) {
    return record.cardSales;
  }

  return getPaymentTotals(record.orders, record.giftCardSales ?? []).cardSales;
}

function getRecordCommissionTotal(record: DailyRecord) {
  if (record.orders) {
    return record.orders.reduce(
      (sum, order) => sum + getOrderCommission(order),
      0,
    );
  }

  return record.commissions.reduce((sum, entry) => sum + entry.amount, 0);
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

function getPaymentTotals(orders: EmployeeOrder[], giftCardSales: GiftCardSale[]) {
  return {
    cashSales:
      orders.reduce((sum, order) => {
        const method = order.paymentMethod ?? "card";

        if (method === "cash") {
          return sum + getOrderRevenue(order);
        }

        if (method === "split") {
          return sum + (order.cashAmount ?? 0);
        }

        if (method === "gift-card") {
          if (order.giftCardRemainderMethod === "cash") {
            return sum + getOrderRevenue(order);
          }

          if (order.giftCardRemainderMethod === "split") {
            return sum + (order.cashAmount ?? 0);
          }
        }

        return sum;
      }, 0) +
      giftCardSales
        .filter((sale) => sale.paymentMethod === "cash")
        .reduce((sum, sale) => sum + sale.amount, 0),
    cardSales:
      orders.reduce((sum, order) => {
        const method = order.paymentMethod ?? "card";

        if (method === "card") {
          return sum + getOrderRevenue(order);
        }

        if (method === "split") {
          return sum + (order.cardAmount ?? 0);
        }

        if (method === "gift-card") {
          if (order.giftCardRemainderMethod === "cash") {
            return sum;
          }

          if (order.giftCardRemainderMethod === "split") {
            return sum + (order.cardAmount ?? 0);
          }

          return sum + getOrderRevenue(order);
        }

        return sum;
      }, 0) +
      giftCardSales
        .filter((sale) => sale.paymentMethod === "card")
        .reduce((sum, sale) => sum + sale.amount, 0),
  };
}

function getOrderCommission(order: EmployeeOrder) {
  return (
    order.commission +
    (order.extras ?? []).reduce((sum, extra) => sum + extra.commission, 0)
  );
}

function getDailyBasePay(employee: Employee, date: string) {
  const salary = getSalaryForDate(employee, date);
  const amount = salary?.newAmount ?? employee.basePay;
  const payPeriod = salary?.payPeriod ?? employee.basePayPeriod;

  if (payPeriod === "daily") {
    return amount;
  }

  if (payPeriod === "weekly") {
    return amount / 7;
  }

  return amount / getDaysInMonth(date);
}

function getSalaryForDate(employee: Employee, targetDate: string) {
  const availableEntries = (employee.salaryHistory ?? [])
    .filter(
      (entry) => entry.status !== "cancelled" && entry.effectiveDate <= targetDate,
    )
    .sort((firstEntry, secondEntry) => {
      const dateComparison = secondEntry.effectiveDate.localeCompare(
        firstEntry.effectiveDate,
      );

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return secondEntry.createdAt.localeCompare(firstEntry.createdAt);
    });

  return availableEntries[0] ?? null;
}

function parseEmployeeSearch(search: string, employees: Employee[]) {
  const trimmedSearch = search.trim();

  if (!trimmedSearch) {
    return {};
  }

  const employee = employees.find((item) =>
    trimmedSearch.toLowerCase().includes(item.name.toLowerCase()),
  );
  const rangeMatch = trimmedSearch.match(
    /(\d{1,2})[/-](\d{1,2})(?:\s*(?:-|to|到|至|~)\s*(\d{1,2})[/-](\d{1,2}))?/i,
  );

  if (!rangeMatch) {
    return { employeeId: employee?.id };
  }

  const year = new Date().getFullYear();
  const startDate = formatDateKey(
    new Date(year, Number(rangeMatch[1]) - 1, Number(rangeMatch[2]), 12),
  );
  const endDate = rangeMatch[3]
    ? formatDateKey(
        new Date(year, Number(rangeMatch[3]) - 1, Number(rangeMatch[4]), 12),
      )
    : startDate;

  return {
    employeeId: employee?.id,
    startDate,
    endDate,
  };
}

function getEmployeeSearchText(search: string) {
  return search
    .replace(
      /(\d{1,2})[/-](\d{1,2})(?:\s*(?:-|to|~)\s*(\d{1,2})[/-](\d{1,2}))?/gi,
      " ",
    )
    .replace(/\b(to|from)\b/gi, " ")
    .trim();
}

function matchesSearchText(value: string, searchText: string) {
  return value.toLowerCase().includes(searchText.trim().toLowerCase());
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function groupExpensesByCategory(expenses: Expense[]) {
  const totals = new Map<string, number>();

  expenses.forEach((expense) => {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  });

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function getPeriodDates(selectedDate: string, period: Period) {
  const date = new Date(`${selectedDate}T12:00:00`);

  if (period === "day") {
    return [selectedDate];
  }

  if (period === "week") {
    const { weekStart } = getWeekRange(selectedDate);
    const monday = new Date(`${weekStart}T12:00:00`);

    return Array.from({ length: 7 }, (_, index) =>
      formatDateKey(addDays(monday, index)),
    );
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    formatDateKey(new Date(year, month, index + 1, 12)),
  );
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

function buildCalendarCells(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDate = new Date(year, month - 1, 1, 12);
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = Array.from(
    { length: firstDate.getDay() },
    () => null,
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(formatDateKey(new Date(year, month - 1, day, 12)));
  }

  return cells;
}

function shiftMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const nextDate = new Date(year, month - 1 + offset, 1, 12);

  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function formatMonthLabel(monthKey: string, isEnglish: boolean) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1, 12);

  return new Intl.DateTimeFormat(isEnglish ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
  }).format(date);
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

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getDaysInMonth(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  return formatDateKey(new Date());
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
