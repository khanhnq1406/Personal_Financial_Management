import { resources } from "@/app/constants";
import Image from "next/image";
import { UseQueryResult } from "@tanstack/react-query";
import { ListWalletsResponse } from "@/gen/protobuf/v1/wallet";
import { ErrorType } from "@/utils/generated/hooks.types";

type WalletsProps = {
  getListWallets: UseQueryResult<ListWalletsResponse, ErrorType>;
};
const Wallets: React.FC<WalletsProps> = (props) => {
  const { getListWallets } = props;
  const { isLoading, data } = getListWallets;
  if (isLoading) {
    return <div className="px-2 py-1">Loading...</div>;
  }

  return (
    <div className="px-2 py-1">
      {data?.wallets && data.wallets.length > 0 ? (
        data.wallets.map((wallet) => {
          const balanceAmount = wallet.balance?.amount ?? 0;
          const balance = balanceAmount > 0 ? Number(balanceAmount) / 100 : 0;
          const currency = wallet.balance?.currency || "USD";

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
                {currency === "USD" ? "$" : ""}
                {balance.toFixed(2)}
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
};

export { Wallets };
