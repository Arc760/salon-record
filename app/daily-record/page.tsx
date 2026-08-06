"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppModal } from "../AppModal";
import { BottomNav } from "../BottomNav";
import { DatePickerButton } from "../DatePickerButton";
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
  aliases?: string[];
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

type OrderLineDraft = {
  id: string;
  kind: "service" | "extra";
  name: string;
  amount: string;
  commission: string;
};

type CategoryKey = "rent" | "supplies" | "payroll" | "utilities" | "marketing" | "other";

type Expense = {
  id: string;
  date: string;
  category: CategoryKey;
  amount: number;
  vendor: string;
  note: string;
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

type DailyRecordDraft = {
  date: string;
  note: string;
  orders: EmployeeOrder[];
  giftCardSales: GiftCardSale[];
  legacyCommissions: CommissionEntry[];
  updatedAt: string;
};

const EMPLOYEES_KEY = "salon-record-employees";
const DAILY_RECORDS_KEY = "salon-record-daily-records";
const DAILY_RECORD_DRAFTS_KEY = "salon-record-daily-record-drafts";
const EXPENSES_KEY = "salon-record-expenses";
const MENU_KEY = "salon-record-service-menu";
const ORDER_DRAFT_KEY = "salon-record-order-draft";
const NAIL_ART_ITEM: MenuItem = {
  id: "nail-art-custom",
  type: "additional-services",
  name: "花样",
  price: 0,
  commission: 0,
  aliases: ["nail art", "art", "design", "hy"],
  active: true,
};
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
    orderNumber: "单号",
    addOrderNumber: "新增单号",
    itemName: "项目名称",
    itemAmount: "金额",
    itemCommission: "提成",
    addProject: "添加项目",
    addExtraLine: "添加额外设施",
    saveEmployeeOrders: "保存当前员工项目",
    expense: "支出",
    addExpense: "添加支出",
    expenseDate: "支出日期",
    expenseCategory: "支出分类",
    expenseAmount: "金额",
    expenseVendor: "商家 / 用途",
    expenseVendorPlaceholder: "例如：甲油采购",
    expenseNote: "支出备注",
    expenseSaved: "支出已保存，会显示在支出记录里。",
    invalidExpense: "请选择日期并输入正确的支出金额。",
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
    orderNumber: "Order",
    addOrderNumber: "Add Order",
    itemName: "Item Name",
    itemAmount: "Amount",
    itemCommission: "Commission",
    addProject: "Add Item",
    addExtraLine: "Add Extra",
    saveEmployeeOrders: "Save Employee Orders",
    expense: "Expense",
    addExpense: "Add Expense",
    expenseDate: "Expense Date",
    expenseCategory: "Category",
    expenseAmount: "Amount",
    expenseVendor: "Vendor / Purpose",
    expenseVendorPlaceholder: "For example: nail polish purchase",
    expenseNote: "Expense Note",
    expenseSaved: "Expense saved. It will show in expense records.",
    invalidExpense: "Choose a date and enter a valid expense amount.",
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

export default function DailyRecordPage() {
  const { language, setLanguage } = useLanguage();
  const t = text[language];
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recordDataLoaded, setRecordDataLoaded] = useState(false);
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
  const [orderNumbers, setOrderNumbers] = useState(["1"]);
  const [activeOrderNumber, setActiveOrderNumber] = useState("1");
  const [orderLineDrafts, setOrderLineDrafts] = useState<Record<string, OrderLineDraft[]>>({
    "1": [createOrderLineDraft()],
  });
  const [showGiftCardForm, setShowGiftCardForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<CategoryKey>("supplies");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
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
  const datePickerLabels = {
    close: language === "en" ? "Close" : "关闭",
    select: language === "en" ? "Select Date" : "选择日期",
  };

  useEffect(() => {
    const loadData = window.setTimeout(() => {
      const loadedEmployees = readStorage<Employee[]>(EMPLOYEES_KEY, []);
      setEmployees(loadedEmployees);
      setEmployeeId(loadedEmployees[0]?.id ?? "");
      setMenuItems(mergeDailyMenuItems(readStorage<MenuItem[]>(MENU_KEY, [])));
      setRecords(readStorage<DailyRecord[]>(DAILY_RECORDS_KEY, []));
      setExpenses(readStorage<Expense[]>(EXPENSES_KEY, []));
      setRecordDataLoaded(true);
    }, 0);

    return () => window.clearTimeout(loadData);
  }, []);

  const selectedRecord = useMemo(
    () => records.find((record) => record.date === date),
    [date, records],
  );

  useEffect(() => {
    if (!recordDataLoaded) {
      return;
    }

    const loadRecord = window.setTimeout(() => {
      const drafts = readStorage<Record<string, DailyRecordDraft>>(
        DAILY_RECORD_DRAFTS_KEY,
        {},
      );
      const selectedDraft = drafts[date];

      if (selectedDraft) {
        setNote(selectedDraft.note);
        setOrders(selectedDraft.orders);
        setGiftCardSales(selectedDraft.giftCardSales);
        setLegacyCommissions(selectedDraft.legacyCommissions);
        return;
      }

      setNote(selectedRecord?.note ?? "");
      setOrders(selectedRecord?.orders ?? []);
      setGiftCardSales(selectedRecord?.giftCardSales ?? []);
      setLegacyCommissions(
        selectedRecord?.orders ? [] : selectedRecord?.commissions ?? [],
      );
    }, 0);

    return () => window.clearTimeout(loadRecord);
  }, [date, recordDataLoaded, selectedRecord]);

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

  useEffect(() => {
    if (!recordDataLoaded) {
      return;
    }

    const saveDraft = window.setTimeout(() => {
      const drafts = readStorage<Record<string, DailyRecordDraft>>(
        DAILY_RECORD_DRAFTS_KEY,
        {},
      );
      const draft: DailyRecordDraft = {
        date,
        note,
        orders,
        giftCardSales,
        legacyCommissions,
        updatedAt: new Date().toISOString(),
      };
      const hasDraftContent =
        note.trim() !== "" ||
        orders.length > 0 ||
        giftCardSales.length > 0 ||
        legacyCommissions.some((entry) => entry.amount > 0);
      const savedDraft = selectedRecord
        ? buildDraftFromSavedRecord(selectedRecord)
        : undefined;

      if (!hasDraftContent || draftsMatchSavedRecord(draft, savedDraft)) {
        delete drafts[date];
      } else {
        drafts[date] = draft;
      }

      window.localStorage.setItem(
        DAILY_RECORD_DRAFTS_KEY,
        JSON.stringify(drafts),
      );
    }, 150);

    return () => window.clearTimeout(saveDraft);
  }, [
    date,
    giftCardSales,
    legacyCommissions,
    note,
    orders,
    recordDataLoaded,
    selectedRecord,
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
  const selectedDateExpenseTotal = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date === date)
        .reduce((sum, expense) => sum + expense.amount, 0),
    [date, expenses],
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
    setOrderNumbers(["1"]);
    setActiveOrderNumber("1");
    setOrderLineDrafts({ "1": [createOrderLineDraft()] });
  }

  function addOrderNumber() {
    const nextNumber = String(orderNumbers.length + 1);

    setOrderNumbers((currentNumbers) => [...currentNumbers, nextNumber]);
    setOrderLineDrafts((currentDrafts) => ({
      ...currentDrafts,
      [nextNumber]: [createOrderLineDraft()],
    }));
    setActiveOrderNumber(nextNumber);
  }

  function addOrderLine(orderNumber: string) {
    setOrderLineDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderNumber]: [
        ...(currentDrafts[orderNumber] ?? []),
        createOrderLineDraft("service"),
      ],
    }));
  }

  function addExtraOrderLine(orderNumber: string) {
    setOrderLineDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderNumber]: [
        ...(currentDrafts[orderNumber] ?? []),
        createOrderLineDraft("extra"),
      ],
    }));
  }

  function removeOrderLine(orderNumber: string, lineId: string) {
    setOrderLineDrafts((currentDrafts) => {
      const currentLines = currentDrafts[orderNumber] ?? [];
      const removedLine = currentLines.find((line) => line.id === lineId);
      const firstServiceLineId = currentLines.find(
        (line) => line.kind === "service",
      )?.id;
      const nextLines = currentLines.filter((line) => line.id !== lineId);

      if (removedLine?.kind === "service" && removedLine.id === firstServiceLineId) {
        return {
          ...currentDrafts,
          [orderNumber]: [createOrderLineDraft(), ...nextLines],
        };
      }

      return {
        ...currentDrafts,
        [orderNumber]: nextLines.length > 0 ? nextLines : [createOrderLineDraft()],
      };
    });
  }

  function updateOrderLine(
    orderNumber: string,
    lineId: string,
    field: keyof Pick<OrderLineDraft, "name" | "amount" | "commission">,
    value: string,
  ) {
    setOrderLineDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderNumber]: (currentDrafts[orderNumber] ?? []).map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        if (field === "name") {
          const menuItem = findMenuItemBySearch(value, menuItems, line.kind);
          const nextAmount =
            menuItem && menuItem.price > 0 ? String(menuItem.price) : line.amount;

          return {
            ...line,
            name: value,
            amount: nextAmount,
            commission: getLineCommissionValue(menuItem, nextAmount, line.commission),
          };
        }

        if (field === "amount") {
          const menuItem = findMenuItemBySearch(line.name, menuItems, line.kind);

          return {
            ...line,
            amount: value,
            commission: getLineCommissionValue(menuItem, value, line.commission),
          };
        }

        return {
          ...line,
          [field]: value,
        };
      }),
    }));
  }

  function fillOrderLineFromMenuItem(
    orderNumber: string,
    lineId: string,
    item: MenuItem,
  ) {
    setOrderLineDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderNumber]: (currentDrafts[orderNumber] ?? []).map((line) =>
        line.id === lineId
          ? {
              ...line,
              name: item.name,
              amount: item.price > 0 ? String(item.price) : "",
              commission: getLineCommissionValue(item, String(item.price), ""),
            }
          : line,
      ),
    }));
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
    setServiceName("");
    setPrice("");
    setCommission("");
    setExtraName("");
    setExtraPrice("");
    setExtraCommission("");
    setOrderNumbers(["1"]);
    setActiveOrderNumber("1");
    setOrderLineDrafts({
      "1": orderToLineDrafts(order),
    });
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
    const nextOrders = buildOrdersFromLineDrafts(
      orderNumbers,
      orderLineDrafts,
      employee,
      menuItems,
      {
        editingOrderId,
        existingOrder: orders.find((order) => order.id === editingOrderId),
        paymentMethod,
        giftCardAmount: toAmount(giftCardAmount),
        giftCardRemainderMethod,
        discountAmount: toAmount(discountAmount),
        splitCashAmount: toAmount(splitCashAmount),
        splitCardAmount: toAmount(splitCardAmount),
        fallbackName: t.orderNumber,
      },
    );

    if (!employee || nextOrders.length === 0) {
      window.alert(t.invalidOrder);
      return;
    }

    setOrders((currentOrders) =>
      editingOrderId
        ? currentOrders.map((order) =>
            order.id === editingOrderId ? nextOrders[0] : order,
          )
        : [...currentOrders, ...nextOrders],
    );
    window.localStorage.removeItem(ORDER_DRAFT_KEY);
    resetOrderForm();
    setShowOrderForm(false);
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

  function saveExpenses(nextExpenses: Expense[]) {
    const sortedExpenses = [...nextExpenses].sort((a, b) =>
      b.date.localeCompare(a.date),
    );

    setExpenses(sortedExpenses);
    window.localStorage.setItem(EXPENSES_KEY, JSON.stringify(sortedExpenses));
  }

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = toAmount(expenseAmount);

    if (!date || numericAmount <= 0) {
      window.alert(t.invalidExpense);
      return;
    }

    saveExpenses([
      {
        id: crypto.randomUUID(),
        date,
        category: expenseCategory,
        amount: numericAmount,
        vendor: expenseVendor.trim(),
        note: expenseNote.trim(),
        createdAt: new Date().toISOString(),
      },
      ...expenses,
    ]);
    setExpenseCategory("supplies");
    setExpenseAmount("");
    setExpenseVendor("");
    setExpenseNote("");
    setShowExpenseForm(false);
    window.alert(t.expenseSaved);
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
    removeDailyRecordDraft(date);
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
              <DatePickerButton
                id="record-date"
                label={t.date}
                value={date}
                closeLabel={datePickerLabels.close}
                selectLabel={datePickerLabels.select}
                isEnglish={language === "en"}
                onChange={setDate}
              />
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
                  <div>
                    <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
                      {orderNumbers.map((orderNumber) => (
                        <button
                          key={orderNumber}
                          type="button"
                          onClick={() => setActiveOrderNumber(orderNumber)}
                          className={`min-h-10 shrink-0 rounded-xl border px-4 text-sm font-semibold ${
                            activeOrderNumber === orderNumber
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-300 text-gray-700"
                          }`}
                        >
                          {t.orderNumber} {orderNumber}
                        </button>
                      ))}
                      {!editingOrderId && (
                        <button
                          type="button"
                          onClick={addOrderNumber}
                          className="min-h-10 shrink-0 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                        >
                          +
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(orderLineDrafts[activeOrderNumber] ?? []).map((line) => {
                        const searchResults = getMenuSearchResults(
                          line.name,
                          menuItems,
                          line.kind,
                        );
                        const selectedMenuItem = findMenuItemBySearch(
                          line.name,
                          menuItems,
                          line.kind,
                        );
                        const showSearchResults =
                          searchResults.length > 0 &&
                          normalizeMenuSearchText(line.name) !==
                            normalizeMenuSearchText(selectedMenuItem?.name ?? "");
                        const isServiceLine = line.kind === "service";
                        const firstServiceLineId = (
                          orderLineDrafts[activeOrderNumber] ?? []
                        ).find((draftLine) => draftLine.kind === "service")?.id;
                        const isPrimaryServiceLine =
                          isServiceLine && line.id === firstServiceLineId;

                        return (
                          <div
                            key={line.id}
                            className="grid grid-cols-1 gap-2 rounded-xl border border-gray-200 p-2 sm:grid-cols-[1fr_7rem_7rem_auto_auto_auto]"
                          >
                            <div className="relative min-w-0">
                              <p className="mb-1 text-xs font-semibold text-gray-500">
                                {isServiceLine ? t.serviceName : t.extraName}
                              </p>
                              <input
                                value={line.name}
                                onChange={(event) =>
                                  updateOrderLine(
                                    activeOrderNumber,
                                    line.id,
                                    "name",
                                    event.target.value,
                                  )
                                }
                                placeholder={
                                  isServiceLine
                                    ? t.servicePlaceholder
                                    : t.extraPlaceholder
                                }
                                className={inputClassName}
                              />
                              {showSearchResults && (
                                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                                  {searchResults.map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() =>
                                        fillOrderLineFromMenuItem(
                                          activeOrderNumber,
                                          line.id,
                                          item,
                                        )
                                      }
                                      className="block min-h-10 w-full border-b border-gray-100 px-4 py-2 text-left text-base text-gray-900 last:border-b-0 hover:bg-gray-50"
                                    >
                                      {item.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-semibold text-gray-500">
                                {t.itemAmount}
                              </p>
                              <MoneyInput
                                id={`line-amount-${line.id}`}
                                value={line.amount}
                                onChange={(value) =>
                                  updateOrderLine(
                                    activeOrderNumber,
                                    line.id,
                                    "amount",
                                    value,
                                  )
                                }
                                placeholder={t.itemAmount}
                              />
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-semibold text-gray-500">
                                {t.itemCommission}
                              </p>
                              <MoneyInput
                                id={`line-commission-${line.id}`}
                                value={line.commission}
                                onChange={(value) =>
                                  updateOrderLine(
                                    activeOrderNumber,
                                    line.id,
                                    "commission",
                                    value,
                                  )
                                }
                                placeholder={t.itemCommission}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => addOrderLine(activeOrderNumber)}
                              title={t.addProject}
                              className="min-h-12 rounded-xl border border-gray-300 px-3 text-sm font-bold text-gray-700 sm:mt-5"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => addExtraOrderLine(activeOrderNumber)}
                              title={t.addExtraLine}
                              className="min-h-12 rounded-xl border border-gray-300 px-3 text-sm font-bold text-gray-700 sm:mt-5"
                            >
                              {t.addExtraLine}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeOrderLine(activeOrderNumber, line.id)
                              }
                              disabled={isPrimaryServiceLine}
                              className={`min-h-12 rounded-xl border px-3 text-lg font-bold ${
                                isPrimaryServiceLine
                                  ? "border-gray-200 text-gray-300"
                                  : "border-red-200 text-red-600"
                              } sm:mt-5`}
                            >
                              x
                            </button>
                          </div>
                        );
                      })}
                    </div>
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
                    {editingOrderId ? orderLabels.saveOrder : t.saveEmployeeOrders}
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

          <section className="rounded-xl border border-gray-200 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {t.expense}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {date}: {formatCurrency(selectedDateExpenseTotal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseForm(true)}
                className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              >
                {t.addExpense}
              </button>
            </div>
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

        {showExpenseForm && (
          <AppModal
            onClose={() => setShowExpenseForm(false)}
            contentClassName="space-y-4 overflow-y-auto p-5"
          >
            <form onSubmit={addExpense} className="space-y-4">
              <DatePickerButton
                  id="expense-date"
                  label={t.expenseDate}
                  value={date}
                  closeLabel={datePickerLabels.close}
                  selectLabel={datePickerLabels.select}
                  isEnglish={language === "en"}
                  onChange={setDate}
              />
              <FormField label={t.expenseCategory} htmlFor="expense-category">
                <select
                  id="expense-category"
                  value={expenseCategory}
                  onChange={(event) =>
                    setExpenseCategory(event.target.value as CategoryKey)
                  }
                  className={inputClassName}
                >
                  {categoryKeys.map((category) => (
                    <option key={category} value={category}>
                      {t.categories[category]}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t.expenseAmount} htmlFor="expense-amount">
                <MoneyInput
                  id="expense-amount"
                  value={expenseAmount}
                  onChange={setExpenseAmount}
                />
              </FormField>
              <FormField label={t.expenseVendor} htmlFor="expense-vendor">
                <input
                  id="expense-vendor"
                  value={expenseVendor}
                  onChange={(event) => setExpenseVendor(event.target.value)}
                  placeholder={t.expenseVendorPlaceholder}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t.expenseNote} htmlFor="expense-note">
                <textarea
                  id="expense-note"
                  value={expenseNote}
                  onChange={(event) => setExpenseNote(event.target.value)}
                  rows={3}
                  className={`${inputClassName} py-3`}
                />
              </FormField>
              <button
                type="submit"
                className="min-h-12 w-full rounded-xl bg-gray-900 px-5 text-base font-semibold text-white"
              >
                {t.addExpense}
              </button>
              <button
                type="button"
                onClick={() => setShowExpenseForm(false)}
                className="min-h-12 w-full rounded-xl border border-gray-300 px-5 text-base font-semibold text-gray-700"
              >
                {t.close}
              </button>
            </form>
          </AppModal>
        )}

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

function createOrderLineDraft(kind: OrderLineDraft["kind"] = "service"): OrderLineDraft {
  return {
    id: crypto.randomUUID(),
    kind,
    name: "",
    amount: "",
    commission: "",
  };
}

function orderToLineDrafts(order: EmployeeOrder): OrderLineDraft[] {
  const lines: OrderLineDraft[] = [
    {
      id: crypto.randomUUID(),
      kind: "service",
      name: order.price > 0 ? order.serviceName : "",
      amount: order.price > 0 ? String(order.price) : "",
      commission: order.commission > 0 ? String(order.commission) : "",
    },
    ...order.extras.map((extra) => ({
      id: crypto.randomUUID(),
      kind: "extra" as const,
      name: extra.name,
      amount: extra.price > 0 ? String(extra.price) : "",
      commission: extra.commission > 0 ? String(extra.commission) : "",
    })),
  ];

  return lines.length > 0 ? lines : [createOrderLineDraft()];
}

function buildOrdersFromLineDrafts(
  orderNumbers: string[],
  orderLineDrafts: Record<string, OrderLineDraft[]>,
  employee: Employee | undefined,
  menuItems: MenuItem[],
  options: {
    editingOrderId: string | null;
    existingOrder?: EmployeeOrder;
    paymentMethod: PaymentMethod;
    giftCardAmount: number;
    giftCardRemainderMethod: "card" | "cash" | "split";
    discountAmount: number;
    splitCashAmount: number;
    splitCardAmount: number;
    fallbackName: string;
  },
): EmployeeOrder[] {
  if (!employee) {
    return [];
  }

  const now = new Date().toISOString();
  const nextOrders: EmployeeOrder[] = [];

  orderNumbers.forEach((orderNumber, index) => {
    const lines = orderLineDrafts[orderNumber] ?? [];
    const serviceLine =
      lines.find((line) => line.kind === "service") ??
      lines.find((line) => line.name.trim() || toAmount(line.amount) > 0);
    const serviceName = serviceLine?.name.trim() ?? "";
    const servicePrice = toAmount(serviceLine?.amount);
    const serviceMenuItem = findMenuItemBySearch(
      serviceName,
      menuItems,
      "service",
    );
    const serviceCommission =
      toAmount(serviceLine?.commission) ||
      getMenuItemDefaultCommission(serviceMenuItem, servicePrice);
    const extras: OrderExtra[] = [];

    lines.forEach((line) => {
      if (line.id === serviceLine?.id) {
        return;
      }

      const name = line.name.trim();
      const price = toAmount(line.amount);
      const menuItem = findMenuItemBySearch(name, menuItems, line.kind);
      const commission = toAmount(line.commission);

      if (!name && price <= 0) {
        return;
      }

      extras.push({
        id: crypto.randomUUID(),
        name: name || `${options.fallbackName} ${orderNumber}`,
        price,
        commission: commission || getMenuItemDefaultCommission(menuItem, price),
      });
    });

    if (!serviceName && servicePrice <= 0 && extras.length === 0) {
      return;
    }

    nextOrders.push({
      id:
        options.editingOrderId && index === 0
          ? options.editingOrderId
          : crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      serviceName: serviceName || `${options.fallbackName} ${orderNumber}`,
      price: servicePrice,
      commission: serviceCommission,
      extras,
      paymentMethod: options.paymentMethod,
      giftCardAmount:
        options.paymentMethod === "gift-card" ? options.giftCardAmount : 0,
      giftCardRemainderMethod:
        options.paymentMethod === "gift-card"
          ? options.giftCardRemainderMethod
          : undefined,
      discountAmount: options.discountAmount,
      cashAmount:
        options.paymentMethod === "split" ||
        (options.paymentMethod === "gift-card" &&
          options.giftCardRemainderMethod === "split")
          ? options.splitCashAmount
          : 0,
      cardAmount:
        options.paymentMethod === "split" ||
        (options.paymentMethod === "gift-card" &&
          options.giftCardRemainderMethod === "split")
          ? options.splitCardAmount
          : 0,
      createdAt:
        options.editingOrderId && index === 0
          ? (options.existingOrder?.createdAt ?? now)
          : now,
    });
  });

  return nextOrders;
}

function findMenuItemBySearch(
  searchText: string,
  menuItems: MenuItem[],
  kind?: OrderLineDraft["kind"],
) {
  const normalizedSearch = normalizeMenuSearchText(searchText);

  if (!normalizedSearch) {
    return undefined;
  }

  return menuItems.find((item) => {
    if (!menuItemMatchesLineKind(item, kind)) {
      return false;
    }

    const aliases = getMenuAliases(item).map(normalizeMenuSearchText);

    return (
      normalizeMenuSearchText(item.name) === normalizedSearch ||
      normalizeMenuSearchText(item.id) === normalizedSearch ||
      aliases.some((alias) => alias === normalizedSearch)
    );
  });
}

function getMenuSearchResults(
  searchText: string,
  menuItems: MenuItem[],
  kind?: OrderLineDraft["kind"],
) {
  const normalizedSearch = normalizeMenuSearchText(searchText);

  if (!normalizedSearch) {
    return [];
  }

  return menuItems
    .map((item) => ({
      item,
      rank: getMenuSearchRank(item, normalizedSearch, kind),
    }))
    .filter((result) => result.rank < Number.POSITIVE_INFINITY)
    .sort((first, second) => first.rank - second.rank)
    .map((result) => result.item);
}

function getMenuSearchRank(
  item: MenuItem,
  normalizedSearch: string,
  kind?: OrderLineDraft["kind"],
) {
  if (!item.active || !menuItemMatchesLineKind(item, kind)) {
    return Number.POSITIVE_INFINITY;
  }

  const normalizedName = normalizeMenuSearchText(item.name);
  const normalizedId = normalizeMenuSearchText(item.id);
  const normalizedType = normalizeMenuSearchText(item.type);
  const normalizedInitials = normalizeMenuSearchText(getInitials(item.name));
  const aliases = getMenuAliases(item).map(normalizeMenuSearchText);
  const exactAliasMatch = aliases.some((alias) => alias === normalizedSearch);
  const aliasPrefixMatch = aliases.some((alias) =>
    alias.startsWith(normalizedSearch),
  );

  if (exactAliasMatch || normalizedInitials === normalizedSearch) {
    return 0;
  }

  if (aliasPrefixMatch || normalizedInitials.startsWith(normalizedSearch)) {
    return 1;
  }

  if (normalizedName === normalizedSearch || normalizedId === normalizedSearch) {
    return 2;
  }

  if (
    normalizedName.startsWith(normalizedSearch) ||
    normalizedId.startsWith(normalizedSearch)
  ) {
    return 3;
  }

  if (
    normalizedName.includes(normalizedSearch) ||
    normalizedId.includes(normalizedSearch) ||
    normalizedType.includes(normalizedSearch)
  ) {
    return 4;
  }

  return Number.POSITIVE_INFINITY;
}

function menuItemMatchesLineKind(
  item: MenuItem,
  kind?: OrderLineDraft["kind"],
) {
  if (!kind) {
    return true;
  }

  const isExtraItem = item.type === "extra" || item.type === "additional-services";

  return kind === "extra" ? isExtraItem : !isExtraItem;
}

function getMenuAliases(item: MenuItem) {
  const aliases = new Set<string>(item.aliases ?? []);
  const normalizedName = normalizeMenuSearchText(item.name);

  aliases.add(getInitials(item.name));

  if (normalizedName.includes("full set")) {
    aliases.add("fs");
  }

  if (normalizedName.includes("fill in")) {
    aliases.add("fi");
  }

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

function normalizeMenuSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

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

function buildDraftFromSavedRecord(record: DailyRecord): DailyRecordDraft {
  return {
    date: record.date,
    note: record.note,
    orders: record.orders ?? [],
    giftCardSales: record.giftCardSales ?? [],
    legacyCommissions: record.orders ? [] : record.commissions,
    updatedAt: record.updatedAt,
  };
}

function draftsMatchSavedRecord(
  draft: DailyRecordDraft,
  savedDraft: DailyRecordDraft | undefined,
) {
  if (!savedDraft) {
    return false;
  }

  return (
    draft.date === savedDraft.date &&
    draft.note.trim() === savedDraft.note.trim() &&
    JSON.stringify(draft.orders) === JSON.stringify(savedDraft.orders) &&
    JSON.stringify(draft.giftCardSales) ===
      JSON.stringify(savedDraft.giftCardSales) &&
    JSON.stringify(draft.legacyCommissions) ===
      JSON.stringify(savedDraft.legacyCommissions)
  );
}

function removeDailyRecordDraft(date: string) {
  const drafts = readStorage<Record<string, DailyRecordDraft>>(
    DAILY_RECORD_DRAFTS_KEY,
    {},
  );

  delete drafts[date];
  window.localStorage.setItem(DAILY_RECORD_DRAFTS_KEY, JSON.stringify(drafts));
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

function mergeDailyMenuItems(menuItems: MenuItem[]) {
  const hasNailArt = menuItems.some(
    (item) =>
      item.id === NAIL_ART_ITEM.id ||
      normalizeMenuSearchText(item.name) === normalizeMenuSearchText(NAIL_ART_ITEM.name),
  );

  return hasNailArt ? menuItems : [...menuItems, NAIL_ART_ITEM];
}

function getLineCommissionValue(
  menuItem: MenuItem | undefined,
  amountValue: string,
  currentCommission: string,
) {
  const amount = toAmount(amountValue);

  if (isNailArtItem(menuItem)) {
    return amount > 0 ? formatPlainAmount(amount * 0.2) : "";
  }

  if (menuItem && menuItem.commission > 0) {
    return String(menuItem.commission);
  }

  return currentCommission;
}

function getMenuItemDefaultCommission(
  menuItem: MenuItem | undefined,
  amount: number,
) {
  if (isNailArtItem(menuItem)) {
    return roundCurrency(amount * 0.2);
  }

  return menuItem?.commission ?? 0;
}

function isNailArtItem(menuItem: MenuItem | undefined) {
  return menuItem?.id === NAIL_ART_ITEM.id;
}

function formatPlainAmount(amount: number) {
  return String(roundCurrency(amount));
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}

function getTodayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
