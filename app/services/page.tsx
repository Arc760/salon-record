"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BottomNav } from "../BottomNav";
import { LanguageSwitcher, useLanguage } from "../useLanguage";

type MenuType =
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

type StoredMenuType = MenuType | "service" | "hand" | "foot" | "extra";

type MenuItem = {
  id: string;
  type: StoredMenuType;
  name: string;
  price: number;
  commission: number;
  active: boolean;
  updatedAt: string;
};

const MENU_KEY = "salon-record-service-menu";

const defaultMenuItems: Array<
  Omit<MenuItem, "active" | "updatedAt">
> = [
  { id: "uv-gel-full-set", type: "uv-gel-nail", name: "UV Gel Full Set", price: 55, commission: 0 },
  { id: "uv-gel-fill-in", type: "uv-gel-nail", name: "UV Gel Fill-In", price: 40, commission: 0 },
  { id: "uv-gel-full-set-gel-color", type: "uv-gel-nail", name: "UV Gel Full Set + Gel Color", price: 70, commission: 0 },
  { id: "uv-gel-fill-in-gel-color", type: "uv-gel-nail", name: "UV Gel Fill-In + Gel Color", price: 55, commission: 0 },
  { id: "gel-x-new-set", type: "uv-gel-nail", name: "Gel X New Set", price: 70, commission: 0 },
  { id: "gel-x-fill-in", type: "uv-gel-nail", name: "Gel X Fill In", price: 60, commission: 0 },
  { id: "uv-gel-permanent-french-full-set", type: "uv-gel-permanent-french", name: "UV Gel Permanent French - Full Set", price: 75, commission: 0 },
  { id: "uv-gel-permanent-french-double-fill-in", type: "uv-gel-permanent-french", name: "UV Gel Permanent French - Double Fill-In", price: 66, commission: 0 },
  { id: "uv-gel-permanent-french-pink-fill-in", type: "uv-gel-permanent-french", name: "UV Gel Permanent French - Pink Fill-In", price: 55, commission: 0 },
  { id: "kid-manicure", type: "kid-services", name: "Kid Manicure", price: 18, commission: 0 },
  { id: "kid-pedicure", type: "kid-services", name: "Kid Pedicure", price: 28, commission: 0 },
  { id: "kid-manicure-pedicure-combo", type: "kid-services", name: "Kid Manicure & Pedicure Combo", price: 40, commission: 0 },
  { id: "kid-hand-polish", type: "kid-services", name: "Kid Hand Polish", price: 10, commission: 0 },
  { id: "kid-feet-polish", type: "kid-services", name: "Kid Feet Polish", price: 15, commission: 0 },
  { id: "kid-hand-feet-polish", type: "kid-services", name: "Kid Hand and Feet Polish", price: 20, commission: 0 },
  { id: "regular-color-change-feet", type: "pedicure", name: "Regular Color Change on Feet", price: 20, commission: 0 },
  { id: "regular-pedicure", type: "pedicure", name: "Regular Pedicure", price: 38, commission: 0 },
  { id: "regular-gel-pedicure", type: "pedicure", name: "Regular Gel Pedicure", price: 53, commission: 0 },
  { id: "gel-color-change-feet", type: "pedicure", name: "Gel Color Change on Feet", price: 35, commission: 0 },
  { id: "classic-manicure", type: "manicures", name: "Classic Manicure", price: 20, commission: 0 },
  { id: "regular-color-change-hands", type: "manicures", name: "Regular Color Change on Hands", price: 15, commission: 0 },
  { id: "dazzle-manicure", type: "manicures", name: "Dazzle Manicure", price: 38, commission: 0 },
  { id: "gel-manicure", type: "manicures", name: "Gel Manicure", price: 38, commission: 0 },
  { id: "dipped-powder", type: "dip-manicures", name: "Dipped Powder", price: 50, commission: 0 },
  { id: "dipped-nails-extended-tips", type: "dip-manicures", name: "Dipped Nails w. Extended Tips", price: 60, commission: 0 },
  { id: "dipped-nails-french", type: "dip-manicures", name: "Dipped Nails w. French", price: 60, commission: 0 },
  { id: "dipped-nails-french-tips", type: "dip-manicures", name: "Dipped Nails French w. Tips", price: 70, commission: 0 },
  { id: "acrylic-full-set", type: "acrylic-nail", name: "Acrylic Full Set", price: 45, commission: 0 },
  { id: "acrylic-fill-in", type: "acrylic-nail", name: "Acrylic Fill-In", price: 33, commission: 0 },
  { id: "acrylic-new-set-gel-color", type: "acrylic-nail", name: "Acrylic New Set w. Gel Color", price: 60, commission: 0 },
  { id: "acrylic-fill-in-gel-color", type: "acrylic-nail", name: "Acrylic Fill-In w. Gel Color", price: 48, commission: 0 },
  { id: "pink-white-full-set", type: "acrylic-nail", name: "Pink & White Full Set", price: 70, commission: 0 },
  { id: "pink-white-double-fill-in", type: "acrylic-nail", name: "Pink & White Double Fill-In", price: 65, commission: 0 },
  { id: "pink-white-pink-fill-in", type: "acrylic-nail", name: "Pink & White Pink Fill-In", price: 45, commission: 0 },
  { id: "gel-color", type: "additional-services", name: "Gel Color", price: 15, commission: 0 },
  { id: "french", type: "additional-services", name: "French", price: 10, commission: 0 },
  { id: "coffin-almond-pointy-shape", type: "additional-services", name: "Coffin / Almond / Pointy Shape", price: 5, commission: 0 },
  { id: "soak-off", type: "additional-services", name: "Soak Off", price: 15, commission: 0 },
  { id: "nail-repair-per-nail", type: "additional-services", name: "Nail Repair (Charged Per Nail)", price: 10, commission: 0 },
  { id: "paraffin-waxing-hands", type: "additional-services", name: "Paraffin Waxing For Hands", price: 10, commission: 0 },
  { id: "hand-mask", type: "additional-services", name: "Hand Mask", price: 10, commission: 0 },
  { id: "paraffin-waxing-feet", type: "additional-services", name: "Paraffin Waxing For Feet", price: 15, commission: 0 },
  { id: "feet-mask", type: "additional-services", name: "Feet Mask", price: 15, commission: 0 },
  { id: "callus-treatment", type: "additional-services", name: "Callus Treatment", price: 12, commission: 0 },
  { id: "shiny-buff", type: "additional-services", name: "Shiny Buff", price: 8, commission: 0 },
  { id: "waxing-eyebrow", type: "waxing", name: "Eyebrow Waxing", price: 15, commission: 0 },
  { id: "waxing-lips", type: "waxing", name: "Lips Waxing", price: 10, commission: 0 },
  { id: "waxing-chin", type: "waxing", name: "Chin Waxing", price: 10, commission: 0 },
  { id: "waxing-cheeks", type: "waxing", name: "Cheeks Waxing", price: 10, commission: 0 },
  { id: "waxing-face", type: "waxing", name: "Face Waxing", price: 35, commission: 0 },
  { id: "waxing-neck", type: "waxing", name: "Neck Waxing", price: 10, commission: 0 },
  { id: "waxing-under-arm", type: "waxing", name: "Under Arm Waxing", price: 15, commission: 0 },
  { id: "waxing-half-arm", type: "waxing", name: "Half Arm Waxing", price: 30, commission: 0 },
  { id: "waxing-full-arm", type: "waxing", name: "Full Arm Waxing", price: 40, commission: 0 },
  { id: "waxing-bikini", type: "waxing", name: "Bikini Waxing", price: 35, commission: 0 },
  { id: "waxing-brazilian", type: "waxing", name: "Brazilian Waxing", price: 50, commission: 0 },
  { id: "waxing-half-leg", type: "waxing", name: "Half Leg Waxing", price: 35, commission: 0 },
  { id: "waxing-full-leg", type: "waxing", name: "Full Leg Waxing", price: 50, commission: 0 },
  { id: "silver-spa", type: "spa-pedicure", name: "Silver Spa", price: 51, commission: 0 },
  { id: "gold-spa", type: "spa-pedicure", name: "Gold Spa", price: 61, commission: 0 },
  { id: "platinum-spa", type: "spa-pedicure", name: "Platinum Spa", price: 71, commission: 0 },
  { id: "diamond-spa", type: "spa-pedicure", name: "Diamond Spa", price: 85, commission: 0 },
  { id: "premium-heated-foot-mitts-foot-mask", type: "spa-pedicure", name: "Premium Heated Foot Mitts and Foot Mask", price: 0, commission: 0 },
];

