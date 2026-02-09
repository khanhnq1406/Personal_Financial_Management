import type { Meta, StoryObj } from "@storybook/react";
import {
  Icon,
  CheckIcon,
  XIcon,
  PlusIcon,
  EditIcon,
  DeleteIcon,
  WalletIcon,
  TransactionIcon,
  IncomeIcon,
  ExpenseIcon,
  HomeIcon,
  PortfolioIcon,
  ChevronDownIcon,
  SearchIcon,
  RefreshIcon,
} from "./";

const meta: Meta<typeof Icon> = {
  title: "Components/Icons",
  component: Icon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

/**
 * Basic icon with different sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CheckIcon size="xs" ariaLabel="Extra small" />
      <CheckIcon size="sm" ariaLabel="Small" />
      <CheckIcon size="md" ariaLabel="Medium" />
      <CheckIcon size="lg" ariaLabel="Large" />
      <CheckIcon size="xl" ariaLabel="Extra large" />
    </div>
  ),
};

/**
 * All action icons
 */
export const ActionIcons: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      <div className="flex flex-col items-center gap-2">
        <PlusIcon size="md" />
        <span className="text-xs">Plus</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EditIcon size="md" />
        <span className="text-xs">Edit</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DeleteIcon size="md" />
        <span className="text-xs">Delete</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CheckIcon size="md" />
        <span className="text-xs">Check</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <XIcon size="md" />
        <span className="text-xs">Close</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SearchIcon size="md" />
        <span className="text-xs">Search</span>
      </div>
    </div>
  ),
};

/**
 * All navigation icons
 */
export const NavigationIcons: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      <div className="flex flex-col items-center gap-2">
        <HomeIcon size="md" />
        <span className="text-xs">Home</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TransactionIcon size="md" />
        <span className="text-xs">Transactions</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <WalletIcon size="md" />
        <span className="text-xs">Wallets</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PortfolioIcon size="md" />
        <span className="text-xs">Portfolio</span>
      </div>
    </div>
  ),
};

/**
 * Finance icons with semantic colors
 */
export const FinanceIcons: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <div className="flex flex-col items-center gap-2">
        <IncomeIcon size="lg" />
        <span className="text-xs text-success-600">Income</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ExpenseIcon size="lg" />
        <span className="text-xs text-danger-600">Expense</span>
      </div>
    </div>
  ),
};

/**
 * Icons in different colors
 */
export const ColoredIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CheckIcon size="md" className="text-success-600" />
      <XIcon size="md" className="text-danger-600" />
      <EditIcon size="md" className="text-primary-600" />
      <WalletIcon size="md" className="text-warning-600" />
    </div>
  ),
};

/**
 * Dark mode icons
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-dark-background p-8 rounded-lg">
      <div className="grid grid-cols-6 gap-4">
        <HomeIcon size="md" />
        <TransactionIcon size="md" />
        <WalletIcon size="md" />
        <PortfolioIcon size="md" />
        <PlusIcon size="md" />
        <EditIcon size="md" />
      </div>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

/**
 * UI Icons
 */
export const UIIcons: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      <div className="flex flex-col items-center gap-2">
        <ChevronDownIcon size="md" />
        <span className="text-xs">Chevron Down</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RefreshIcon size="md" />
        <span className="text-xs">Refresh</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SearchIcon size="md" />
        <span className="text-xs">Search</span>
      </div>
    </div>
  ),
};
