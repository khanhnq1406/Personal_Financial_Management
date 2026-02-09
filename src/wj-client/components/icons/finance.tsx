"use client";

import { memo } from "react";
import { Icon, standardSvgProps, type IconProps } from "./Icon";

export const IncomeIcon = memo(function IncomeIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Income"}>
      <svg {...standardSvgProps} className="text-success-600">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    </Icon>
  );
});

export const ExpenseIcon = memo(function ExpenseIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Expense"}>
      <svg {...standardSvgProps} className="text-danger-600">
        <path d="M23 18l-9.5-9.5-5 5L1 6" />
        <path d="M17 18h6v-6" />
      </svg>
    </Icon>
  );
});

export const TransferIcon = memo(function TransferIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Transfer"}>
      <svg {...standardSvgProps}>
        <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </Icon>
  );
});

export const SavingsIcon = memo(function SavingsIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Savings"}>
      <svg {...standardSvgProps}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    </Icon>
  );
});

export const PercentIcon = memo(function PercentIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Percentage"}>
      <svg {...standardSvgProps}>
        <path d="M19 5L5 19M6.5 6.5h.01M17.5 17.5h.01" />
      </svg>
    </Icon>
  );
});

export const CategoryIcon = memo(function CategoryIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Category"}>
      <svg {...standardSvgProps}>
        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    </Icon>
  );
});
