import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  TransferMoneyType,
  CreateWalletType,
  AddTransactionType,
} from "./baseModal";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { currencyFormatter } from "@/utils/currencyFormatter";

interface TransferMoneyFormProps {
  setInput: Dispatch<
    SetStateAction<CreateWalletType | AddTransactionType | TransferMoneyType>
  >;
}

export const TransferMoneyForm: React.FC<TransferMoneyFormProps> = ({
  setInput,
}) => {
  // Fetch wallets
  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  const wallets = walletsData?.wallets || [];

  // State for selected wallets (to enable filtering)
  const [fromWallet, setFromWallet] = useState<string>("");
  const [toWallet, setToWallet] = useState<string>("");

  // Filter "To" options to exclude selected "From" wallet
  const availableToWallets = fromWallet
    ? wallets.filter((w) => String(w.id) !== fromWallet)
    : wallets;

  // Initialize datetime on mount
  useEffect(() => {
    const now = new Date();
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const datetimeLocal = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);
    setInput((input) => ({
      ...input,
      datetime: datetimeLocal,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to wallet when from wallet changes
  useEffect(() => {
    if (fromWallet && toWallet && fromWallet === toWallet) {
      setToWallet("");
      setInput((input) => ({
        ...input,
        to: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromWallet]);

  return (
    <div>
      {/* Amount */}
      <div className="mb-2">
        <div>
          Amount<span className="required">*</span>
        </div>
        <input
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          onChange={(e) =>
            setInput((input) => ({
              ...input,
              amount: Number(e.target.value),
            }))
          }
        />
      </div>

      {/* From Wallet */}
      <div className="mb-2">
        <div>
          From<span className="required">*</span>
        </div>
        <select
          defaultValue={""}
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          disabled={walletsLoading}
          value={fromWallet}
          onChange={(e) => {
            const value = e.target.value;
            setFromWallet(value);
            setInput((input) => ({
              ...input,
              from: value,
            }));
          }}
        >
          <option value={""} disabled>
            {walletsLoading ? "Loading wallets..." : "Select wallet"}
          </option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.walletName} (
              {currencyFormatter.format(wallet.balance?.amount || 0)})
            </option>
          ))}
        </select>
      </div>

      {/* To Wallet */}
      <div className="mb-2">
        <div>
          To<span className="required">*</span>
        </div>
        <select
          defaultValue={""}
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          disabled={walletsLoading || !fromWallet}
          value={toWallet}
          onChange={(e) => {
            const value = e.target.value;
            setToWallet(value);
            setInput((input) => ({
              ...input,
              to: value,
            }));
          }}
        >
          <option value={""} disabled>
            {!fromWallet
              ? "Select source wallet first"
              : walletsLoading
              ? "Loading wallets..."
              : "Select wallet"}
          </option>
          {availableToWallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.walletName} (
              {currencyFormatter.format(wallet.balance?.amount || 0)})
            </option>
          ))}
        </select>
      </div>

      {/* Date & Time */}
      <div className="mb-2">
        <div>Date & Time</div>
        <input
          type="datetime-local"
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          onChange={(e) =>
            setInput((input) => ({
              ...input,
              datetime: e.target.value,
            }))
          }
        />
      </div>

      {/* Note */}
      <div className="mb-2">
        <div>Note</div>
        <input
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          type="text"
          placeholder="Enter note (optional)"
          onChange={(e) =>
            setInput((input) => ({
              ...input,
              note: e.target.value,
            }))
          }
        />
      </div>
    </div>
  );
};
