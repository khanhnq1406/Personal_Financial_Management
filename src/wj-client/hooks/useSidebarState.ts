"use client";

import { useState, useEffect, useCallback } from "react";

const SIDEBAR_STORAGE_KEY = "wj-sidebar-expanded";

/**
 * Custom hook to manage sidebar expanded/collapsed state
 * Persists state to localStorage for user preference
 */
export function useSidebarState() {
  // Initialize from localStorage, default to expanded
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isExpanded));
  }, [isExpanded]);

  // Toggle function with useCallback for stable reference
  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Explicit setters
  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
  };
}
