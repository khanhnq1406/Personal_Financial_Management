import { ButtonType } from "@/app/constants";
import React from "react";

type PropType = {
  type: string;
  onClick?: React.MouseEventHandler;
  children?: React.ReactNode;
  src?: string | undefined;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

// Hoist SVG content outside component to avoid recreating on each render
const LOADING_SPINNER_WHITE = (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
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
);

const LOADING_SPINNER_GREEN = (
  <svg
    className="animate-spin h-5 w-5 text-hgreen"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
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
);

export const Button = React.memo(function Button({
  type,
  src,
  onClick,
  children,
  loading = false,
  disabled = false,
  className = "",
}: PropType) {
  switch (type) {
    case ButtonType.IMG:
      return (
        <button className={`hover:bg-hover rounded-md p-1 hover:drop-shadow-sm focus-visible:ring-2 focus-visible:ring-hgreen focus-visible:ring-offset-2 ${className}`}>
          <img src={src} alt="" onClick={onClick} className="w-5" />
        </button>
      );

    case ButtonType.PRIMARY:
      return (
        <button
          className={`bg-hgreen hover:bg-bg text-white py-2 w-full font-semibold rounded drop-shadow-round disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-hgreen focus-visible:ring-offset-2 ${className}`}
          onClick={onClick}
          disabled={loading || disabled}
        >
          {loading && LOADING_SPINNER_WHITE}
          {children}
        </button>
      );

    case ButtonType.SECONDARY:
      return (
        <button
          className={`bg-fg hover:bg-white text-hgreen py-2 w-full font-semibold rounded drop-shadow-round border-2 border-hgreen disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-hgreen focus-visible:ring-offset-2 ${className}`}
          onClick={onClick}
          disabled={loading || disabled}
        >
          {loading && LOADING_SPINNER_GREEN}
          {children}
        </button>
      );

    default:
      return null;
  }
});
