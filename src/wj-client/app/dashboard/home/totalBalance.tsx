import { ButtonType, resources } from "@/app/constants";
import { BaseCard } from "@/components/baseCard";
import { Button } from "@/components/Button";
import { currencyFormatter } from "@/utils/currencyFormatter";
import { memo, useState } from "react";

const displayImgList = [`${resources}/unhide.png`, `${resources}/hide.png`];
export const TotalBalance = memo(function TotalBalance() {
  const [balance, setBalance] = useState(currencyFormatter.format(123456789));
  const [isHide, setHide] = useState(false);
  const [displayImg, setDisplayImg] = useState(displayImgList[0]);
  const handleHideBalance = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setHide(!isHide);
    setDisplayImg(displayImgList[Number(!isHide)]);
  };
  return (
    <div className="py-5">
      <BaseCard>
        <div className="flex items-center justify-between py-5 flex-wrap px-5">
          <div>
            <div className="text-[#99A3A5] font-semibold mb-2">
              Total balance
            </div>
            <div className="font-bold text-2xl break-all">
              {isHide ? "*****" : balance}
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
