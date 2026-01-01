import { resources } from "@/app/constants";
import Image from "next/image";
import { memo } from "react";
import { useQueryListWallets } from "@/utils/generated/hooks";

export const Wallets = memo(function Wallets() {
  const { data, isLoading } = useQueryListWallets(
    { pagination: { page: 1, pageSize: 10, orderBy: "", order: "" } }
  );

  if (isLoading) {
    return <div className="px-2 py-1">Loading...</div>;
  }

  return (
    <div className="px-2 py-1">
      {data?.wallets && data.wallets.length > 0 ? (
        data.wallets.map((wallet) => {
          const balance = wallet.balance
            ? Number(wallet.balance.amount) / 100
            : 0;
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
                ${balance.toFixed(2)}
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
