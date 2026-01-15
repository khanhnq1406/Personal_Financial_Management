import { resources } from "@/app/constants";
import Image from "next/image";
import { UseQueryResult } from "@tanstack/react-query";
import { ListWalletsResponse } from "@/gen/protobuf/v1/wallet";
import { ErrorType } from "@/utils/generated/hooks.types";
import { currencyFormatter } from "@/utils/currencyFormatter";
import { WalletListSkeleton } from "@/components/loading/Skeleton";

type WalletsProps = {
  getListWallets: UseQueryResult<ListWalletsResponse, ErrorType>;
};
const Wallets: React.FC<WalletsProps> = (props) => {
  const { getListWallets } = props;
  const { isLoading, data } = getListWallets;
  if (isLoading) {
    return <WalletListSkeleton />;
  }

  return (
    <div className="px-2 py-1">
      {data?.wallets && data.wallets.length > 0 ? (
        data.wallets.map((wallet) => {
          const balanceAmount = wallet.balance?.amount ?? 0;

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
                {currencyFormatter.format(balanceAmount)}
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
