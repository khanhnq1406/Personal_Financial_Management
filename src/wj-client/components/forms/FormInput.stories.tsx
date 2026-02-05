import type { Meta, StoryObj } from "@storybook/react";
import { FormInput } from "./FormInput";

const meta: Meta<typeof FormInput> = {
  title: "Forms/FormInput",
  component: FormInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "tel", "password"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormInput>;

export const Default: Story = {
  args: {
    label: "Email Address",
    type: "email",
    placeholder: "you@example.com",
  },
};

export const Text: Story = {
  args: {
    label: "Full Name",
    type: "text",
    placeholder: "Enter your name",
  },
};

export const Email: Story = {
  args: {
    label: "Email Address",
    type: "email",
    placeholder: "you@example.com",
  },
};

export const Tel: Story = {
  args: {
    label: "Phone Number",
    type: "tel",
    placeholder: "+1 234 567 8900",
  },
};

export const Password: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "Enter a password",
  },
};

export const Required: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "Enter a password",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Email Address",
    type: "email",
    placeholder: "you@example.com",
    disabled: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Email Address",
    type: "email",
    placeholder: "you@example.com",
    helperText: "We'll never share your email with anyone else.",
  },
};

export const WithError: Story = {
  args: {
    label: "Email Address",
    type: "email",
    placeholder: "you@example.com",
    error: "Please enter a valid email address",
  },
};

export const WithSuccess: Story = {
  args: {
    label: "Email Address",
    type: "email",
    value: "john@example.com",
    success: "Email is available",
  },
};

export const Small: Story = {
  args: {
    label: "Email",
    type: "email",
    size: "sm",
    placeholder: "you@example.com",
  },
};

export const Large: Story = {
  args: {
    label: "Email",
    type: "email",
    size: "lg",
    placeholder: "you@example.com",
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: "Search",
    type: "text",
    placeholder: "Search...",
    leftIcon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
};

export const WithRightIcon: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "Enter password",
    rightIcon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
};

// Form example
export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 w-80">
      <FormInput
        label="Full Name"
        type="text"
        placeholder="John Doe"
      />
      <FormInput
        label="Email"
        type="email"
        placeholder="john@example.com"
        helperText="We'll never share your email with anyone else."
      />
      <FormInput
        label="Password"
        type="password"
        placeholder="Enter a password"
        required
      />
    </form>
  ),
};
