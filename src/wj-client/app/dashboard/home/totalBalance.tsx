import { ButtonType, resources } from "@/app/constants";
import { BaseCard } from "@/components/BaseCard";
import { Button } from "@/components/Button";
import { TotalBalanceSkeleton } from "@/components/loading/Skeleton";
import { currencyFormatter } from "@/utils/currency-formatter";
import { useQueryGetTotalBalance } from "@/utils/generated/hooks";
import { memo, useMemo, useState } from "react";

const displayImgList = [`${resources}/unhide.png`, `${resources}/hide.png`];
export const TotalBalance = memo(function TotalBalance() {
  const [isHide, setHide] = useState(false);
  const [displayImg, setDisplayImg] = useState(displayImgList[0]);

  const getTotalBalance = useQueryGetTotalBalance({});

  const balance = useMemo(() => {
    const amount = getTotalBalance.data?.data?.amount || 0;
    return currencyFormatter.format(amount);
  }, [getTotalBalance.data]);

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

  const displayBalance = getTotalBalance.error ? "0 ₫" : balance;

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
