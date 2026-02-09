import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["primary", "secondary", "image"],
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "link", "danger", "success"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    type: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    type: "secondary",
    children: "Secondary Button",
  },
};

export const Small: Story = {
  args: {
    type: "primary",
    size: "sm",
    children: "Small Button",
  },
};

export const Large: Story = {
  args: {
    type: "primary",
    size: "lg",
    children: "Large Button",
  },
};

export const WithIcon: Story = {
  args: {
    type: "primary",
    children: "Add Transaction",
    leftIcon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
};

export const Loading: Story = {
  args: {
    type: "primary",
    children: "Loading...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    type: "primary",
    children: "Disabled Button",
    disabled: true,
  },
};

export const Success: Story = {
  args: {
    type: "primary",
    variant: "success",
    children: "Success!",
    success: true,
  },
};

export const Danger: Story = {
  args: {
    type: "primary",
    variant: "danger",
    children: "Delete",
  },
};

export const Ghost: Story = {
  args: {
    type: "primary",
    variant: "ghost",
    children: "Ghost Button",
  },
};

export const Link: Story = {
  args: {
    type: "primary",
    variant: "link",
    children: "Link Button",
  },
};

export const IconOnly: Story = {
  args: {
    type: "primary",
    children: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    iconOnly: true,
    "aria-label": "Add",
  },
};

export const FullWidth: Story = {
  args: {
    type: "primary",
    children: "Full Width Button",
    fullWidth: true,
  },
  parameters: {
    layout: "fullscreen",
  },
};

export const ButtonGroup: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button type="primary">Save</Button>
      <Button type="secondary">Cancel</Button>
      <Button type="primary" variant="danger">Delete</Button>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
  args: {
    type: "primary",
    children: "Mobile Button",
  },
};

export const DarkMode: Story = {
  args: {
    type: "primary",
    children: "Dark Mode Button",
  },
  globals: {
    theme: "dark",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button type="primary" variant="primary">Primary</Button>
      <Button type="primary" variant="secondary">Secondary</Button>
      <Button type="primary" variant="success">Success</Button>
      <Button type="primary" variant="danger">Danger</Button>
      <Button type="primary" variant="ghost">Ghost</Button>
      <Button type="primary" variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button type="primary" size="sm">Small</Button>
      <Button type="primary" size="md">Medium</Button>
      <Button type="primary" size="lg">Large</Button>
    </div>
  ),
};
