"use client";
import ActiveLink from "@/components/activeLink";
import { Logout } from "../auth/utils/logout";
import { routes } from "../constants";
import { AuthCheck } from "../auth/utils/authCheck";
import { ButtonGroup } from "@/components/buttonGroup";
import { BaseModal } from "@/components/modals/baseModal";
import { store } from "@/redux/store";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [modal, setModal] = useState(store.getState().setModalReducer);
  store.subscribe(() => {
    setModal(store.getState().setModalReducer);
  });
  return (
    <AuthCheck>
      <div className="bg-bg min-h-full p-3">
        <div className="block sm:grid grid-cols-[250px_auto] min-h-full">
          <div className="hidden sm:flex flex-wrap justify-center h-fit">
            <div className="flex h-fit items-center gap-2 my-8">
              <img alt="logo" src="/logo.png" className="w-[50px] h-[50px]" />
              <div className="text-fg font-bold h-fit text-lg">
                Wealth Journey
              </div>
            </div>
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
                onClick={Logout}
              >
                <img className="w-[20px] h-[20px]" src="/logout(white).png" />
                <div>Logout</div>
              </button>
            </div>
          </div>
          <div className="bg-fg rounded-md">{children}</div>
        </div>
      </div>
      <ButtonGroup />
      {modal.isOpen && <BaseModal modal={modal} />}
    </AuthCheck>
  );
}
