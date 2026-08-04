"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppModal } from "../AppModal";
import { BottomNav } from "../BottomNav";
import { LanguageSwitcher, useLanguage } from "../useLanguage";

type BasePayPeriod = "daily" | "weekly" | "monthly";
type SalaryEntryStatus = "active" | "cancelled";

type SalaryHistoryEntry = {
  id: string;
  previousAmount: number | null;
  newAmount: number;
  payPeriod: BasePayPeriod;
  effectiveDate: string;
  reason: string;
  createdAt: string;
  status: SalaryEntryStatus;
  cancelledAt?: string;
  cancelReason?: string;
};

type Employee = {
  id: string;
  name: string;
  basePay: number;
  basePayPeriod: BasePayPeriod;
  active: boolean;
  createdAt: string;
  salaryHistory: SalaryHistoryEntry[];
};

type EmployeeText = typeof text.zh;

const STORAGE_KEY = "salon-record-employees";

const text = {
  zh: {
    back: "← 返回首页",
    title: "员工管理",
    subtitle: "Employees",
    addEmployee: "+ 添加员工",
    activeEmployees: "在职员工",
    inactiveEmployees: "已停用",
    inactiveEmployeeTitle: "已停用员工",
    note: "此页面设置员工底薪。员工每天因不同服务产生的提成，会在“记账 / 补录账目”中填写。",
    noEmployees: "目前还没有员工",
    emptyHint: "点击右上角“添加员工”开始记录。",
    editEmployee: "编辑员工",
    editScheduledSalary: "编辑未来调薪",
    addEmployeeTitle: "添加员工",
    formHint: "修改底薪后，系统会自动保留薪资记录。",
    cancel: "取消",
    name: "员工姓名",
    namePlaceholder: "例如：May",
    basePay: "底薪金额",
    payPeriod: "底薪计算周期",
    daily: "每天",
    weekly: "每周",
    monthly: "每月",
    effectiveDateEdit: "新薪资生效日期",
    effectiveDateAdd: "底薪开始日期",
    changeReason: "调整原因",
    reasonPlaceholder: "例如：工作满一年加薪",
    saveChanges: "保存修改",
    saveEmployee: "保存员工",
    nameRequired: "请输入员工姓名。",
    amountInvalid: "请输入正确的底薪金额。",
    dateRequired: "请选择薪资生效日期。",
    importReason: "从旧版员工数据自动导入",
    initialReason: "员工入职时设置的初始底薪",
    salaryAdjust: "薪资调整",
    cancelReasonPrompt: "请输入取消这次薪资调整的原因：",
    cancelReasonRequired: "请输入取消原因。",
    cancelConfirm: "确定要取消这次未来薪资调整吗？取消后系统会保留记录，但不会再自动生效。",
    currentBasePay: "当前底薪",
    commissionHint: "每日提成在记账 / 补录账目时填写",
    scheduledAdjust: "已安排薪资调整",
    startsAdjustTo: "起调整为",
    edit: "编辑",
    salaryRecords: "薪资记录",
    collapseRecords: "收起记录",
    disable: "停用",
    restore: "恢复",
    deleteEmployee: "删除",
    deleteConfirm: "请确认是否删除这个员工？删除后员工会从员工管理中移除。",
    active: "在职",
    inactive: "已停用",
    salaryHistory: "薪资变动记录",
    initialBasePay: "初始底薪",
    pending: "待生效",
    effective: "已生效",
    cancelled: "已取消",
    cancelReason: "取消原因",
    cancelAdjust: "取消调薪",
    unnamed: "未命名员工",
  },
  en: {
    back: "← Back Home",
    title: "Employees",
    subtitle: "Employee Management",
    addEmployee: "+ Add Employee",
    activeEmployees: "Active Employees",
    inactiveEmployees: "Inactive",
    inactiveEmployeeTitle: "Inactive Employees",
    note: "Set employee base pay here. Daily service commission is entered in Record / Backfill.",
    noEmployees: "No employees yet",
    emptyHint: "Use Add Employee in the top right to start.",
    editEmployee: "Edit Employee",
    editScheduledSalary: "Edit Scheduled Raise",
    addEmployeeTitle: "Add Employee",
    formHint: "Changes to base pay are saved in the salary history.",
    cancel: "Cancel",
    name: "Employee Name",
    namePlaceholder: "Example: May",
    basePay: "Base Pay",
    payPeriod: "Pay Period",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    effectiveDateEdit: "New Pay Effective Date",
    effectiveDateAdd: "Base Pay Start Date",
    changeReason: "Reason",
    reasonPlaceholder: "Example: one-year raise",
    saveChanges: "Save Changes",
    saveEmployee: "Save Employee",
    nameRequired: "Enter employee name.",
    amountInvalid: "Enter a valid base pay amount.",
    dateRequired: "Choose a salary effective date.",
    importReason: "Imported from old employee data",
    initialReason: "Initial base pay set when employee joined",
    salaryAdjust: "Salary adjustment",
    cancelReasonPrompt: "Enter the reason for canceling this salary change:",
    cancelReasonRequired: "Enter a cancel reason.",
    cancelConfirm: "Cancel this future salary change? The record will be kept but will not take effect.",
    currentBasePay: "Current Base Pay",
    commissionHint: "Daily commission is entered in Record / Backfill",
    scheduledAdjust: "Scheduled Salary Change",
    startsAdjustTo: "starts at",
    edit: "Edit",
    salaryRecords: "Salary Records",
    collapseRecords: "Collapse",
    disable: "Disable",
    restore: "Restore",
    deleteEmployee: "Delete",
    deleteConfirm: "Please confirm deleting this employee. This removes the employee from employee management.",
    active: "Active",
    inactive: "Inactive",
    salaryHistory: "Salary Change History",
    initialBasePay: "Initial base pay",
    pending: "Pending",
    effective: "Effective",
    cancelled: "Cancelled",
    cancelReason: "Cancel reason",
    cancelAdjust: "Cancel Raise",
    unnamed: "Unnamed employee",
  },
};

