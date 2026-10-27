"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  rating: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const SIZE_CONFIG: Record<string, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

export function StarRating({
  rating = 0,
  className,
  size = "md",
  showText = false,
}: StarRatingProps) {
  // Coerce to a number: MySQL DECIMAL columns (e.g. ROUND(AVG(rating),2))
  // are returned as strings by mysql2 unless decimalNumbers: true is set.
  const ratingValue = Number(rating) || 0;
  const fullStars = Math.floor(ratingValue);
  const hasHalfStar = ratingValue % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label={`Rating ${ratingValue} out of 5`}
    >
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={i}
          className={cn(SIZE_CONFIG[size], "text-yellow-400 fill-yellow-400")}
          aria-hidden
        />
      ))}
      {hasHalfStar && (
        <Star
          className={cn(
            SIZE_CONFIG[size],
            "text-yellow-400/50 fill-yellow-400/50"
          )}
          aria-hidden
        />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={i}
          className={cn(SIZE_CONFIG[size], "text-muted-foreground")}
          aria-hidden
        />
      ))}
      {showText && (
        <span className="ml-1 text-xs text-muted-foreground">
          {ratingValue.toFixed(1)} / 5
        </span>
      )}
    </div>
  );
}
