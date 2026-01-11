import { ButtonType } from "@/app/constants";
import React from "react";

type PropType = {
  type: string;
  onClick?: React.MouseEventHandler;
  children?: React.ReactNode;
  src?: string | undefined;
  loading?: boolean;
  disabled?: boolean;
};
export const Button = (props: PropType) => {
  const { type, src, onClick, children, loading = false, disabled = false } = props;
  switch (type) {
    case ButtonType.IMG:
      return (
        <button className="hover:bg-hover rounded-md p-1 hover:drop-shadow-sm">
          <img src={src} alt="" onClick={onClick} className="w-5" />
        </button>
      );

    case ButtonType.PRIMARY:
      return (
        <button
          className="bg-hgreen hover:bg-bg text-white py-2 w-full font-semibold rounded drop-shadow-round disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onClick={onClick}
          disabled={loading || disabled}
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {children}
        </button>
      );

    case ButtonType.SECONDARY:
      return (
        <button
          className="bg-fg hover:bg-white text-hgreen py-2 w-full font-semibold rounded drop-shadow-round border-2 border-hgreen disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onClick={onClick}
          disabled={loading || disabled}
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-hgreen"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {children}
        </button>
      );

    default:
      break;
  }
};
