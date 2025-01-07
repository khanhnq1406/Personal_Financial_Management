"use client";

import { BaseCard } from "@/components/baseCard";
import { Logout } from "../../auth/utils/logout";
import { Wallets } from "./walllets";
import { Balance } from "./balance";

export default function Home() {
  return (
    <div className="grid grid-cols-[70%_30%] divide-x-2 h-full">
      <div className="flex justify-center py-2">
        <div className="w-[80%]">
          <div className="font-semibold my-2">My Wallets</div>
          <BaseCard>
            <Wallets />
          </BaseCard>
          <div className="font-semibold mt-4 mb-2">
            Total balance fluctuation
          </div>
          <BaseCard>
            <Balance />
          </BaseCard>
        </div>
      </div>
      <div className="px-3">
        <div></div>
      </div>
    </div>
  );
}
