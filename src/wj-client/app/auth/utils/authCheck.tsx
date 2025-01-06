"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL, LOCAL_STORAGE_TOKEN_NAME, routes } from "@/app/constants";
import fetcher from "@/utils/fetcher";
import { redirect } from "next/navigation";

export const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME);

    if (storedToken) {
      fetcher(`${BACKEND_URL}/auth`).then((res) => {
        if (res.ok) {
          setToken(storedToken);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_TOKEN_NAME);
          redirect(routes.login);
        }
      });
    } else {
      redirect(routes.login);
    }
  }, []);
  if (token === null) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
