import React from "react";
import { ChevronDown } from "lucide-react";

export function AccordionCard({
  title,
  isOpen,
  onToggle,
  icon,
  children,
  isCollapsible = true,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: string;
  children: React.ReactNode;
  isCollapsible?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E8E4DE] bg-white dark:border-[#2C313C] dark:bg-[#1F232D] overflow-hidden shadow-sm transition-all duration-300">
      <button
        type="button"
        disabled={!isCollapsible}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1F232D] text-left hover:bg-neutral-50/50 dark:hover:bg-[#1F232D]/90 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px]">{icon}</span>
          <span className="text-[13px] font-bold text-[#1A1A1A] dark:text-white tracking-wide">{title}</span>
        </div>
        {isCollapsible && (
          <ChevronDown
            className={`h-4 w-4 text-[#666] dark:text-[#A1A8B5] transition-transform duration-300 ${
              isOpen ? "rotate-180 text-[#1A1A1A] dark:text-white" : ""
            }`}
          />
        )}
      </button>

      {/* Accordion inner expansion body */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 h-0 overflow-hidden"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 border-t border-[#E8E4DE] bg-[#FAF9F7]/60 dark:border-[#2C313C] dark:bg-[#1F232D]/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#666]/75 dark:text-[#A1A8B5]/75">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
  compact,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
  compact?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          className={`block font-bold uppercase tracking-wider text-[#666]/75 dark:text-[#A1A8B5]/75 ${
            compact ? "text-[9.5px]" : "text-[10px]"
          }`}
        >
          {label}
        </label>
        <span className="text-[11px] text-[#1A1A1A] dark:text-white font-mono">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <div className="relative">
        <div className="h-1 w-full rounded-full bg-[#E8E4DE] dark:bg-[#2C313C]" />
        <div
          className="absolute left-0 top-0 h-1 rounded-full bg-[#FF6B2C]"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF6B2C] bg-white shadow-md cursor-pointer"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#666]/75 dark:text-[#A1A8B5]/75">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-[#E8E4DE] bg-[#F9F8F5] px-2.5 py-1.5 transition hover:border-[#FF6B2C]/40 dark:border-[#2C313C] dark:bg-[#181B22]">
        <label className="relative flex-shrink-0">
          <div
            className="h-5 w-5 cursor-pointer rounded border border-black/10 dark:border-white/10"
            style={{ background: value }}
          />
          <input
            type="color"
            aria-label={`${label} color picker`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          aria-label={`${label} hex value`}
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-[11.5px] text-[#1A1A1A] dark:text-white outline-none"
        />
      </div>
    </div>
  );
}

export function ToggleRow({
  icon,
  label,
  checked,
  onChange,
  last,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between px-3.5 py-3.5 cursor-pointer select-none min-h-[44px] hover:bg-neutral-50 dark:hover:bg-[#1F232D]/40 transition ${
        last ? "" : "border-b border-[#E8E4DE] dark:border-[#2C313C]"
      }`}
    >
      <span className="flex items-center gap-2.5 text-[12.5px] font-semibold text-[#666] dark:text-[#A1A8B5]">
        <span className="flex h-5 min-w-[20px] items-center justify-center text-[12px] font-bold text-[#1A1A1A] dark:text-white/90 bg-[#F9F8F5] dark:bg-[#2C313C] rounded">
          {icon}
        </span>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative h-[22px] w-[38px] flex-shrink-0 rounded-full transition duration-200 cursor-pointer ${
          checked ? "bg-[#FF6B2C]" : "bg-[#E8E4DE] dark:bg-[#2C313C]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
