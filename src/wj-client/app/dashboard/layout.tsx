"use client";
import ActiveLink from "@/components/activeLink";
import { logout } from "../auth/utils/logout";
import { routes, ButtonType, resources } from "../constants";
import { AuthCheck } from "../auth/utils/authCheck";
import { ButtonGroup } from "@/components/buttonGroup";
import { BaseModal } from "@/components/modals/baseModal";
import { store } from "@/redux/store";
import { useState, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const path = usePathname();
  const [modal, setModal] = useState(store.getState().setModalReducer);
  const [user, setUser] = useState(store.getState().setAuthReducer);
  const menuRef = useRef<HTMLDivElement>(null);

  store.subscribe(() => {
    setModal(store.getState().setModalReducer);
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
      <div className="flex flex-wrap gap-3 mx-4">
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
        <button
          className="text-fg w-full flex flex-nowrap gap-2 items-center font-medium p-2 rounded-md hover:shadow-md hover:bg-[rgba(255,255,255,0.35)]"
          onClick={logout}
        >
          <img className="w-[20px] h-[20px]" src="/logout(white).png" />
          <div>Logout</div>
        </button>
      </div>
    );
  }, [path]);

  const handleExtend = () => {
    if (!menuRef.current) return;
    menuRef.current.classList.toggle("opacity-0");
    menuRef.current.classList.toggle("scale-95");
    menuRef.current.classList.toggle("pointer-events-none");
    if (menuRef.current.classList.contains("h-0")) {
      menuRef.current.style.height = menuRef.current.scrollHeight + "px"; // Expand
    } else {
      menuRef.current.style.height = "0px"; // Collapse
    }
    menuRef.current.classList.toggle("h-0");
  };
  return (
    <AuthCheck>
      <div className="bg-bg min-h-full sm:p-3">
        <div className="block sm:grid grid-cols-[250px_auto] min-h-full">
          <div className="sm:hidden bg-bg flex justify-between p-3">
            <div className="flex items-center">
              <Button
                type={ButtonType.IMG}
                src={`${resources}/menu.png`}
                onClick={handleExtend}
              />
            </div>
            <div className="text-fg font-semibold text-lg">{pathname}</div>
            <div>
              <img
                src={
                  user.picture !== null ? user.picture : `${resources}/user.png`
                }
                alt=""
                className="rounded-full h-9"
              />
            </div>
          </div>
          <div
            className="sm:hidden overflow-hidden opacity-0 scale-95 transform transition-all duration-300 ease-out pointer-events-none h-0"
            ref={menuRef}
          >
            <div className="pb-3">{navigationItems}</div>
          </div>
          <div className="hidden sm:flex flex-wrap justify-center h-fit">
            <div className="flex h-fit items-center gap-2 my-8">
              <img alt="logo" src="/logo.png" className="w-[50px] h-[50px]" />
              <div className="text-fg font-bold h-fit text-lg">
                Wealth Journey
              </div>
            </div>
            {navigationItems}
          </div>
          <div className="bg-fg sm:rounded-md">{children}</div>
        </div>
      </div>
      <ButtonGroup />
      {modal.isOpen && <BaseModal modal={modal} />}
    </AuthCheck>
  );
}
