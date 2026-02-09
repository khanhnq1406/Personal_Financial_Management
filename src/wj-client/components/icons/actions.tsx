"use client";

import { memo } from "react";
import { Icon, standardSvgProps, type IconProps } from "./Icon";

export const EditIcon = memo(function EditIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Edit"}>
      <svg {...standardSvgProps}>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </Icon>
  );
});

export const DeleteIcon = memo(function DeleteIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Delete"}>
      <svg {...standardSvgProps}>
        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </Icon>
  );
});

export const EyeIcon = memo(function EyeIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Show"}>
      <svg {...standardSvgProps}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </Icon>
  );
});

export const EyeOffIcon = memo(function EyeOffIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Hide"}>
      <svg {...standardSvgProps}>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <path d="M1 1l22 22" />
      </svg>
    </Icon>
  );
});

export const UserIcon = memo(function UserIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "User"}>
      <svg {...standardSvgProps}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Icon>
  );
});

export const LogoutIcon = memo(function LogoutIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Logout"}>
      <svg {...standardSvgProps}>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    </Icon>
  );
});
