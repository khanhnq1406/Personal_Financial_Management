import { ButtonType, resources } from "@/app/constants";
import { BaseCard } from "@/components/BaseCard";
import { Button } from "@/components/Button";
import { TotalBalanceSkeleton } from "@/components/loading/Skeleton";
import { formatCurrency, getCurrencySymbol } from "@/utils/currency-formatter";
import { useQueryGetTotalBalance } from "@/utils/generated/hooks";
import { memo, useMemo, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

const displayImgList = [`${resources}/unhide.png`, `${resources}/hide.png`];
export const TotalBalance = memo(function TotalBalance() {
  const [isHide, setHide] = useState(false);
  const [displayImg, setDisplayImg] = useState(displayImgList[0]);
  const { currency } = useCurrency();

  const getTotalBalance = useQueryGetTotalBalance({});

  const balance = useMemo(() => {
    // Use displayValue if available (converted value), otherwise fallback to data
    const amount = getTotalBalance.data?.displayValue?.amount || getTotalBalance.data?.data?.amount || 0;
    const displayCurrency = getTotalBalance.data?.displayCurrency || currency;
    return formatCurrency(amount, displayCurrency);
  }, [getTotalBalance.data, currency]);

  const handleHideBalance = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setHide(!isHide);
    setDisplayImg(displayImgList[Number(!isHide)]);
  };

  if (getTotalBalance.isLoading) {
    return (
      <div className="py-5 hidden sm:block">
        <BaseCard>
          <TotalBalanceSkeleton />
        </BaseCard>
      </div>
    );
  }

  const displayBalance = getTotalBalance.error ? `0 ${getCurrencySymbol(currency)}` : balance;

  return (
    <div className="py-5 hidden sm:block">
      <BaseCard>
        <div className="flex items-center justify-between py-5 flex-wrap px-5">
          <div>
            <div className="text-[#99A3A5] font-semibold mb-2">
              Total balance
            </div>
            <div className="font-bold text-2xl break-all">
              {isHide ? "*****" : displayBalance}
            </div>
          </div>
          <div>
            <Button
              type={ButtonType.IMG}
              src={displayImg}
              onClick={handleHideBalance}
            />
          </div>
        </div>
      </BaseCard>
    </div>
  );
});
