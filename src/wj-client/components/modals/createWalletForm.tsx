import { Dispatch, SetStateAction } from "react";

interface CreateWalletFormProps {
  setInput: Dispatch<SetStateAction<object>>;
}

export const CreateWalletForm: React.FC<CreateWalletFormProps> = ({
  setInput,
}) => {
  return (
    <div>
      <div>Name</div>
      <input
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        type="text"
        placeholder="Enter wallet's name"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            name: e.target.value,
          }))
        }
      />

      <div>Initial Balance</div>
      <input
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        type="number"
        placeholder="0.00"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            initialBalance: Number(e.target.value),
          }))
        }
      />
    </div>
  );
};