export default function EmployeesPage() {
  const { language, setLanguage } = useLanguage();
  const t = text[language];
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingSalaryEntryId, setEditingSalaryEntryId] = useState<string | null>(
    null,
  );
  const [name, setName] = useState("");
  const [basePay, setBasePay] = useState("");
  const [basePayPeriod, setBasePayPeriod] = useState<BasePayPeriod>("daily");
  const [effectiveDate, setEffectiveDate] = useState(getTodayDate());
  const [changeReason, setChangeReason] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployees = window.setTimeout(() => {
      const savedEmployees = window.localStorage.getItem(STORAGE_KEY);

      if (savedEmployees) {
        try {
          const parsedEmployees = JSON.parse(savedEmployees) as Partial<Employee>[];
          setEmployees(parsedEmployees.map((employee) => migrateEmployee(employee, t)));
        } catch {
          console.error("Failed to read employee data");
        }
      }

      setHasLoaded(true);
    }, 0);

    return () => window.clearTimeout(loadEmployees);
  }, [t]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }, [employees, hasLoaded]);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.active),
    [employees],
  );
  const inactiveEmployees = useMemo(
    () => employees.filter((employee) => !employee.active),
    [employees],
  );

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(employee: Employee) {
    const currentSalary = getSalaryForDate(employee, getTodayDate());

    setEditingEmployeeId(employee.id);
    setEditingSalaryEntryId(null);
    setName(employee.name);
    setBasePay(String(currentSalary?.newAmount ?? employee.basePay));
    setBasePayPeriod(currentSalary?.payPeriod ?? employee.basePayPeriod);
    setEffectiveDate(getTodayDate());
    setChangeReason("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditScheduledSalary(employee: Employee, entry: SalaryHistoryEntry) {
    if (entry.status === "cancelled" || entry.effectiveDate <= getTodayDate()) {
      return;
    }

    setEditingEmployeeId(employee.id);
    setEditingSalaryEntryId(entry.id);
    setName(employee.name);
    setBasePay(String(entry.newAmount));
    setBasePayPeriod(entry.payPeriod);
    setEffectiveDate(entry.effectiveDate);
    setChangeReason(entry.reason);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingSalaryEntryId(null);
    setEditingEmployeeId(null);
    setName("");
    setBasePay("");
    setBasePayPeriod("daily");
    setEffectiveDate(getTodayDate());
    setChangeReason("");
    setShowForm(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const numericBasePay = Number(basePay);

    if (!trimmedName) {
      window.alert(t.nameRequired);
      return;
    }

    if (basePay === "" || Number.isNaN(numericBasePay) || numericBasePay < 0) {
      window.alert(t.amountInvalid);
      return;
    }

    if (!effectiveDate) {
      window.alert(t.dateRequired);
      return;
    }

    if (editingEmployeeId) {
      updateEmployee(
        editingEmployeeId,
        trimmedName,
        numericBasePay,
        basePayPeriod,
        effectiveDate,
        changeReason.trim(),
        editingSalaryEntryId,
        t,
      );
    } else {
      addEmployee(trimmedName, numericBasePay, basePayPeriod, effectiveDate, t);
    }

    resetForm();
  }

  function addEmployee(
    employeeName: string,
    amount: number,
    payPeriod: BasePayPeriod,
    salaryEffectiveDate: string,
    copy: EmployeeText,
  ) {
    const createdAt = new Date().toISOString();
    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      name: employeeName,
      basePay: amount,
      basePayPeriod: payPeriod,
      active: true,
      createdAt,
      salaryHistory: [
        {
          id: crypto.randomUUID(),
          previousAmount: null,
          newAmount: amount,
          payPeriod,
          effectiveDate: salaryEffectiveDate,
          reason: copy.initialReason,
          createdAt,
          status: "active",
        },
      ],
    };

    setEmployees((currentEmployees) => [...currentEmployees, newEmployee]);
  }

  function updateEmployee(
    employeeId: string,
    employeeName: string,
    newBasePay: number,
    newPayPeriod: BasePayPeriod,
    salaryEffectiveDate: string,
    reason: string,
    salaryEntryIdToUpdate: string | null,
    copy: EmployeeText,
  ) {
    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) => {
        if (employee.id !== employeeId) {
          return employee;
        }

        const historyWithoutEditedEntry = salaryEntryIdToUpdate
          ? employee.salaryHistory.filter(
              (entry) => entry.id !== salaryEntryIdToUpdate,
            )
          : employee.salaryHistory;
        const salaryBeforeChange = getSalaryForDate(
          { ...employee, salaryHistory: historyWithoutEditedEntry },
          salaryEffectiveDate,
        );
        const previousAmount = salaryBeforeChange?.newAmount ?? employee.basePay;
        const updatedHistory = salaryEntryIdToUpdate
          ? employee.salaryHistory.map((entry) =>
              entry.id === salaryEntryIdToUpdate
                ? {
                    ...entry,
                    previousAmount,
                    newAmount: newBasePay,
                    payPeriod: newPayPeriod,
                    effectiveDate: salaryEffectiveDate,
                    reason: reason || copy.salaryAdjust,
                    status: "active" as const,
                    cancelledAt: undefined,
                    cancelReason: undefined,
                  }
                : entry,
            )
          : [
              ...employee.salaryHistory,
              {
                id: crypto.randomUUID(),
                previousAmount,
                newAmount: newBasePay,
                payPeriod: newPayPeriod,
                effectiveDate: salaryEffectiveDate,
                reason: reason || copy.salaryAdjust,
                createdAt: new Date().toISOString(),
                status: "active" as const,
              },
            ];
        const currentSalary = getSalaryForDate(
          { ...employee, salaryHistory: updatedHistory },
          getTodayDate(),
        );

        return {
          ...employee,
          name: employeeName,
          basePay: currentSalary?.newAmount ?? employee.basePay,
          basePayPeriod: currentSalary?.payPeriod ?? employee.basePayPeriod,
          salaryHistory: updatedHistory,
        };
      }),
    );
  }

  function cancelScheduledSalary(employeeId: string, salaryEntryId: string) {
    const cancelReason = window.prompt(t.cancelReasonPrompt);

    if (cancelReason === null) {
      return;
    }

    const trimmedReason = cancelReason.trim();

    if (!trimmedReason) {
      window.alert(t.cancelReasonRequired);
      return;
    }

    if (!window.confirm(t.cancelConfirm)) {
      return;
    }

    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) => {
        if (employee.id !== employeeId) {
          return employee;
        }

        const updatedHistory = employee.salaryHistory.map((entry) =>
          entry.id === salaryEntryId
            ? {
                ...entry,
                status: "cancelled" as const,
                cancelledAt: new Date().toISOString(),
                cancelReason: trimmedReason,
              }
            : entry,
        );
        const currentSalary = getSalaryForDate(
          { ...employee, salaryHistory: updatedHistory },
          getTodayDate(),
        );

        return {
          ...employee,
          basePay: currentSalary?.newAmount ?? employee.basePay,
          basePayPeriod: currentSalary?.payPeriod ?? employee.basePayPeriod,
          salaryHistory: updatedHistory,
        };
      }),
    );
  }

  function toggleEmployeeStatus(employeeId: string) {
    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) =>
        employee.id === employeeId
          ? { ...employee, active: !employee.active }
          : employee,
      ),
    );
  }

  function deleteEmployee(employeeId: string) {
    if (!window.confirm(t.deleteConfirm)) {
      return;
    }

    setEmployees((currentEmployees) =>
      currentEmployees.filter((employee) => employee.id !== employeeId),
    );
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

        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid w-full flex-1 grid-cols-2 gap-3">
            <SummaryCard label={t.activeEmployees} value={activeEmployees.length} />
            <SummaryCard label={t.inactiveEmployees} value={inactiveEmployees.length} />
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="min-h-11 w-full shrink-0 rounded-xl bg-gray-900 px-3 text-sm font-semibold text-white sm:w-auto"
          >
            {t.addEmployee}
          </button>
        </div>

        <div className="mb-3 rounded-xl bg-blue-50 p-3">
          <p className="text-sm leading-6 text-blue-900">{t.note}</p>
        </div>

        {showForm && (
          <AppModal onClose={resetForm} contentClassName="overflow-y-auto">
              <EmployeeForm
                t={t}
                isEditing={editingEmployeeId !== null}
                isEditingScheduledSalary={editingSalaryEntryId !== null}
                name={name}
                basePay={basePay}
                basePayPeriod={basePayPeriod}
                effectiveDate={effectiveDate}
                changeReason={changeReason}
                setName={setName}
                setBasePay={setBasePay}
                setBasePayPeriod={setBasePayPeriod}
                setEffectiveDate={setEffectiveDate}
                setChangeReason={setChangeReason}
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
          </AppModal>
        )}

        <EmployeeSection
          t={t}
          title={t.activeEmployees}
          employees={activeEmployees}
          emptyMessage={t.noEmployees}
          expandedHistoryId={expandedHistoryId}
          setExpandedHistoryId={setExpandedHistoryId}
          onEdit={openEditForm}
          onToggleStatus={toggleEmployeeStatus}
          onDelete={deleteEmployee}
          onEditScheduledSalary={openEditScheduledSalary}
          onCancelScheduledSalary={cancelScheduledSalary}
        />

        {inactiveEmployees.length > 0 && (
          <div className="mt-8">
            <EmployeeSection
              t={t}
              title={t.inactiveEmployeeTitle}
              employees={inactiveEmployees}
              emptyMessage=""
              expandedHistoryId={expandedHistoryId}
              setExpandedHistoryId={setExpandedHistoryId}
              onEdit={openEditForm}
              onToggleStatus={toggleEmployeeStatus}
              onDelete={deleteEmployee}
              onEditScheduledSalary={openEditScheduledSalary}
              onCancelScheduledSalary={cancelScheduledSalary}
            />
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

function EmployeeForm({
  t,
  isEditing,
  isEditingScheduledSalary,
  name,
  basePay,
  basePayPeriod,
  effectiveDate,
  changeReason,
  setName,
  setBasePay,
  setBasePayPeriod,
  setEffectiveDate,
  setChangeReason,
  onSubmit,
  onCancel,
}: {
  t: EmployeeText;
  isEditing: boolean;
  isEditingScheduledSalary: boolean;
  name: string;
  basePay: string;
  basePayPeriod: BasePayPeriod;
  effectiveDate: string;
  changeReason: string;
  setName: (value: string) => void;
  setBasePay: (value: string) => void;
  setBasePayPeriod: (value: BasePayPeriod) => void;
  setEffectiveDate: (value: string) => void;
  setChangeReason: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <section className="mb-7 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing
              ? isEditingScheduledSalary
                ? t.editScheduledSalary
                : t.editEmployee
              : t.addEmployeeTitle}
          </h2>
          {isEditing && <p className="mt-1 text-xs text-gray-500">{t.formHint}</p>}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-sm font-medium text-gray-500"
        >
          {t.cancel}
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <FormField label={t.name} htmlFor="employee-name">
          <input
            id="employee-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.namePlaceholder}
            className={inputClassName}
          />
        </FormField>
        <FormField label={t.basePay} htmlFor="base-pay">
          <MoneyInput id="base-pay" value={basePay} onChange={setBasePay} />
        </FormField>
        <FormField label={t.payPeriod} htmlFor="base-pay-period">
          <select
            id="base-pay-period"
            value={basePayPeriod}
            onChange={(event) =>
              setBasePayPeriod(event.target.value as BasePayPeriod)
            }
            className={inputClassName}
          >
            <option value="daily">{t.daily}</option>
            <option value="weekly">{t.weekly}</option>
            <option value="monthly">{t.monthly}</option>
          </select>
        </FormField>
        <FormField
          label={isEditing ? t.effectiveDateEdit : t.effectiveDateAdd}
          htmlFor="effective-date"
        >
          <input
            id="effective-date"
            type="date"
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
            className={inputClassName}
          />
        </FormField>
        {isEditing && (
          <FormField label={t.changeReason} htmlFor="change-reason">
            <input
              id="change-reason"
              type="text"
              value={changeReason}
              onChange={(event) => setChangeReason(event.target.value)}
              placeholder={t.reasonPlaceholder}
              className={inputClassName}
            />
          </FormField>
        )}
        <button
          type="submit"
          className="min-h-12 w-full rounded-xl bg-gray-900 px-5 text-base font-semibold text-white"
        >
          {isEditing ? t.saveChanges : t.saveEmployee}
        </button>
      </form>
    </section>
  );
}

function EmployeeSection({
  t,
  title,
  employees,
  emptyMessage,
  expandedHistoryId,
  setExpandedHistoryId,
  onEdit,
  onToggleStatus,
  onDelete,
  onEditScheduledSalary,
  onCancelScheduledSalary,
}: {
  t: EmployeeText;
  title: string;
  employees: Employee[];
  emptyMessage: string;
  expandedHistoryId: string | null;
  setExpandedHistoryId: (id: string | null) => void;
  onEdit: (employee: Employee) => void;
  onToggleStatus: (employeeId: string) => void;
  onDelete: (employeeId: string) => void;
  onEditScheduledSalary: (employee: Employee, entry: SalaryHistoryEntry) => void;
  onCancelScheduledSalary: (employeeId: string, salaryEntryId: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <section className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{employees.length}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="min-h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
        >
          {t.salaryRecords}
        </button>
      </div>

      {showModal && (
        <AppModal
          onClose={() => setShowModal(false)}
          contentClassName="flex flex-col"
        >
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="mt-1 text-sm text-gray-500">{employees.length}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
              >
                {t.cancel}
              </button>
            </div>
            <div className="overflow-y-auto p-4">
      {employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
          <p className="font-semibold text-gray-800">{emptyMessage}</p>
          <p className="mt-2 text-sm text-gray-500">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              t={t}
              employee={employee}
              showHistory={expandedHistoryId === employee.id}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              onToggleHistory={(employeeId) =>
                setExpandedHistoryId(
                  expandedHistoryId === employeeId ? null : employeeId,
                )
              }
              onEditScheduledSalary={onEditScheduledSalary}
              onCancelScheduledSalary={onCancelScheduledSalary}
            />
          ))}
        </div>
      )}
            </div>
        </AppModal>
      )}
    </section>
  );
}

