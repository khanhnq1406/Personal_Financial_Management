import { ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";
import { memo } from "react";

export const FunctionalButton = memo(function FunctionalButton() {
  return (
    <div className="py-5">
      <div className="mb-5">
        <Button type={ButtonType.PRIMARY}>Add Transaction</Button>
      </div>
      <div className="mb-5">
        <Button type={ButtonType.SECONDARY}>Transfer Money</Button>
      </div>
      <div>
        <Button type={ButtonType.SECONDARY}>Create New Wallet</Button>
      </div>
    </div>
  );
});
