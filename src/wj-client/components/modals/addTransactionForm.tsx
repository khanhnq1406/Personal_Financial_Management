import { Dispatch, SetStateAction } from "react";
import { AddTransactionType, CreateWalletType, TransferMoneyType } from "./baseModal";

interface AddTransactionFormProps {
  setInput: Dispatch<SetStateAction<CreateWalletType | AddTransactionType | TransferMoneyType>>;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  setInput,
}) => {
  return (
    <div>
      <div>Amount</div>
      <input
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        type="number"
        placeholder="0.00"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            amount: Number(e.target.value),
          }))
        }
      />

      <div>Category</div>
      <select
        defaultValue={""}
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            category: e.target.value,
          }))
        }
      >
        <option value={""} disabled>
          Select category
        </option>
      </select>

      <div>Wallet</div>
      <select
        defaultValue={""}
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            wallet: e.target.value,
          }))
        }
      >
        <option value={""} disabled>
          Select wallet
        </option>
      </select>

      <div>Date & Time</div>
      <input
        type="datetime-local"
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            datetime: e.target.value,
          }))
        }
      />

      <div>Note</div>
      <input
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        type="text"
        placeholder="Enter note"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            note: e.target.value,
          }))
        }
      />
    </div>
  );
};
