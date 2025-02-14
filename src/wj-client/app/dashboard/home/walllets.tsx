import { resources } from "@/app/constants";
import { memo } from "react";

export const Wallets = memo(function Wallets() {
  const wallets = [
    { id: 1, name: "Wallet 1", balance: 100 },
    { id: 2, name: "Wallet 2", balance: 200 },
    { id: 3, name: "Wallet 3", balance: 300 },
  ];
  return (
    <div className="px-2 py-1">
      {wallets.map((wallet) => {
        return (
          <div className="flex flex-nowrap justify-between m-3" key={wallet.id}>
            <div className="flex flex-nowrap gap-3">
              <img className="w-[25px]" src={`${resources}/wallet.png`} />
              <div className="font-semibold">{wallet.name}</div>
            </div>
            <div className="font-semibold">{wallet.balance}</div>
          </div>
        );
      })}
    </div>
  );
});
