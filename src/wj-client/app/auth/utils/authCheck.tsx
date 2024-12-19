"use client";

import { redirect } from "next/navigation";
import { LOCAL_STORAGE_TOKEN_NAME } from "../../constants";

export const AuthCheck = (props: any) => {
  const isAuthenticated = localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME);
  if (!isAuthenticated) {
    redirect("/auth/login");
  }
  return props.children;
};
