"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Hook to animate a number from start to end value
 *
 * @param endValue - Target value to animate to
 * @param duration - Animation duration in milliseconds (default: 1000)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Current animated value
 *
 * @example
 * ```tsx
 * const animatedValue = useAnimatedNumber(1000, 500);
 * // Returns: 0 -> 200 -> 400 -> 600 -> 800 -> 1000
 * ```
 */
export function useAnimatedNumber(
  endValue: number,
  duration: number = 1000,
  decimals: number = 0,
): number {
  const [currentValue, setCurrentValue] = useState(endValue);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(endValue);
  const previousEndValueRef = useRef(endValue);

  useEffect(() => {
    // If endValue changed, start new animation from current value
    if (endValue !== previousEndValueRef.current) {
      startValueRef.current = currentValue;
      previousEndValueRef.current = endValue;
      startTimeRef.current = null;
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const newValue =
        startValueRef.current +
        (endValue - startValueRef.current) * easedProgress;

      setCurrentValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
      }
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);

  // Round to specified decimals
  if (decimals === 0) {
    return Math.round(currentValue);
  }
  return Math.round(currentValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Hook to animate a percentage value
 *
 * @param endPercentage - Target percentage (0-100)
 * @param duration - Animation duration in milliseconds (default: 1000)
 * @returns Current animated percentage
 */
export function useAnimatedPercentage(
  endPercentage: number,
  duration: number = 1000,
): number {
  return useAnimatedNumber(endPercentage, duration, 1);
}
