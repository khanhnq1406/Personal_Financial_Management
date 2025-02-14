import { ButtonType } from "@/app/constants";
import React from "react";

type PropType = {
  type: string;
  onClick?: React.MouseEventHandler;
  children?: React.ReactNode;
  src?: string | undefined;
};
export const Button = (props: PropType) => {
  const { type, src, onClick, children } = props;
  switch (type) {
    case ButtonType.IMG:
      return (
        <button className="hover:bg-hover rounded-md p-1 hover:drop-shadow-sm">
          <img src={src} alt="" onClick={onClick} className="w-5" />
        </button>
      );

    case ButtonType.PRIMARY:
      return (
        <button className="bg-hgreen hover:bg-bg text-white py-2 w-full font-semibold rounded drop-shadow-round">
          {children}
        </button>
      );

    case ButtonType.SECONDARY:
      return (
        <button className="bg-fg hover:bg-white text-hgreen py-2 w-full font-semibold rounded drop-shadow-round border-2 border-hgreen">
          {children}
        </button>
      );

    default:
      break;
  }
};
