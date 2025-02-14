"use client";

import { ButtonType, resources } from "@/app/constants";
import { useEffect, useRef, useState } from "react";

export const ButtonGroup = () => {
  const [extend, setExtend] = useState(false);
  const buttonRef = useRef(null);
  const handleExtend = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExtend(!extend);
  };
  useEffect(() => {
    // if (buttonRef.current) console.log(buttonRef.current.style.display);
  }, []);
  return (
    <div className="fixed bottom-3 right-5">
      <div className="">
        <button className="hover:drop-shadow-round" onClick={handleExtend}>
          <img src={`${resources}/plus.png`} alt="" className="w-8" />
        </button>
        <button
          className="fixed hover:drop-shadow-round bottom-8 right-14 bg-bg rounded-full w-8"
          ref={buttonRef}
        >
          <img src={`${resources}/transaction.png`} alt="" className="w-8" />
        </button>
        <button
          className="fixed hover:drop-shadow-round bottom-14 right-6 bg-bg rounded-full w-8 p-1"
          ref={buttonRef}
        >
          <img src={`${resources}/transfer.png`} alt="" className="" />
        </button>
      </div>
    </div>
  );
};
