"use client";

import { BaseCard } from "@/components/baseCard";
import { Logout } from "../../auth/utils/logout";
import { Wallets } from "./walllets";
import { Balance } from "./balance";
import { Dominance } from "./dominance";
import { MonthlyDominance } from "./monthlyDominance";
import { AccountBalance } from "./accountBalance";
import { User } from "./user";

export default function Home() {
  return (
    <div className="sm:grid grid-cols-[70%_30%] divide-x-2">
      <div className="flex justify-center py-2">
        <div className="w-[80%] mb-3">
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
          <div className="font-semibold mt-4 mb-2">Dominance</div>
          <BaseCard>
            <Dominance />
          </BaseCard>
          <div className="font-semibold mt-4 mb-2">Monthly Dominance</div>
          <BaseCard>
            <MonthlyDominance />
          </BaseCard>
          <div className="font-semibold mt-4 mb-2">Account Balance</div>
          <BaseCard>
            <AccountBalance />
          </BaseCard>
        </div>
      </div>
      <div className="px-3">
        <div className="grid grid-rows-3 divide-x-2">
          <User />
        </div>
      </div>
    </div>
  );
}
