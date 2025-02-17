"use client";

import { ButtonType, resources } from "@/app/constants";
import { memo, useEffect, useRef, useState } from "react";

export const ButtonGroup = memo(() => {
  const [extend, setExtend] = useState(false);
  const transactionButtonRef = useRef(null);
  const transferButtonRef = useRef(null);

  const handleExtend = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExtend(!extend);
    if (extend) {
      if (transferButtonRef.current) {
        transferButtonRef.current.classList.remove("show");
      }
      if (transactionButtonRef.current) {
        transactionButtonRef.current.classList.remove("show");
      }
    } else {
      if (transferButtonRef.current) {
        transferButtonRef.current.classList.add("show");
      }
      if (transactionButtonRef.current) {
        transactionButtonRef.current.classList.add("show");
      }
    }
  };

  return (
    <div className="fixed bottom-3 right-5">
      <div className="">
        <button
          className="relative hover:drop-shadow-round z-50"
          onClick={handleExtend}
        >
          <img src={`${resources}/plus.png`} alt="" className="w-8" />
        </button>
        <button
          className="btn-transaction fixed hover:drop-shadow-round bottom-8 right-14 bg-bg rounded-full w-8"
          ref={transactionButtonRef}
        >
          <img src={`${resources}/transaction.png`} alt="" className="w-8" />
        </button>
        <button
          className="btn-transfer fixed hover:drop-shadow-round bottom-14 right-6 bg-bg rounded-full w-8 p-1"
          ref={transferButtonRef}
        >
          <img src={`${resources}/transfer.png`} alt="" className="" />
        </button>
      </div>
    </div>
  );
});
