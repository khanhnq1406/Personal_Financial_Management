import type { Meta, StoryObj } from "@storybook/react";
import { FormSelect } from "./FormSelect";

const meta: Meta<typeof FormSelect> = {
  title: "Forms/FormSelect",
  component: FormSelect,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      const mockControl = {
        _subjects: {
          values: { subscribe: () => {} },
          state: { subscribe: () => {} },
        },
        _names: { name: "test" },
      };

      return (
        <div className="w-80">
          <Story
            args={{
              control: mockControl as any,
            }}
          />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof FormSelect>;

const walletOptions = [
  { value: "1", label: "Vietcombank" },
  { value: "2", label: "Cash" },
  { value: "3", label: "TPBank" },
  { value: "4", label: "Momo" },
];

export const Default: Story = {
  args: {
    label: "Select Wallet",
    name: "wallet",
    options: walletOptions,
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: "Select Wallet",
    name: "wallet",
    placeholder: "Choose a wallet...",
    options: walletOptions,
  },
};

export const ManyOptions: Story = {
  args: {
    label: "Select Category",
    name: "category",
    options: [
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
    ],
    placeholder: "Choose a category...",
  },
};

export const Disabled: Story = {
  args: {
    label: "Select Wallet",
    name: "wallet",
    options: walletOptions,
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    label: "Select Wallet",
    name: "wallet",
    options: walletOptions,
    required: true,
  },
};

// Form example
export const FormExample: Story = {
  render: () => {
    const mockControl = {
      _subjects: {
        values: { subscribe: () => {} },
        state: { subscribe: () => {} },
      },
      _names: { name: "form" },
    };

    return (
      <form className="space-y-4 w-80">
        <FormSelect
          control={mockControl as any}
          label="Wallet"
          name="wallet"
          options={walletOptions}
        />
        <FormSelect
          control={mockControl as any}
          label="Category"
          name="category"
          options={[
            { value: "1", label: "Food & Dining" },
            { value: "2", label: "Transportation" },
            { value: "3", label: "Shopping" },
          ]}
        />
      </form>
    );
  },
};
