"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_CONFIG: Record<string, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
};

export function StarRatingInput({
  value,
  onChange,
  className,
  disabled = false,
  readonly = false,
  size = "md",
}: StarRatingInputProps) {
  const handleClick = (newValue: number) => {
    if (disabled || readonly) return;
    onChange(newValue);
  };

  const handleMouseEnter = (newValue: number) => {
    if (disabled || readonly) return;
    onChange(newValue);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 flex-row-reverse",
        className
      )}
      dir="rtl"
    >
      {[5, 4, 3, 2, 1].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={() => onChange(value)}
          disabled={disabled || readonly}
          className={cn(
            "p-0 text-yellow-300 hover:text-yellow-400 transition-colors",
            star <= value ? "text-yellow-400" : "text-yellow-300/50"
          )}
          aria-label={`Rate ${star} stars`}
        >
          <Star className={SIZE_CONFIG[size]} aria-hidden />
        </button>
      ))}
    </div>
  );
}
