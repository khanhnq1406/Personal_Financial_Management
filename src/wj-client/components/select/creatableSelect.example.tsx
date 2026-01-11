"use client";

import React, { useState } from "react";
import { CreatableSelect } from "./creatableSelect";

// Example 1: Basic usage with categories
export const CategorySelectExample = () => {
  const [categories, setCategories] = useState([
    { value: "food", label: "Food & Dining" },
    { value: "transport", label: "Transportation" },
    { value: "utilities", label: "Utilities" },
    { value: "entertainment", label: "Entertainment" },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleCreateCategory = (newCategory: string) => {
    const value = newCategory.toLowerCase().replace(/\s+/g, "-");
    setCategories([...categories, { value, label: newCategory }]);
  };

  return (
    <div className="p-4">
      <label className="block mb-2 font-medium">Category</label>
      <CreatableSelect
        options={categories}
        value={selectedCategory}
        onChange={setSelectedCategory}
        onCreate={handleCreateCategory}
        placeholder="Select or create a category..."
      />
      <p className="mt-2 text-sm text-gray-600">
        Selected: {selectedCategory || "None"}
      </p>
    </div>
  );
};

// Example 2: Using with form state (like your createWalletForm)
interface FormState {
  name: string;
  category: string;
}

export const FormIntegrationExample = () => {
  const [form, setForm] = useState<FormState>({
    name: "",
    category: "",
  });

  const [categories, setCategories] = useState([
    { value: "wallet", label: "Wallet" },
    { value: "bank", label: "Bank Account" },
    { value: "investment", label: "Investment" },
  ]);

  const handleCreateCategory = (newCategory: string) => {
    const value = newCategory.toLowerCase().replace(/\s+/g, "-");
    setCategories([...categories, { value, label: newCategory }]);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block mb-1 font-medium">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="p-2 drop-shadow-round rounded-lg w-full"
          placeholder="Enter name..."
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Type</label>
        <CreatableSelect
          options={categories}
          value={form.category}
          onChange={(category) => setForm({ ...form, category })}
          onCreate={handleCreateCategory}
          placeholder="Select or create a type..."
        />
      </div>

      <div className="text-sm text-gray-600">
        Form state: {JSON.stringify(form)}
      </div>
    </div>
  );
};

// Example 3: Pre-selected value and disabled state
export const PreselectedExample = () => {
  const options = [
    { value: "usd", label: "USD - US Dollar" },
    { value: "eur", label: "EUR - Euro" },
    { value: "gbp", label: "GBP - British Pound" },
  ];

  const [currency, setCurrency] = useState("usd");
  const [isDisabled, setIsDisabled] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <CreatableSelect
        options={options}
        value={currency}
        onChange={setCurrency}
        disabled={isDisabled}
        placeholder="Select currency..."
        allowCreate={false}
      />

      <button
        onClick={() => setIsDisabled(!isDisabled)}
        className="px-4 py-2 bg-hgreen text-white rounded"
      >
        Toggle Disabled
      </button>

      <p className="text-sm">
        Selected currency: {options.find((o) => o.value === currency)?.label}
      </p>
    </div>
  );
};
