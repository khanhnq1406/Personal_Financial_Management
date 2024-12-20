"use client";

import { redirect } from "next/navigation";
import { LOCAL_STORAGE_TOKEN_NAME } from "../../constants";
import { isClient } from "@/utils/isClient";

export const AuthCheck = (props: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const isAuthenticated = isClient && localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME);
  if (!isAuthenticated) {
    redirect("/auth/login");
  }
  return props.children;
};
