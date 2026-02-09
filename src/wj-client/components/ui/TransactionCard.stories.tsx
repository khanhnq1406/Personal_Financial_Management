import type { Meta, StoryObj } from "@storybook/react";
import { TransactionCard } from "./TransactionCard";

const meta: Meta<typeof TransactionCard> = {
  title: "UI/TransactionCard",
  component: TransactionCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["income", "expense"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TransactionCard>;

export const Expense: Story = {
  args: {
    name: "Grocery Shopping",
    amount: 1500000,
    currency: "₫",
    category: "Food & Dining",
    date: "2024-01-15",
    wallet: "Cash",
    type: "expense",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
};

export const Income: Story = {
  args: {
    name: "Salary",
    amount: 25000000,
    currency: "₫",
    category: "Income",
    date: "2024-01-01",
    wallet: "Vietcombank",
    type: "income",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export const WithAllDetails: Story = {
  args: {
    name: "Coffee Shop",
    amount: 85000,
    currency: "₫",
    category: "Food & Dining",
    date: "2024-01-15T09:30:00",
    wallet: "Cash",
    type: "expense",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
};

export const NoCategory: Story = {
  args: {
    name: "ATM Withdrawal",
    amount: 5000000,
    currency: "₫",
    date: "2024-01-14",
    wallet: "Vietcombank",
    type: "expense",
  },
};

export const NoIcon: Story = {
  args: {
    name: "Transfer from Savings",
    amount: 10000000,
    currency: "₫",
    category: "Transfer",
    date: "2024-01-13",
    wallet: "Cash",
    type: "income",
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
  args: {
    name: "Grocery Shopping",
    amount: 1500000,
    currency: "₫",
    category: "Food & Dining",
    date: "2024-01-15",
    wallet: "Cash",
    type: "expense",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
};

export const DarkMode: Story = {
  args: {
    name: "Grocery Shopping",
    amount: 1500000,
    currency: "₫",
    category: "Food & Dining",
    date: "2024-01-15",
    wallet: "Cash",
    type: "expense",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  globals: {
    theme: "dark",
  },
};