function EmployeeCard({
  t,
  employee,
  showHistory,
  onEdit,
  onToggleStatus,
  onDelete,
  onToggleHistory,
  onEditScheduledSalary,
  onCancelScheduledSalary,
}: {
  t: EmployeeText;
  employee: Employee;
  showHistory: boolean;
  onEdit: (employee: Employee) => void;
  onToggleStatus: (employeeId: string) => void;
  onDelete: (employeeId: string) => void;
  onToggleHistory: (employeeId: string) => void;
  onEditScheduledSalary: (employee: Employee, entry: SalaryHistoryEntry) => void;
  onCancelScheduledSalary: (employeeId: string, salaryEntryId: string) => void;
}) {
  const sortedHistory = [...(employee.salaryHistory ?? [])].sort((first, second) =>
    second.effectiveDate.localeCompare(first.effectiveDate),
  );
  const today = getTodayDate();
  const currentSalary = getSalaryForDate(employee, today);
  const nextScheduledSalary = getNextScheduledSalary(employee, today);
  const displayedBasePay = currentSalary?.newAmount ?? employee.basePay;
  const displayedPayPeriod = currentSalary?.payPeriod ?? employee.basePayPeriod;

  return (
    <article
      className={`rounded-2xl border p-4 ${
        employee.active
          ? "border-gray-200 bg-white"
          : "border-gray-200 bg-gray-50 opacity-80"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
        <StatusBadge t={t} active={employee.active} />
      </div>
      <p className="mt-3 text-sm text-gray-500">{t.currentBasePay}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">
        {formatCurrency(displayedBasePay)}
        <span className="ml-1 text-sm font-medium text-gray-500">
          / {payPeriodLabel(displayedPayPeriod, t)}
        </span>
      </p>
      <p className="mt-2 text-xs text-gray-500">{t.commissionHint}</p>

      {nextScheduledSalary && (
        <div className="mt-3 rounded-xl bg-blue-50 p-3">
          <p className="text-sm font-semibold text-blue-900">
            {t.scheduledAdjust}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            {formatDate(nextScheduledSalary.effectiveDate)} {t.startsAdjustTo}{" "}
            {formatCurrency(nextScheduledSalary.newAmount)} /{" "}
            {payPeriodLabel(nextScheduledSalary.payPeriod, t)}
          </p>
          <p className="mt-1 text-xs text-blue-700">{nextScheduledSalary.reason}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onEditScheduledSalary(employee, nextScheduledSalary)}
              className="min-h-9 rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-800"
            >
              {t.edit}
            </button>
            <button
              type="button"
              onClick={() =>
                onCancelScheduledSalary(employee.id, nextScheduledSalary.id)
              }
              className="min-h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700"
            >
              {t.cancelAdjust}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onEdit(employee)}
          className="min-h-10 rounded-xl border border-gray-300 px-2 text-sm font-semibold text-gray-700"
        >
          {t.edit}
        </button>
        <button
          type="button"
          onClick={() => onToggleHistory(employee.id)}
          className="min-h-10 rounded-xl border border-gray-300 px-2 text-sm font-semibold text-gray-700"
        >
          {showHistory ? t.collapseRecords : t.salaryRecords}
        </button>
        <button
          type="button"
          onClick={() => onToggleStatus(employee.id)}
          className="min-h-10 rounded-xl border border-gray-300 px-2 text-sm font-semibold text-gray-700"
        >
          {employee.active ? t.disable : t.restore}
        </button>
        <button
          type="button"
          onClick={() => onDelete(employee.id)}
          className="min-h-10 rounded-xl border border-red-200 px-2 text-sm font-semibold text-red-600"
        >
          {t.deleteEmployee}
        </button>
      </div>

      {showHistory && (
        <SalaryHistory
          t={t}
          employee={employee}
          history={sortedHistory}
          onEditScheduledSalary={onEditScheduledSalary}
          onCancelScheduledSalary={onCancelScheduledSalary}
        />
      )}
    </article>
  );
}

function SalaryHistory({
  t,
  employee,
  history,
  onEditScheduledSalary,
  onCancelScheduledSalary,
}: {
  t: EmployeeText;
  employee: Employee;
  history: SalaryHistoryEntry[];
  onEditScheduledSalary: (employee: Employee, entry: SalaryHistoryEntry) => void;
  onCancelScheduledSalary: (employeeId: string, salaryEntryId: string) => void;
}) {
  const today = getTodayDate();

  return (
    <div className="mt-5 border-t border-gray-200 pt-4">
      <h4 className="mb-3 text-sm font-bold text-gray-900">{t.salaryHistory}</h4>
      <div className="space-y-3">
        {history.map((entry) => {
          const isFuture = entry.effectiveDate > today;
          const isCancelled = entry.status === "cancelled";

          return (
            <div
              key={entry.id}
              className={`rounded-xl p-3 ${
                isCancelled ? "bg-gray-100" : isFuture ? "bg-blue-50" : "bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {entry.previousAmount === null
                      ? `${t.initialBasePay}: ${formatCurrency(entry.newAmount)}`
                      : `${formatCurrency(entry.previousAmount)} -> ${formatCurrency(
                          entry.newAmount,
                        )}`}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {payPeriodLabel(entry.payPeriod, t)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-xs font-medium text-gray-500">
                    {formatDate(entry.effectiveDate)}
                  </span>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      isCancelled
                        ? "bg-gray-200 text-gray-600"
                        : isFuture
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {isCancelled ? t.cancelled : isFuture ? t.pending : t.effective}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">{entry.reason}</p>
              {entry.cancelReason && (
                <p className="mt-1 text-xs text-gray-500">
                  {t.cancelReason}: {entry.cancelReason}
                </p>
              )}
              {isFuture && !isCancelled && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEditScheduledSalary(employee, entry)}
                    className="min-h-9 flex-1 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-800"
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancelScheduledSalary(employee.id, entry.id)}
                    className="min-h-9 flex-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700"
                  >
                    {t.cancelAdjust}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.]?[0-9]*"
        value={value}
        onKeyDown={blockNonNumericKeys}
        onChange={(event) => onChange(cleanNumberInput(event.target.value))}
        placeholder="0.00"
        className={`${inputClassName} pl-8`}
      />
    </div>
  );
}

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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ t, active }: { t: EmployeeText; active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
      }`}
    >
      {active ? t.active : t.inactive}
    </span>
  );
}

const inputClassName =
  "min-h-12 w-full min-w-0 max-w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none focus:border-gray-900";

function migrateEmployee(employee: Partial<Employee>, t: EmployeeText): Employee {
  const basePay = typeof employee.basePay === "number" ? employee.basePay : 0;
  const basePayPeriod = normalizePayPeriod(employee.basePayPeriod);
  const createdAt = employee.createdAt ?? new Date().toISOString();
  const salaryHistory: SalaryHistoryEntry[] =
    Array.isArray(employee.salaryHistory) && employee.salaryHistory.length > 0
      ? employee.salaryHistory.map((entry) => ({
          id: entry.id ?? crypto.randomUUID(),
          previousAmount:
            typeof entry.previousAmount === "number" ? entry.previousAmount : null,
          newAmount: typeof entry.newAmount === "number" ? entry.newAmount : basePay,
          payPeriod: normalizePayPeriod(entry.payPeriod),
          effectiveDate: entry.effectiveDate ?? getTodayDate(),
          reason: entry.reason ?? t.importReason,
          createdAt: entry.createdAt ?? createdAt,
          status:
            entry.status === "cancelled"
              ? ("cancelled" as const)
              : ("active" as const),
          cancelledAt: entry.cancelledAt,
          cancelReason: entry.cancelReason,
        }))
      : [
          {
            id: crypto.randomUUID(),
            previousAmount: null,
            newAmount: basePay,
            payPeriod: basePayPeriod,
            effectiveDate: getTodayDate(),
            reason: t.importReason,
            createdAt,
            status: "active" as const,
          },
        ];
  const migratedEmployee = {
    id: employee.id ?? crypto.randomUUID(),
    name: employee.name ?? t.unnamed,
    basePay,
    basePayPeriod,
    active: employee.active ?? true,
    createdAt,
    salaryHistory,
  };
  const currentSalary = getSalaryForDate(migratedEmployee, getTodayDate());

  return {
    ...migratedEmployee,
    basePay: currentSalary?.newAmount ?? migratedEmployee.basePay,
    basePayPeriod: currentSalary?.payPeriod ?? migratedEmployee.basePayPeriod,
  };
}

function normalizePayPeriod(value: unknown): BasePayPeriod {
  return value === "weekly" || value === "monthly" ? value : "daily";
}

function payPeriodLabel(period: BasePayPeriod, t: EmployeeText) {
  return period === "daily" ? t.daily : period === "weekly" ? t.weekly : t.monthly;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: string) {
  const parsedDate = new Date(`${date}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function getSalaryForDate(
  employee: Employee,
  targetDate: string,
): SalaryHistoryEntry | null {
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

function getNextScheduledSalary(
  employee: Employee,
  targetDate: string,
): SalaryHistoryEntry | null {
  const futureEntries = (employee.salaryHistory ?? [])
    .filter(
      (entry) => entry.status !== "cancelled" && entry.effectiveDate > targetDate,
    )
    .sort((firstEntry, secondEntry) =>
      firstEntry.effectiveDate.localeCompare(secondEntry.effectiveDate),
    );

  return futureEntries[0] ?? null;
}

function getTodayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
