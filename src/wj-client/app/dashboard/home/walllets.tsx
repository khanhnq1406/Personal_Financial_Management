import { BACKEND_URL, resources } from "@/app/constants";
import Image from "next/image";
import { memo } from "react";
import { useGet } from "@/hooks";
import type { ListWalletsResponseData, Wallet } from "@/types/api";
import { currencyFormatter } from "@/utils/currencyFormatter";
export const Wallets = memo(function Wallets() {
  const { data } = useGet<ListWalletsResponseData>(`${BACKEND_URL}/wallets`);

  return (
    <div className="px-2 py-1">
      {data?.wallets && data?.wallets.length > 0 ? (
        data?.wallets?.map((wallet: Wallet) => {
          return (
            <div
              className="flex flex-nowrap justify-between m-3"
              key={wallet.id}
            >
              <div className="flex flex-nowrap gap-3">
                <Image
                  width={25}
                  height={25}
                  alt="wallet-icon"
                  src={`${resources}wallet.png`}
                />
                <div className="font-semibold">{wallet.walletName}</div>
              </div>
              <div className="font-semibold">
                {currencyFormatter.format(wallet.balance)}
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex items-center justify-center py-8 text-gray-400">
          No wallets found. Create your first wallet to get started.
        </div>
      )}
    </div>
  );
});
