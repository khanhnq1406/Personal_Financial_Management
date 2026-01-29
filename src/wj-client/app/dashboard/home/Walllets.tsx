import { resources } from "@/app/constants";
import Image from "next/image";
import { UseQueryResult } from "@tanstack/react-query";
import { memo, useMemo } from "react";
import { ListWalletsResponse } from "@/gen/protobuf/v1/wallet";
import { ErrorType } from "@/utils/generated/hooks.types";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { WalletListSkeleton } from "@/components/loading/Skeleton";

type WalletsProps = {
  getListWallets: UseQueryResult<ListWalletsResponse, ErrorType>;
};

// Memoized wallet item component
const WalletItem = memo(function WalletItem({
  walletName,
  balance,
  currency,
}: {
  walletName: string;
  balance: number;
  currency: string;
}) {
  return (
    <div className="flex flex-nowrap justify-between m-3">
      <div className="flex flex-nowrap gap-3">
        <Image
          width={25}
          height={25}
          alt="wallet-icon"
          src={`${resources}wallet.png`}
        />
        <div className="font-semibold">{walletName}</div>
      </div>
      <div className="font-semibold">{formatCurrency(balance, currency)}</div>
    </div>
  );
});

// Memoized empty state
const EmptyWalletsState = memo(function EmptyWalletsState() {
  return (
    <div className="flex items-center justify-center py-8 text-gray-400">
      No wallets found. Create your first wallet to get started.
    </div>
  );
});

const Wallets: React.FC<WalletsProps> = memo(function Wallets({
  getListWallets,
}) {
  const { isLoading, data } = getListWallets;
  const { currency } = useCurrency();

  // Memoize wallet list rendering
  const walletList = useMemo(() => {
    if (!data?.wallets || data.wallets.length === 0) {
      return <EmptyWalletsState />;
    }

    return data.wallets.map((wallet) => (
      <WalletItem
        key={wallet.id}
        walletName={wallet.walletName}
        balance={wallet.displayBalance?.amount ?? 0}
        currency={currency}
      />
    ));
  }, [data, currency]);

  if (isLoading) {
    return <WalletListSkeleton />;
  }

  return <div className="px-2 py-1">{walletList}</div>;
});

export { Wallets };
