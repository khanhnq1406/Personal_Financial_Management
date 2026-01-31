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

  const balanceData = useMemo(() => {
    const netWorth = getTotalBalance.data?.displayNetWorth?.amount ||
                     getTotalBalance.data?.netWorth?.amount || 0;
    const totalCash = getTotalBalance.data?.displayValue?.amount ||
                      getTotalBalance.data?.data?.amount || 0;
    const totalInvestments = getTotalBalance.data?.displayTotalInvestments?.amount || 0;
    const displayCurrency = getTotalBalance.data?.displayCurrency || currency;

    return {
      netWorth: formatCurrency(netWorth, displayCurrency),
      totalCash: formatCurrency(totalCash, displayCurrency),
      totalInvestments: formatCurrency(totalInvestments, displayCurrency),
      displayCurrency,
    };
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

  const displayBalance = getTotalBalance.error
    ? `0 ${getCurrencySymbol(currency)}`
    : balanceData.netWorth;

  return (
    <div className="py-5 hidden sm:block">
      <BaseCard>
        <div className="flex items-center justify-between py-5 flex-wrap px-5">
          <div className="flex-1">
            <div className="text-[#99A3A5] font-semibold mb-2">
              Total Net Worth
            </div>
            <div className="font-bold text-2xl break-all mb-3">
              {isHide ? "*****" : displayBalance}
            </div>
            {!isHide && (
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Cash: {balanceData.totalCash}</span>
                <span>Investments: {balanceData.totalInvestments}</span>
              </div>
            )}
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
