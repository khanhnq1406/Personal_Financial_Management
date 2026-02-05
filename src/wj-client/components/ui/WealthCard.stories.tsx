import type { Meta, StoryObj } from "@storybook/react";
import { WealthCard } from "./WealthCard";

const meta: Meta<typeof WealthCard> = {
  title: "UI/WealthCard",
  component: WealthCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof WealthCard>;

export const Default: Story = {
  args: {
    title: "Total Balance",
    value: 125000000,
    currency: "₫",
  },
};

export const WithTrend: Story = {
  args: {
    title: "Total Balance",
    value: 125000000,
    currency: "₫",
    trend: 12.5,
  },
};

export const NegativeTrend: Story = {
  args: {
    title: "Monthly Spending",
    value: 4500000,
    currency: "₫",
    trend: -5.2,
    variant: "danger",
  },
};

export const WithIcon: Story = {
  args: {
    title: "Investments",
    value: 50000000,
    currency: "₫",
    trend: 8.3,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Savings Account",
    value: 25000000,
    currency: "₫",
    subtitle: "Vietcombank",
    trend: 2.1,
  },
};

export const SuccessVariant: Story = {
  args: {
    title: "Goal Progress",
    value: "75%",
    variant: "success",
    subtitle: "Emergency Fund",
  },
};

export const WarningVariant: Story = {
  args: {
    title: "Budget Used",
    value: "85%",
    variant: "warning",
    subtitle: "Monthly Budget",
  },
};

export const InfoVariant: Story = {
  args: {
    title: "Pending Transactions",
    value: 3,
    variant: "info",
    subtitle: "Awaiting confirmation",
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
  args: {
    title: "Total Balance",
    value: 125000000,
    currency: "₫",
    trend: 12.5,
  },
};

export const DarkMode: Story = {
  args: {
    title: "Total Balance",
    value: 125000000,
    currency: "₫",
    trend: 12.5,
  },
  globals: {
    theme: "dark",
  },
};
