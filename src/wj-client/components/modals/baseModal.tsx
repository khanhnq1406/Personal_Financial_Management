"use client";

import { ButtonType, resources } from "@/app/constants";
import { Button } from "../Button";
import { useEffect, useState } from "react";
import { AddTransactionForm } from "./addTransactionForm";

export const BaseModal = () => {
  const [input, setInput] = useState({});
  useEffect(() => {
    console.log(input);
  }, [input]);
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-modal flex justify-center items-center">
      <div className="bg-fg p-5 rounded-lg drop-shadow-round">
        <div>
          <Button type={ButtonType.IMG} src={`${resources}/close.png`} />
        </div>
        <div className="font-bold text-lg">Add Transaction</div>
        <AddTransactionForm setInput={setInput} />
        <div>
          <Button type={ButtonType.PRIMARY}>Save</Button>
        </div>
      </div>
    </div>
  );
};
