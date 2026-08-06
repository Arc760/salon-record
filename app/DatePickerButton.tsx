"use client";

import { useState } from "react";
import { AppModal } from "./AppModal";

type DatePickerButtonProps = {
  id: string;
  label: string;
  value: string;
  closeLabel: string;
  selectLabel: string;
  isEnglish: boolean;
  onChange: (value: string) => void;
};

export function DatePickerButton({
  id,
  label,
  value,
  closeLabel,
  selectLabel,
  isEnglish,
  onChange,
}: DatePickerButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7));

  return (
    <div>
      <p id={id} className="mb-2 text-sm font-semibold text-gray-800">
        {label}
      </p>
      <button
        type="button"
        aria-labelledby={id}
        onClick={() => {
          setMonth(value.slice(0, 7));
          setShowPicker(true);
        }}
        className="flex min-h-12 w-full min-w-0 max-w-full items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 text-left text-base font-semibold text-gray-900"
      >
        <span className="min-w-0 break-words">{value}</span>
        <span className="shrink-0 text-sm text-gray-500">v</span>
      </button>

      {showPicker && (
        <AppModal onClose={() => setShowPicker(false)} contentClassName="flex flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectLabel}</h2>
              <p className="mt-1 text-sm text-gray-500">{value}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="shrink-0 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
            >
              {closeLabel}
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMonth(shiftMonth(month, -1))}
                className="min-h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              >
                {"<"}
              </button>
              <p className="text-base font-bold text-gray-900">
                {formatMonthLabel(month, isEnglish)}
              </p>
              <button
                type="button"
                onClick={() => setMonth(shiftMonth(month, 1))}
                className="min-h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              >
                {">"}
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {(isEnglish
                ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                : ["日", "一", "二", "三", "四", "五", "六"]
              ).map((weekday) => (
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
                    onClick={() => {
                      onChange(cell);
                      setShowPicker(false);
                    }}
                    className={`min-h-11 rounded-xl text-sm font-semibold ${
                      cell === value
                        ? "bg-gray-900 text-white"
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
          </div>
        </AppModal>
      )}
    </div>
  );
}

function buildCalendarCells(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDate = new Date(year, month - 1, 1, 12);
  const daysInMonth = new Date(year, month, 0).getDate();
  const blanks = firstDate.getDay();

  return [
    ...Array.from({ length: blanks }, () => ""),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      formatDateKey(new Date(year, month - 1, index + 1, 12)),
    ),
  ];
}

function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1, 12);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string, isEnglish: boolean) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat(isEnglish ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, 1, 12));
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
