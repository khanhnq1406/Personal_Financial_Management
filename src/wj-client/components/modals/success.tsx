"use client";

import { useEffect, useState } from "react";
import { SuccessAnimation } from "../success/SuccessAnimation";

type SuccessProps = {
  message?: string;
};

export const Success: React.FC<SuccessProps> = ({ message: propMessage }) => {
  const [message, setMessage] = useState(propMessage || "");

  useEffect(() => {
    if (!propMessage) {
      const stored = sessionStorage.getItem("successMessage");
      if (stored) {
        setMessage(stored);
        sessionStorage.removeItem("successMessage");
      }
    }
  }, [propMessage]);

  return (
    <div>
      <div className="flex justify-center">
        <SuccessAnimation />
      </div>
      <div className="text-center text-2xl font-bold m-2">Success</div>
      <div className="text-center mt-2 mb-3 text-gray-600">{message}</div>
    </div>
  );
};