const menuNameTranslations: Record<string, string> = {
  "uv-gel-full-set": "UV凝胶全套",
  "uv-gel-fill-in": "UV凝胶补甲",
  "uv-gel-full-set-gel-color": "UV凝胶全套加光疗颜色",
  "uv-gel-fill-in-gel-color": "UV凝胶补甲加光疗颜色",
  "gel-x-new-set": "Gel X新套",
  "gel-x-fill-in": "Gel X补甲",
  "uv-gel-permanent-french-full-set": "UV凝胶永久法式全套",
  "uv-gel-permanent-french-double-fill-in": "UV凝胶永久法式双补",
  "uv-gel-permanent-french-pink-fill-in": "UV凝胶永久法式粉色补",
  "kid-manicure": "儿童修手",
  "kid-pedicure": "儿童修脚",
  "kid-manicure-pedicure-combo": "儿童修手修脚套餐",
  "kid-hand-polish": "儿童手部涂色",
  "kid-feet-polish": "儿童脚部涂色",
  "kid-hand-feet-polish": "儿童手脚涂色",
  "regular-color-change-feet": "脚部普通换色",
  "regular-pedicure": "普通修脚",
  "regular-gel-pedicure": "光疗修脚",
  "gel-color-change-feet": "脚部光疗换色",
  "classic-manicure": "经典修手",
  "regular-color-change-hands": "手部普通换色",
  "dazzle-manicure": "Dazzle修手",
  "gel-manicure": "光疗修手",
  "dipped-powder": "蘸粉",
  "dipped-nails-extended-tips": "蘸粉加延长甲片",
  "dipped-nails-french": "蘸粉法式",
  "dipped-nails-french-tips": "蘸粉法式加甲片",
  "acrylic-full-set": "水晶全套",
  "acrylic-fill-in": "水晶补甲",
  "acrylic-new-set-gel-color": "水晶新套加光疗颜色",
  "acrylic-fill-in-gel-color": "水晶补甲加光疗颜色",
  "pink-white-full-set": "粉白全套",
  "pink-white-double-fill-in": "粉白双补",
  "pink-white-pink-fill-in": "粉白粉色补",
  "gel-color": "光疗颜色",
  "french": "法式",
  "coffin-almond-pointy-shape": "棺材形 / 杏仁形 / 尖形",
  "soak-off": "卸甲",
  "nail-repair-per-nail": "修甲每只",
  "paraffin-waxing-hands": "手部石蜡护理",
  "hand-mask": "手膜",
  "paraffin-waxing-feet": "脚部石蜡护理",
  "feet-mask": "脚膜",
  "callus-treatment": "去脚皮护理",
  "shiny-buff": "抛光",
  "waxing-eyebrow": "眉毛拔毛",
  "waxing-lips": "唇部拔毛",
  "waxing-chin": "下巴拔毛",
  "waxing-cheeks": "脸颊拔毛",
  "waxing-face": "全脸拔毛",
  "waxing-neck": "颈部拔毛",
  "waxing-under-arm": "腋下拔毛",
  "waxing-half-arm": "半手臂拔毛",
  "waxing-full-arm": "全手臂拔毛",
  "waxing-bikini": "比基尼拔毛",
  "waxing-brazilian": "巴西式拔毛",
  "waxing-half-leg": "半腿拔毛",
  "waxing-full-leg": "全腿拔毛",
  "silver-spa": "银牌足部护理",
  "gold-spa": "金牌足部护理",
  "platinum-spa": "白金足部护理",
  "diamond-spa": "钻石足部护理",
  "premium-heated-foot-mitts-foot-mask": "高级加热脚套和脚膜",
};

