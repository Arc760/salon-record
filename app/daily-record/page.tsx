"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppModal } from "../AppModal";
import { BottomNav } from "../BottomNav";
import { LanguageSwitcher, useLanguage } from "../useLanguage";

type Employee = {
  id: string;
  name: string;
  active: boolean;
};

type MenuItem = {
  id: string;
  type:
    | "service"
    | "hand"
    | "foot"
    | "extra"
    | "pedicure"
    | "manicures"
    | "dip-manicures"
    | "acrylic-nail"
    | "uv-gel-nail"
    | "uv-gel-permanent-french"
    | "kid-services"
    | "additional-services"
    | "waxing"
    | "spa-pedicure";
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

type PaymentMethod = "card" | "cash" | "gift-card" | "split";

type EmployeeOrder = {
  id: string;
  employeeId: string;
  employeeName: string;
  serviceId?: string;
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
  createdAt: string;
};

type GiftCardSale = {
  id: string;
  amount: number;
  paymentMethod: "card" | "cash";
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
  giftCardSales?: GiftCardSale[];
  updatedAt: string;
};

const EMPLOYEES_KEY = "salon-record-employees";
const DAILY_RECORDS_KEY = "salon-record-daily-records";
const MENU_KEY = "salon-record-service-menu";
const ORDER_DRAFT_KEY = "salon-record-order-draft";

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
    invalidOrder: "请选择员工，并输入服务或额外设施。",
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
    invalidOrder: "Choose an employee and enter a service or extra.",
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
  const [giftCardSales, setGiftCardSales] = useState<GiftCardSale[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [giftCardAmount, setGiftCardAmount] = useState("");
  const [giftCardRemainderMethod, setGiftCardRemainderMethod] = useState<
    "card" | "cash" | "split"
  >("card");
  const [splitCashAmount, setSplitCashAmount] = useState("");
  const [splitCardAmount, setSplitCardAmount] = useState("");
  const [giftCardSaleAmount, setGiftCardSaleAmount] = useState("");
  const [giftCardSalePaymentMethod, setGiftCardSalePaymentMethod] =
    useState<"card" | "cash">("card");
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [extraCommission, setExtraCommission] = useState("");
  const [legacyCommissions, setLegacyCommissions] = useState<CommissionEntry[]>([]);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [showGiftCardForm, setShowGiftCardForm] = useState(false);
  const paymentLabels = {
    paymentMethod: language === "en" ? "Payment Method" : "支付方式",
    card: language === "en" ? "Card" : "刷卡",
    cash: language === "en" ? "Cash" : "现金",
    giftCard: language === "en" ? "Gift Card" : "礼品卡",
    giftCardUsed: language === "en" ? "Gift Card Amount" : "礼品卡金额",
    giftCardSales: language === "en" ? "Gift Card Sales" : "售出礼品卡",
    addGiftCardSale:
      language === "en" ? "Record Gift Card" : "记录礼品卡",
    cashIncome: language === "en" ? "Cash Income" : "现金收入",
    cardIncome: language === "en" ? "Card Income" : "刷卡收入",
  };

  const orderLabels = {
    split: language === "en" ? "Split" : "拆分",
    splitCash: language === "en" ? "Cash Amount" : "现金金额",
    splitCard: language === "en" ? "Card Amount" : "刷卡金额",
    discount: language === "en" ? "Discount" : "优惠",
    saveOrder: language === "en" ? "Save Order" : "保存订单",
    edit: language === "en" ? "Edit" : "编辑",
    noCommission: language === "en" ? "No commission" : "无提成",
  };

  const orderDraftLabels = {
    clearDraft: language === "en" ? "Clear" : "清空",
    remainingPayment: language === "en" ? "Remaining Payment" : "剩余付款",
  };

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
    (item) => item.active && !isExtraMenuItem(item),
  );
  const activeExtras = menuItems.filter(
    (item) => item.active && isExtraMenuItem(item),
  );
  const selectedRecord = useMemo(
    () => records.find((record) => record.date === date),
    [date, records],
  );

  useEffect(() => {
    const loadRecord = window.setTimeout(() => {
      setNote(selectedRecord?.note ?? "");
      setOrders(selectedRecord?.orders ?? []);
      setGiftCardSales(selectedRecord?.giftCardSales ?? []);
      setLegacyCommissions(selectedRecord?.orders ? [] : selectedRecord?.commissions ?? []);
    }, 0);

    return () => window.clearTimeout(loadRecord);
  }, [selectedRecord]);

  useEffect(() => {
    if (!showOrderForm || editingOrderId) {
      return;
    }

    const hasDraftContent = [
      serviceName,
      price,
      commission,
      extraName,
      extraPrice,
      extraCommission,
      discountAmount,
      giftCardAmount,
      splitCashAmount,
      splitCardAmount,
    ].some((value) => value.trim() !== "");

    if (!hasDraftContent && paymentMethod === "card") {
      window.localStorage.removeItem(ORDER_DRAFT_KEY);
      return;
    }

    window.localStorage.setItem(
      ORDER_DRAFT_KEY,
      JSON.stringify({
        serviceName,
        price,
        commission,
        extraName,
        extraPrice,
        extraCommission,
        discountAmount,
        paymentMethod,
        giftCardAmount,
        giftCardRemainderMethod,
        splitCashAmount,
        splitCardAmount,
      }),
    );
  }, [
    commission,
    discountAmount,
    editingOrderId,
    employeeId,
    extraCommission,
    extraName,
    extraPrice,
    giftCardAmount,
    giftCardRemainderMethod,
    paymentMethod,
    price,
    serviceName,
    showOrderForm,
    splitCardAmount,
    splitCashAmount,
  ]);

  const totals = useMemo(() => {
    const orderSales = orders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
    const giftCardSaleTotal = giftCardSales.reduce(
      (sum, sale) => sum + sale.amount,
      0,
    );
    const paymentTotals = getPaymentTotals(orders, giftCardSales);
    const commissionTotal =
      orders.reduce((sum, order) => sum + getOrderCommission(order), 0) +
      legacyCommissions.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      sales: orderSales + giftCardSaleTotal,
      orderSales,
      giftCardSaleTotal,
      cashSales: paymentTotals.cashSales,
      cardSales: paymentTotals.cardSales,
      commissionTotal,
      orderCount: orders.length,
      shopIncome: orderSales + giftCardSaleTotal - commissionTotal,
    };
  }, [giftCardSales, legacyCommissions, orders]);
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
  const serviceSuggestions = useMemo(() => {
    const query = serviceName.trim().toLowerCase();

    return query
      ? activeServices
          .filter((item) => menuItemMatchesQuery(item, query))
          .slice(0, 8)
      : [];
  }, [activeServices, serviceName]);
  const extraSuggestions = useMemo(() => {
    const query = extraName.trim().toLowerCase();

    return query
      ? activeExtras
          .filter((item) => menuItemMatchesQuery(item, query))
          .slice(0, 8)
      : [];
  }, [activeExtras, extraName]);

  function fillFromService(name: string) {
    setServiceName(name);
    const service = activeServices.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (service) {
      setPrice(String(service.price));
      setCommission(service.commission === 0 ? "" : String(service.commission));
    }
  }

  function fillFromExtra(name: string) {
    setExtraName(name);
    const extra = activeExtras.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (extra) {
      setExtraPrice(String(extra.price));
      setExtraCommission(extra.commission === 0 ? "" : String(extra.commission));
    }
  }

  function resetOrderForm() {
    setEditingOrderId(null);
    setServiceName("");
    setPrice("");
    setCommission("");
    setExtraName("");
    setExtraPrice("");
    setExtraCommission("");
    setDiscountAmount("");
    setPaymentMethod("card");
    setGiftCardAmount("");
    setGiftCardRemainderMethod("card");
    setSplitCashAmount("");
    setSplitCardAmount("");
  }

  function openAddOrderForm() {
    resetOrderForm();
    const draft = readStorage<{
      serviceName?: string;
      price?: string;
      commission?: string;
      extraName?: string;
      extraPrice?: string;
      extraCommission?: string;
      discountAmount?: string;
      paymentMethod?: PaymentMethod;
      giftCardAmount?: string;
      giftCardRemainderMethod?: "card" | "cash" | "split";
      splitCashAmount?: string;
      splitCardAmount?: string;
    } | null>(ORDER_DRAFT_KEY, null);

    if (draft) {
      setServiceName(draft.serviceName ?? "");
      setPrice(draft.price ?? "");
      setCommission(draft.commission ?? "");
      setExtraName(draft.extraName ?? "");
      setExtraPrice(draft.extraPrice ?? "");
      setExtraCommission(draft.extraCommission ?? "");
      setDiscountAmount(draft.discountAmount ?? "");
      setPaymentMethod(draft.paymentMethod ?? "card");
      setGiftCardAmount(draft.giftCardAmount ?? "");
      setGiftCardRemainderMethod(draft.giftCardRemainderMethod ?? "card");
      setSplitCashAmount(draft.splitCashAmount ?? "");
      setSplitCardAmount(draft.splitCardAmount ?? "");
    }

    setShowOrderForm(true);
  }

  function closeOrderForm() {
    setShowOrderForm(false);
    setEditingOrderId(null);
  }

  function clearOrderDraft() {
    window.localStorage.removeItem(ORDER_DRAFT_KEY);
    resetOrderForm();
    setShowOrderForm(true);
  }

  function openEditOrder(order: EmployeeOrder) {
    setEditingOrderId(order.id);
    setEmployeeId(order.employeeId);
    setServiceName(order.serviceName);
    setPrice(order.price === 0 ? "" : String(order.price));
    setCommission(order.commission === 0 ? "" : String(order.commission));
    const firstExtra = order.extras[0];
    setExtraName(firstExtra?.name ?? "");
    setExtraPrice(firstExtra && firstExtra.price > 0 ? String(firstExtra.price) : "");
    setExtraCommission(
      firstExtra && firstExtra.commission > 0 ? String(firstExtra.commission) : "",
    );
    setDiscountAmount(
      order.discountAmount && order.discountAmount > 0
        ? String(order.discountAmount)
        : "",
    );
    setPaymentMethod(order.paymentMethod ?? "card");
    setGiftCardAmount(
      order.giftCardAmount && order.giftCardAmount > 0
        ? String(order.giftCardAmount)
        : "",
    );
    setGiftCardRemainderMethod(order.giftCardRemainderMethod ?? "card");
    setSplitCashAmount(
      order.cashAmount && order.cashAmount > 0 ? String(order.cashAmount) : "",
    );
    setSplitCardAmount(
      order.cardAmount && order.cardAmount > 0 ? String(order.cardAmount) : "",
    );
    setShowRevenueModal(false);
    setShowOrderForm(true);
  }

  function addOrder() {
    const employee = employees.find((item) => item.id === employeeId);
    const numericPrice = toAmount(price);
    const numericCommission = toAmount(commission);
    const hasService = serviceName.trim() || numericPrice > 0;
    const hasExtra =
      extraName.trim() || toAmount(extraPrice) > 0 || toAmount(extraCommission) > 0;

    if (!employee || (!hasService && !hasExtra)) {
      window.alert(t.invalidOrder);
      return;
    }

    const matchedService = activeServices.find(
      (item) => item.name.toLowerCase() === serviceName.trim().toLowerCase(),
    );
    const extra =
      hasExtra
        ? [
            {
              id: crypto.randomUUID(),
              name: extraName.trim() || t.extraName,
              price: toAmount(extraPrice),
              commission: toAmount(extraCommission),
            },
          ]
        : [];
    const nextOrder: EmployeeOrder = {
      id: editingOrderId ?? crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      serviceId: matchedService?.id,
      serviceName: serviceName.trim() || extraName.trim() || t.extraName,
      price: Math.max(0, numericPrice),
      commission: Math.max(0, numericCommission),
      extras: extra,
      paymentMethod,
      giftCardAmount:
        paymentMethod === "gift-card" ? Math.max(0, toAmount(giftCardAmount)) : 0,
      giftCardRemainderMethod:
        paymentMethod === "gift-card" ? giftCardRemainderMethod : undefined,
      discountAmount: Math.max(0, toAmount(discountAmount)),
      cashAmount:
        paymentMethod === "split" ||
        (paymentMethod === "gift-card" && giftCardRemainderMethod === "split")
          ? Math.max(0, toAmount(splitCashAmount))
          : 0,
      cardAmount:
        paymentMethod === "split" ||
        (paymentMethod === "gift-card" && giftCardRemainderMethod === "split")
          ? Math.max(0, toAmount(splitCardAmount))
          : 0,
      createdAt:
        orders.find((order) => order.id === editingOrderId)?.createdAt ??
        new Date().toISOString(),
    };

    setOrders((currentOrders) =>
      editingOrderId
        ? currentOrders.map((order) =>
            order.id === editingOrderId ? nextOrder : order,
          )
        : [...currentOrders, nextOrder],
    );
    window.localStorage.removeItem(ORDER_DRAFT_KEY);
    resetOrderForm();
    setShowOrderForm(true);
  }

  function addGiftCardSale() {
    const amount = toAmount(giftCardSaleAmount);

    if (amount <= 0) {
      return;
    }

    setGiftCardSales((currentSales) => [
      ...currentSales,
      {
        id: crypto.randomUUID(),
        amount,
        paymentMethod: giftCardSalePaymentMethod,
        createdAt: new Date().toISOString(),
      },
    ]);
    setGiftCardSaleAmount("");
    setGiftCardSalePaymentMethod("card");
    setShowGiftCardForm(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const commissions = [
      ...buildCommissionEntries(orders),
      ...legacyCommissions,
    ].filter((entry) => entry.amount > 0);
    const nextRecord: DailyRecord = {
      date,
      cashSales: totals.cashSales,
      cardSales: totals.cardSales,
      note: note.trim(),
      commissions,
      orders,
      giftCardSales,
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
            <p className="mt-2 text-sm text-gray-500">{t.subtitle}</p>
          </div>
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <section className="rounded-xl border border-gray-200 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
                className="shrink-0 rounded-xl border border-gray-300 px-3 py-3 text-center text-sm font-semibold text-gray-700"
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
                  onClick={openAddOrderForm}
                  className="min-h-11 w-full rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                >
                  {t.addOrder}
                </button>

                {showOrderForm && (
                  <AppModal
                    onClose={closeOrderForm}
                    contentClassName="space-y-4 overflow-y-auto p-5"
                  >
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-800">
                      {t.employee}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {employees.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => setEmployeeId(employee.id)}
                          className={`min-h-11 rounded-xl border px-3 text-left text-sm font-semibold ${
                            employeeId === employee.id
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-300 text-gray-700"
                          }`}
                        >
                          {employee.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <FormField label={t.serviceName} htmlFor="service-name">
                    <input
                      id="service-name"
                      value={serviceName}
                      onChange={(event) => fillFromService(event.target.value)}
                      placeholder={t.servicePlaceholder}
                      className={inputClassName}
                    />
                    {serviceSuggestions.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2">
                        {serviceSuggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => fillFromService(item.name)}
                            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm hover:bg-gray-50"
                          >
                            <span className="font-semibold text-gray-900">
                              {item.name}
                            </span>
                            <span className="shrink-0 text-gray-600">
                              {formatCurrency(item.price)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </FormField>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label={t.price} htmlFor="service-price">
                      <MoneyInput id="service-price" value={price} onChange={setPrice} />
                    </FormField>
                    <FormField label={t.commission} htmlFor="service-commission">
                      <MoneyInput
                        id="service-commission"
                        value={commission}
                        onChange={setCommission}
                        placeholder={orderLabels.noCommission}
                      />
                    </FormField>
                  </div>
                  <FormField label={t.extraName} htmlFor="extra-name">
                    <input
                      id="extra-name"
                      value={extraName}
                      onChange={(event) => fillFromExtra(event.target.value)}
                      placeholder={t.extraPlaceholder}
                      className={inputClassName}
                    />
                    {extraSuggestions.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2">
                        {extraSuggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => fillFromExtra(item.name)}
                            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm hover:bg-gray-50"
                          >
                            <span className="font-semibold text-gray-900">
                              {item.name}
                            </span>
                            <span className="shrink-0 text-gray-600">
                              {formatCurrency(item.price)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </FormField>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        placeholder={orderLabels.noCommission}
                      />
                    </FormField>
                  </div>
                  <FormField label={orderLabels.discount} htmlFor="discount-amount">
                    <MoneyInput
                      id="discount-amount"
                      value={discountAmount}
                      onChange={setDiscountAmount}
                    />
                  </FormField>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-800">
                      {paymentLabels.paymentMethod}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        ["card", paymentLabels.card],
                        ["cash", paymentLabels.cash],
                        ["gift-card", paymentLabels.giftCard],
                        ["split", orderLabels.split],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPaymentMethod(value as PaymentMethod)}
                          className={`min-h-11 rounded-xl border px-2 text-sm font-semibold ${
                            paymentMethod === value
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-300 text-gray-700"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {paymentMethod === "gift-card" && (
                    <>
                      <FormField label={paymentLabels.giftCardUsed} htmlFor="gift-card-amount">
                        <MoneyInput
                          id="gift-card-amount"
                          value={giftCardAmount}
                          onChange={setGiftCardAmount}
                        />
                      </FormField>
                      <div>
                        <p className="mb-2 text-sm font-semibold text-gray-800">
                          {orderDraftLabels.remainingPayment}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            ["card", paymentLabels.card],
                            ["cash", paymentLabels.cash],
                            ["split", orderLabels.split],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setGiftCardRemainderMethod(
                                  value as "card" | "cash" | "split",
                                )
                              }
                              className={`min-h-11 rounded-xl border px-2 text-sm font-semibold ${
                                giftCardRemainderMethod === value
                                  ? "border-gray-900 bg-gray-900 text-white"
                                  : "border-gray-300 text-gray-700"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {(paymentMethod === "split" ||
                    (paymentMethod === "gift-card" &&
                      giftCardRemainderMethod === "split")) && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField label={orderLabels.splitCash} htmlFor="split-cash">
                        <MoneyInput
                          id="split-cash"
                          value={splitCashAmount}
                          onChange={setSplitCashAmount}
                        />
                      </FormField>
                      <FormField label={orderLabels.splitCard} htmlFor="split-card">
                        <MoneyInput
                          id="split-card"
                          value={splitCardAmount}
                          onChange={setSplitCardAmount}
                        />
                      </FormField>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={addOrder}
                    className="min-h-11 w-full rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                  >
                    {editingOrderId ? orderLabels.saveOrder : t.addOrder}
                  </button>
                  <button
                    type="button"
                    onClick={closeOrderForm}
                    className="min-h-11 w-full rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                  >
                    {t.close}
                  </button>
                  <button
                    type="button"
                    onClick={clearOrderDraft}
                    className="min-h-11 w-full rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600"
                  >
                    {orderDraftLabels.clearDraft}
                  </button>
                  </AppModal>
                )}
              </>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {paymentLabels.giftCardSales}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {giftCardSales.length} / {formatCurrency(totals.giftCardSaleTotal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGiftCardForm(true)}
                className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              >
                {paymentLabels.addGiftCardSale}
              </button>
            </div>
            {giftCardSales.length > 0 && (
              <div className="mt-3 space-y-2">
                {giftCardSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(sale.amount)} /{" "}
                      {sale.paymentMethod === "cash"
                        ? paymentLabels.cash
                        : paymentLabels.card}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGiftCardSales((currentSales) =>
                          currentSales.filter((item) => item.id !== sale.id),
                        )
                      }
                      className="font-semibold text-red-600"
                    >
                      {t.delete}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showGiftCardForm && (
            <AppModal
              onClose={() => setShowGiftCardForm(false)}
              contentClassName="space-y-4 overflow-y-auto p-5"
            >
              <FormField label={paymentLabels.giftCardSales} htmlFor="gift-card-sale-amount">
                <MoneyInput
                  id="gift-card-sale-amount"
                  value={giftCardSaleAmount}
                  onChange={setGiftCardSaleAmount}
                />
              </FormField>
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-800">
                  {paymentLabels.paymentMethod}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["card", paymentLabels.card],
                    ["cash", paymentLabels.cash],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setGiftCardSalePaymentMethod(value as "card" | "cash")
                      }
                      className={`min-h-11 rounded-xl border px-2 text-sm font-semibold ${
                        giftCardSalePaymentMethod === value
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={addGiftCardSale}
                className="min-h-11 w-full rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white"
              >
                {paymentLabels.addGiftCardSale}
              </button>
              <button
                type="button"
                onClick={() => setShowGiftCardForm(false)}
                className="min-h-11 w-full rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              >
                {t.close}
              </button>
            </AppModal>
          )}

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

          <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <SummaryCard label={t.sales} value={formatCurrency(totals.sales)} />
            <SummaryCard label={t.orderCount} value={String(totals.orderCount)} />
            <SummaryCard
              label={t.commission}
              value={formatCurrency(totals.commissionTotal)}
            />
            <SummaryCard
              label={paymentLabels.cashIncome}
              value={formatCurrency(totals.cashSales)}
            />
            <SummaryCard
              label={paymentLabels.cardIncome}
              value={formatCurrency(totals.cardSales)}
            />
            <SummaryCard
              label={paymentLabels.giftCardSales}
              value={formatCurrency(totals.giftCardSaleTotal)}
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
            onEditOrder={openEditOrder}
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
  placeholder = "0.00",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
        placeholder={placeholder}
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
  onEditOrder,
  onDeleteOrder,
  onClose,
}: {
  t: (typeof text)["zh"];
  employeeName: string;
  orders: EmployeeOrder[];
  onEditOrder: (order: EmployeeOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onClose: () => void;
}) {
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
  const totalCommission = orders.reduce(
    (sum, order) => sum + getOrderCommission(order),
    0,
  );

  return (
    <AppModal onClose={onClose} contentClassName="flex flex-col">
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
                  {(order.discountAmount ?? 0) > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t.back.includes("Back") ? "Discount" : "优惠"}:{" "}
                      -{formatCurrency(order.discountAmount ?? 0)}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {t.sales}: {formatCurrency(getOrderRevenue(order))}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {paymentLabel(order.paymentMethod ?? "card", t)} /{" "}
                    {formatCurrency(getOrderPaidAmount(order))}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onEditOrder(order)}
                      className="min-h-10 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700"
                    >
                      {t.back.includes("Back") ? "Edit" : "编辑"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteOrder(order.id)}
                      className="min-h-10 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600"
                    >
                      {t.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
    </AppModal>
  );
}

const inputClassName =
  "min-h-12 w-full min-w-0 max-w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none focus:border-gray-900";

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
  return getOrderPaidAmount(order);
}

function getOrderGrossAmount(order: EmployeeOrder) {
  return order.price + order.extras.reduce((sum, extra) => sum + extra.price, 0);
}

function getOrderPaidAmount(order: EmployeeOrder) {
  if ((order.paymentMethod ?? "card") === "split") {
    return (order.cashAmount ?? 0) + (order.cardAmount ?? 0);
  }

  if (
    (order.paymentMethod ?? "card") === "gift-card" &&
    order.giftCardRemainderMethod === "split"
  ) {
    return (order.cashAmount ?? 0) + (order.cardAmount ?? 0);
  }

  const grossAmount = Math.max(
    0,
    getOrderGrossAmount(order) - (order.discountAmount ?? 0),
  );

  if ((order.paymentMethod ?? "card") !== "gift-card") {
    return grossAmount;
  }

  return Math.max(0, grossAmount - (order.giftCardAmount ?? 0));
}

function getPaymentTotals(orders: EmployeeOrder[], giftCardSales: GiftCardSale[]) {
  return {
    cashSales:
      orders.reduce((sum, order) => {
        const method = order.paymentMethod ?? "card";

        if (method === "cash") {
          return sum + getOrderPaidAmount(order);
        }

        if (method === "split") {
          return sum + (order.cashAmount ?? 0);
        }

        if (method === "gift-card") {
          if (order.giftCardRemainderMethod === "cash") {
            return sum + getOrderPaidAmount(order);
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

        if (method === "card" || method === "gift-card") {
          if (
            method === "gift-card" &&
            (order.giftCardRemainderMethod === "cash" ||
              order.giftCardRemainderMethod === "split")
          ) {
            return (
              sum +
              (order.giftCardRemainderMethod === "split"
                ? (order.cardAmount ?? 0)
                : 0)
            );
          }

          return sum + getOrderPaidAmount(order);
        }

        if (method === "split") {
          return sum + (order.cardAmount ?? 0);
        }

        return sum;
      }, 0) +
      giftCardSales
        .filter((sale) => sale.paymentMethod === "card")
        .reduce((sum, sale) => sum + sale.amount, 0),
  };
}

function paymentLabel(paymentMethod: PaymentMethod, t: (typeof text)["zh"]) {
  if (paymentMethod === "cash") {
    return t.back.includes("Back") ? "Cash" : "现金";
  }

  if (paymentMethod === "gift-card") {
    return t.back.includes("Back") ? "Gift Card" : "礼品卡";
  }

  if (paymentMethod === "split") {
    return t.back.includes("Back") ? "Split" : "拆分";
  }

  return t.back.includes("Back") ? "Card" : "刷卡";
}

function getOrderCommission(order: EmployeeOrder) {
  return (
    order.commission +
    order.extras.reduce((sum, extra) => sum + extra.commission, 0)
  );
}

function isExtraMenuItem(item: MenuItem) {
  return item.type === "extra" || item.type === "additional-services";
}

function menuItemMatchesQuery(item: MenuItem, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return false;
  }

  const searchableText = [
    item.name,
    item.id,
    item.type,
    getInitials(item.name),
    ...getMenuAliases(item),
  ]
    .map(normalizeSearchText)
    .join(" ");

  if (normalizedQuery.length <= 2) {
    return getMenuAliases(item)
      .map(normalizeSearchText)
      .some((alias) => alias === normalizedQuery);
  }

  return searchableText.includes(normalizedQuery);
}

function getMenuAliases(item: MenuItem) {
  const aliases = new Set<string>();
  const normalizedName = normalizeSearchText(item.name);

  aliases.add(getInitials(item.name));

  if (normalizedName.includes("dipped")) {
    aliases.add("dip");
    aliases.add("dp");
  }

  if (normalizedName === "regular pedicure") {
    aliases.add("p");
    aliases.add("ped");
    aliases.add("pedi");
  }

  if (normalizedName === "regular gel pedicure") {
    aliases.add("gp");
    aliases.add("rgp");
  }

  if (
    normalizedName === "classic manicure" ||
    normalizedName === "regular manicure"
  ) {
    aliases.add("m");
    aliases.add("mani");
  }

  if (normalizedName === "gel manicure") {
    aliases.add("gm");
  }

  if (normalizedName === "gel color") {
    aliases.add("gc");
  }

  if (normalizedName.includes("acrylic")) {
    aliases.add("ac");
    aliases.add("a");
  }

  if (normalizedName.includes("uv gel")) {
    aliases.add("uv");
  }

  if (normalizedName.includes("french")) {
    aliases.add("fr");
  }

  return [...aliases].filter(Boolean);
}

function getInitials(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toLowerCase();
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
