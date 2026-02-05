"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { memo } from "react";
import { ZIndex } from "@/lib/utils/z-index";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  ariaLabel: string;
}

interface BottomNavProps {
  navItems: NavItem[];
  className?: string;
}

/**
 * Mobile-optimized bottom navigation bar.
 * Features:
 * - Fixed position at bottom on mobile (< 640px)
 * - Hidden on desktop (sm breakpoint)
 * - Touch-friendly 44px min-height targets
 * - Smooth transitions and active state indicators
 * - Safe area padding for devices with home indicators
 */
export const BottomNav = memo(function BottomNav({
  navItems,
  className,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (
    e: React.MouseEvent,
    href: string
  ) => {
    // Allow Cmd/Ctrl+click and middle-click to open in new tab
    if (e.metaKey || e.ctrlKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    router.push(href);
  };

  return (
    <nav
      className={cn(
        "sm:hidden fixed bottom-0 left-0 right-0",
        "bg-white border-t border-neutral-200",
        "pb-safe pt-1",
        "shadow-[0_-2px_10px_rgba(0,0,0,0.05)]",
        className
      )}
      style={{ zIndex: ZIndex.sidebar }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={cn(
                "flex flex-col items-center justify-center",
                "min-h-[48px] w-full max-w-[20%]", // 20% width for 5 items
                "transition-all duration-200 ease-out",
                "text-neutral-600",
                isActive
                  ? "text-primary-600"
                  : "hover:text-neutral-800 active:text-primary-700",
                isActive && "font-medium"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.ariaLabel}
            >
              <div className="relative">
                {/* Icon with active indicator */}
                <div
                  className={cn(
                    "flex items-center justify-center",
                    "w-6 h-6 sm:w-7 sm:h-7",
                    "transition-transform duration-200",
                    isActive ? "scale-110" : "scale-100"
                  )}
                >
                  {item.icon}
                </div>
                {/* Active dot indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <div className="w-1 h-1 rounded-full bg-primary-600" />
                  </div>
                )}
              </div>
              {/* Label text */}
              <span
                className={cn(
                  "text-[10px] sm:text-xs mt-1",
                  "truncate max-w-full",
                  isActive ? "font-medium" : "font-normal"
                )}
              >
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
});

/**
 * Helper function to create navigation items from routes
 * Use this to easily generate nav items with proper icons
 */
export const createNavItems = (
  routes: Record<string, string>
): NavItem[] => {
  return [
    {
      href: routes.home,
      label: "Home",
      ariaLabel: "Go to home dashboard",
      icon: (
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: routes.transaction,
      label: "Transactions",
      ariaLabel: "Go to transactions",
      icon: (
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      href: routes.wallets,
      label: "Wallets",
      ariaLabel: "Go to wallets",
      icon: (
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      href: routes.portfolio,
      label: "Portfolio",
      ariaLabel: "Go to investment portfolio",
      icon: (
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
    {
      href: routes.report,
      label: "Reports",
      ariaLabel: "Go to reports",
      icon: (
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];
};
