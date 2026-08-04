"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BottomNav } from "../BottomNav";
import { LanguageSwitcher, useLanguage } from "../useLanguage";

type Employee = {
  id: string;
  name: string;
  active: boolean;
};

type MenuItem = {
  id: string;
  type: "service" | "hand" | "foot" | "waxing" | "extra";
  name: string;
  price: number;
  commission: number;
  active: boolean;
};

type OrderExtra = {
  id: string;
  name: string;
  price: number;
  commission: number;
};

type EmployeeOrder = {
  id: string;
  employeeId: string;
  employeeName: string;
  serviceId?: string;
  serviceName: string;
  price: number;
  commission: number;
  extras: OrderExtra[];
  createdAt: string;
};

type CommissionEntry = {
  employeeId: string;
  employeeName: string;
  amount: number;
};

type DailyRecord = {
  date: string;
  cashSales: number;
  cardSales: number;
  note: string;
  commissions: CommissionEntry[];
  orders?: EmployeeOrder[];
  updatedAt: string;
};

const EMPLOYEES_KEY = "salon-record-employees";
const DAILY_RECORDS_KEY = "salon-record-daily-records";
const MENU_KEY = "salon-record-service-menu";

const text = {
  zh: {
    back: "← 返回首页",
    title: "记账 / 补录账目",
    subtitle: "Daily Record",
    date: "记账日期（可补录过去日期）",
    menuLink: "菜单",
    employeeOrders: "员工订单",
    employee: "员工",
    serviceName: "服务名称",
    servicePlaceholder: "输入服务名称",
    price: "价钱",
    commission: "提成",
    extraName: "额外设施 / 加项",
    extraPlaceholder: "例如：Nail Art",
    extraPrice: "额外价钱",
    extraCommission: "额外提成",
    addOrder: "添加订单",
    noEmployees: "还没有员工。可以先到员工管理添加员工。",
    noMenu: "还没有服务菜单。可以先添加服务和额外设施。",
    inactive: "（已停用）",
    note: "备注",
    notePlaceholder: "例如：节假日客流较多",
    sales: "营业额",
    orderCount: "单数",
    shopIncome: "店铺收入",
    save: "保存账目",
    saved: "账目已保存。",
    invalidOrder: "请选择员工并输入服务名称、价钱和提成。",
    delete: "删除",
    ordersEmpty: "还没有录入订单",
    legacyCommission: "旧版手动提成",
    selectedEmployee: "当前员工",
    revenueDetail: "营业额明细",
    revenue: "营业额",
    close: "关闭",
    totalOrders: "总单数",
  },
  en: {
    back: "← Back Home",
    title: "Record / Backfill",
    subtitle: "Daily Record",
    date: "Record date (past dates allowed)",
    menuLink: "Menu",
    employeeOrders: "Employee Orders",
    employee: "Employee",
    serviceName: "Service Name",
    servicePlaceholder: "Enter service name",
    price: "Price",
    commission: "Commission",
    extraName: "Extra Facility / Add-on",
    extraPlaceholder: "Example: Nail Art",
    extraPrice: "Extra Price",
    extraCommission: "Extra Commission",
    addOrder: "Add Order",
    noEmployees: "No employees yet. Add employees from Employees first.",
    noMenu: "No service menu yet. Add services and extras first.",
    inactive: " (inactive)",
    note: "Note",
    notePlaceholder: "For example: holiday traffic was higher",
    sales: "Sales",
    orderCount: "Orders",
    shopIncome: "Shop Income",
    save: "Save Record",
    saved: "Record saved.",
    invalidOrder: "Choose an employee and enter service name, price, and commission.",
    delete: "Delete",
    ordersEmpty: "No orders entered yet",
    legacyCommission: "Legacy manual commission",
    selectedEmployee: "Selected Employee",
    revenueDetail: "Revenue Detail",
    revenue: "Revenue",
    close: "Close",
    totalOrders: "Total Orders",
  },
};

