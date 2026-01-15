"use client";

interface LabelProps {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Label = ({
  htmlFor,
  required = false,
  children,
  className = "",
}: LabelProps) => {
  return (
    <div className={`text-sm font-medium ${className}`}>
      {children}
      {required && <span className="required">*</span>}
    </div>
  );
};
