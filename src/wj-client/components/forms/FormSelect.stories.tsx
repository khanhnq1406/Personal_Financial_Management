import type { Meta, StoryObj } from "@storybook/react";
import { FormSelect } from "./FormSelect";
import { useState } from "react";

const meta: Meta<typeof FormSelect> = {
  title: "Forms/FormSelect",
  component: FormSelect,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormSelect>;

// Interactive wrapper for controlled component
const InteractiveFormSelect = (args: any) => {
  const [value, setValue] = useState(args.value || args.defaultValue || "");
  const [values, setValues] = useState(args.values || []);

  return (
    <div className="space-y-2">
      <FormSelect
        {...args}
        value={value}
        values={values}
        onChange={setValue}
        onValuesChange={setValues}
      />
      {args.multiple ? (
        <p className="text-xs text-neutral-500">
          Selected: {values.length ? values.join(", ") : "None"}
        </p>
      ) : (
        <p className="text-xs text-neutral-500">Selected: {value || "None"}</p>
      )}
    </div>
  );
};

const walletOptions = [
  { value: "1", label: "Vietcombank" },
  { value: "2", label: "Cash" },
  { value: "3", label: "TPBank" },
  { value: "4", label: "Momo" },
];

const categoryOptions = [
  { value: "1", label: "Food & Dining" },
  { value: "2", label: "Transportation" },
  { value: "3", label: "Shopping" },
  { value: "4", label: "Entertainment" },
  { value: "5", label: "Bills & Utilities" },
  { value: "6", label: "Healthcare" },
  { value: "7", label: "Education" },
  { value: "8", label: "Travel" },
  { value: "9", label: "Personal Care" },
  { value: "10", label: "Gifts & Donations" },
];

export const Default: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Select Wallet",
    options: walletOptions,
    helperText: "Choose your wallet",
  },
};

export const WithPlaceholder: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Select Wallet",
    placeholder: "Choose a wallet...",
    options: walletOptions,
  },
};

export const WithDefaultValue: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Select Wallet",
    options: walletOptions,
    defaultValue: "2",
  },
};

export const ManyOptions: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Select Category",
    options: categoryOptions,
    placeholder: "Choose a category...",
    helperText: "Select a transaction category",
  },
};

export const Searchable: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Search Categories",
    options: categoryOptions,
    placeholder: "Type to search...",
    searchable: true,
    searchPlaceholder: "Search...",
    helperText: "Start typing to filter options",
  },
};

export const MultiSelect: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Select Multiple",
    options: walletOptions,
    placeholder: "Choose multiple wallets...",
    multiple: true,
    helperText: "You can select multiple wallets",
  },
};

export const SmallSize: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Small Select",
    options: walletOptions,
    size: "sm",
  },
};

export const LargeSize: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Large Select",
    options: walletOptions,
    size: "lg",
  },
};

export const Disabled: Story = {
  args: {
    label: "Select Wallet",
    options: walletOptions,
    disabled: true,
    helperText: "This field is disabled",
  },
};

export const Required: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Select Wallet",
    options: walletOptions,
    required: true,
    helperText: "This field is required",
  },
};

export const WithError: Story = {
  args: {
    label: "Select Wallet",
    options: walletOptions,
    error: "Please select a wallet",
    required: true,
  },
};

export const WithSuccess: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Select Wallet",
    options: walletOptions,
    success: "Wallet selected successfully",
    defaultValue: "1",
  },
};

export const WithDisabledOptions: Story = {
  render: (args) => <InteractiveFormSelect {...args} />,
  args: {
    label: "Select Wallet",
    options: [
      { value: "1", label: "Vietcombank" },
      { value: "2", label: "Cash (Disabled)", disabled: true },
      { value: "3", label: "TPBank" },
      { value: "4", label: "Momo (Disabled)", disabled: true },
    ],
    helperText: "Some options are disabled",
  },
};

// Form example with all states
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <InteractiveFormSelect
        label="Default State"
        options={walletOptions}
        placeholder="Choose an option..."
        helperText="Normal state"
      />
      <InteractiveFormSelect
        label="With Error"
        options={walletOptions}
        error="This field is required"
        required
      />
      <InteractiveFormSelect
        label="With Success"
        options={walletOptions}
        success="Selection saved successfully"
        defaultValue="1"
      />
      <FormSelect
        label="Disabled"
        options={walletOptions}
        disabled
        helperText="This field is disabled"
      />
      <InteractiveFormSelect
        label="Searchable"
        options={categoryOptions}
        searchable
        placeholder="Type to search..."
        helperText="Start typing to filter"
      />
      <InteractiveFormSelect
        label="Multi-Select"
        options={walletOptions}
        multiple
        placeholder="Select multiple..."
        helperText="Select multiple options"
      />
    </div>
  ),
};

// Dark mode example
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-dark-background p-8 rounded-lg">
      <div className="space-y-6">
        <InteractiveFormSelect
          label="Dark Mode Select"
          options={walletOptions}
          placeholder="Choose a wallet..."
          helperText="This is how it looks in dark mode"
        />
        <InteractiveFormSelect
          label="With Error (Dark)"
          options={walletOptions}
          error="Please select a wallet"
          required
        />
        <InteractiveFormSelect
          label="Searchable (Dark)"
          options={categoryOptions}
          searchable
          placeholder="Type to search..."
          helperText="Start typing to filter"
        />
      </div>
    </div>
  ),
};
