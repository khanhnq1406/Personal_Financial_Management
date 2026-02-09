import type { Meta, StoryObj } from "@storybook/react";
import { StatCard } from "./StatCard";

const meta: Meta<typeof StatCard> = {
  title: "UI/StatCard",
  component: StatCard,
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
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    label: "Total Balance",
    value: 125000000,
  },
};

export const PositiveChange: Story = {
  args: {
    label: "Monthly Income",
    value: 25000000,
    change: 12.5,
  },
};

export const NegativeChange: Story = {
  args: {
    label: "Monthly Expenses",
    value: 18000000,
    change: -8.3,
  },
};

export const WithIcon: Story = {
  args: {
    label: "Investments",
    value: 50000000,
    change: 5.2,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
};

export const Small: Story = {
  args: {
    label: "Transactions",
    value: 24,
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    label: "Net Worth",
    value: 500000000,
    size: "lg",
    change: 15.3,
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
  args: {
    label: "Total Balance",
    value: 125000000,
    change: 12.5,
  },
};

export const DarkMode: Story = {
  args: {
    label: "Total Balance",
    value: 125000000,
    change: 12.5,
  },
  globals: {
    theme: "dark",
  },
};
