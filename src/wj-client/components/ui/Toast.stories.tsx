import type { Meta, StoryObj } from "@storybook/react";
import { Toast } from "./Toast";

const meta: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "error", "warning", "info"],
    },
    duration: {
      control: "number",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    message: "Transaction added successfully!",
    variant: "success",
    duration: 5000,
  },
};

export const Error: Story = {
  args: {
    message: "Failed to add transaction. Please try again.",
    variant: "error",
    duration: 5000,
  },
};

export const Warning: Story = {
  args: {
    message: "Your budget is running low for this category.",
    variant: "warning",
    duration: 5000,
  },
};

export const Info: Story = {
  args: {
    message: "New features available! Check out what's new.",
    variant: "info",
    duration: 5000,
  },
};

export const WithAction: Story = {
  args: {
    message: "Transaction deleted successfully",
    variant: "success",
    action: {
      label: "Undo",
      onClick: () => console.log("Undo clicked"),
    },
  },
};

export const Persistent: Story = {
  args: {
    message: "This toast will not auto-dismiss",
    variant: "info",
    duration: 0,
  },
};

export const ShortDuration: Story = {
  args: {
    message: "Quick notification",
    variant: "info",
    duration: 2000,
  },
};

export const DarkMode: Story = {
  args: {
    message: "Operation completed successfully!",
    variant: "success",
    duration: 5000,
  },
  globals: {
    theme: "dark",
  },
};

// Example: Multiple toasts
export const ToastShowcase: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-8">
      <div className="fixed top-4 right-4 flex flex-col gap-2">
        <Toast
          key="1"
          message="Success message"
          variant="success"
          duration={0}
          onClose={() => {}}
        />
        <Toast
          key="2"
          message="Error message"
          variant="error"
          duration={0}
          onClose={() => {}}
        />
        <Toast
          key="3"
          message="Warning message"
          variant="warning"
          duration={0}
          onClose={() => {}}
        />
        <Toast
          key="4"
          message="Info message"
          variant="info"
          duration={0}
          onClose={() => {}}
        />
      </div>
    </div>
  ),
};
