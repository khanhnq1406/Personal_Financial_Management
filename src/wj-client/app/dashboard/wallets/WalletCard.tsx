import { memo } from "react";
import Image from "next/image";
import { BaseCard } from "@/components/BaseCard";
import { Button } from "@/components/Button";
import { ButtonType, resources } from "@/app/constants";
import { formatCurrency } from "@/utils/currency-formatter";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import { useCurrency } from "@/contexts/CurrencyContext";

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}

export const WalletCard = memo(function WalletCard({
  wallet,
  onEdit,
  onDelete,
}: WalletCardProps) {
  const { currency } = useCurrency();

  // Use displayBalance if available (converted), otherwise use original balance
  const balance = wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0;
  const displayCurrency = wallet.displayCurrency || currency;

  return (
    <BaseCard className="p-4">
      <div className="flex flex-col gap-3">
        {/* Header with wallet icon, name and actions */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Image
              src={`${resources}wallet.png`}
              alt="Wallet"
              width={32}
              height={32}
            />
            <h3 className="text-lg font-semibold">{wallet.walletName}</h3>
          </div>
          <div className="flex gap-2">
            <Button
              type={ButtonType.IMG}
              src={`${resources}/editing.png`}
              onClick={() => onEdit(wallet)}
            />
            <Button
              type={ButtonType.IMG}
              src={`${resources}/remove.png`}
              onClick={() => onDelete(wallet)}
            />
          </div>
        </div>

        {/* Balance display */}
        <div className="text-right">
          <div className="text-sm text-gray-500">Balance</div>
          <div className="text-2xl font-bold text-bg">
            {formatCurrency(balance, displayCurrency)}
          </div>
        </div>
      </div>
    </BaseCard>
  );
});