export default function DailyRecordPage() {
  const { language, setLanguage } = useLanguage();
  const t = text[language];
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [date, setDate] = useState(getTodayDate());
  const [note, setNote] = useState("");
  const [orders, setOrders] = useState<EmployeeOrder[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [extraCommission, setExtraCommission] = useState("");
  const [legacyCommissions, setLegacyCommissions] = useState<CommissionEntry[]>([]);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    const loadData = window.setTimeout(() => {
      const loadedEmployees = readStorage<Employee[]>(EMPLOYEES_KEY, []);
      setEmployees(loadedEmployees);
      setEmployeeId(loadedEmployees[0]?.id ?? "");
      setMenuItems(readStorage<MenuItem[]>(MENU_KEY, []));
      setRecords(readStorage<DailyRecord[]>(DAILY_RECORDS_KEY, []));
    }, 0);

    return () => window.clearTimeout(loadData);
  }, []);

  const activeServices = menuItems.filter(
    (item) => item.active && item.type !== "extra",
  );
  const activeExtras = menuItems.filter(
    (item) => item.active && item.type === "extra",
  );
  const selectedRecord = useMemo(
    () => records.find((record) => record.date === date),
    [date, records],
  );

  useEffect(() => {
    const loadRecord = window.setTimeout(() => {
      setNote(selectedRecord?.note ?? "");
      setOrders(selectedRecord?.orders ?? []);
      setLegacyCommissions(selectedRecord?.orders ? [] : selectedRecord?.commissions ?? []);
    }, 0);

    return () => window.clearTimeout(loadRecord);
  }, [selectedRecord]);

  const totals = useMemo(() => {
    const sales = orders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
    const commissionTotal =
      orders.reduce((sum, order) => sum + getOrderCommission(order), 0) +
      legacyCommissions.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      sales,
      commissionTotal,
      orderCount: orders.length,
      shopIncome: sales - commissionTotal,
    };
  }, [legacyCommissions, orders]);
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
  const selectedEmployeeOrders = orders.filter(
    (order) => order.employeeId === employeeId,
  );
  const selectedEmployeeTotals = useMemo(() => {
    const sales = selectedEmployeeOrders.reduce(
      (sum, order) => sum + getOrderRevenue(order),
      0,
    );
    const commissionTotal = selectedEmployeeOrders.reduce(
      (sum, order) => sum + getOrderCommission(order),
      0,
    );

    return {
      sales,
      commissionTotal,
      orderCount: selectedEmployeeOrders.length,
    };
  }, [selectedEmployeeOrders]);

  function fillFromService(name: string) {
    setServiceName(name);
    const service = activeServices.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (service) {
      setPrice(String(service.price));
      setCommission(String(service.commission));
    }
  }

  function fillFromExtra(name: string) {
    setExtraName(name);
    const extra = activeExtras.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (extra) {
      setExtraPrice(String(extra.price));
      setExtraCommission(String(extra.commission));
    }
  }

  function addOrder() {
    const employee = employees.find((item) => item.id === employeeId);
    const numericPrice = Number(price);
    const numericCommission = Number(commission);

    if (
      !employee ||
      !serviceName.trim() ||
      Number.isNaN(numericPrice) ||
      Number.isNaN(numericCommission)
    ) {
      window.alert(t.invalidOrder);
      return;
    }

    const matchedService = activeServices.find(
      (item) => item.name.toLowerCase() === serviceName.trim().toLowerCase(),
    );
    const extra =
      extraName.trim() || toAmount(extraPrice) > 0 || toAmount(extraCommission) > 0
        ? [
            {
              id: crypto.randomUUID(),
              name: extraName.trim() || t.extraName,
              price: toAmount(extraPrice),
              commission: toAmount(extraCommission),
            },
          ]
        : [];

    setOrders((currentOrders) => [
      ...currentOrders,
      {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        employeeName: employee.name,
        serviceId: matchedService?.id,
        serviceName: serviceName.trim(),
        price: Math.max(0, numericPrice),
        commission: Math.max(0, numericCommission),
        extras: extra,
        createdAt: new Date().toISOString(),
      },
    ]);
    setServiceName("");
    setPrice("");
    setCommission("");
    setExtraName("");
    setExtraPrice("");
    setExtraCommission("");
    setShowOrderForm(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const commissions = [
      ...buildCommissionEntries(orders),
      ...legacyCommissions,
    ].filter((entry) => entry.amount > 0);
    const nextRecord: DailyRecord = {
      date,
      cashSales: totals.sales,
      cardSales: 0,
      note: note.trim(),
      commissions,
      orders,
      updatedAt: new Date().toISOString(),
    };
    const nextRecords = [
      nextRecord,
      ...records.filter((record) => record.date !== date),
    ].sort((a, b) => b.date.localeCompare(a.date));

    setRecords(nextRecords);
    window.localStorage.setItem(DAILY_RECORDS_KEY, JSON.stringify(nextRecords));
    window.alert(t.saved);
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-4 pb-24 pt-4">
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

        <form onSubmit={handleSubmit} className="space-y-3">
          <section className="rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <FormField label={t.date} htmlFor="record-date">
                <input
                  id="record-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={inputClassName}
                />
              </FormField>
              <Link
                href="/services"
                className="mt-7 shrink-0 rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700"
              >
                {t.menuLink}
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 p-3">
            <h2 className="mb-2 text-base font-bold text-gray-900">
              {t.employeeOrders}
            </h2>
            {employees.length === 0 ? (
              <p className="text-sm text-gray-500">{t.noEmployees}</p>
            ) : (
              <>
                {menuItems.length === 0 && (
                  <p className="mb-4 text-sm text-amber-700">{t.noMenu}</p>
                )}
                <div className="mb-2">
                  <p className="mb-2 text-sm font-semibold text-gray-800">
                    {t.employee}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {employees.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => {
                          setEmployeeId(employee.id);
                          setShowRevenueModal(false);
                        }}
                        className={`min-h-10 shrink-0 rounded-xl border px-4 text-sm font-semibold ${
                          employeeId === employee.id
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-300 text-gray-700"
                        }`}
                      >
                        {employee.name}
                        {employee.active ? "" : t.inactive}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedEmployee && (
                  <div className="mb-3 rounded-xl bg-gray-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {t.selectedEmployee}: {selectedEmployee.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {t.orderCount}: {selectedEmployeeTotals.orderCount} ·{" "}
                          {t.sales}: {formatCurrency(selectedEmployeeTotals.sales)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRevenueModal(true)}
                        className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
                      >
                        {t.revenue}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowOrderForm(true)}
                  className="min-h-11 w-full rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                >
                  {t.addOrder}
                </button>

                {showOrderForm && (
                  <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6">
                    <div className="mx-auto max-h-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
                  <FormField label={t.serviceName} htmlFor="service-name">
                    <input
                      id="service-name"
                      list="service-options"
                      value={serviceName}
                      onChange={(event) => fillFromService(event.target.value)}
                      placeholder={t.servicePlaceholder}
                      className={inputClassName}
                    />
                    <datalist id="service-options">
                      {activeServices.map((item) => (
                        <option key={item.id} value={item.name} />
                      ))}
                    </datalist>
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t.price} htmlFor="service-price">
                      <MoneyInput id="service-price" value={price} onChange={setPrice} />
                    </FormField>
                    <FormField label={t.commission} htmlFor="service-commission">
                      <MoneyInput
                        id="service-commission"
                        value={commission}
                        onChange={setCommission}
                      />
                    </FormField>
                  </div>
                  <FormField label={t.extraName} htmlFor="extra-name">
                    <input
                      id="extra-name"
                      list="extra-options"
                      value={extraName}
                      onChange={(event) => fillFromExtra(event.target.value)}
                      placeholder={t.extraPlaceholder}
                      className={inputClassName}
                    />
                    <datalist id="extra-options">
                      {activeExtras.map((item) => (
                        <option key={item.id} value={item.name} />
                      ))}
                    </datalist>
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t.extraPrice} htmlFor="extra-price">
                      <MoneyInput
                        id="extra-price"
                        value={extraPrice}
                        onChange={setExtraPrice}
                      />
                    </FormField>
                    <FormField label={t.extraCommission} htmlFor="extra-commission">
                      <MoneyInput
                        id="extra-commission"
                        value={extraCommission}
                        onChange={setExtraCommission}
                      />
                    </FormField>
                  </div>
                  <button
                    type="button"
                    onClick={addOrder}
                    className="min-h-11 w-full rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                  >
                    {t.addOrder}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOrderForm(false)}
                    className="min-h-11 w-full rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                  >
                    {t.close}
                  </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {legacyCommissions.length > 0 && (
            <section className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                {t.legacyCommission}:{" "}
                {formatCurrency(
                  legacyCommissions.reduce((sum, entry) => sum + entry.amount, 0),
                )}
              </p>
            </section>
          )}

          <section className="rounded-xl border border-gray-200 p-3">
            <FormField label={t.note} htmlFor="record-note">
              <textarea
                id="record-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className={`${inputClassName} py-3`}
                placeholder={t.notePlaceholder}
              />
            </FormField>
          </section>

          <section className="grid grid-cols-3 gap-2">
            <SummaryCard label={t.sales} value={formatCurrency(totals.sales)} />
            <SummaryCard label={t.orderCount} value={String(totals.orderCount)} />
            <SummaryCard
              label={t.commission}
              value={formatCurrency(totals.commissionTotal)}
            />
          </section>

          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-gray-900 px-5 text-base font-semibold text-white"
          >
            {t.save}
          </button>
        </form>

        {showRevenueModal && selectedEmployee && (
          <OrderRevenueModal
            t={t}
            employeeName={selectedEmployee.name}
            orders={selectedEmployeeOrders}
            onDeleteOrder={(orderId) =>
              setOrders((current) => current.filter((item) => item.id !== orderId))
            }
            onClose={() => setShowRevenueModal(false)}
          />
        )}
      </div>
      <BottomNav />
    </main>
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
    <div className="w-full">
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function OrderRevenueModal({
  t,
  employeeName,
  orders,
  onDeleteOrder,
  onClose,
}: {
  t: (typeof text)["zh"];
  employeeName: string;
  orders: EmployeeOrder[];
  onDeleteOrder: (orderId: string) => void;
  onClose: () => void;
}) {
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
  const totalCommission = orders.reduce(
    (sum, order) => sum + getOrderCommission(order),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-8">
      <div className="mx-auto flex max-h-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {employeeName} · {t.revenueDetail}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t.sales}: {formatCurrency(totalRevenue)} · {t.totalOrders}:{" "}
              {orders.length} · {t.commission}: {formatCurrency(totalCommission)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
          >
            {t.close}
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              {t.ordersEmpty}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, index) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <p className="text-sm font-bold text-gray-900">
                    #{index + 1} {order.serviceName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {t.price}: {formatCurrency(order.price)} · {t.commission}:{" "}
                    {formatCurrency(order.commission)}
                  </p>
                  {order.extras.map((extra) => (
                    <p key={extra.id} className="mt-1 text-xs text-gray-500">
                      + {extra.name}: {formatCurrency(extra.price)} /{" "}
                      {formatCurrency(extra.commission)}
                    </p>
                  ))}
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {t.sales}: {formatCurrency(getOrderRevenue(order))}
                  </p>
                  <button
                    type="button"
                    onClick={() => onDeleteOrder(order.id)}
                    className="mt-3 text-sm font-semibold text-red-600"
                  >
                    {t.delete}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClassName =
  "min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none focus:border-gray-900";

function buildCommissionEntries(orders: EmployeeOrder[]) {
  const totals = new Map<string, CommissionEntry>();

  orders.forEach((order) => {
    const current = totals.get(order.employeeId) ?? {
      employeeId: order.employeeId,
      employeeName: order.employeeName,
      amount: 0,
    };
    totals.set(order.employeeId, {
      ...current,
      amount: current.amount + getOrderCommission(order),
    });
  });

  return [...totals.values()];
}

function getOrderRevenue(order: EmployeeOrder) {
  return order.price + order.extras.reduce((sum, extra) => sum + extra.price, 0);
}

function getOrderCommission(order: EmployeeOrder) {
  return (
    order.commission +
    order.extras.reduce((sum, extra) => sum + extra.commission, 0)
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

function toAmount(value: string | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
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