void menuNameTranslations;

const text = {
  zh: {
    back: "← 返回首页",
    title: "菜单",
    subtitle: "Menu",
    type: "类型",
    hand: "手",
    foot: "脚",
    waxing: "拔毛",
    extra: "额外设施 / 加项",
    name: "名称",
    namePlaceholder: "例如：Gel Manicure",
    price: "价钱",
    commission: "提成",
    save: "保存项目",
    update: "保存修改",
    cancel: "取消",
    empty: "还没有菜单项目",
    active: "启用",
    inactive: "停用",
    edit: "编辑",
    disable: "停用",
    restore: "恢复",
    invalid: "请输入名称、价钱和提成。",
  },
  en: {
    back: "← Back Home",
    title: "Menu",
    subtitle: "Services, prices, and commission",
    type: "Type",
    hand: "Hands",
    foot: "Feet",
    waxing: "Waxing",
    extra: "Extra Facility / Add-on",
    name: "Name",
    namePlaceholder: "Example: Gel Manicure",
    price: "Price",
    commission: "Commission",
    save: "Save Item",
    update: "Save Changes",
    cancel: "Cancel",
    empty: "No menu items yet",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    disable: "Disable",
    restore: "Restore",
    invalid: "Enter a name, price, and commission.",
  },
};

