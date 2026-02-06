"use client";
import ActiveLink from "@/components/ActiveLink";
import { logout } from "../auth/utils/logout";
import { routes, ButtonType, resources, ModalType } from "../constants";
import { AuthCheck } from "../auth/utils/AuthCheck";
import { store } from "@/redux/store";
import { useState, useMemo, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import NextImage from "next/image";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import { CurrencyConversionProgress } from "@/components/CurrencyConversionProgress";
// import { ConnectionStatus } from "@/components/trust/ConnectionStatus";
import { BottomNav, createNavItems } from "@/components/navigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { ZIndex } from "@/lib/utils/z-index";
import { BaseModal } from "@/components/modals/BaseModal";
import { AddTransactionForm } from "@/components/modals/forms/AddTransactionForm";
import { TransferMoneyForm } from "@/components/modals/forms/TransferMoneyForm";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const path = usePathname();
  const [user, setUser] = useState(store.getState().setAuthReducer);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);

  store.subscribe(() => {
    if (!user.picture) {
      setUser(store.getState().setAuthReducer);
    }
  });

  // Global search keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const pathname = useMemo(() => {
    const lastWord = path.split("/").filter(Boolean).pop();
    const formattedWord = lastWord
      ? lastWord.charAt(0).toUpperCase() + lastWord.slice(1)
      : "";
    return formattedWord;
  }, [path]);

  const navigationItems = useMemo(() => {
    return (
      <div className="flex flex-col gap-1 px-3">
        <ActiveLink
          href={routes.home}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors touch-target"
        >
          <svg
            className="w-5 h-5"
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
          <span className="font-medium">Home</span>
        </ActiveLink>
        <ActiveLink
          href={routes.transaction}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors touch-target"
        >
          <svg
            className="w-5 h-5"
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
          <span className="font-medium">Transactions</span>
        </ActiveLink>
        <ActiveLink
          href={routes.wallets}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors touch-target"
        >
          <svg
            className="w-5 h-5"
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
          <span className="font-medium">Wallets</span>
        </ActiveLink>
        <ActiveLink
          href={routes.portfolio}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors touch-target"
        >
          <svg
            className="w-5 h-5"
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
          <span className="font-medium">Portfolio</span>
        </ActiveLink>
        <ActiveLink
          href={routes.report}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors touch-target"
        >
          <svg
            className="w-5 h-5"
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
          <span className="font-medium">Reports</span>
        </ActiveLink>
        <ActiveLink
          href={routes.budget}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors touch-target"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span className="font-medium">Budget</span>
        </ActiveLink>

        <div className="my-2 border-t border-white/20" />

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 transition-colors touch-target w-full text-left"
          aria-label="Logout"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    );
  }, [path]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <AuthCheck>
      <CurrencyProvider>
        {/* Currency conversion progress banner */}
        <CurrencyConversionProgress />

        <div className="h-screen bg-neutral-50 dark:bg-dark-background flex flex-col sm:flex-row overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="hidden sm:flex sm:w-64 lg:w-72 flex-col bg-gradient-to-b from-primary-600 to-primary-700 dark:from-dark-surface dark:to-dark-surface min-h-screen fixed left-0 top-0 z-sidebar">
            {/* Logo */}
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-primary-600"
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
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">
                    WealthJourney
                  </h1>
                  <p className="text-primary-200 text-xs">
                    Financial Management
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav
              className="flex-1 overflow-y-auto px-3"
              aria-label="Main navigation"
            >
              {navigationItems}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/20">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {user.picture ? (
                    <NextImage
                      src={user.picture}
                      alt={user.fullname || "User"}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {user.fullname || "User"}
                  </p>
                  <p className="text-primary-200 text-xs truncate">
                    {user.email || "user@example.com"}
                  </p>
                </div>
              </div>
              <div className="mt-3 px-3 space-y-2">
                <CurrencySelector />
                {/* <ConnectionStatus /> */}
              </div>
            </div>
          </aside>

          {/* Mobile Header */}
          <header className="sm:hidden shrink-0 sticky top-0 z-sticky bg-white dark:bg-dark-surface border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surface-hover transition-colors touch-target"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg
                  className="w-6 h-6 text-neutral-700 dark:text-dark-text"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
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
                </div>
                <span className="font-bold text-neutral-900 dark:text-dark-text">
                  WealthJourney
                </span>
              </div>

              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-dark-surface-hover flex items-center justify-center overflow-hidden">
                {user.picture ? (
                  <NextImage
                    src={user.picture}
                    alt={user.fullname || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <svg
                    className="w-6 h-6 text-neutral-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-[45] sm:hidden"
                  onClick={toggleMobileMenu}
                  aria-hidden="true"
                  style={{ zIndex: ZIndex.modalBackdrop }}
                />
                <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-gradient-to-b from-primary-600 to-primary-700 dark:from-dark-surface dark:to-dark-surface z-modal sm:hidden overflow-y-auto animate-slide-in-right">
                  {/* Close Button */}
                  <div className="flex items-center justify-between p-4 border-b border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-primary-600"
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
                      </div>
                      <span className="text-white font-bold text-lg">
                        WealthJourney
                      </span>
                    </div>
                    <button
                      onClick={toggleMobileMenu}
                      className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors touch-target"
                      aria-label="Close menu"
                    >
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Navigation Items */}
                  <nav className="p-4" aria-label="Mobile navigation">
                    {navigationItems}
                  </nav>

                  {/* User Info */}
                  <div className="p-4 border-t border-white/20">
                    <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                        {user.picture ? (
                          <NextImage
                            src={user.picture}
                            alt={user.fullname || "User"}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">
                          {user.fullname || "User"}
                        </p>
                        <p className="text-primary-200 text-xs truncate">
                          {user.email || "user@example.com"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <CurrencySelector />
                    </div>
                  </div>
                </div>
              </>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 sm:ml-64 lg:ml-72 overflow-y-auto">
            <div className="h-full p-4 sm:p-6 lg:p-8 pb-14 sm:pb-8 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav navItems={createNavItems(routes)} />

        {/* Global Search - Keyboard Shortcut: Cmd/Ctrl + K */}
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        {/* Floating Action Button */}
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
                setModalType(ModalType.ADD_TRANSACTION);
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
                setModalType(ModalType.TRANSFER_MONEY);
              },
            },
          ]}
        />

        {/* Global Modals */}
        <BaseModal
          isOpen={modalType !== null}
          onClose={() => setModalType(null)}
          title={modalType || ""}
        >
          {modalType === ModalType.ADD_TRANSACTION && (
            <AddTransactionForm
              onSuccess={() => {
                setModalType(null);
                // Refresh data if needed
              }}
            />
          )}
          {modalType === ModalType.TRANSFER_MONEY && (
            <TransferMoneyForm
              onSuccess={() => {
                setModalType(null);
                // Refresh data if needed
              }}
            />
          )}
        </BaseModal>
      </CurrencyProvider>
    </AuthCheck>
  );
}
