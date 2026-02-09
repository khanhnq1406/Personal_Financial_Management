import { LoadingSpinnerIcon } from "@/components/icons";

type LoadingSpinnerProps = {
  text?: string;
};

export const LoadingSpinner = ({ text = "Loading…" }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinnerIcon size="md" className="text-primary-500" />
      <span className="text-primary-500">{text}</span>
    </div>
  );
};