export default function ServicesPage() {
  const { language, setLanguage } = useLanguage();
  const t = text[language];
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedMenuType, setSelectedMenuType] = useState<MenuType | null>(
    null,
  );
  const [type, setType] = useState<MenuType>("pedicure");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [commissionSearch, setCommissionSearch] = useState("");
  const [search, setSearch] = useState("");
  const commissionSearchResults = commissionSearch.trim()
    ? items
        .filter((item) => matchesMenuItemSearch(item, commissionSearch))
        .slice(0, 8)
    : [];
  const filteredItems = search.trim()
    ? items.filter((item) => matchesMenuItemSearch(item, search))
    : items;
  const categories = getMenuCategories(t);
  const selectedCategory = categories.find(
    (category) => category.type === selectedMenuType,
  );
  const selectedItems = selectedMenuType
    ? filteredItems.filter(
        (item) => getMenuItemCategory(item) === selectedMenuType,
      )
    : [];
  const itemCountLabel = language === "zh" ? "项目" : "items";
  const openCategoryLabel = language === "zh" ? "查看" : "Open";
  const closeLabel = language === "zh" ? "关闭" : "Close";
  const searchLabel = language === "zh" ? "搜索菜单" : "Search Menu";
  const searchPlaceholder =
    language === "zh" ? "输入项目名称，例如 凝胶" : "Enter item name, example Gel";
  const commissionSearchLabel =
    language === "zh" ? "搜索项目添加提成" : "Search Item for Commission";
  const commissionSearchPlaceholder =
    language === "zh" ? "输入项目名称，选择后添加提成" : "Search item, then add commission";
  const visibleCategories = search.trim()
    ? categories.filter((category) =>
        filteredItems.some(
          (item) => getMenuItemCategory(item) === category.type,
        ),
      )
    : categories;

  useEffect(() => {
    const loadMenu = window.setTimeout(() => {
      const savedItems = readStorage<MenuItem[]>(MENU_KEY, []);
      const mergedItems = mergeDefaultMenuItems(savedItems);

      setItems(mergedItems);

      if (mergedItems.length !== savedItems.length) {
        window.localStorage.setItem(MENU_KEY, JSON.stringify(mergedItems));
      }
    }, 0);

    return () => window.clearTimeout(loadMenu);
  }, []);

  function saveItems(nextItems: MenuItem[]) {
    const sortedItems = [...nextItems].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    setItems(sortedItems);
    window.localStorage.setItem(MENU_KEY, JSON.stringify(sortedItems));
  }

  function resetForm() {
    setEditingId(null);
    setType("pedicure");
    setName("");
    setPrice("");
    setCommission("");
    setCommissionSearch("");
    setShowEditor(false);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const numericPrice = Number(price);
    const numericCommission = commission.trim() === "" ? 0 : Number(commission);

    if (
      !trimmedName ||
      Number.isNaN(numericPrice) ||
      Number.isNaN(numericCommission) ||
      numericPrice < 0 ||
      numericCommission < 0
    ) {
      window.alert(t.invalid);
      return;
    }

    if (editingId) {
      saveItems(
        items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                type,
                name: trimmedName,
                price: numericPrice,
                commission: numericCommission,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
    } else {
      saveItems([
        ...items,
        {
          id: crypto.randomUUID(),
          type,
          name: trimmedName,
          price: numericPrice,
          commission: numericCommission,
          active: true,
          updatedAt: new Date().toISOString(),
        },
      ]);
    }

    resetForm();
  }

  function editItem(item: MenuItem) {
    setEditingId(item.id);
    setType(getMenuItemCategory(item));
    setName(item.name);
    setPrice(String(item.price));
    setCommission(item.commission === 0 ? "" : String(item.commission));
    setCommissionSearch(item.name);
    setSelectedMenuType(null);
    setShowEditor(true);
  }

  function toggleItem(itemId: string) {
    saveItems(
      items.map((item) =>
        item.id === itemId ? { ...item, active: !item.active } : item,
      ),
    );
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

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowEditor(true);
          }}
          className="mb-3 min-h-11 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white"
        >
          {t.save}
        </button>

        {showEditor && (
          <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6">
            <form
              onSubmit={submitForm}
              className="mx-auto flex max-h-full max-w-md flex-col overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
            >
          <FormField label={commissionSearchLabel} htmlFor="commission-search">
            <input
              id="commission-search"
              type="search"
              value={commissionSearch}
              onChange={(event) => setCommissionSearch(event.target.value)}
              placeholder={commissionSearchPlaceholder}
              className={inputClassName}
            />
            {commissionSearchResults.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2">
                {commissionSearchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => editItem(item)}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm hover:bg-gray-50"
                  >
                    <span>
                      <span className="block font-semibold text-gray-900">
                        {getMenuItemDisplayName(item)}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {menuTypeLabel(item.type, t)}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-gray-900">
                      {formatCurrency(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </FormField>

          <FormField label={t.type} htmlFor="menu-type">
            <select
              id="menu-type"
              value={type}
              onChange={(event) => setType(event.target.value as MenuType)}
              className={inputClassName}
            >
              {categories.map((category) => (
                <option key={category.type} value={category.type}>
                  {category.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t.name} htmlFor="menu-name">
            <input
              id="menu-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.namePlaceholder}
              className={inputClassName}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.price} htmlFor="menu-price">
              <MoneyInput id="menu-price" value={price} onChange={setPrice} />
            </FormField>
            <FormField label={t.commission} htmlFor="menu-commission">
              <MoneyInput
                id="menu-commission"
                value={commission}
                onChange={setCommission}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              className="min-h-12 rounded-xl bg-gray-900 px-5 text-base font-semibold text-white"
            >
              {editingId ? t.update : t.save}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="min-h-12 rounded-xl border border-gray-300 px-5 text-base font-semibold text-gray-700"
            >
              {t.cancel}
            </button>
          </div>
            </form>
          </div>
        )}

        <div className="mb-3">
          <label
            htmlFor="menu-search"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            {searchLabel}
          </label>
          <input
            id="menu-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className={inputClassName}
          />
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            {t.empty}
          </div>
        ) : (
          <>
            <section className="grid shrink-0 grid-cols-2 gap-3">
              {visibleCategories.map((category) => {
                const categoryItems = filteredItems.filter(
                  (item) => getMenuItemCategory(item) === category.type,
                );

                return (
                  <button
                    key={category.type}
                    type="button"
                    onClick={() => setSelectedMenuType(category.type)}
                    className="min-h-20 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm"
                  >
                    <span className="block text-lg font-bold text-gray-900">
                      {category.label}
                    </span>
                    <span className="mt-2 block text-sm text-gray-500">
                      {categoryItems.length} {itemCountLabel}
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-gray-700">
                      {openCategoryLabel}
                    </span>
                  </button>
                );
              })}
            </section>
            <section className="hidden">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">
                      {getMenuItemDisplayName(item)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {menuTypeLabel(item.type, t)} ·{" "}
                      {item.active ? t.active : t.inactive}
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      {t.price} {formatCurrency(item.price)} · {t.commission}{" "}
                      {formatCurrency(item.commission)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => editItem(item)}
                    className="min-h-10 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700"
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="min-h-10 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700"
                  >
                    {item.active ? t.disable : t.restore}
                  </button>
                </div>
              </article>
            ))}
            </section>
          </>
        )}

        {selectedCategory ? (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-4 pt-10 sm:items-center sm:justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-category-title"
          >
            <div className="max-h-[88vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2
                    id="menu-category-title"
                    className="text-xl font-bold text-gray-900"
                  >
                    {selectedCategory.label}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedItems.length} {itemCountLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMenuType(null)}
                  className="min-h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
                >
                  {closeLabel}
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
                {selectedItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                    {t.empty}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => editItem(item)}
                        className="min-h-28 w-full rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm"
                      >
                        <span className="block">
                          <span className="block">
                            <span className="line-clamp-2 block text-sm font-bold text-gray-900">
                              {getMenuItemDisplayName(item)}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              {item.active ? t.active : t.inactive}
                            </span>
                          </span>
                        </span>
                        <span className="mt-2 block rounded-lg bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-900">
                          {t.price} {formatCurrency(item.price)}
                        </span>
                        <span className="mt-1 block rounded-lg bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-900">
                          {t.commission} {formatCurrency(item.commission)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <BottomNav />
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

const inputClassName =
  "min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none focus:border-gray-900";

function mergeDefaultMenuItems(savedItems: MenuItem[]) {
  const defaultsById = new Map(defaultMenuItems.map((item) => [item.id, item]));
  const migratedItems = savedItems.map((item) => {
    const defaultItem = defaultsById.get(item.id);

    return defaultItem ? { ...item, type: defaultItem.type } : item;
  });
  const existingIds = new Set(savedItems.map((item) => item.id));
  const existingKeys = new Set(
    migratedItems.map(
      (item) => `${getMenuItemCategory(item)}|${item.name.trim().toLowerCase()}`,
    ),
  );
  const now = new Date().toISOString();
  const missingItems: MenuItem[] = defaultMenuItems
    .filter(
      (item) =>
        !existingIds.has(item.id) &&
        !existingKeys.has(`${item.type}|${item.name.trim().toLowerCase()}`),
    )
    .map((item) => ({
      ...item,
      active: true,
      updatedAt: now,
    }));

  return [...migratedItems, ...missingItems].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function normalizeMenuType(type: StoredMenuType): MenuType {
  if (isMenuType(type)) {
    return type;
  }

  if (type === "foot") {
    return "pedicure";
  }

  if (type === "extra") {
    return "additional-services";
  }

  return "manicures";
}

function getMenuItemCategory(item: MenuItem): MenuType {
  const defaultItem = defaultMenuItems.find(
    (menuItem) => menuItem.id === item.id,
  );

  return defaultItem ? normalizeMenuType(defaultItem.type) : normalizeMenuType(item.type);
}

function isMenuType(type: StoredMenuType): type is MenuType {
  return [
    "pedicure",
    "manicures",
    "dip-manicures",
    "acrylic-nail",
    "uv-gel-nail",
    "uv-gel-permanent-french",
    "kid-services",
    "additional-services",
    "waxing",
    "spa-pedicure",
  ].includes(type);
}

function getMenuCategories(t: (typeof text)["zh"]) {
  void t;

  return [
    { type: "pedicure" as const, label: "PEDICURE" },
    { type: "manicures" as const, label: "MANICURES" },
    { type: "dip-manicures" as const, label: "DIP MANICURES" },
    { type: "acrylic-nail" as const, label: "ACRYLIC NAIL" },
    { type: "uv-gel-nail" as const, label: "UV GEL NAIL" },
    { type: "uv-gel-permanent-french" as const, label: "UV GEL PERMANENT FRENCH" },
    { type: "kid-services" as const, label: "KID SERVICES" },
    { type: "additional-services" as const, label: "ADDITIONAL SERVICES" },
    { type: "waxing" as const, label: "WAXING" },
    { type: "spa-pedicure" as const, label: "SPA PEDICURE" },
  ];
}

function getMenuItemDisplayName(item: MenuItem) {
  return item.name;
}

function matchesMenuItemSearch(
  item: MenuItem,
  searchText: string,
) {
  const normalizedSearch = searchText.trim().toLowerCase();
  const displayName = getMenuItemDisplayName(item).toLowerCase();

  return displayName.includes(normalizedSearch);
}

function menuTypeLabel(type: StoredMenuType, t: (typeof text)["zh"]) {
  const normalizedType = normalizeMenuType(type);
  return getMenuCategories(t).find((category) => category.type === normalizedType)
    ?.label ?? normalizedType;
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
