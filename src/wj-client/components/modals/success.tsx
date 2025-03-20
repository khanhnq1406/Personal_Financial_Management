import { SuccessAnimation } from "../success/successAnimation";

type SuccessProps = {
  message: string;
};

export const Success: React.FC<SuccessProps> = ({ message }) => {
  return (
    <div>
      <div className="">
        <SuccessAnimation />
      </div>
      <div className="text-center text-2xl font-bold m-2">Success</div>
      <div className="text-center mt-2 mb-3">{message}</div>
    </div>
  );
};
