"use client";

interface ErrorMessageProps {
  id?: string;
  children: React.ReactNode;
}

export const ErrorMessage = ({ id, children }: ErrorMessageProps) => {
  return (
    <div id={id} className="text-lred text-sm mt-1" role="alert">
      {children}
    </div>
  );
};
