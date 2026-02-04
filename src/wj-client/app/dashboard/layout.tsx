"use client";
import ActiveLink from "@/components/ActiveLink";
import { logout } from "../auth/utils/logout";
import { routes, ButtonType, resources } from "../constants";
import { AuthCheck } from "../auth/utils/AuthCheck";
import { store } from "@/redux/store";
import { useState, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import NextImage from "next/image";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import { CurrencyConversionProgress } from "@/components/CurrencyConversionProgress";
import { ConnectionStatus } from "@/components/trust/ConnectionStatus";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const path = usePathname();
  const [user, setUser] = useState(store.getState().setAuthReducer);
  const menuRef = useRef<HTMLDivElement>(null);

  store.subscribe(() => {
    if (!user.picture) {
      setUser(store.getState().setAuthReducer);
    }
  });

  const pathname = useMemo(() => {
    const lastWord = path.split("/").filter(Boolean).pop();
    const formattedWord = lastWord
      ? lastWord.charAt(0).toUpperCase() + lastWord.slice(1)
      : "";
    return formattedWord;
  }, [path]);

  const navigationItems = useMemo(() => {
    return (
      <div className="flex flex-col gap-2 mx-4">
        <ActiveLink href={routes.home}>
          <img className="w-[20px] h-[20px]" src="/home.png" />
          <div>Home</div>
        </ActiveLink>
        <ActiveLink href={routes.transaction}>
          <img className="w-[20px] h-[20px]" src="/transaction.png" />
          <div>Transaction</div>
        </ActiveLink>
        <ActiveLink href={routes.report}>
          <img className="w-[20px] h-[20px]" src="/report.png" />
          <div>Report</div>
        </ActiveLink>
        <ActiveLink href={routes.budget}>
          <img className="w-[20px] h-[20px]" src="/budget.png" />
          <div>Budget</div>
        </ActiveLink>
        <ActiveLink href={routes.wallets}>
          <img className="w-[20px] h-[20px]" src="/wallet-white.png" />
          <div>Wallets</div>
        </ActiveLink>
        <ActiveLink href={routes.portfolio}>
          <img className="w-[20px] h-[20px]" src="/portfolio.png" />
          <div>Portfolio</div>
        </ActiveLink>
        <button
          className="text-white w-full flex flex-nowrap gap-2 items-center font-medium p-2 rounded-md hover:shadow-md hover:bg-[rgba(255,255,255,0.35)]"
          onClick={logout}
          aria-label="Logout"
        >
          <img className="w-[20px] h-[20px]" src="/logout(white).png" alt="" />
          <div>Logout</div>
        </button>
      </div>
    );
  }, [path]);

  const handleExtend = () => {
    if (!menuRef.current) return;
    const menu = menuRef.current;
    const isExpanded = menu.style.height !== "0px" && menu.style.height !== "";

    if (isExpanded) {
      menu.style.height = "0px";
      menu.style.opacity = "0";
      menu.style.pointerEvents = "none";
    } else {
      menu.style.height = menu.scrollHeight + "px";
      menu.style.opacity = "1";
      menu.style.pointerEvents = "auto";
    }
  };
  return (
    <AuthCheck>
      <CurrencyProvider>
        {/* Currency conversion progress banner */}
        <CurrencyConversionProgress />

        <div className="bg-primary-600 h-screen sm:h-full sm:p-3 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:grid sm:grid-cols-[250px_auto] flex-1 min-h-0">
            {/* Mobile header */}
            <div className="sm:hidden bg-primary-600 flex justify-between items-center p-3 gap-3 flex-shrink-0">
              <div className="flex items-center">
                <Button
                  type={ButtonType.IMG}
                  src={`${resources}/menu.png`}
                  onClick={handleExtend}
                />
              </div>
              <div className="text-white font-semibold text-base sm:text-lg flex items-center">
                {pathname}
              </div>
              <div className="flex items-center gap-2">
                <CurrencySelector />
                <img
                  src={
                    user.picture !== null
                      ? user.picture
                      : `${resources}/user.png`
                  }
                  alt={user.fullname || "User avatar"}
                  className="rounded-full h-9 w-9"
                />
              </div>
            </div>
            {/* Mobile menu */}
            <div
              className="sm:hidden overflow-hidden transition-all duration-300 ease-out flex-shrink-0"
              ref={menuRef}
              style={{ height: "0px", opacity: "0", pointerEvents: "none" }}
            >
              <div className="pb-3">{navigationItems}</div>
            </div>
            {/* Desktop sidebar */}
            <div className="hidden sm:flex flex-col justify-between h-full">
              <div>
                <div className="flex h-fit items-center gap-2 my-8 justify-center">
                  <NextImage
                    alt="Wealth Journey logo"
                    src="/logo.png"
                    width={50}
                    height={50}
                  />
                  <div className="text-white font-bold h-fit text-lg">
                    Wealth Journey
                  </div>
                </div>
                {navigationItems}
              </div>
              <div className="px-4 pb-4 space-y-3">
                <CurrencySelector />
                <ConnectionStatus />
              </div>
            </div>
            {/* Main content area */}
            <div className="bg-neutral-50 sm:rounded-md flex-1 min-h-0 overflow-auto">
              {children}
            </div>
          </div>
        </div>
        <FloatingActionButton
          actions={[
            {
              label: "Add Transaction",
              icon: (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              ),
              onClick: () => {
                // Navigate to transaction page where modal can be opened
                window.location.href = "/dashboard/transaction";
              },
            },
            {
              label: "Transfer Money",
              icon: (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              ),
              onClick: () => {
                // Navigate to transaction page where transfer modal can be opened
                window.location.href = "/dashboard/transaction";
              },
            },
          ]}
        />
      </CurrencyProvider>
    </AuthCheck>
  );
}
