import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState, EmptyStates } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: "No Data",
    description: "There's nothing to display here yet.",
  },
};

export const WithIcon: Story = {
  args: {
    title: "No Transactions",
    description: "Start by adding your first transaction to track your finances.",
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
};

export const WithAction: Story = {
  args: {
    title: "No Wallets",
    description: "Create a wallet to start tracking your balance and transactions.",
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    actionLabel: "Create Wallet",
    onAction: () => console.log("Action clicked"),
  },
};

export const Small: Story = {
  args: {
    title: "No Results",
    size: "sm",
    icon: (
      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
};

export const Large: Story = {
  args: {
    title: "No Data Available",
    description: "There's nothing to display here. Check back later!",
    size: "lg",
    icon: (
      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
};

// Preset empty states
export const NoTransactionsPreset: Story = {
  render: () => <EmptyStates.NoTransactions />,
};

export const NoWalletsPreset: Story = {
  render: () => <EmptyStates.NoWallets />,
};

export const NoInvestmentsPreset: Story = {
  render: () => <EmptyStates.NoInvestments />,
};

export const NoResultsPreset: Story = {
  render: () => <EmptyStates.NoResults />,
};

export const NoBudgetsPreset: Story = {
  render: () => <EmptyStates.NoBudgets />,
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
  args: {
    title: "No Transactions",
    description: "Start by adding your first transaction to track your finances.",
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
};

export const DarkMode: Story = {
  args: {
    title: "No Transactions",
    description: "Start by adding your first transaction to track your finances.",
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  globals: {
    theme: "dark",
  },
};
