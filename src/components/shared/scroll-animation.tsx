"use client";

import { useState, useCallback } from "react";

export interface ScrollAnimationProps {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useScrollAnimation({
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
  once = true,
}: ScrollAnimationProps = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (hasTriggered && once) return;
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              setHasTriggered(true);
              observer.disconnect();
            }
          } else if (!once) {
            setIsVisible(false);
          }
        },
        { threshold, rootMargin }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, [threshold, rootMargin, once, hasTriggered]);

  return { ref, isVisible };
}

export function ScrollReveal({
  children,
  className,
  threshold,
  rootMargin,
  once,
  delay,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold, rootMargin, once });

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-700 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${delay ? `transition-delay-${delay}` : ""}
        ${className ?? ""}
      `}
      style={style}
    >
      {children}
    </div>
  );
}
