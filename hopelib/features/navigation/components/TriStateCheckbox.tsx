"use client";

import React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TriStateCheckboxProps {
  state: "checked" | "unchecked" | "indeterminate";
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
}

export function TriStateCheckbox({
  state,
  disabled = false,
  onToggle,
  className,
}: TriStateCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "indeterminate" ? "mixed" : state === "checked"}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 shrink-0",
        "focus:outline-hidden focus:ring-2 focus:ring-[#F5B82E]/50",
        disabled && "opacity-50 cursor-not-allowed",
        state === "checked" && "bg-[#F5B82E] text-stone-900 shadow-xs",
        state === "indeterminate" &&
          "bg-amber-100 border-2 border-[#F5B82E] text-stone-900 font-bold",
        state === "unchecked" &&
          "bg-white border-2 border-stone-300 hover:border-stone-400",
        className
      )}
    >
      {state === "checked" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      {state === "indeterminate" && <Minus className="w-3.5 h-3.5 stroke-[3]" />}
    </button>
  );
}
