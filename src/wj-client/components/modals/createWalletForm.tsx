import { ModalType } from "@/app/constants";
import { Dispatch, SetStateAction, useEffect } from "react";
import {
  CreateWalletType,
  AddTransactionType,
  TransferMoneyType,
} from "./baseModal";
import { WalletType } from "@/gen/protobuf/v1/wallet";

interface CreateWalletFormProps {
  setInput: Dispatch<
    SetStateAction<CreateWalletType | AddTransactionType | TransferMoneyType>
  >;
}

export const CreateWalletForm: React.FC<CreateWalletFormProps> = ({
  setInput,
}) => {
  useEffect(() => {
    setInput((input) => ({
      ...input,
      type: ModalType.CREATE_WALLET,
      initialBalance: 0,
    }));
  }, []);
  return (
    <div>
      <div>
        Name<span className="required">*</span>
      </div>
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

      <div>Wallet Type</div>
      <select
        defaultValue={WalletType.BASIC}
        className="p-2 drop-shadow-round rounded-lg w-full mt-1 mb-2"
        onChange={(e) =>
          setInput((input) => ({
            ...input,
            walletType: e.target.value,
          }))
        }
      >
        <option value={WalletType.BASIC}>Basic</option>
        <option value={WalletType.INVESTMENT}>Investment</option>
      </select>
    </div>
  );
};
