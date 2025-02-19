import { Dispatch, SetStateAction } from "react";

interface TransferMoneyFormProps {
  setInput: Dispatch<SetStateAction<object>>;
}

export const TransferMoneyForm: React.FC<TransferMoneyFormProps> = ({
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

      <div>From</div>
      <select
        defaultValue={""}
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            from: e.target.value,
          }))
        }
      >
        <option value={""} disabled>
          Select wallet
        </option>
      </select>

      <div>To</div>
      <select
        defaultValue={""}
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            to: e.target.value,
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
