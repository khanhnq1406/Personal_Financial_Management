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
      options: ["text", "email", "tel"],
    },
  },
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
type Story = StoryObj<typeof FormInput>;

export const Default: Story = {
  args: {
    label: "Email Address",
    name: "email",
    type: "email",
    placeholder: "you@example.com",
  },
};

export const Text: Story = {
  args: {
    label: "Full Name",
    name: "name",
    type: "text",
    placeholder: "Enter your name",
  },
};

export const Email: Story = {
  args: {
    label: "Email Address",
    name: "email",
    type: "email",
    placeholder: "you@example.com",
  },
};

export const Tel: Story = {
  args: {
    label: "Phone Number",
    name: "phone",
    type: "tel",
    placeholder: "+1 234 567 8900",
  },
};

export const Required: Story = {
  args: {
    label: "Password",
    name: "password",
    type: "text",
    placeholder: "Enter a password",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Email Address",
    name: "email",
    type: "email",
    placeholder: "you@example.com",
    disabled: true,
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
        <FormInput
          control={mockControl as any}
          label="Full Name"
          name="name"
          type="text"
          placeholder="John Doe"
        />
        <FormInput
          control={mockControl as any}
          label="Email"
          name="email"
          type="email"
          placeholder="john@example.com"
        />
        <FormInput
          control={mockControl as any}
          label="Phone"
          name="phone"
          type="tel"
          placeholder="+1 234 567 8900"
        />
      </form>
    );
  },
};
